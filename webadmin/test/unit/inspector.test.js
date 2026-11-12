// SPDX-License-Identifier: MPL-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { Inspector } from "../../src/profile-mapper/inspector.js";

const h = (tag, props, ...children) => ({ tag, props: props || {}, children });
const text = node => Array.isArray(node) ? node.map(text).join(" ") : node && typeof node === "object" ? text(node.children) : String(node ?? "");

test("the inspector explains a profile slice, its binding, fixed values and examples", () => {
  const view = Inspector({ h, node: { key: "Patient.identifier:ipp", code: "Identifier", min: 1, max: "1", mustSupport: true,
    sliceName: "ipp", fixed: { kind: "pattern", value: { system: "urn:ipp" } },
    binding: { strength: "required", valueSet: "urn:identifiers" },
    el: { definition: "Identifiant permanent", example: [{ label: "IPP", valueString: "000123" }] } },
    helpUrl: "https://hl7.org/fhir/R4/patient-definitions.html#Patient.identifier", children: "Rules content", diagnostics: ["Rule error"] });
  assert.equal(view.tag, "aside");
  const content = text(view);
  for (const expected of ["Patient.identifier:ipp", "Identifier", "1..1", "Must Support Yes", "Slice ipp", "Identifiant permanent", "required: urn:identifiers", 'Pattern {"system":"urn:ipp"}', '"000123"', "Rules content", "Rule error"]) assert.ok(content.includes(expected), expected);
});

test("the inspector prompts for selection and preserves a fixed false value", () => {
  assert.match(text(Inspector({ h })), /Select an element/);
  const content = text(Inspector({ h, node: { key: "Patient.active", fixed: { kind: "fixed", value: false } }, diagnostics: [] }));
  assert.match(content, /Fixed value false/);
  assert.match(content, /No diagnostic reported/);
});
