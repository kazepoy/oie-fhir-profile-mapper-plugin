// SPDX-License-Identifier: MPL-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { importMappingTable, mappingTable, mappingDocumentation } from "../../src/fhir/mapping-table.js";
import { mapperPreviewSteps } from "../../src/host/channel-context.js";
import { MAPPER_TYPE } from "../../src/fhir/step.js";
const tree = { chain: key => ["Patient.gender", "Patient.active"].includes(key) ? [{ key }] : null };

test("CSV and Markdown value tables preserve quotes, commas, pipes, escapes and multiline notes", () => {
  const rules = [{ key: "Patient.gender", expression: 'msg.gender || "unknown,<br>"', note: 'a,b\n<script>x</script> \\ | "test"' }];
  for (const format of ["csv", "markdown"]) assert.deepEqual(importMappingTable(mappingTable(rules, format), format, tree, {}), rules);
});
test("invalid or duplicate targets reject the whole table, including later rows", () => {
  for (const key of ["Patient.absent", "Patient.gender"]) {
    const rules = [{ key: "Patient.gender", expression: "'male'" }, { key, expression: "'female'" }];
    assert.throws(() => importMappingTable(mappingTable(rules), "csv", tree, {}), /Invalid or duplicate/);
  }
  assert.throws(() => importMappingTable('key,expression\nPatient.gender,true', "csv", tree, {}), /columns/);
  assert.throws(() => importMappingTable('key,expression,note\nPatient.gender,"broken,', "csv", tree, {}), /quoting/);
});
test("documentation includes conditions, disabled rules and notes while escaping HTML", () => {
  const rules = [{ key: "Patient", condition: "msg.a < 3", disabled: true, note: "<script>alert(1)</script>" }];
  const html = mappingDocumentation({ name: "<test>", resourceType: "Patient" }, rules, "html");
  assert.ok(!html.includes("<script>"));
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /condition/);
  assert.match(html, /<pre>No<\/pre>/);
  assert.match(mappingDocumentation({ resourceType: "Patient" }, rules), /msg.a &lt; 3/);
  assert.ok(!mappingTable(rules).includes("msg.a"));
});
test("transformer previews use enabled siblings in order and replace the open step with its draft", () => {
  const element = { __type: MAPPER_TYPE, sequenceNumber: "4", name: "Patient", profileUrl: "Patient", mappings: "draft" };
  const steps = [{ ...element, sequenceNumber: "2", name: "Bundle" }, { ...element, mappings: "old" }, { __type: "JavaScript", enabled: true }, { ...element, sequenceNumber: "6", enabled: false }];
  const platform = { store: { getState: () => ({ sourceConnector: { transformer: { elements: steps } } }) },
    oie: { destinationsOf: () => [], elementsToArray: elements => elements || [] } };
  const result = mapperPreviewSteps(platform, element);
  assert.deepEqual(result.map(step => step.sequenceNumber), ["2", "4"]);
  assert.equal(result[1].mappings, "draft");
  assert.equal(result[1].samples, "[]");
  assert.equal(steps[1].mappings, "old");
});

test("result comparison ignores random identities but preserves their reference relationships", async () => {
  const { normalizeResult } = await import("../../src/fhir/diagnostics.js");
  const a = "urn:uuid:11111111-1111-1111-1111-111111111111", b = "urn:uuid:22222222-2222-2222-2222-222222222222";
  const first = JSON.stringify({ entry: [{ fullUrl: a }, { fullUrl: b, reference: a }] });
  const renamed = first.replaceAll(a, "urn:uuid:33333333-3333-3333-3333-333333333333");
  assert.equal(normalizeResult(first), normalizeResult(renamed));
  assert.notEqual(normalizeResult(first), normalizeResult(JSON.stringify({ entry: [{ fullUrl: a }, { fullUrl: b, reference: b }] })));
});
