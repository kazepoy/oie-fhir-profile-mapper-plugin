// SPDX-License-Identifier: MPL-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { fmlCompletions, fmlSkeleton } from "../../src/fml/completion.js";

test("FML completion finds aliases, groups, variables, transforms and profile paths", () => {
  const source = `uses "http://example/Patient" alias Patient as target\ngroup Make(source src : Source, target patient : Patient) { src.node as pid -> patient; }`;
  const items = fmlCompletions(source, ["Patient.identifier", "Patient.birthDate"]);
  const labels = new Set(items.map(item => item.label));
  for (const label of ["Patient", "Make", "src", "patient", "pid", "translate", "exists", "Patient.birthDate"]) assert.ok(labels.has(label), label);
});

test("the FML skeleton names both models and comments every required target", () => {
  const source = fmlSkeleton({ sourceUrl: "http://example/ORU", targetUrl: "http://example/Patient", required: ["Patient.identifier", "Patient.name"] });
  assert.match(source, /uses "http:\/\/example\/ORU" alias Source as source/);
  assert.match(source, /group PatientMap\(source src : Source, target tgt : Target\)/);
  assert.match(source, /TODO required: Patient\.identifier/);
  assert.match(source, /TODO required: Patient\.name/);
});
