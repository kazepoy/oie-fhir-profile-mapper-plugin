// SPDX-License-Identifier: MPL-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { duplicateBranch } from "../../src/fhir/branch.js";
import { snapshot, restore } from "../../src/fhir/history.js";

test("duplicating a branch keeps expressions opaque, copies nested counts and metadata, and excludes siblings", () => {
  const state = {
    values: new Map([["Patient.name.family", "fhirRef('Patient.name')"], ["Patient.name[1].family", "'Other'"]]),
    iterations: new Map([["Patient.name.given", { expression: "msg.names", variable: "n" }]]),
    conditions: new Map([["Patient.name", "true"]]),
    translations: new Map([["Patient.name.family", { conceptMap: "urn:test", unmapped: "source" }]]),
    instances: new Map([["Patient.name", 2], ["Patient.name.given", 3]]),
    notes: new Map([["value:Patient.name.family", "Keep me"], ["fixed:Patient.name.id", "Fixed note"]]),
    disabled: new Set(["condition:Patient.name"]), ruleIds: new Map([["value:Patient.name.family", "original"], ["value:Patient.name[2].family", "deleted-occurrence"]])
  };
  const before = snapshot(state);
  duplicateBranch(state, "Patient.name", "Patient.name[2]");
  assert.equal(state.values.get("Patient.name[2].family"), "fhirRef('Patient.name')");
  assert.equal(state.values.has("Patient.name[2][1].family"), false);
  assert.equal(state.instances.get("Patient.name[2].given"), 3);
  assert.equal(state.instances.has("Patient.name[2]"), false);
  assert.equal(state.notes.get("fixed:Patient.name[2].id"), "Fixed note");
  assert.equal(state.notes.get("value:Patient.name[2].family"), "Keep me");
  assert.ok(state.disabled.has("condition:Patient.name[2]"));
  assert.equal(state.ruleIds.has("value:Patient.name[2].family"), false);
  state.translations.get("Patient.name[2].family").conceptMap = "urn:changed";
  assert.equal(state.translations.get("Patient.name.family").conceptMap, "urn:test");
  restore(state, before);
  assert.equal(state.values.has("Patient.name[2].family"), false);
  assert.equal(state.ruleIds.get("value:Patient.name.family"), "original");
});
