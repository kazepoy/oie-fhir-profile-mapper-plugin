// SPDX-License-Identifier: MPL-2.0
// Verifies terminology translation facade, diagnostic/TypeError previews, bounded traces and all saved samples.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  asList,
  assertCleanTestResult,
  assertNormalizedEqual,
  channelId,
  createOieClient,
  loadManifest,
  mapperSteps,
  readExample,
  readJsonExample
} from "./oie-client.js";

describe("Profile Mapper API, diagnostics, trace bounds and saved samples", () => {
  let client;

  before(async () => {
    client = await createOieClient();
  });

  after(() => client?.close());

  test("ConceptMap $translate facade translates GLU to LOINC", async () => {
    const queryLine = (await readExample("api/terminology-translate-query.txt")).trim();
    const params = new URLSearchParams(queryLine.split("?")[1]);
    for (const target of ["profiles=%2Ffhir-volume%2Fig", "server=http%3A%2F%2F127.0.0.1%3A10819%2Ffhir"]) {
      const data = await client.getJson(
        `/api/extensions/fhir-profile-mapper/translate?fhirVersion=R4&${target}&conceptMap=${encodeURIComponent(params.get("url"))}&system=${encodeURIComponent(params.get("system"))}&code=${encodeURIComponent(params.get("code"))}`
      );
      assert.equal(data.system, "http://loinc.org");
      assert.equal(data.code, "14749-6");
    }
  });

  test("diagnostic-error.json reports path, rule and expression on both validation modes", async () => {
    const base = await readJsonExample("api/diagnostic-error.json");
    for (const validateOutput of [false, true]) {
      const payload = { ...base, step: { ...base.step, validateOutput } };
      const res = await client.postTest("/api/extensions/fhir-profile-mapper/test", payload);
      assert.ok(res.errors?.length >= 1, `Expected diagnostic error for validateOutput=${validateOutput}`);
      const message = res.errors.map(e => `${e.key || ""} ${e.message}`).join(" ");
      assert.ok(message.includes("Patient.active"), `Missing path in diagnostic: ${message}`);
    }
  });

  test("typeerror-error.json fails unguarded optional path and succeeds with explicit guard", async () => {
    const base = await readJsonExample("api/typeerror-error.json");
    const errRes = await client.postTest("/api/extensions/fhir-profile-mapper/test", base);
    assert.ok(errRes.errors?.length >= 1, "Expected TypeError diagnostic");
    const errText = errRes.errors.map(e => `${e.key || ""} ${e.message}`).join(" ");
    assert.ok(errText.includes("Patient.gender"), `Missing path in diagnostic: ${errText}`);
    assert.match(errText, /Cannot read property "gender" from undefined|TypeError/);

    const fixedStep = {
      ...base.step,
      mappings: JSON.stringify([{
        key: "Patient.gender",
        type: "code",
        expression: "msg.optional ? msg.optional.gender : null",
        path: [["gender"]]
      }])
    };
    const okEmpty = await client.postTest("/api/extensions/fhir-profile-mapper/test", { ...base, step: fixedStep, message: "{}" });
    assertCleanTestResult(okEmpty, "Guarded expression on empty input");
    assert.equal(JSON.parse(okEmpty.output).gender, undefined);

    const okPresent = await client.postTest("/api/extensions/fhir-profile-mapper/test", {
      ...base,
      step: fixedStep,
      message: JSON.stringify({ optional: { gender: "female" } })
    });
    assertCleanTestResult(okPresent, "Guarded expression on populated input");
    assert.equal(JSON.parse(okPresent.output).gender, "female");
  });

  test("trace-preview.json honors enabled=false, captureValues and maxEvents bounds", async () => {
    const base = await readJsonExample("api/trace-preview.json");

    const defaultTrace = await client.postTest("/api/extensions/fhir-profile-mapper/test", base);
    assertCleanTestResult(defaultTrace, "Default trace preview");
    assert.ok(defaultTrace.trace?.events?.length > 3, "Expected > 3 trace events");
    for (const ev of defaultTrace.trace.events) assert.equal(ev.value, undefined);

    const disabledTrace = await client.postTest("/api/extensions/fhir-profile-mapper/test", {
      ...base,
      trace: { enabled: false }
    });
    assertCleanTestResult(disabledTrace, "Disabled trace preview");
    assert.equal(disabledTrace.trace, undefined);
    assertNormalizedEqual(disabledTrace.output, defaultTrace.output, "Output must be identical with/without trace");

    const withValues = await client.postTest("/api/extensions/fhir-profile-mapper/test", {
      ...base,
      trace: { enabled: true, captureValues: true, maxEvents: 200 }
    });
    assertCleanTestResult(withValues, "Capture values trace preview");
    assert.ok(withValues.trace.events.some(ev => ev.value !== undefined), "Expected captured values when enabled");

    const bounded = await client.postTest("/api/extensions/fhir-profile-mapper/test", {
      ...base,
      trace: { enabled: true, captureValues: false, maxEvents: 3 }
    });
    assertCleanTestResult(bounded, "Bounded trace preview");
    assert.equal(bounded.trace.truncated, true);
    assert.equal(bounded.trace.events.length, 3);
  });

  test("every saved Profile Mapper sample across all demo channels runs and matches its expected output", async () => {
    const manifest = await loadManifest();
    let totalSamples = 0;

    for (const entry of manifest.channels) {
      const id = await channelId(entry.channel);
      const ch = await client.channel(id);
      const transformers = [
        ch.sourceConnector?.transformer,
        ...asList(ch.destinationConnectors?.connector).map(c => c.transformer)
      ].filter(Boolean);

      for (const transformer of transformers) {
        const steps = mapperSteps(transformer);
        for (const step of asList(transformer.elements?.["fr.kazepoy.fhir.mapper.FhirProfileMapperStep"])) {
          const samples = step.samples ? JSON.parse(step.samples) : [];
          for (const sample of samples) {
            totalSamples += 1;
            const selection = sample.scope === "transformer"
              ? { steps }
              : { step: { ...step, samples: "[]" } };
            const res = await client.postTest("/api/extensions/fhir-profile-mapper/test", {
              ...selection,
              message: sample.message,
              dataType: sample.dataType || "HL7V2"
            });
            assertCleanTestResult(res, `${entry.channel} / ${step.name} / ${sample.name}`);
            if (sample.expected) {
              assertNormalizedEqual(res.output, sample.expected, `${entry.channel} / ${step.name} / ${sample.name}`);
            }
          }
        }
      }
    }

    assert.ok(totalSamples >= 20, `Expected at least 20 saved samples across demo channels, checked ${totalSamples}`);
  });
});
