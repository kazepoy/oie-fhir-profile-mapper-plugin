// SPDX-License-Identifier: MPL-2.0
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { apply, explainStep, FML_TYPE, PATTERN, select, steps } from "../channel_mapping.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHANNELS_DIR = join(ROOT, "demo/oie-init/data/channels");

test("all demo exports can be read and updated without touching other steps", () => {
  const files = readdirSync(CHANNELS_DIR).filter((f) => f.endsWith(".xml")).sort();
  for (const file of files) {
    const xml = readFileSync(join(CHANNELS_DIR, file), "utf8");
    const [root, entries] = steps(xml);
    const spans = [...xml.matchAll(PATTERN)];
    assert.equal(spans.length, entries.length, `Span count mismatch in ${file}`);

    entries.forEach(([connector, kind, node, step], ordinal) => {
      const patch = { ...step };
      const rules = JSON.parse(patch.mappings);
      rules.forEach((rule, index) => {
        rule.id = `rule-${index}`;
      });
      patch.mappings = JSON.stringify(rules);
      patch.name = `${step.name} modifié`;
      patch.sequenceNumber = "999";
      patch.enabled = false;

      const span = spans[ordinal];
      const spanStart = span.index;
      const spanEnd = span.index + span[0].length;
      assert.equal(node.start, spanStart);
      assert.equal(node.end, spanEnd);

      const updated = apply(xml, connector, step.sequenceNumber, patch, kind === "responseTransformer");
      assert.ok(updated.startsWith(xml.slice(0, spanStart)));
      assert.ok(updated.endsWith(xml.slice(spanEnd)));

      const [updatedRoot, , reopened] = select(
        updated,
        connector,
        step.sequenceNumber,
        kind === "responseTransformer"
      );
      assert.equal(reopened.enabled, step.enabled);
      assert.equal(reopened.mappings, patch.mappings);
      assert.equal(reopened.sequenceNumber, step.sequenceNumber);
      assert.equal(updatedRoot.findtext("id"), root.findtext("id"));
    });
  }
});

test("FML steps can be listed, extracted, explained and updated without touching other steps", () => {
  const xml = readFileSync(join(CHANNELS_DIR, "oru-r01-to-fhir-patient-fml-inline.xml"), "utf8");
  const [, allEntries] = steps(xml, { includeFml: true });
  assert.equal(allEntries.length, 1);
  const [connector, kind, node, fmlStep] = allEntries[0];
  assert.equal(fmlStep.__type, FML_TYPE);

  const explained = explainStep(fmlStep);
  assert.equal(explained.__type, FML_TYPE);
  assert.equal(explained.hasInlineMap, true);
  assert.equal(explained.context, "demo-labo");

  const updated = apply(
    xml,
    connector,
    fmlStep.sequenceNumber,
    { ...fmlStep, name: "Patient FML modifié", context: "fr-core-2.2.0" },
    kind === "responseTransformer"
  );
  assert.ok(updated.startsWith(xml.slice(0, node.start)));
  assert.ok(updated.endsWith(xml.slice(node.end)));
  const [, , reopened] = select(updated, connector, fmlStep.sequenceNumber, false);
  assert.equal(reopened.name, "Patient FML modifié");
  assert.equal(reopened.context, "fr-core-2.2.0");
});

test("explainStep exposes format 2 step metadata and rule annotations", () => {
  const step = {
    __type: "fr.kazepoy.fhir.mapper.FhirProfileMapperStep",
    name: "Patient",
    action: "resource",
    resourceType: "Patient",
    fhirVersion: "R4",
    context: "demo-labo",
    validation: "inherit",
    formatVersion: "2",
    mappings: JSON.stringify([
      {
        id: "r1",
        key: "Patient.gender",
        path: [["gender"]],
        expression: "msg.gender",
        note: "Note test",
        disabled: true,
        translate: { conceptMap: "urn:cm", unmapped: "none" },
      },
    ]),
  };
  const info = explainStep(step);
  assert.equal(info.context, "demo-labo");
  assert.equal(info.validation, "inherit");
  assert.equal(info.formatVersion, "2");
  assert.equal(info.rules[0].note, "Note test");
  assert.equal(info.rules[0].disabled, true);
  assert.equal(info.rules[0].translate.conceptMap, "urn:cm");
});

test("wrong selection and invalid rules are rejected", () => {
  const xml = readFileSync(join(CHANNELS_DIR, "sql-xml-to-fhir-patient.xml"), "utf8");
  assert.throws(() => select(xml, "999", "999"), /sélection/);
  const [, entries] = steps(xml);
  const [connector, , , step] = entries[0];
  assert.throws(() => apply(xml, connector, step.sequenceNumber, { mappings: "[null]" }));
  assert.throws(() => apply(xml, connector, step.sequenceNumber, { __type: "another.Step" }));
});
