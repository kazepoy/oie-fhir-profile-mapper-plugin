// Tests of the FHIR Profile Mapper editor logic (web/plugin.js): node --test webadmin/test/
// The module is loaded without its export, on small hand-made StructureDefinitions.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const here = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(here, "../../src/profile-mapper/editor.js"), "utf8").replace("export function register", "function register").replace(/^import .*$/gm, "");
const catalog = JSON.parse(fs.readFileSync(path.join(here, "../../../src/main/resources/org/oie/fhir/mapper/mapper-functions.json"), "utf8"));
const context = vm.createContext({ console, crypto: { randomUUID }, snapshot: () => ({}), restore: () => {}, normalizeResult: (x) => String(x), sourceTree: () => [], sourcePaths: () => [], cachedFhirSettings: () => null, fhirContext: () => null, loadFhirSettings: () => Promise.resolve({ contexts: [] }) });
vm.runInContext(code + `\nMAPPER_FUNCTIONS = ${JSON.stringify(catalog)};\nthis.t = { indexSd, makeTree, compile, substitute, inserted, completeness, instancesOf, sdLoaded, sdKey, functionCompletion, completeFunction, mapperBundleDeclarations, mapperSample, mapperDiagnostic, mapperTraceRows, mapperTraceExport, mapperSourcePaths, mapperHelpUrl, mapperJsonImport, mapperRuleIds, mapperCompletionContext, isCompletionShortcut, MapperExpression, ProfileMapperEditor, setReact: value => React = value };`, context);
const { indexSd, makeTree, compile, substitute, inserted, completeness, instancesOf, sdLoaded, sdKey, functionCompletion, completeFunction, mapperBundleDeclarations, mapperSample } = context.t;

const el = (id, min, max, types, more = {}) => ({ id, path: id.replace(/:[^.]+/g, ""), min, max, base: { max: more.baseMax ?? max }, type: types.map((t) => (typeof t === "string" ? { code: t } : t)), ...more });

const patient = indexSd({
  resourceType: "StructureDefinition",
  url: "http://example.org/StructureDefinition/patient",
  version: "1.0.0",
  type: "Patient",
  snapshot: {
    element: [
      { id: "Patient", path: "Patient", min: 0, max: "*" },
      el("Patient.id", 0, "1", ["http://hl7.org/fhirpath/System.String"]),
      el("Patient.extension", 0, "*", ["Extension"]),
      el("Patient.identifier", 1, "*", ["Identifier"], { slicing: { discriminator: [{ type: "value", path: "system" }] } }),
      el("Patient.identifier:ipp", 0, "1", ["Identifier"], { sliceName: "ipp", baseMax: "*" }),
      el("Patient.identifier:ipp.system", 0, "1", ["uri"], { fixedUri: "urn:ipp" }),
      el("Patient.identifier:ipp.value", 0, "1", ["string"]),
      el("Patient.gender", 1, "1", ["code"], { mustSupport: true }),
      el("Patient.deceased[x]", 0, "1", ["boolean", "dateTime"]),
      el("Patient.name", 0, "*", ["HumanName"], { mustSupport: true })
    ]
  }
});
const humanName = indexSd({
  resourceType: "StructureDefinition",
  url: "http://hl7.org/fhir/StructureDefinition/HumanName",
  type: "HumanName",
  snapshot: {
    element: [
      { id: "HumanName", path: "HumanName", min: 0, max: "*" },
      el("HumanName.id", 0, "1", ["http://hl7.org/fhirpath/System.String"]),
      el("HumanName.family", 0, "1", ["string"]),
      el("HumanName.given", 0, "*", ["string"])
    ]
  }
});
sdLoaded.set(sdKey("R4", "", "http://hl7.org/fhir/StructureDefinition/HumanName"), humanName);

const tree = (keys = [], showAll = false) => makeTree(patient, { version: "R4", profiles: "", instances: instancesOf(keys), showAll });
// Objects of the vm context have other prototypes: compare them as plain JSON.
const plain = (x) => JSON.parse(JSON.stringify(x));
const labels = (t, node) => (t.children(node) || []).map((n) => n.label);

test("expanded tree branches keep their auxiliary rows and descendants together when folded", () => {
  const state = { values: new Map(), iterations: new Map([["Patient.name", { expression: "msg.names", variable: "n" }]]),
    conditions: new Map([["Patient.name", "n.active"]]), translations: new Map(), expanded: new Set(["Patient", "Patient.name"]),
    instances: new Map(), rootIndex: patient, sourcePaths: [], showAll: false, filter: "all", unresolved: [], tests: new Map(),
    sample: { dataType: "JSON", message: "{}" }, traceOptions: { enabled: false }, jsonDraft: "", loading: false, tab: "mapper" };
  const element = { action: "resource", resourceType: "Patient", profileUrl: patient.sd.url, mappings: "[]", bundleTargets: "[]" };
  const render = () => {
    let firstRef = true;
    context.t.setReact({ createElement: (tag, props, ...children) => ({ tag, props: props || {}, children }),
      useReducer: () => [0, () => {}], useId: () => "m", useRef: value => { const current = firstRef ? state : value; firstRef = false; return { current }; }, useEffect: () => {} });
    return context.t.ProfileMapperEditor({ element, onChange: () => {}, platform: { store: { getState: () => null } } });
  };
  const all = (node) => Array.isArray(node) ? node.flatMap(all) : node && typeof node === "object" ? [node, ...all(node.children || [])] : [];
  const opened = all(render());
  const name = opened.find(node => node.tag === "tbody" && node.props["aria-label"] === "Patient.name");
  const keys = all(name).filter(node => node.tag === "tr").map(node => node.props.key);
  assert.deepEqual(keys, ["Patient.name", "Patient.name/each", "Patient.name/condition", "Patient.name.family", "Patient.name.given"]);
  assert.equal(name.props.className, "mapper-branch-open");
  assert.ok(all(name).some(node => node.props.className === "mapper-tree-guides"));
  assert.ok(opened.some(node => node.tag === "a" && node.props.className === "mapper-help"));
  state.expanded.delete("Patient.name");
  const closed = all(render());
  assert.ok(!closed.some(node => node.props.key === "Patient.name.family"));
  assert.ok(closed.some(node => node.props["data-owner"] === "Patient.name"));
  // Properties, mapper and test are tabs: only the selected panel is rendered.
  const tabs = closed.filter(node => node.props.role === "tab");
  assert.deepEqual(tabs.map(node => node.props.key), ["properties", "mapper", "test"]);
  assert.deepEqual(tabs.map(node => node.props["aria-selected"]), [false, true, false]);
  state.tab = "properties";
  const properties = all(render());
  assert.ok(!properties.some(node => node.tag === "tbody"));
  assert.ok(properties.some(node => node.tag === "summary" && node.children.includes("Edit as JSON")));
  state.tab = "test";
  assert.ok(all(render()).some(node => node.tag === "button" && node.children.includes("Run")));
});

test("Ctrl+Space and Alt/Option+Space open completion; macOS keeps Ctrl+Space for input sources", () => {
  const key = (more) => ({ code: "Space", key: " ", ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, ...more });
  assert.equal(context.t.isCompletionShortcut(key({ ctrlKey: true })), true);
  assert.equal(context.t.isCompletionShortcut(key({ altKey: true, key: "\u00a0" })), true);
  assert.equal(context.t.isCompletionShortcut(key({})), false);
  assert.equal(context.t.isCompletionShortcut(key({ metaKey: true })), false);
  assert.equal(context.t.isCompletionShortcut(key({ ctrlKey: true, altKey: true })), false);
  assert.equal(context.t.isCompletionShortcut(key({ ctrlKey: true, code: "KeyA", key: "a" })), false);
});

test("Ctrl+Space opens completion without a prefix, including scoped variables and sample paths", () => {
  const root = { key: "Patient" }, name = { key: "Patient.name", parent: root }, family = { key: "Patient.name.family", parent: name };
  const iterations = new Map([[root.key, { variable: "p", expression: "msg['patients']" }], [name.key, { variable: "n", expression: "p['names']" }]]);
  const scope = context.t.mapperCompletionContext(family, iterations, ['msg["patients"][0]["id"]']);
  assert.deepEqual(plain(scope.variables), ["n", "nIndex", "p", "pIndex"]);
  const menu = functionCompletion("", 0, 0, scope, true);
  assert.ok(menu.items.some((fn) => fn.name === "nIndex"));
  assert.ok(menu.items.some((fn) => fn.name === 'p["id"]'));
  const each = context.t.mapperCompletionContext(name, iterations, [], "iteration");
  assert.deepEqual(plain(each.variables), ["p", "pIndex"]);
  assert.equal(functionCompletion("'unfinished", 11, 11, scope, true), null);
  assert.ok(functionCompletion("uuid", 4, 4, scope, true).items.some((fn) => fn.name === "fhirUuid"));
  const updates = [];
  context.t.setReact({ createElement: (tag, props, ...children) => ({ tag, props, children }), useRef: value => ({ current: value }),
    useId: () => "completion", useState: value => [value, next => updates.push(next)], useLayoutEffect: () => {} });
  const field = context.t.MapperExpression({ value: "", onChange: () => {}, completionContext: scope });
  let prevented = false;
  field.children[0].props.onKeyDown({ ctrlKey: true, code: "Space", nativeEvent: { isComposing: false },
    target: { value: "", selectionStart: 0, selectionEnd: 0 }, preventDefault: () => prevented = true, stopPropagation: () => {} });
  assert.ok(prevented);
  assert.ok(updates[0].items.length);
});

test("FHIR help uses the selected release and a core definition anchor rather than an IG slice", () => {
  assert.equal(context.t.mapperHelpUrl("R4B", "Patient", "Patient.identifier:ipp.value"), "https://hl7.org/fhir/R4B/patient-definitions.html#Patient.identifier");
  assert.equal(context.t.mapperHelpUrl("R5", "Patient", "Patient.deceased[x].deceasedDateTime"), "https://hl7.org/fhir/R5/patient-definitions.html#Patient.deceased%5Bx%5D");
});

test("source suggestions use sample structure and JSON round trips preserve rules and OIE identity", () => {
  assert.deepEqual(plain(context.t.mapperSourcePaths({ dataType: "JSON", message: '{"rows":[{"ipp":"001"}]}' })), ['msg["rows"]', 'msg["rows"][0]', 'msg["rows"][0]["ipp"]']);
  const original = { __type: "org.oie.fhir.mapper.FhirProfileMapperStep", sequenceNumber: "2", enabled: false,
    action: "resource", resourceType: "Patient", mappings: JSON.stringify([{ id: "stable-1", key: "Patient.active", type: "boolean", expression: "true", path: [["active"]] }]), bundleTargets: "[]", customMetadata: "kept" };
  const edited = context.t.mapperJsonImport(original, JSON.stringify({ ...original, sequenceNumber: "99", enabled: true, mappings: original.mappings.replace('true', 'false') }));
  assert.equal(edited.sequenceNumber, "2"); assert.equal(edited.enabled, false); assert.equal(edited.customMetadata, "kept");
  assert.equal(JSON.parse(edited.mappings)[0].id, "stable-1");
  const reopened = context.t.mapperJsonImport(original, JSON.stringify(edited));
  assert.equal(reopened.mappings, edited.mappings);
  assert.throws(() => context.t.mapperJsonImport(original, '{"mappings":[]}'));
  const rules = JSON.parse(original.mappings);
  assert.equal(context.t.mapperRuleIds([{ ...rules[0], expression: "false" }], rules)[0].id, "stable-1");
  assert.throws(() => context.t.mapperRuleIds([rules[0], rules[0]]));
});

test("diagnostics show the step, slice path and phase and select the right editor field", () => {
  const error = { step: { name: "Patient", resourceType: "Patient" }, key: "Patient.identifier:ipp.value",
    phase: "conversion", operation: "value", line: "42", path: [["identifier", "ipp#0"], ["value"]] };
  assert.deepEqual(plain(context.t.mapperDiagnostic(error)), {
    label: "Patient · conversion · Patient.identifier:ipp.value · line 42",
    target: "Patient.identifier[ipp#0].value", kind: "value"
  });
  assert.equal(context.t.mapperDiagnostic({ ...error, operation: "condition", phase: "syntax" }).kind, "condition");
  assert.equal(context.t.mapperDiagnostic({ ...error, operation: "iteration" }).kind, "each");
  assert.equal(context.t.mapperDiagnostic({ ...error, phase: "translation" }).kind, "translate");
  assert.equal(context.t.mapperDiagnostic({ ...error, errorType: "TypeError" }).label,
    "Patient · conversion · TypeError · Patient.identifier:ipp.value · line 42");
  assert.deepEqual(plain(context.t.mapperDiagnostic({ message: "old API error" })), { label: "", target: "", kind: "value" });
});

test("trace rows preserve iteration indices and exports retain the structured trace", () => {
  const trace = { formatVersion: 1, id: "preview-1", step: { name: "Patient", resourceType: "Patient" },
    events: [{ phase: "conversion", key: "Patient.name.family", status: "success", durationNanos: 1500000,
      iterations: [{ ruleIndex: 0, index: 2 }], value: { type: "string", text: "Durand", truncated: false } }] };
  const rows = context.t.mapperTraceRows(trace);
  assert.equal(rows[0].label, "Patient · conversion · Patient.name.family");
  assert.equal(rows[0].duration, "1.500 ms");
  assert.equal(rows[0].iterations, "rule 0, item 2");
  assert.deepEqual(JSON.parse(context.t.mapperTraceExport(trace)), trace);
});

test("the tree hides ids and unsliced extensions unless asked, and opens data types", () => {
  const t = tree();
  assert.deepEqual(plain(labels(t, t.root)), ["id", "identifier", "identifier:ipp", "gender", "deceased[x]", "name"]);
  assert.deepEqual(plain(labels(t, t.chain("Patient.deceased[x]").at(-1))), ["deceasedBoolean", "deceasedDateTime"]);
  assert.deepEqual(plain(labels(t, t.chain("Patient.name").at(-1))), ["family", "given"]);
  const all = tree([], true);
  assert.ok(labels(all, all.root).includes("extension"));
  assert.ok(labels(all, all.chain("Patient.name").at(-1)).includes("id"));
});

test("compile: values in tree order, slices, instances, fixed discriminators", () => {
  const values = new Map([
    ["Patient.name.given[1]", "'B'"],
    ["Patient.name.given", "'A'"],
    ["Patient.identifier:ipp.value", "msg['PID']['PID.3']['PID.3.1']"],
    ["Patient.deceased[x].deceasedBoolean", "'false'"]
  ]);
  const entries = compile(tree([...values.keys()]), values, new Map(), new Map(), new Map());
  assert.deepEqual(
    plain(entries.map((e) => [e.key, JSON.stringify(e.path)])),
    [
      ["Patient.identifier:ipp.value", '[["identifier","ipp#0"],["value"]]'],
      ["Patient.deceased[x].deceasedBoolean", '[["deceasedBoolean"]]'],
      ["Patient.name.given", '[["name","#0"],["given","#0"]]'],
      ["Patient.name.given[1]", '[["name","#0"],["given","#1"]]'],
      ["Patient.identifier:ipp.system", '[["identifier","ipp#0"],["system"]]']
    ]
  );
  assert.equal(entries.at(-1).fixed, "urn:ipp");
  assert.equal(entries.at(-1).when, 1);
});

test("compile: iterations, conditions and translations, also on the resource", () => {
  const values = new Map([["Patient.identifier.value", "id['PID.3.1']"], ["Patient.gender", "msg['PID']['PID.8']"]]);
  const iterations = new Map([["Patient.identifier", { expression: "msg['PID']['PID.3']", variable: "id" }], ["Patient", { expression: "msg['PID']", variable: "pid" }], ["Patient.gender", { expression: "x", variable: "g" }]]);
  const conditions = new Map([["Patient.identifier", "id['PID.3.5'] == 'PI'"], ["Patient", "true"]]);
  const translations = new Map([["Patient.gender", { conceptMap: "http://cm", source: "urn:v2", unmapped: "fixed", value: "unknown" }]]);
  const entries = compile(tree([...values.keys()]), values, iterations, translations, conditions);
  const find = (pred) => entries.find(pred);
  assert.deepEqual(plain(find((e) => e.each && e.key === "Patient").path), []);
  assert.deepEqual(plain(find((e) => e.condition && e.key === "Patient").path), []);
  assert.deepEqual(plain(find((e) => e.each && e.key === "Patient.identifier").path), [["identifier", "#0"]]);
  assert.equal(find((e) => e.condition && e.key === "Patient.identifier").condition, "id['PID.3.5'] == 'PI'");
  assert.equal(entries.filter((e) => e.each).length, 2, "gender does not repeat: no iteration");
  assert.deepEqual(plain(find((e) => e.key === "Patient.gender" && e.expression).translate), { conceptMap: "http://cm", source: "urn:v2", target: "", unmapped: "fixed", keepSource: false, value: "unknown" });
});

test("fields dragged or clicked in below an iteration use its variable", () => {
  const its = [{ expression: "msg['PID']['PID.3']", variable: "id" }, { expression: "msg['PID']", variable: "p" }];
  assert.equal(substitute("msg['PID']['PID.3']['PID.3.1'].toString()", its), "id['PID.3.1'].toString()");
  assert.equal(substitute("msg['PID']['PID.3'][0]['PID.3.1']", its), "id['PID.3.1']");
  assert.equal(substitute("msg['PID']['PID.30']", its), "p['PID.30']");
  assert.equal(substitute("msg['OBX']", its), "msg['OBX']");
  assert.deepEqual(plain(inserted("ab", "aXYZb")), { start: 1, end: 4, text: "XYZ" });
  assert.equal(inserted("ab", "aXb"), null, "typing one character is no insertion");
});

test("completeness: required and Must Support elements nothing maps", () => {
  const t = tree();
  assert.deepEqual(plain(completeness(t, [])), { required: ["Patient.identifier", "Patient.gender"], mustSupport: ["Patient.name"] });
  const mapped = completeness(t, [{ key: "Patient.identifier:ipp.value" }, { key: "Patient.gender" }, { element: "Patient.name.family" }]);
  assert.deepEqual(plain(mapped), { required: [], mustSupport: [] });
});

test("function suggestions filter helpers and ignore strings, comments and object members", () => {
  assert.deepEqual(plain(functionCompletion("fhir", 4).items.map((fn) => fn.name)), ["fhirUuid", "fhirRef", "fhirRefs", "fhirFind", "fhirFilter"]);
  assert.deepEqual(plain(functionCompletion("hl7", 3).items.map((fn) => fn.name)), ["hl7Following", "hl7Preceding", "hl7Ordinal"]);
  assert.deepEqual(plain(functionCompletion("fhirRef", 7).items.map((fn) => fn.name)), ["fhirRef", "fhirRefs"]);
  for (const text of ["", "fh", "unknown", "myfhir", "obj.fhir", "obj. fhir", "'fhir", '"text fhir', "`text hl7", "// hl7", "/* fhir", "'it\\'s fhir"]) {
    assert.equal(functionCompletion(text, text.length), null, text);
  }
  const text = "'prefix' + fhir";
  assert.ok(functionCompletion(text, text.length));
});

test("completing a helper preserves nested expressions, selections and existing arguments", () => {
  const before = "fhirRef('spm-' + hl7Pre) + suffix";
  const caret = before.indexOf("hl7Pre") + 6;
  const menu = functionCompletion(before, caret);
  const next = completeFunction(before, menu, menu.items[0]);
  assert.equal(next.value, "fhirRef('spm-' + hl7Preceding(obx, 'OBR', [])) + suffix");
  assert.equal(next.value.slice(next.caret), ") + suffix");

  const existing = "fhirRe('my-resource', 2)";
  const call = functionCompletion(existing, 6);
  assert.equal(completeFunction(existing, call, call.items[0]).value, "fhirRef('my-resource', 2)");

  const middle = functionCompletion("fhirRef('patient')", 4);
  assert.equal(completeFunction("fhirRef('patient')", middle, middle.items.find((fn) => fn.name === "fhirRefs")).value, "fhirRefs('patient')");

  const selected = "prefix + fhirREPLACE + suffix";
  const start = selected.indexOf("fhir") + 4;
  const selection = functionCompletion(selected, start, selected.indexOf(" + suffix"));
  assert.equal(completeFunction(selected, selection, selection.items[0]).value, "prefix + fhirUuid() + suffix");
});

test("Bundle choices are enabled declarations preceding this step in the same transformer", () => {
  const type = "org.oie.fhir.mapper.FhirProfileMapperStep";
  const declaration = (sequence, name, enabled = true) => ({ __type: type, sequenceNumber: String(sequence), name, profileUrl: name,
    action: "createBundle", bundleName: name, enabled });
  const patient = { __type: type, sequenceNumber: "2", name: "Patient", profileUrl: "Patient" };
  const elements = [declaration(0, "labo"), declaration(1, "disabled", false), patient, declaration(3, "later")];
  const channel = { sourceConnector: { transformer: { elements } }, destinationConnectors: [{ transformer: { elements: [declaration(0, "other")] } }] };
  const platform = { store: { getState: () => channel }, oie: { destinationsOf: c => c.destinationConnectors, elementsToArray: es => (es || []).map(e => ({ ...e })) } };
  assert.deepEqual(plain(mapperBundleDeclarations(platform, { ...patient }).map(b => b.bundleName)), ["labo"]);
});


test("sample messages use the current transformer's inbound template and separate channel/connector storage", () => {
  const type = "org.oie.fhir.mapper.FhirProfileMapperStep";
  const step = { __type: type, name: "Patient", sequenceNumber: "1", profileUrl: "Patient" };
  const source = { metaDataId: "0", transformer: { inboundDataType: "XML", inboundTemplate: "<result><ipp>000123</ipp></result>", elements: [step] } };
  const destination = { metaDataId: "1", transformer: { inboundDataType: "XML", inboundTemplate: "<delimited><row><ipp>000456</ipp></row></delimited>", elements: [step] } };
  const channel = { id: "sql", sourceConnector: source, destinationConnectors: [] };
  const platform = { store: { getState: () => channel }, oie: { destinationsOf: c => c.destinationConnectors, elementsToArray: es => es || [] } };
  const sql = mapperSample(platform, step);
  assert.deepEqual(plain(sql.sample), { dataType: "XML", message: source.transformer.inboundTemplate });
  channel.id = "csv"; source.transformer.elements = []; channel.destinationConnectors = [destination];
  const csv = mapperSample(platform, step);
  assert.deepEqual(plain(csv.sample), { dataType: "XML", message: destination.transformer.inboundTemplate });
  assert.notEqual(sql.key, csv.key);
  destination.responseTransformer = { inboundDataType: "JSON", inboundTemplate: '{"response":true}', elements: [step] };
  destination.transformer.elements = [];
  const response = mapperSample(platform, step);
  assert.equal(response.sample.dataType, "JSON");
  assert.notEqual(csv.key, response.key);
});
