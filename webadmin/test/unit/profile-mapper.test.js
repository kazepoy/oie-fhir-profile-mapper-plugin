// Direct module tests on small StructureDefinitions; component renders use a minimal React adapter.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { snapshot, restore } from "../../src/fhir/history.js";
import { Inspector } from "../../src/profile-mapper/inspector.js";
import { ProfileMapperEditor } from "../../src/profile-mapper/editor.js";
import { MapperExpression, isCompletionShortcut } from "../../src/profile-mapper/expression.js";
import { bindReact as setReact } from "../../src/host/react.js";
import { indexSd, makeTree, compile, completeness, instancesOf, sdLoaded, sdKey } from "../../src/fhir/model.js";
import { inserted, substitute } from "../../src/fhir/expressions.js";
import { mapperSourcePaths, mapperHelpUrl, mapperJsonImport, mapperRuleIds } from "../../src/fhir/step.js";
import { mapperBundleDeclarations, mapperSample } from "../../src/host/channel-context.js";
import { mapperDiagnostic, traceRows as mapperTraceRows, traceExport as mapperTraceExport } from "../../src/fhir/diagnostics.js";
import { functionCompletion as completeSymbols, completeFunction, completionContext as mapperCompletionContext } from "../../src/fhir/completion.js";
import { profileExtensions } from "../../src/fhir/assistance.js";
const catalog = JSON.parse(fs.readFileSync(fileURLToPath(new URL("../../../src/main/resources/org/oie/fhir/mapper/mapper-functions.json", import.meta.url)), "utf8"));
const functionCompletion = (...args) => completeSymbols(catalog, ...args);

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
    instances: new Map(), notes: new Map(), disabled: new Set(), rootIndex: patient, sourcePaths: [], showAll: false, filter: "all", unresolved: [], tests: new Map(),
    sample: { dataType: "JSON", message: "{}" }, traceOptions: { enabled: false }, jsonDraft: "", loading: false, tab: "mapper" };
  const element = { action: "resource", resourceType: "Patient", profileUrl: patient.sd.url, mappings: "[]", bundleTargets: "[]" };
  const render = () => {
    let firstRef = true;
    setReact({ createElement: (tag, props, ...children) => ({ tag, props: props || {}, children }),
      useReducer: () => [0, () => {}], useId: () => "m", useRef: value => { const current = firstRef ? state : value; firstRef = false; return { current }; }, useEffect: () => {} });
    return ProfileMapperEditor({ element, onChange: () => {}, platform: { store: { getState: () => null } } });
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
  assert.equal(isCompletionShortcut(key({ ctrlKey: true })), true);
  assert.equal(isCompletionShortcut(key({ altKey: true, key: "\u00a0" })), true);
  assert.equal(isCompletionShortcut(key({})), false);
  assert.equal(isCompletionShortcut(key({ metaKey: true })), false);
  assert.equal(isCompletionShortcut(key({ ctrlKey: true, altKey: true })), false);
  assert.equal(isCompletionShortcut(key({ ctrlKey: true, code: "KeyA", key: "a" })), false);
});

test("rule notes and activation remain independent for a value and condition, including undo and redo", () => {
  const key = "Patient.gender";
  const saved = [
    { id: "gender-value", key, type: "code", expression: "'female'", path: [["gender"]], note: "Imported note", disabled: true },
    { id: "gender-condition", key, condition: "true", path: [["gender"]] }
  ];
  const state = { values: new Map([[key, "'female'"]]), iterations: new Map(), translations: new Map(), conditions: new Map([[key, "true"]]),
    notes: new Map([[`value:${key}`, "Imported note"]]), disabled: new Set([`value:${key}`]),
    instances: new Map(), rootIndex: patient, sourcePaths: [], showAll: false, filter: "all", unresolved: [], tests: new Map(),
    sample: { dataType: "JSON", message: "{}" }, traceOptions: { enabled: false }, jsonDraft: "", loading: false, tab: "mapper",
    expanded: new Set(), undo: [], redo: [], lastPush: 0 };
  state.current = snapshot(state);
  const element = { action: "resource", resourceType: "Patient", profileUrl: patient.sd.url, mappings: JSON.stringify(saved), bundleTargets: "[]" };
  const all = (node) => Array.isArray(node) ? node.flatMap(all) : node && typeof node === "object" ? [node, ...all(node.children || [])] : [];
  const render = () => {
    let firstRef = true;
    setReact({ createElement: (tag, props, ...children) => ({ tag, props: props || {}, children }),
      useReducer: () => [0, () => {}], useId: () => "m", useRef: value => { const current = firstRef ? state : value; firstRef = false; return { current }; }, useEffect: () => {} });
    return all(ProfileMapperEditor({ element, onChange: () => {}, platform: { store: { getState: () => null } } }));
  };
  const control = (label) => render().find(node => node.props["aria-label"] === label);
  const rules = () => JSON.parse(element.mappings);
  control(`Rule details for ${key}`).props.onClick();
  assert.equal(control(`Note for value rule for ${key}`).props.value, "Imported note");
  assert.equal(control(`Enable value rule for ${key}`).props.checked, false);
  control(`Enable condition rule for ${key}`).props.onChange({ target: { checked: false } });
  assert.ok(rules().find(rule => rule.id === "gender-condition").disabled);
  assert.equal(rules().find(rule => rule.id === "gender-value").note, "Imported note");
  control(`Note for value rule for ${key}`).props.onChange({ target: { value: "Updated note" } });
  assert.equal(rules().find(rule => rule.id === "gender-value").note, "Updated note");
  render().find(node => node.tag === "button" && node.children.includes("↶ Undo")).props.onClick();
  assert.equal(control(`Note for value rule for ${key}`).props.value, "Imported note");
  assert.ok(rules().find(rule => rule.id === "gender-condition").disabled);
  render().find(node => node.tag === "button" && node.children.includes("↷ Redo")).props.onClick();
  assert.equal(rules().find(rule => rule.id === "gender-value").note, "Updated note");
  control(`Enable value rule for ${key}`).props.onChange({ target: { checked: true } });
  assert.equal(rules().find(rule => rule.id === "gender-value").disabled, undefined);
  assert.ok(rules().find(rule => rule.id === "gender-condition").disabled);
  control(`Note for value rule for ${key}`).props.onChange({ target: { value: "" } });
  assert.equal(rules().find(rule => rule.id === "gender-value").note, undefined);
  control(`Inspect ${key}`).props.onClick();
  let inspector = render().find(node => node.tag === Inspector);
  assert.equal(inspector.props.node.key, key);
  assert.equal(control(`Inspector expression for ${key}`).props.value, "'female'");
  control(`Inspector expression for ${key}`).props.onChange({ target: { value: "'male'" } });
  assert.equal(rules().find(rule => rule.id === "gender-value").expression, "'male'");
  assert.equal(state.values.get(key), "'male'");
  state.scriptResult = { errors: [{ key, operation: "condition", message: "Invalid condition" }, { key: "Patient.name", message: "Other rule" }] };
  inspector = render().find(node => node.tag === Inspector);
  assert.equal(inspector.props.diagnostics.length, 1);
  state.search = "name";
  state.selectedKey = "Patient.name";
  all(inspector.props.diagnostics).find(node => node.tag === "button" && node.children.includes("Go to rule")).props.onClick();
  assert.equal(state.selectedKey, key);
  assert.equal(state.search, "");
  assert.equal(state.pendingDiagnostic.kind, "condition");

  // Reopening from the serialized step must recover edits made through the inspector.
  const reopened = { current: null };
  let firstRef = true;
  setReact({ createElement: (tag, props, ...children) => ({ tag, props: props || {}, children }),
    useReducer: () => [0, () => {}], useId: () => "reopened", useRef: value => { const ref = firstRef ? reopened : { current: value }; firstRef = false; return ref; }, useEffect: () => {} });
  ProfileMapperEditor({ element, onChange: () => {}, platform: { store: { getState: () => null } } });
  assert.equal(reopened.current.values.get(key), "'male'");
  assert.ok(reopened.current.disabled.has(`condition:${key}`));
  assert.equal(reopened.current.notes.has(`value:${key}`), false);
});

test("duplicating from the menu generates distinct stable ids and undo/redo preserves the serialized branch", () => {
  const saved = [{ id: "family", key: "Patient.name.family", type: "string", expression: "'Martin'", path: [["name", "#0"], ["family"]], note: "Name" },
    { id: "condition", key: "Patient.name", condition: "true", path: [["name", "#0"]], disabled: true }];
  const state = { values: new Map([["Patient.name.family", "'Martin'"]]), iterations: new Map(), translations: new Map(),
    conditions: new Map([["Patient.name", "true"]]), notes: new Map([["value:Patient.name.family", "Name"]]), disabled: new Set(["condition:Patient.name"]),
    ruleIds: new Map([["value:Patient.name.family", "family"], ["condition:Patient.name", "condition"]]),
    instances: new Map(), rootIndex: patient, expanded: new Set(["Patient.name"]), sourcePaths: [], showAll: false, filter: "all", unresolved: [], tests: new Map(),
    sample: { dataType: "JSON", message: "{}" }, traceOptions: { enabled: false }, jsonDraft: "", tab: "mapper", undo: [], redo: [], lastPush: 0 };
  state.current = snapshot(state);
  const element = { action: "resource", resourceType: "Patient", profileUrl: patient.sd.url, mappings: JSON.stringify(saved), bundleTargets: "[]" };
  let menu;
  const all = node => Array.isArray(node) ? node.flatMap(all) : node && typeof node === "object" ? [node, ...all(node.children || [])] : [];
  const render = () => {
    let firstRef = true;
    setReact({ createElement: (tag, props, ...children) => ({ tag, props: props || {}, children }), useReducer: () => [0, () => {}], useId: () => "branch",
      useRef: value => { const current = firstRef ? state : value; firstRef = false; return { current }; }, useEffect: () => {} });
    return all(ProfileMapperEditor({ element, onChange() {}, platform: { store: { getState: () => null }, ui: { contextMenu: (x, y, items) => { menu = items; } } } }));
  };
  const openMenu = key => render().find(node => node.props["aria-label"] === `Actions for ${key}`).props.onClick({ type: "click", detail: 0,
    currentTarget: { getBoundingClientRect: () => ({ left: 0, bottom: 0 }) }, preventDefault() {}, stopPropagation() {} });
  openMenu("Patient.identifier:ipp");
  assert.equal(menu.find(item => item.label === "Duplicate branch").disabled, true);
  openMenu("Patient.name");
  assert.equal(menu.find(item => item.label === "Duplicate branch").disabled, false);
  menu.find(item => item.label === "Duplicate branch").onClick();
  const duplicated = JSON.parse(element.mappings).filter(rule => rule.key.startsWith("Patient.name[1]"));
  assert.equal(duplicated.length, 2);
  assert.ok(duplicated.every(rule => !["family", "condition"].includes(rule.id)));
  assert.equal(duplicated.find(rule => rule.expression).note, "Name");
  assert.deepEqual(plain(duplicated.find(rule => rule.expression).path), [["name", "#1"], ["family"]]);
  assert.equal(duplicated.find(rule => rule.condition).disabled, true);
  render().find(node => node.children.includes("↶ Undo")).props.onClick();
  assert.equal(JSON.parse(element.mappings).some(rule => rule.key.startsWith("Patient.name[1]")), false);
  render().find(node => node.children.includes("↷ Redo")).props.onClick();
  assert.deepEqual(JSON.parse(element.mappings).filter(rule => rule.key.startsWith("Patient.name[1]")), duplicated);
  const imported = mapperJsonImport(element, JSON.stringify(element));
  assert.equal(imported.mappings, element.mappings);
  state.iterations.set("Patient.name", { expression: "msg.names", variable: "n" });
  openMenu("Patient.name");
  assert.equal(menu.find(item => item.label === "Duplicate branch").disabled, true);
});

test("a profile extension picker exposes the canonical and mapping its value creates the fixed URL", () => {
  const url = "http://example.org/StructureDefinition/mode";
  const sd = plain(patient.sd);
  sd.snapshot.element.splice(3, 0, el("Patient.extension:mode", 0, "1", [{ code: "Extension", profile: [url] }], { sliceName: "mode", baseMax: "*" }));
  sdLoaded.set(sdKey("R4", "", url), indexSd({ type: "Extension", url, snapshot: { element: [
    { id: "Extension", path: "Extension" }, el("Extension.url", 1, "1", ["uri"], { fixedUri: url }), el("Extension.value[x]", 1, "1", ["code"])
  ] } }));
  const target = makeTree(indexSd(sd), { version: "R4", profiles: "", instances: new Map(), showAll: true });
  assert.deepEqual(plain(profileExtensions(target, target.root)), [{ key: "Patient.extension:mode", label: "extension:mode", url }]);
  const rules = compile(target, new Map([["Patient.extension:mode.valueCode", "'routine'"]]), new Map(), new Map(), new Map());
  const fixed = rules.find(rule => rule.key === "Patient.extension:mode.url");
  assert.equal(fixed.fixed, url);
  assert.deepEqual(plain(fixed.path), [["extension", "mode#0"], ["url"]]);
});

test("Ctrl+Space opens completion without a prefix, including scoped variables and sample paths", () => {
  const root = { key: "Patient" }, name = { key: "Patient.name", parent: root }, family = { key: "Patient.name.family", parent: name };
  const iterations = new Map([[root.key, { variable: "p", expression: "msg['patients']" }], [name.key, { variable: "n", expression: "p['names']" }]]);
  const scope = mapperCompletionContext(family, iterations, ['msg["patients"][0]["id"]']);
  assert.deepEqual(plain(scope.variables), ["n", "nIndex", "p", "pIndex"]);
  const menu = functionCompletion("", 0, 0, scope, true);
  assert.ok(menu.items.some((fn) => fn.name === "nIndex"));
  assert.ok(menu.items.some((fn) => fn.name === 'p["id"]'));
  const each = mapperCompletionContext(name, iterations, [], "iteration");
  assert.deepEqual(plain(each.variables), ["p", "pIndex"]);
  assert.equal(functionCompletion("'unfinished", 11, 11, scope, true), null);
  assert.ok(functionCompletion("uuid", 4, 4, scope, true).items.some((fn) => fn.name === "fhirUuid"));
  const updates = [];
  setReact({ createElement: (tag, props, ...children) => ({ tag, props, children }), useRef: value => ({ current: value }),
    useId: () => "completion", useState: value => [value, next => updates.push(next)], useLayoutEffect: () => {} });
  const field = MapperExpression({ value: "", onChange: () => {}, completionContext: scope });
  let prevented = false;
  field.children[0].props.onKeyDown({ ctrlKey: true, code: "Space", nativeEvent: { isComposing: false },
    target: { value: "", selectionStart: 0, selectionEnd: 0 }, preventDefault: () => prevented = true, stopPropagation: () => {} });
  assert.ok(prevented);
  assert.ok(updates[0].items.length);
});

test("FHIR help uses the selected release and a core definition anchor rather than an IG slice", () => {
  assert.equal(mapperHelpUrl("R4B", "Patient", "Patient.identifier:ipp.value"), "https://hl7.org/fhir/R4B/patient-definitions.html#Patient.identifier");
  assert.equal(mapperHelpUrl("R5", "Patient", "Patient.deceased[x].deceasedDateTime"), "https://hl7.org/fhir/R5/patient-definitions.html#Patient.deceased%5Bx%5D");
});

test("source suggestions use sample structure and JSON round trips preserve rules and OIE identity", () => {
  assert.deepEqual(plain(mapperSourcePaths({ dataType: "JSON", message: '{"rows":[{"ipp":"001"}]}' })), ['msg["rows"]', 'msg["rows"][0]', 'msg["rows"][0]["ipp"]']);
  const original = { __type: "org.oie.fhir.mapper.FhirProfileMapperStep", sequenceNumber: "2", enabled: false,
    action: "resource", resourceType: "Patient", mappings: JSON.stringify([{ id: "stable-1", key: "Patient.active", type: "boolean", expression: "true", path: [["active"]] }]), bundleTargets: "[]", customMetadata: "kept" };
  const edited = mapperJsonImport(original, JSON.stringify({ ...original, sequenceNumber: "99", enabled: true, mappings: original.mappings.replace('true', 'false') }));
  assert.equal(edited.sequenceNumber, "2"); assert.equal(edited.enabled, false); assert.equal(edited.customMetadata, "kept");
  assert.equal(JSON.parse(edited.mappings)[0].id, "stable-1");
  const reopened = mapperJsonImport(original, JSON.stringify(edited));
  assert.equal(reopened.mappings, edited.mappings);
  assert.throws(() => mapperJsonImport(original, '{"mappings":[]}'));
  const rules = JSON.parse(original.mappings);
  assert.equal(mapperRuleIds([{ ...rules[0], expression: "false" }], rules)[0].id, "stable-1");
  assert.throws(() => mapperRuleIds([rules[0], rules[0]]));
});

test("diagnostics show the step, slice path and phase and select the right editor field", () => {
  const error = { step: { name: "Patient", resourceType: "Patient" }, key: "Patient.identifier:ipp.value",
    phase: "conversion", operation: "value", line: "42", path: [["identifier", "ipp#0"], ["value"]] };
  assert.deepEqual(plain(mapperDiagnostic(error)), {
    label: "Patient · conversion · Patient.identifier:ipp.value · line 42",
    target: "Patient.identifier[ipp#0].value", kind: "value"
  });
  assert.equal(mapperDiagnostic({ ...error, operation: "condition", phase: "syntax" }).kind, "condition");
  assert.equal(mapperDiagnostic({ ...error, operation: "iteration" }).kind, "each");
  assert.equal(mapperDiagnostic({ ...error, phase: "translation" }).kind, "translate");
  assert.equal(mapperDiagnostic({ ...error, errorType: "TypeError" }).label,
    "Patient · conversion · TypeError · Patient.identifier:ipp.value · line 42");
  assert.deepEqual(plain(mapperDiagnostic({ message: "old API error" })), { label: "", target: "", kind: "value" });
});

test("trace rows preserve iteration indices and exports retain the structured trace", () => {
  const trace = { formatVersion: 1, id: "preview-1", step: { name: "Patient", resourceType: "Patient" },
    events: [{ phase: "conversion", key: "Patient.name.family", status: "success", durationNanos: 1500000,
      iterations: [{ ruleIndex: 0, index: 2 }], value: { type: "string", text: "Durand", truncated: false } }] };
  const rows = mapperTraceRows(trace);
  assert.equal(rows[0].label, "Patient · conversion · Patient.name.family");
  assert.equal(rows[0].duration, "1.500 ms");
  assert.equal(rows[0].iterations, "rule 0, item 2");
  assert.deepEqual(JSON.parse(mapperTraceExport(trace)), trace);
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
