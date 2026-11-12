import test from "node:test";
import assert from "node:assert/strict";
import { findTraces, traceText } from "../../src/trace/message-trace.js";

const trace = { scope: "channel-message", channel: { id: "c", name: "ORU", revision: 3 }, connector: { metaDataId: 0, name: "Source", transformer: "transformer" },
  steps: [{ sequenceNumber: 1, name: "Patient", action: "resource", resourceType: "Patient" }], truncated: false,
  events: [{ step: 1, phase: "value", status: "success", key: "Patient.birthDate", durationNanos: 1200000 },
    { step: 1, phase: "reference", status: "missing", name: "encounter", index: 0, durationNanos: 10 },
    { phase: "publication", status: "published", target: "outbound-message", durationNanos: 5 }] };

test("traces are found in XStream map entries, as arrays or as properties", () => {
  const asEntries = { connectorMessages: { entry: [{ connectorMessage: { connectorMapContent: { content: { entry: [{ string: ["other", "x"] }, { string: ["fhirMapperTrace", JSON.stringify(trace)] }] } } } }] } };
  assert.deepEqual(findTraces(asEntries).map(t => t.key), ["fhirMapperTrace"]);
  assert.equal(findTraces({ a: { fhirMapperResponseTrace: JSON.stringify(trace) } })[0].trace.channel.name, "ORU");
  assert.deepEqual(findTraces({ string: ["fhirMapperTrace", "not json"] }), []);
  assert.deepEqual(findTraces(null), []);
});

test("the text of a trace names the channel, the steps and every event", () => {
  const text = traceText(trace);
  assert.match(text, /Channel ORU, revision 3/);
  assert.match(text, /Steps: 2\. Patient \(Patient\)/);
  assert.match(text, /── Patient\n\s+value\s+success\s+Patient\.birthDate\s+1\.20 ms/);
  assert.match(text, /reference\s+missing\s+encounter\[0\]/);
  assert.match(text, /── finalization\n\s+publication\s+published\s+outbound-message/);
});
