// Le schéma doit accepter les exports réels et refuser les fautes de structure.
// SPDX-License-Identifier: MPL-2.0

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { steps } from "../channel_mapping.mjs";
import { checkSchema, errors, main, SCHEMA } from "../check_mapping.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const EXAMPLES = join(ROOT, "doc/demo/examples/mapping");
const CHANNELS_DIR = join(ROOT, "demo/oie-init/data/channels");

test("schema is valid", () => {
  checkSchema(SCHEMA);
});

test("documented examples", () => {
  for (const name of [
    "patient.step.json",
    "patient-samples.step.json",
    "laboratory.steps.json",
    "unresolved-reference.steps.json",
  ]) {
    const value = JSON.parse(readFileSync(join(EXAMPLES, name), "utf8"));
    for (const step of Array.isArray(value) ? value : [value]) {
      assert.deepEqual([...errors(step)], [], `${name} / ${step.resourceType}`);
    }
  }
  const invalid = JSON.parse(readFileSync(join(EXAMPLES, "invalid-path.step.json"), "utf8"));
  assert.ok([...errors(invalid)].some((e) => e.includes("$.mappings (décodé)")));
});

test("all demo channels conform to step schema and OIE name limit", () => {
  const channels = readdirSync(CHANNELS_DIR).filter((f) => f.endsWith(".xml")).sort();
  assert.equal(channels.length, 23);
  let count = 0;
  for (const file of channels) {
    const xml = readFileSync(join(CHANNELS_DIR, file), "utf8");
    const [root, entries] = steps(xml);
    const name = root.findtext("name");
    assert.ok(name && name.length <= 40, `Channel name exceeds 40 chars in ${file}: ${name}`);
    for (const [, , , step] of entries) {
      assert.deepEqual([...errors(step)], [], `${file} / ${step.name}`);
      count += 1;
    }
  }
  assert.ok(count > 6);
});

test("cli main validates both JSON and XML files", async () => {
  const code = await main([
    join(EXAMPLES, "patient.step.json"),
    join(CHANNELS_DIR, "sql-xml-to-fhir-patient.xml"),
  ]);
  assert.equal(code, 0);
});

test("embedded json is checked explicitly", () => {
  for (const field of ["mappings", "bundleTargets"]) {
    for (const value of ["{", "{}", "[null]", "null"]) {
      assert.ok(
        [...errors({ action: "resource", resourceType: "Patient", [field]: value })].length > 0,
        `${field}=${value}`
      );
    }
  }
});

test("rule forms and translation", () => {
  const step = JSON.parse(readFileSync(join(EXAMPLES, "patient.step.json"), "utf8"));
  const rule = {
    key: "Patient.gender",
    expression: "msg.gender",
    path: [["gender"]],
    translate: { conceptMap: "urn:sex", unmapped: "fixed", value: "unknown" },
  };
  step.mappings = JSON.stringify([rule]);
  assert.deepEqual([...errors(step)], []);

  for (const change of [
    { path: [] },
    { path: [["gender", "#0", "extra"]] },
    { each: "msg.rows", variable: "row" },
    { translate: { conceptMap: "urn:sex", unmapped: "fixed" } },
  ]) {
    step.mappings = JSON.stringify([{ ...rule, ...change }]);
    assert.ok([...errors(step)].length > 0, `Expected error for ${JSON.stringify(change)}`);
  }

  // Les anciens mappings peuvent employer element sans key.
  const { key, ...rest } = rule;
  const legacy = { ...rest, element: key };
  step.mappings = JSON.stringify([legacy]);
  assert.deepEqual([...errors(step)], []);
});

test("step actions and wire representation", () => {
  for (const badStep of [
    { resourceType: "Patient" },
    { action: "unknown", resourceType: "Patient" },
    { action: "createBundle", resourceType: "Patient", bundleName: "lab" },
    { action: "createBundle", resourceType: "Bundle", bundleName: " " },
    { action: "resource", resourceType: "Patient", mappings: [] },
    { action: "resource", resourceType: "Patient", requestMethod: "POST" },
  ]) {
    assert.ok([...errors(badStep)].length > 0, `Expected error for ${JSON.stringify(badStep)}`);
  }
  const validStep = {
    action: "resource",
    resourceType: "Patient",
    validateOutput: "false",
    mappings: "",
  };
  assert.deepEqual([...errors(validStep)], []);
});
