// Tests of the Channel Flow model, step creation and arrow routing (web/channel-flow.js).
import test from "node:test";
import assert from "node:assert/strict";
import { flowModel, destinationChains, pickLayout, addElement, elementTypes, layoutEdges, arrowPaths, hasScript, actualSizeView } from "../web/channel-flow.js";

// The few Web Admin helpers the module uses, with the engine's wire shapes.
const oie = {
  destinationsOf: channel => {
    const list = channel.destinationConnectors?.connector ?? [];
    return Array.isArray(list) ? list : [list];
  },
  elementsToArray: elements => Object.entries(elements || {}).filter(([key]) => !key.startsWith("@"))
    .flatMap(([type, value]) => (Array.isArray(value) ? value : [value]).map(item => ({ __type: type, ...item })))
    .sort((a, b) => Number(a.sequenceNumber ?? 0) - Number(b.sequenceNumber ?? 0)),
  arrayToElements: items => {
    if (!items.length) return null;
    const out = {};
    items.forEach(({ __type, ...rest }, index) => (out[__type] ||= []).push({ ...rest, sequenceNumber: String(index) }));
    return out;
  },
  emptyFilter: version => ({ "@version": version, elements: null }),
  emptyTransformer: version => ({ "@version": version, elements: null, inboundDataType: "RAW", outboundDataType: "RAW" }),
  elementTypeLabel: type => type.split(".").pop()
};
const JS_STEP = "com.mirth.connect.plugins.javascriptstep.JavaScriptStep", JS_RULE = "com.mirth.connect.plugins.javascriptrule.JavaScriptRule";
const steps = new Map([[JS_STEP, { label: "JavaScript", create: () => ({ __type: JS_STEP, name: "", enabled: true, script: "" }) }],
  ["x.SourceOnly", { label: "Source only", onlySource: true }]]);
const rules = new Map([[JS_RULE, { label: "JavaScript", create: () => ({ __type: JS_RULE, name: "", enabled: true, script: "" }) }]]);
const platform = { oie, stepTypes: () => steps, ruleTypes: () => rules, stepType: type => steps.get(type), ruleType: type => rules.get(type) };

const destination = (metaDataId, more = {}) => ({ metaDataId, name: `D${metaDataId}`, transportName: "HTTP Sender", enabled: true,
  properties: { host: "https://fhir.example/fhir" }, transformer: { inboundDataType: "FHIR", outboundDataType: "FHIR" }, ...more });
const channel = (...destinations) => ({
  id: "c1", "@version": "4.7.0",
  sourceConnector: { metaDataId: 0, transportName: "TCP Listener", enabled: true,
    properties: { listenerConnectorProperties: { host: "0.0.0.0", port: "6661" }, sourceConnectorProperties: { responseVariable: "d1", respondAfterProcessing: true } },
    transformer: { inboundDataType: "HL7V2", outboundDataType: "FHIR", elements: { [JS_STEP]: [{ name: "Normalize", enabled: true, sequenceNumber: "0" }] } } },
  destinationConnectors: { connector: destinations },
  properties: { attachmentProperties: { type: "None" } },
  deployScript: "// default\nreturn;", undeployScript: "", preprocessingScript: "return message;", postprocessingScript: "logger.info('done'); return;"
});

test("destinations form chains like the engine; disabled ones stay where declared", () => {
  const ids = chains => chains.map(chain => chain.map(d => d.metaDataId));
  assert.deepEqual(ids(destinationChains([destination(1), destination(2), destination(3, { waitForPrevious: false }), destination(4)])), [[1, 2], [3, 4]]);
  assert.deepEqual(ids(destinationChains([destination(1), destination(2, { waitForPrevious: false, enabled: false }), destination(3)])), [[1, 2, 3]]);
  assert.deepEqual(ids(destinationChains([destination(1, { enabled: false }), destination(2, { enabled: false })])), [[1, 2]]);
});

test("the model lists components in processing order, with data types and the selected response", () => {
  const model = flowModel(channel(destination(1), destination(2, { waitForPrevious: false })), platform);
  assert.deepEqual(model.source.tiles.map(t => t.label), ["Connector", "Attachments", "Preprocessor", "Filter", "Transformer"]);
  assert.deepEqual(model.chains[0][0].tiles.map(t => t.label), ["Filter", "Transformer", "Connector", "Response"]);
  assert.equal(model.source.types, "HL7V2 → FHIR");
  assert.equal(model.source.tiles[0].detail, "0.0.0.0:6661");
  assert.equal(model.source.tiles[4].items[0].name, "Normalize");
  assert.equal(model.end.tiles[1].title, "Destination 1 · D1");
  assert.equal(model.end.tiles[1].detail, "after processing");
  assert.equal(model.replies, true);
  assert.deepEqual([model.lifecycle.tiles[0].empty, model.lifecycle.tiles[1].empty, model.source.tiles[2].empty, model.end.tiles[0].empty], [true, true, true, false]);
});

test("a polled source has no sender waiting for a response", () => {
  const input = channel(destination(1));
  input.sourceConnector.transportName = "File Reader";
  input.sourceConnector.properties.pollConnectorProperties = {};
  const model = flowModel(input, platform);
  assert.equal(model.sender.label, "Polled");
  assert.equal(model.replies, false);
});

test("default scripts count as empty", () => {
  assert.equal(hasScript("// comment\nreturn;"), false);
  assert.equal(hasScript("return message;", true), false);
  assert.equal(hasScript("logger.info(1);"), true);
});

test("Auto picks Line, Columns or Bands from the channel's shape", () => {
  const shape = (...ids) => flowModel(channel(...ids.map(([id, wait]) => destination(id, { waitForPrevious: wait }))), platform);
  assert.equal(pickLayout(shape([1], [2])), "A");
  assert.equal(pickLayout(shape([1], [2, false])), "B");
  assert.equal(pickLayout(shape([1], [2], [3])), "C");
  assert.equal(pickLayout(shape([1], [2, false], [3, false], [4, false], [5, false])), "C");
});

test("adding a filter rule appends it like the editor, with AND after the first rule", () => {
  const input = channel(destination(1));
  assert.equal(addElement(input, platform, { section: "filter", metaDataId: 1 }, JS_RULE), 0);
  assert.equal(addElement(input, platform, { section: "filter", metaDataId: 1 }, JS_RULE), 1);
  const rulesOut = input.destinationConnectors.connector[0].filter.elements[JS_RULE];
  assert.deepEqual(rulesOut.map(r => [r.operator, r.sequenceNumber, r.name, r["@version"]]), [["NONE", "0", "JavaScript", "4.7.0"], ["AND", "1", "JavaScript", "4.7.0"]]);
});

test("adding a step keeps existing steps and creates a missing response transformer", () => {
  const input = channel(destination(1));
  assert.equal(addElement(input, platform, { section: "transformer", metaDataId: 0 }, JS_STEP), 1);
  assert.deepEqual(input.sourceConnector.transformer.elements[JS_STEP].map(s => s.name), ["Normalize", "JavaScript"]);
  assert.equal(addElement(input, platform, { section: "response", metaDataId: 1 }, JS_STEP), 0);
  assert.equal(input.destinationConnectors.connector[0].responseTransformer.elements[JS_STEP][0].script, "");
  assert.throws(() => addElement(input, platform, { section: "filter", metaDataId: 9 }, JS_RULE), /Connector 9 not found/);
});

test("source-only step types are offered on the source only", () => {
  assert.deepEqual(elementTypes(platform, { section: "transformer", metaDataId: 0 }).map(t => t.label), ["JavaScript", "Source only"]);
  assert.deepEqual(elementTypes(platform, { section: "transformer", metaDataId: 1 }).map(t => t.label), ["JavaScript"]);
  assert.deepEqual(elementTypes(platform, { section: "filter", metaDataId: 1 }).map(t => t.label), ["JavaScript"]);
});

test("every link of every layout is an orthogonal arrow", () => {
  let n = 0;
  const boxes = new Map();
  const g = id => {
    if (!boxes.has(id)) { n += 1; const l = (n * 137) % 900, t = (n * 61) % 700; boxes.set(id, { l, t, r: l + 120, b: t + 80, cx: l + 60, cy: t + 40 }); }
    return boxes.get(id);
  };
  for (const destinations of [[destination(1), destination(2), destination(3, { waitForPrevious: false }), destination(4, { enabled: false })], []]) {
    const model = flowModel(channel(...destinations), platform);
    for (const layout of ["A", "B", "C"]) {
      const edges = layoutEdges(layout, model, g);
      assert.ok(edges.length > 5, layout);
      for (const edge of edges) {
        for (let i = 1; i < edge.pts.length; i++) {
          const [a, b] = [edge.pts[i - 1], edge.pts[i]];
          assert.ok(Math.abs(a[0] - b[0]) < 1e-9 || Math.abs(a[1] - b[1]) < 1e-9, `${layout}: diagonal segment`);
        }
        const { head } = arrowPaths(edge), tip = edge.pts[edge.pts.length - 1];
        assert.ok(head.startsWith(`M${tip[0]},${tip[1]} `), `${layout}: arrowhead at the end`);
      }
    }
  }
});

test("a mouse wheel zooms while a two-finger trackpad scroll pans", async () => {
  const { isMouseWheel } = await import("../web/channel-flow.js");
  assert.equal(isMouseWheel({ deltaMode: 1, deltaX: 0, deltaY: 3 }), true);
  assert.equal(isMouseWheel({ deltaMode: 0, deltaX: 0, deltaY: -100, wheelDeltaY: 120 }), true);
  assert.equal(isMouseWheel({ deltaMode: 0, deltaX: 0, deltaY: 4, wheelDeltaY: -12 }), false);
  assert.equal(isMouseWheel({ deltaMode: 0, deltaX: 2, deltaY: 30, wheelDeltaY: -120 }), false);
});

test("100% shows a large diagram from its start and centers one that fits", () => {
  assert.deepEqual(actualSizeView(2400, 900, 1100, 700), { s: 1, x: 24, y: 24 });
  assert.deepEqual(actualSizeView(600, 400, 1100, 700), { s: 1, x: 250, y: 150 });
  assert.deepEqual(actualSizeView(2400, 300, 1100, 700), { s: 1, x: 24, y: 200 });
});
