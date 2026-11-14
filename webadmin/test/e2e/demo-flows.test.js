// SPDX-License-Identifier: MPL-2.0
// Verifies end-to-end HL7v2, Two Lab Bundles, SQL XML, CSV, message trace and FML-vs-Mapper flows.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { findTraces } from "../../src/trace/message-trace.js";
import {
  asList,
  assertCleanTestResult,
  assertNormalizedEqual,
  channelId,
  connectorOf,
  createOieClient,
  mapperSteps,
  metaMapOf,
  readExample
} from "./oie-client.js";

const FML_VS_MAPPER_CASES = [
  { file: "oru-r01-patient-fml-vs-mapper.xml", port: 10817, route: "/patient-compare", contentType: "text/plain", input: "hl7v2/oru-r01-minimal.er7", expected: "hl7v2/oru-r01-minimal-expected.json" },
  { file: "oru-r01-patient-strict-fml-vs-mapper.xml", port: 10818, route: "/patient-strict-compare", contentType: "text/plain", input: "hl7v2/oru-r01-minimal.er7", expected: "hl7v2/oru-r01-minimal-expected.json" },
  { file: "csv-patient-fml-vs-mapper.xml", port: 10820, route: "/csv-compare", contentType: "text/csv", input: "csv/patient-metier.csv", expected: "csv/patient-metier-expected.json" },
  { file: "sql-xml-patient-fml-vs-mapper.xml", port: 10821, route: "/xml-compare", contentType: "application/xml", input: "xml/patient-result-sql.xml", expected: "xml/patient-result-sql-expected.json" },
  { file: "business-json-patient-fml-vs-mapper.xml", port: 10822, route: "/json-compare", contentType: "application/json", input: "json/patient-metier-fr-core.json", expected: "json/patient-metier-fr-core-expected.json" },
  { file: "fhir-patient-summary-fml-vs-mapper.xml", port: 10823, route: "/fhir-compare", contentType: "application/json", input: "json/patient-fhir-source.json", expected: "json/patient-fhir-source-expected.json" }
];

function collectUuidRefs(value, out = []) {
  if (typeof value === "string" && value.startsWith("urn:uuid:")) out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectUuidRefs(item, out);
  else if (value && typeof value === "object") for (const v of Object.values(value)) collectUuidRefs(v, out);
  return out;
}

describe("demo channel pipelines, message traces and benchmarks", () => {
  let client;

  before(async () => {
    client = await createOieClient();
  });

  after(() => client?.close());

  test("ORU R01 full & minimal bundles, multi-step preview, message trace and birthDate error", async () => {
    const oruId = await channelId("oru-r01-to-fhir-bundle.xml");
    const laboEr7 = await readExample("hl7v2/oru-r01-labo.er7");
    const minimalEr7 = await readExample("hl7v2/oru-r01-minimal.er7");
    const noDobEr7 = await readExample("hl7v2/oru-r01-sans-date-de-naissance.er7");

    const fullRes = await client.postChannel(10801, "/oru/", laboEr7, "text/plain");
    assert.equal(fullRes.status, 200);
    const fullBundle = JSON.parse(fullRes.text);
    assert.equal(fullBundle.resourceType, "Bundle");
    assert.equal(fullBundle.type, "transaction");
    assert.equal(fullBundle.entry.length, 12);
    const fullUrls = fullBundle.entry.map(e => e.fullUrl);
    assert.equal(new Set(fullUrls).size, 12);
    for (const entry of fullBundle.entry) assert.ok(entry.request?.method && entry.request?.url);
    for (const ref of collectUuidRefs(fullBundle)) assert.ok(fullUrls.includes(ref), `Dangling ref ${ref}`);

    const ch = await client.channel(oruId);
    const preview = await client.postTest("/api/extensions/fhir-profile-mapper/test", {
      steps: mapperSteps(ch.sourceConnector?.transformer),
      message: minimalEr7,
      dataType: "HL7V2"
    });
    assertCleanTestResult(preview, "ORU minimal multi-step preview");

    const prevId = await client.latestMessageId(oruId);
    const minRes = await client.postChannel(10801, "/oru/", minimalEr7, "text/plain");
    assert.equal(minRes.status, 200);
    const minBundle = JSON.parse(minRes.text);
    assert.equal(minBundle.entry.length, 4);
    assertNormalizedEqual(minRes.text, preview.output, "ORU deployed output vs multi-step preview");

    const msg = await client.waitNextMessage(oruId, prevId);
    const traces = findTraces(msg);
    assert.ok(traces.length >= 1, "Expected fhirMapperTrace on ORU message");
    const { trace } = traces[0];
    assert.equal(trace.scope, "channel-message");
    assert.deepEqual(trace.steps.map(s => s.name), ["Patient", "Observation"]);
    for (const step of trace.steps) assert.match(step.scriptHash, /^[0-9a-f]{64}$/);
    for (const ev of trace.events) assert.equal(ev.value, undefined, "Trace should not capture values by default");
    const byPhase = phase => trace.events.filter(e => e.phase === phase);
    assert.ok(byPhase("references").some(e => e.status === "passed"));
    assert.ok(byPhase("validation").some(e => e.status === "passed"));
    assert.ok(byPhase("publication").some(e => e.status === "published"));

    const prevErrId = await client.latestMessageId(oruId);
    const errRes = await client.postChannel(10801, "/oru/", noDobEr7, "text/plain");
    assert.equal(errRes.text.trim(), "", "Expected empty HTTP body on ORU validation failure");
    const errMsg = await client.waitNextMessage(oruId, prevErrId);
    const source = connectorOf(errMsg, 0);
    assert.equal(source.status, "ERROR");
    assert.ok((source.processingErrorContent?.content || "").includes("birthDate"));
  });

  test("single-Patient channels (mapper, strict, FML inline) and typed FML Bundle match expectations", async () => {
    const minimalEr7 = await readExample("hl7v2/oru-r01-minimal.er7");
    const outputs = [];
    for (const port of [10802, 10808, 10809]) {
      const res = await client.postChannel(port, "/patient/", minimalEr7, "text/plain");
      assert.equal(res.status, 200, `Port ${port} failed: ${res.status}`);
      const patient = JSON.parse(res.text);
      assert.equal(patient.resourceType, "Patient");
      assert.equal(patient.birthDate, "1980-02-15");
      outputs.push(res.text);
    }
    assertNormalizedEqual(outputs[1], outputs[0], "Strict parser patient differs from mapper patient");
    assertNormalizedEqual(outputs[2], outputs[0], "FML inline patient differs from mapper patient");

    const fmlBundleRes = await client.postChannel(10807, "/bundle/", minimalEr7, "text/plain");
    assert.equal(fmlBundleRes.status, 200);
    const bundle = JSON.parse(fmlBundleRes.text);
    assert.equal(bundle.type, "transaction");
    assert.deepEqual(bundle.entry.map(e => e.resource.resourceType), ["Patient", "Observation"]);
    assert.equal(bundle.entry[0].resource.identifier[0].value, "100001");
    assert.equal(bundle.entry[1].resource.code.text, "GLU");
    assert.equal(bundle.entry[1].resource.valueString, "5.10");
  });

  test("ORU R01 to Two Lab Bundles produces matching transaction, document and archive, and matches preview", async () => {
    const id = await channelId("oru-r01-to-two-lab-bundles.xml");
    const laboEr7 = await readExample("hl7v2/oru-r01-labo.er7");
    const ch = await client.channel(id);

    const preview = await client.postTest("/api/extensions/fhir-profile-mapper/test", {
      steps: mapperSteps(ch.sourceConnector?.transformer),
      message: laboEr7,
      dataType: "HL7V2"
    });
    assertCleanTestResult(preview, "Two Lab Bundles multi-step preview");

    const prevId = await client.latestMessageId(id);
    const res = await client.postChannel(10803, "/labo/", laboEr7, "text/plain");
    assert.equal(res.status, 200);
    const tx = JSON.parse(res.text);
    assert.equal(tx.type, "transaction");
    assert.equal(tx.entry.length, 12);

    const msg = await client.waitNextMessage(id, prevId);
    const enc1 = connectorOf(msg, 1).encoded?.content;
    const enc2 = connectorOf(msg, 2).encoded?.content;
    const dest3 = connectorOf(msg, 3);
    assertNormalizedEqual(enc1, res.text, "Connector 1 encoded should match HTTP transaction bundle");

    const doc = JSON.parse(enc2);
    assert.equal(doc.type, "document");
    assert.equal(doc.entry.length, 14);
    assert.equal(doc.entry[0].resource.resourceType, "Composition");
    const docByUrl = new Map(doc.entry.map(e => [e.fullUrl, e.resource]));
    for (const entry of tx.entry) assert.deepEqual(docByUrl.get(entry.fullUrl), entry.resource);

    assertNormalizedEqual(dest3.encoded?.content, enc2, "Connector 3 encoded should match document bundle");
    assert.ok((dest3.response?.content || "").includes("archive-pca/labo-document-"), "Expected archive filename in response");

    assertNormalizedEqual(preview.output, res.text, "Preview transaction vs deployed");
    assertNormalizedEqual(preview.variables?.bundleDocument, enc2, "Preview document variable vs deployed");
  });

  test("SQL XML and CSV batch/collection channels convert business records accurately", async () => {
    const sqlXml = await readExample("xml/patient-result-sql.xml");
    const sqlExpected = await readExample("xml/patient-result-sql-expected.json");
    const sqlRes = await client.postChannel(10804, "/sql-patient/", sqlXml, "application/xml");
    assert.equal(sqlRes.status, 200);
    assertNormalizedEqual(sqlRes.text, sqlExpected, "SQL XML output mismatch");
    const patient = JSON.parse(sqlRes.text);
    assert.equal(patient.name[0].given[0], "Élodie");
    assert.equal(patient.identifier[0].value, "000123456");

    const csv = await readExample("csv/patients-metier-10.csv");
    const csvSingleId = await channelId("csv-business-patients-to-patient.xml");
    const prevCsvId = await client.latestMessageId(csvSingleId);
    const csvRes = await client.postChannel(10805, "/csv-patients/", csv, "text/csv");
    assert.equal(csvRes.status, 200);
    const created = await client.waitNextMessages(csvSingleId, prevCsvId, 10);
    assert.equal(created.length, 10);
    for (const m of created) {
      assert.notEqual(connectorOf(m, 0).status, "ERROR");
    }

    const colRes = await client.postChannel(10806, "/csv-patients-collection/", csv, "text/csv");
    assert.equal(colRes.status, 200);
    const col = JSON.parse(colRes.text);
    assert.equal(col.resourceType, "Bundle");
    assert.equal(col.type, "collection");
    assert.equal(col.entry.length, 10);
  });

  test("all six FML-vs-Mapper channels run destinations in parallel with identical outputs and timings", async () => {
    for (const spec of FML_VS_MAPPER_CASES) {
      const id = await channelId(spec.file);
      const ch = await client.channel(id);
      const waitFlags = asList(ch.destinationConnectors?.connector).map(c => c.waitForPrevious);
      assert.equal(waitFlags[0], false, `${spec.file}: destination 1 waitForPrevious must be false`);
      assert.equal(waitFlags[1], false, `${spec.file}: destination 2 waitForPrevious must be false`);

      const input = await readExample(spec.input);
      const expected = await readExample(spec.expected);
      const prevId = await client.latestMessageId(id);
      const res = await client.postChannel(spec.port, spec.route, input, spec.contentType);
      assert.equal(res.status, 200, `${spec.file} HTTP ${res.status}: ${res.text}`);
      assertNormalizedEqual(res.text, expected, `${spec.file} HTTP response mismatch`);

      const msg = await client.waitNextMessage(id, prevId);
      assertNormalizedEqual(connectorOf(msg, 1).encoded?.content, expected, `${spec.file} destination 1 mismatch`);
      assertNormalizedEqual(connectorOf(msg, 2).encoded?.content, expected, `${spec.file} destination 2 mismatch`);

      const sourceMeta = metaMapOf(connectorOf(msg, 0));
      assert.ok(Number(sourceMeta.FML_MS) > 0, `${spec.file}: expected FML_MS > 0, got ${sourceMeta.FML_MS}`);
      assert.ok(Number(sourceMeta.MAPPER_MS) > 0, `${spec.file}: expected MAPPER_MS > 0, got ${sourceMeta.MAPPER_MS}`);
      assert.equal(String(sourceMeta.OUTPUTS_EQUAL), "true", `${spec.file}: OUTPUTS_EQUAL`);
      assert.equal(String(sourceMeta.ERROR_STEP), "OK", `${spec.file}: ERROR_STEP`);
    }
  });
});
