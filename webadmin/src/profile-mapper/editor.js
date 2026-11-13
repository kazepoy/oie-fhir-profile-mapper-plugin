// SPDX-License-Identifier: MPL-2.0
import { importMappingTable, mappingTable, mappingDocumentation } from "../fhir/mapping-table.js";
import { t as tr } from "../i18n/index.js";
import { React, h, bindReact } from "../host/react.js";
import { ExpressionField, activeExpressionEditor, setExpressionFunctions, COMPLETION_HINT } from "./expression.js";
import { completionContext as mapperCompletionContext } from "../fhir/completion.js";
import { sdKey, sdLoaded, shortType, makeTree, instancesOf, parseMappings, compile, completeness } from "../fhir/model.js";
import { mapperSourcePaths, mapperHelpUrl, mapperJsonImport, mapperRuleKey, mapperRuleIds, MAPPER_TYPE } from "../fhir/step.js";
import { inserted, asBool, fixedText, TRANSLATABLE, isLocalServer, substitute } from "../fhir/expressions.js";
import { fetchSd, fetchElements } from "../host/catalog.js";
import { mapperContext, mapperBundleDeclarations, mapperSample, mapperPreviewSteps } from "../host/channel-context.js";
import { mapperDiagnostic, traceRows as mapperTraceRows, traceExport as mapperTraceExport } from "../fhir/diagnostics.js";
import { snapshot, restore } from "../fhir/history.js";
import { CodeBox, languageOf } from "../host/code-box.js";
import { HelpButton } from "../host/help.js";
import { MAPPER_HELP } from "../host/help-texts.js";
import { cachedFhirSettings, fhirContext, loadFhirSettings } from "../host/settings.js";
import { normalizeResult } from "../fhir/diagnostics.js";
import { sourceTree, sourcePaths } from "../fhir/source.js";
import { createDiff } from "../host/code-editor.js";
import { Inspector } from "./inspector.js";
import { duplicateBranch, inBranch } from "../fhir/branch.js";
import { matchingConceptMaps, profileExtensions } from "../fhir/assistance.js";
import { showContextMenu } from "../host/context-menu.js";


// ---------------------------------------------------------------------------------------------
// FHIR Profile Mapper transformer step (FhirProfileMapperStep). The tree of the target profile is
// built from its snapshot (GET /api/extensions/fhir-profile-mapper/structure); data types and extension
// profiles without children in the snapshot are loaded when they are opened. Every element can get
// a JavaScript expression, usually a path in msg (drag it from the Message Trees panel). The step is
// saved with the compiled mappings, so the server needs no profile to generate the script.
// ---------------------------------------------------------------------------------------------

const MAPPER_API = "/extensions/fhir-profile-mapper";



let mapperFunctionsRequest = null;

/** A side-by-side diff of the expected and the actual result (the host's diff editor). */
function ResultDiff({ expected, actual }) {
  const host = React.useRef(null);
  React.useEffect(() => {
    const diff = createDiff(expected, actual, "json");
    diff.el.style.height = "320px";
    host.current.appendChild(diff.el);
    diff.layout?.();
    return () => { try { diff.dispose(); } catch { /* already gone */ } diff.el.remove(); };
  }, [expected, actual]);
  return h("div", { ref: host, className: "mapper-result-diff", style: { height: "320px", border: "1px solid #cbd5e1", borderRadius: "4px", overflow: "hidden" } });
}

/** The samples saved with a step: [{ id, name, dataType, message, expected }]. */
function stepSamples(element) {
  return parseMappings(element.samples).filter((s) => s && typeof s === "object" && s.id);
}

/** Whether a test result is what the sample expects; null without an expectation. */
function sampleVerdict(sample, result) {
  if (!sample || sample.expected == null || sample.expected === "") return null;
  return !result.errors.length && normalizeResult(result.output) === normalizeResult(sample.expected);
}

/** The message of a failed request: the engine answers a ClientException as XStream XML. */
function errorText(e) {
  const body = (e && e.body) || "";
  const m = /<detailMessage>([\s\S]*?)<\/detailMessage>/.exec(body);
  if (m) return m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  return (e && e.message) || String(e);
}

function downloadMapperTrace(trace) {
  const url = URL.createObjectURL(new Blob([mapperTraceExport(trace)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `fhir-mapper-trace-${trace.id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ProfileMapperEditor({ element, onChange, platform }) {
  const [, rerender] = React.useReducer((x) => x + 1, 0);
  const tabId = React.useId();
  const state = React.useRef(null);
  if (state.current === null) {
    const saved = parseMappings(element.mappings);
    const values = new Map();
    const iterations = new Map();
    const translations = new Map();
    const conditions = new Map();
    for (const e of saved) {
      const key = e.key || e.element;
      if (!key) continue;
      if (typeof e.each === "string") iterations.set(key, { expression: e.each, variable: e.variable || "item" });
      else if (typeof e.condition === "string") conditions.set(key, e.condition);
      else if (typeof e.expression === "string") values.set(key, e.expression);
      if (e.translate && typeof e.translate === "object") translations.set(key, { ...e.translate });
    }
    const initial = mapperSample(platform, element);
    let sample = initial.sample;
    try {
      sample = JSON.parse(localStorage.getItem(initial.key) || "null") || sample;
    } catch {
      // no storage: use this transformer's inbound template
    }
    // Samples saved with the step come first: they are the same for every user of the channel.
    const savedSamples = stepSamples(element);
    if (savedSamples.length) sample = { message: savedSamples[0].message, dataType: savedSamples[0].dataType || "HL7V2" };
    state.current = {
      values,
      iterations,
      translations,
      conditions,
      notes: new Map(saved.filter((rule) => rule.note).map((rule) => [mapperRuleKey(rule), rule.note])),
      disabled: new Set(saved.filter((rule) => rule.disabled).map(mapperRuleKey)),
      ruleIds: new Map(saved.filter(rule => rule.id).map(rule => [mapperRuleKey(rule), rule.id])),
      // shown when something below an extension, modifierExtension or id (that "extensions & ids" shows) is mapped
      showAll: [...values.keys(), ...iterations.keys(), ...conditions.keys()].some((k) => /\.(extension|modifierExtension|id)(\[\d+\])?(\.|$)/.test(k)),
      sample,
      activeSample: savedSamples.length ? savedSamples[0].id : null,
      sampleKey: initial.key,
      previewScope: savedSamples[0]?.scope || "step",
      testResult: null,
      scriptResult: null,
      testing: false,
      traceOptions: { enabled: false, captureValues: false, maxEvents: 200 },
      versionNotice: "",
      instances: instancesOf([...values.keys(), ...iterations.keys(), ...translations.keys(), ...conditions.keys()]),
      conceptMaps: null,
      tests: new Map(),
      expanded: new Set(),
      rootIndex: null,
      loading: false,
      error: "",
      unresolved: [],
      notice: "",
      profileList: null,
      sourcePaths: [],
      jsonDraft: "",
      filter: "all",
      search: "",
      undo: [],
      redo: [],
      current: null,
      lastPush: 0,
      // An existing mapping opens on its rules; a new step on its properties.
      settingsReady: !!cachedFhirSettings(),
      tab: saved.length ? "mapper" : "properties"
    };
  }
  const st = state.current;
  React.useEffect(() => {
    let active = true;
    if (!mapperFunctionsRequest) mapperFunctionsRequest = platform.api.get(`${MAPPER_API}/functions`, {}, { raw: true })
      .then((text) => { setExpressionFunctions(JSON.parse(text)); })
      .catch((error) => { mapperFunctionsRequest = null; throw error; });
    mapperFunctionsRequest.then(() => { if (active) rerender(); }).catch((error) => {
      if (active) { st.error = tr("Function catalogue: {p0}", { p0: errorText(error) }); rerender(); }
    });
    return () => { active = false; };
  }, []);
  React.useEffect(() => {
    let active = true;
    const sample = { ...st.sample };
    st.sourcePaths = mapperSourcePaths(sample);
    rerender();
    const timer = setTimeout(async () => {
      if (sample.dataType !== "HL7V2" || !sample.message.trim()) return;
      try {
        const text = await platform.api.post(`${MAPPER_API}/source`, JSON.stringify(sample), { contentType: "text/plain", raw: true });
        if (active) { st.serialized = JSON.parse(text); st.sourcePaths = mapperSourcePaths(st.serialized); rerender(); }
      } catch { if (active) { st.sourcePaths = []; rerender(); } }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [st, st.sample.message, st.sample.dataType]);
  // The FHIR contexts of the server; a step that names one takes its version, packages and terminology server.
  React.useEffect(() => {
    let active = true;
    const done = () => { if (active && !st.settingsReady) { st.settingsReady = true; rerender(); } };
    loadFhirSettings().then(done, done);
    return () => { active = false; };
  }, [st]);
  const shared = fhirContext(element.context);
  const version = shared ? shared.fhirVersion : element.fhirVersion || "R4";
  const profiles = shared ? (shared.packages || []).join(";") : element.profiles || "";
  const txServer = shared ? shared.terminologyServer || "" : element.terminologyServer || "";
  const setContext = (name) => {
    element.context = name;
    element.formatVersion = 2;
    if (name && !element.validation) element.validation = "inherit";
    if (!name && element.validation === "inherit") element.validation = asBool(element.validateOutput, true) ? "always" : "off";
    onChange();
    state.current = null; // the profile and its lists are read again with the context's packages
    rerender();
  };
  const ctx = { version, profiles, instances: st.instances, showAll: st.showAll };
  const tree = st.rootIndex ? makeTree(st.rootIndex, ctx) : null;
  const diagnosticHere = error => !error.step || String(error.step.sequenceNumber) === String(element.sequenceNumber);
  const revealDiagnostic = (error) => {
    if (!diagnosticHere(error)) return;
    const chain = st.rootIndex && makeTree(st.rootIndex, { ...ctx, showAll: true }).chain(error.key);
    if (!chain) {
      st.notice = tr("The element {p0} is not in the loaded profile.", { p0: error.key });
    } else {
      st.showAll = true;
      st.filter = "all";
      st.search = "";
      for (const node of chain.slice(0, -1)) st.expanded.add(node.key);
      st.pendingDiagnostic = { key: error.key, kind: mapperDiagnostic(error).kind };
      st.selectedKey = error.key;
      st.tab = "mapper";
    }
    rerender();
  };
  const diagnosticRef = (key, kind) => (node) => {
    if (node && st.pendingDiagnostic?.key === key && st.pendingDiagnostic.kind === kind) {
      st.pendingDiagnostic = null;
      node.scrollIntoView({ block: "center" });
      node.querySelector("input, textarea")?.focus();
    }
  };
  const diagnosticView = (error, id) => {
    const display = mapperDiagnostic(error);
    return h("div", { key: id, style: { color: "var(--err, #b91c1c)", fontSize: "12px", marginBottom: "6px" } },
      h("strong", null, display.label),
      error.key && tree && diagnosticHere(error) ? h("button", { type: "button", className: "btn btn-sm", style: { marginLeft: "6px" }, onClick: () => revealDiagnostic(error) }, tr("Go to rule")) : null,
      h("div", null, error.message),
      !diagnosticHere(error) ? h("div", null, tr("This diagnostic belongs to step {name}. Select that step to edit its rule.", { name: error.step.name || error.step.sequenceNumber })) : null,
      display.target ? h("div", { style: { fontFamily: "monospace" } }, tr("Target: {p0}", { p0: display.target })) : null,
      error.expression ? h("pre", { style: { whiteSpace: "pre-wrap", margin: "4px 0" } }, error.expression) : null);
  };

  const allKeys = () => new Set([...st.values.keys(), ...st.iterations.keys(), ...st.translations.keys(), ...st.conditions.keys()]);
  const forget = (key) => {
    st.values.delete(key);
    st.iterations.delete(key);
    st.translations.delete(key);
    st.conditions.delete(key);
  };
  // Compiled on the whole tree, also what "extensions & ids" hides, so that no mapping is lost.
  const compiled = (index, local) => {
    const previous = parseMappings(element.mappings);
    const ids = st.ruleIds ||= new Map();
    const rules = mapperRuleIds(compile(makeTree(index, { ...local, showAll: true }), st.values, st.iterations, st.translations, st.conditions)
      .map(rule => ids.has(mapperRuleKey(rule)) ? { ...rule, id: ids.get(mapperRuleKey(rule)) } : rule), previous);
    for (const rule of rules) ids.set(mapperRuleKey(rule), rule.id);
    return JSON.stringify(rules.map((rule) => {
      const key = mapperRuleKey(rule);
      return { ...rule, ...(st.notes.get(key) ? { note: st.notes.get(key) } : {}), ...(st.disabled.has(key) ? { disabled: true } : {}) };
    }));
  };

  const save = () => {
    if (!tree) return;
    try {
      element.mappings = compiled(st.rootIndex, ctx);
      st.error = "";
    } catch (error) {
      st.error = errorText(error);
      rerender();
      return;
    }
    // Undo history: one entry per burst of edits (typing in a field is one change).
    const snap = snapshot(st);
    if (st.current && JSON.stringify(snap) !== JSON.stringify(st.current)) {
      if (Date.now() - st.lastPush > 1000) { st.undo.push(st.current); if (st.undo.length > 100) st.undo.shift(); }
      st.lastPush = Date.now();
      st.redo = [];
    }
    st.current = snap;
    onChange();
  };
  const importTable = async () => {
    try {
      if (!tree) throw new Error(tr("Load a profile before importing a table."));
      const file = await platform.ui.pickFile(".csv,.md");
      if (!file) return;
      const edits = importMappingTable(file.content, file.name.toLowerCase().endsWith(".csv") ? "csv" : "markdown",
        makeTree(st.rootIndex, { ...ctx, showAll: true }), element);
      for (const edit of edits) {
        st.values.set(edit.key, edit.expression);
        if (edit.note) st.notes.set(`value:${edit.key}`, edit.note); else st.notes.delete(`value:${edit.key}`);
      }
      st.lastPush = 0;
      save();
      st.lastPush = 0;
      st.notice = tr("Imported {count} value edit(s).", { count: edits.length });
      rerender();
    } catch (error) { st.notice = errorText(error); rerender(); }
  };
  const exportTable = async (format, documentation = false) => {
    try {
      const rules = parseMappings(element.mappings);
      const extension = format === "markdown" ? "md" : format;
      await platform.ui.saveFile(`fhir-mapping.${extension}`, format === "html" ? "text/html" : format === "csv" ? "text/csv" : "text/markdown",
        async () => documentation ? mappingDocumentation(element, rules, format) : mappingTable(rules, format));
    } catch (error) { st.notice = errorText(error); rerender(); }
  };
  const travel = (from, to) => {
    if (!from.length || !tree) return;
    to.push(st.current || snapshot(st));
    st.current = from.pop();
    restore(st, st.current);
    st.lastPush = 0;
    element.mappings = compiled(st.rootIndex, { ...ctx, instances: st.instances });
    onChange();
    rerender();
  };
  // Full screen is a style of the editor's own element: moving it out of the React root would cut its events.
  const toggleFullScreen = () => { st.fullScreen = !st.fullScreen; rerender(); };
  React.useEffect(() => {
    if (!st.fullScreen) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector(".suggest-widget.visible, .mapper-expression-editing, [role=menu]")) return;
      st.fullScreen = false;
      rerender();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [st.fullScreen]);

  // Loads the profile, then every type on the way to a saved mapping. Mappings of elements another
  // profile does not have are dropped (and listed); for the saved profile, a mapping that cannot be
  // found (a type that failed to load) blocks editing, so that saving cannot lose it.
  const load = async (url) => {
    st.loading = true;
    st.error = "";
    st.notice = "";
    st.unresolved = [];
    rerender();
    try {
      const index = await fetchElements(platform, version, profiles, url);
      const sameProfile = element.profileUrl === url && element.resourceType === index.sd.type;
      st.rootIndex = index;
      if (element.action && index.sd.type === "Bundle") {
        element.action = "createBundle";
        element.bundleTargets = "[]";
        const fixedType = index.byId.get("Bundle.type")?.fixedCode;
        if (fixedType) element.bundleType = fixedType;
      }
      st.expanded.add(index.sd.type);
      const local = { version, profiles, instances: st.instances, showAll: true };
      const unresolved = [];
      for (const key of allKeys()) {
        const parts = key.split(".");
        let found = true;
        for (let i = 1; i <= parts.length && found; i++) {
          const prefix = parts.slice(0, i).join(".");
          let t = makeTree(index, local);
          let nodes = t.chain(prefix);
          if (!nodes) {
            // the parent may be a type that is not loaded yet
            const parentNodes = t.chain(parts.slice(0, i - 1).join("."));
            const parent = parentNodes && parentNodes[parentNodes.length - 1];
            if (parent && parent.typeUrl) {
              await fetchSd(platform, version, profiles, parent.typeUrl);
              t = makeTree(index, local);
              nodes = t.chain(prefix);
            }
          }
          if (!nodes) found = false;
          else if (i < parts.length) st.expanded.add(prefix);
        }
        if (!found) unresolved.push(key);
      }
      // Load the types of required elements below what is mapped, so that their fixed values are known.
      for (let round = 0; round < 4; round++) {
        const t = makeTree(index, local);
        const urls = new Set();
        const walk = (node, depth) => {
          for (const d of t.children(node) || []) {
            if (Number(d.min) < 1 || d.instance) continue;
            const kids = t.children(d);
            if (kids === null && d.typeUrl) urls.add(d.typeUrl);
            else if (kids && depth < 6) walk(d, depth + 1);
          }
        };
        for (const key of allKeys()) {
          const nodes = t.chain(key);
          if (nodes) for (const n of nodes.slice(0, -1)) walk(n, 0);
        }
        if (!urls.size) break;
        await Promise.all([...urls].map((u) => fetchSd(platform, version, profiles, u).catch(() => null)));
      }
      const sdVersion = index.sd.version || "";
      if (sameProfile && element.profileVersion && sdVersion && element.profileVersion !== sdVersion) {
        st.versionNotice = tr("The profile is now version {p0}; these mappings were made with version {p1}. Check them (elements no longer in the profile are listed).", { p0: sdVersion, p1: element.profileVersion });
      }
      if (sameProfile) {
        st.unresolved = unresolved;
        const before = parseMappings(element.mappings).filter((e) => "fixed" in e).length;
        const now = compiled(index, local);
        if (!unresolved.length && JSON.parse(now).filter((e) => "fixed" in e).length > before) {
          element.mappings = now;
          st.notice = tr("Fixed values of required elements were added to the mappings.");
          onChange();
        }
      } else {
        for (const key of unresolved) forget(key);
        if (unresolved.length) st.notice = tr("Not in this profile, removed: {p0}.", { p0: unresolved.join(", ") });
      }
      if (!sameProfile) {
        element.profileUrl = url;
        element.profileVersion = index.sd.version || "";
        element.resourceType = index.sd.type;
        element.mappings = compiled(index, local);
        onChange();
      }
    } catch (e) {
      st.error = errorText(e);
    } finally {
      st.loading = false;
      st.current = snapshot(st);
      rerender();
    }
  };

  React.useEffect(() => {
    // A step that names a context waits for the settings: its packages come from them.
    if (element.profileUrl && (!element.context || st.settingsReady)) load(element.profileUrl);
  }, [st, element.context ? st.settingsReady : true]);

  // The transformer editor shows element.script in its Generated Script tab and validates it with
  // Validate Step: the server's script, as a property that is not enumerable, so never saved.
  const scriptFor = React.useRef({ source: null, timer: null });
  React.useEffect(() => {
    const source = JSON.stringify(element);
    if (source === scriptFor.current.source) return undefined;
    clearTimeout(scriptFor.current.timer);
    scriptFor.current.timer = setTimeout(async () => {
      try {
        const text = await platform.api.post(`${MAPPER_API}/script`, source, { contentType: "text/plain", raw: true });
        const result = JSON.parse(text);
        const errors = (result.errors || []).map((e) => `// ${e.key ? `${e.key}: ` : ""}${e.message}`).join("\n");
        Object.defineProperty(element, "script", { value: (errors ? errors + "\n" : "") + (result.script || ""), enumerable: false, writable: true, configurable: true });
        scriptFor.current.source = source;
      } catch {
        // no preview until the next change
      }
    }, 800);
    return undefined;
  });
  React.useEffect(() => () => clearTimeout(scriptFor.current.timer), []);

  const loadProfileList = async () => {
    try {
      const text = await platform.api.get(`${MAPPER_API}/profiles`, { fhirVersion: version, profiles }, { raw: true });
      st.profileList = JSON.parse(text);
      st.error = "";
    } catch (e) {
      st.error = errorText(e);
    }
    rerender();
  };

  const toggle = async (node) => {
    if (st.expanded.has(node.key)) {
      st.expanded.delete(node.key);
      rerender();
      return;
    }
    st.expanded.add(node.key);
    rerender();
    if (tree.children(node) === null) {
      try {
        await fetchSd(platform, version, profiles, node.typeUrl);
      } catch (e) {
        st.error = tr("{p0}: {p1}", { p0: node.typeUrl, p1: errorText(e) });
      }
      rerender();
    }
  };

  const setValue = (node, value) => {
    if (value.trim() === "") st.values.delete(node.key);
    else st.values.set(node.key, value);
    save();
    rerender();
  };

  const addInstance = (node) => {
    st.instances.set(node.keyBase, Math.max(1, st.instances.get(node.keyBase) || 1) + 1);
    rerender();
  };

  const duplicate = (node) => {
    const count = tree.children(node.parent).filter(sibling => sibling.keyBase === node.keyBase).length;
    if (!node.repeats || st.iterations.has(node.key) || (node.max !== "*" && count >= Number(node.max))) return;
    const target = `${node.keyBase}[${count}]`;
    duplicateBranch(st, node.key, target);
    st.instances.set(node.keyBase, count + 1);
    st.expanded.add(target);
    st.selectedKey = target;
    st.lastPush = 0;
    save();
    st.lastPush = 0;
    rerender();
  };

  const removeInstance = (node) => {
    for (const key of allKeys()) {
      if (key === node.key || key.startsWith(node.key + ".")) forget(key);
    }
    st.instances.set(node.keyBase, node.instance);
    save();
    rerender();
  };

  const removeUnresolved = () => {
    for (const key of st.unresolved) forget(key);
    st.unresolved = [];
    save();
    rerender();
  };

  const toggleIteration = (node) => {
    if (st.iterations.has(node.key)) st.iterations.delete(node.key);
    else st.iterations.set(node.key, { expression: "", variable: "item" });
    save();
    rerender();
  };
  const setIteration = (node, prop, value) => {
    st.iterations.get(node.key)[prop] = value;
    save();
    rerender();
  };
  const toggleCondition = (node) => {
    if (st.conditions.has(node.key)) st.conditions.delete(node.key);
    else st.conditions.set(node.key, "");
    save();
    rerender();
  };
  const setCondition = (node, value) => {
    st.conditions.set(node.key, value);
    save();
    rerender();
  };
  const saveSample = () => {
    try {
      localStorage.setItem(st.sampleKey, JSON.stringify(st.sample));
    } catch {
      // no storage: the sample is kept while the editor is open
    }
  };
  const previewSelection = scope => {
    if (scope !== "transformer") return { step: { ...element, samples: "[]" } };
    const steps = mapperPreviewSteps(platform, element);
    if (!steps) throw new Error(tr("The current transformer cannot be identified."));
    return { steps };
  };
  // Samples stay in the channel; the test API receives only code and one input message.
  const testOn = async (sample, trace, scope = sample.scope || st.previewScope) => {
    try {
      const text = await platform.api.post(`${MAPPER_API}/test`, JSON.stringify({ ...previewSelection(scope), message: sample.message, dataType: sample.dataType || "HL7V2", trace }), {
        contentType: "text/plain",
        raw: true,
        timeoutMs: 60000
      });
      return JSON.parse(text);
    } catch (e) {
      const message = errorText(e);
      return { output: null, issues: [], errors: [{ key: null, line: null, message: e?.status === 403 || /Test FHIR mapper steps/.test(message)
        ? tr("Testing a step runs its code on the server, like a deployed channel: it requires the permission “Test FHIR mapper steps”.")
        : message }] };
    }
  };
  const runTest = async () => {
    st.testing = true;
    st.testResult = null;
    st.suite = null;
    rerender();
    st.testResult = await testOn(st.sample, st.traceOptions, st.previewScope);
    st.testing = false;
    rerender();
  };
  // Samples saved with the step (and so with the channel), each with an optional expected result.
  const samples = stepSamples(element);
  const activeSample = samples.find((s) => s.id === st.activeSample) || null;
  const writeSamples = (next) => { element.samples = JSON.stringify(next); onChange(); rerender(); };
  const updateActive = (patch) => { if (activeSample) writeSamples(samples.map((s) => (s.id === activeSample.id ? { ...s, ...patch } : s))); };
  const selectSample = (id) => {
    st.activeSample = id || null;
    const chosen = samples.find((s) => s.id === id);
    if (chosen) { st.sample = { message: chosen.message, dataType: chosen.dataType || "HL7V2" }; st.previewScope = chosen.scope || "step"; }
    st.testResult = null;
    rerender();
  };
  const saveAsSample = async () => {
    const ask = platform.ui?.promptDialog;
    const name = ask ? await ask(tr("Save the sample with the step"), tr("Name"), tr("Sample {count}", { count: samples.length + 1 })) : tr("Sample {count}", { count: samples.length + 1 });
    if (!name || !String(name).trim()) return;
    const id = crypto.randomUUID();
    st.activeSample = id;
    writeSamples([...samples, { id, name: String(name).trim(), dataType: st.sample.dataType, message: st.sample.message, scope: st.previewScope, expected: null }]);
  };
  const runAllSamples = async () => {
    st.testing = true;
    st.suite = [];
    st.testResult = null;
    rerender();
    for (const sample of samples) {
      const result = await testOn(sample, { enabled: false }, sample.scope || "step");
      const verdict = sampleVerdict(sample, result);
      const invalid = result.issues.some((i) => i.severity === "error" || i.severity === "fatal");
      st.suite.push({ id: sample.id, name: sample.name, ok: !result.errors.length && !invalid && verdict !== false,
        detail: result.errors.length ? result.errors[0].message : invalid ? tr("invalid FHIR result") : verdict === false ? tr("differs from the expected result") : verdict === true ? tr("matches the expected result") : tr("runs (no expected result)") });
      rerender();
    }
    st.testing = false;
    rerender();
  };
  const showScript = async () => {
    if (st.scriptResult) {
      st.scriptResult = null;
      rerender();
      return;
    }
    try {
      const text = await platform.api.post(`${MAPPER_API}/script`, JSON.stringify(element), { contentType: "text/plain", raw: true });
      st.scriptResult = JSON.parse(text);
    } catch (e) {
      st.scriptResult = { script: "", errors: [{ key: null, line: null, message: errorText(e) }] };
    }
    rerender();
  };

  // A field clicked or pasted in below an iteration is rewritten to its variable, as when dragged.
  const withSubstitution = (node, before, after) => {
    const around = iterationsAround(node);
    const ins = around.length ? inserted(before, after) : null;
    if (!ins || !/^msg\[/.test(ins.text)) return after;
    return after.slice(0, ins.start) + substitute(ins.text, around) + after.slice(ins.end);
  };

  const toggleTranslation = (node) => {
    if (st.translations.has(node.key)) st.translations.delete(node.key);
    else st.translations.set(node.key, { conceptMap: "", source: "", target: "", unmapped: "none" });
    save();
    rerender();
  };
  const setTranslation = (node, prop, value) => {
    st.translations.get(node.key)[prop] = value;
    save();
    rerender();
  };
  // The ConceptMaps of the terminology server, or without one (empty or n/a) of the profile packages.
  const loadConceptMaps = async () => {
    const server = txServer.trim();
    const source = `${server}|${profiles}|${version}`;
    if (st.conceptMaps && st.conceptMaps.source === source) return;
    try {
      const text = await platform.api.get(`${MAPPER_API}/conceptMaps`, { server, profiles, fhirVersion: version }, { raw: true });
      st.conceptMaps = { source, list: JSON.parse(text) };
      st.error = "";
    } catch (e) {
      st.conceptMaps = { source, list: [] };
      st.error = errorText(e);
    }
    rerender();
  };
  const testTranslation = async (node) => {
    const t = st.translations.get(node.key);
    const test = st.tests.get(node.key) || {};
    test.result = "…";
    st.tests.set(node.key, test);
    rerender();
    try {
      const text = await platform.api.get(
        `${MAPPER_API}/translate`,
        { server: txServer, profiles, conceptMap: t.conceptMap, system: t.source || "", code: test.code || "", targetSystem: t.target || "", fhirVersion: version },
        { raw: true }
      );
      const match = JSON.parse(text);
      test.result = match ? tr("→ {p0}{p1}", { p0: [match.system, match.code].filter(Boolean).join("|"), p1: match.display ? ` (${match.display})` : "" }) : tr("→ no match (then the rule chosen for no match)");
    } catch (e) {
      test.result = errorText(e);
    }
    rerender();
  };

  /** The iterations from a node up to the root, innermost first. */
  const iterationsAround = (node) => {
    const list = [];
    for (let n = node; n; n = n.parent) {
      const it = st.iterations.get(n.key);
      if (it) list.push(it);
    }
    return list;
  };
  // Reference names of the other FHIR steps of this transformer, for fhirRef(...).
  const stepRefs = (() => {
    const found = mapperContext(platform, element);
    return found ? found.steps.filter((s, i) => i !== found.index && s.__type === MAPPER_TYPE && String(s.refName || "").trim())
      .map((s) => ({ step: s.name, expression: String(s.refName).trim(), resourceType: s.resourceType })) : [];
  })();
  // The codes of the value set an element is bound to, read from the server the first time its field is edited.
  const bindingCodes = (node) => (node?.binding && (st.codes ||= new Map()).get(node.binding.valueSet)?.codes) || [];
  const ensureCodes = (node) => {
    if (!node?.binding) return;
    const known = (st.codes ||= new Map());
    if (known.has(node.binding.valueSet)) return;
    known.set(node.binding.valueSet, { codes: [] });
    platform.api.get(`${MAPPER_API}/catalog/expand`, { valueSet: node.binding.valueSet, filter: "", fhirVersion: version, profiles }, { raw: true })
      .then((text) => { known.set(node.binding.valueSet, JSON.parse(text)); rerender(); })
      .catch(() => { /* a value set that cannot be expanded here offers no code */ });
  };
  // Paths of the sample that hold a value, in the form the completion compares (double quotes), with that value.
  const valuedPaths = (() => {
    const serialized = st.sample.dataType === "HL7V2" ? st.serialized : st.sample;
    const values = {};
    if (serialized) {
      for (const f of sourcePaths(sourceTree(serialized))) {
        if (f.value !== null && f.value !== "" && f.path !== "msg") values[f.path.replace(/\['((?:[^'\\]|\\.)*)'\]/g, (_, key) => `[${JSON.stringify(key)}]`)] = f.value;
      }
    }
    return values;
  })();
  const completionFor = (node, role = "value") => ({ ...mapperCompletionContext(node, st.iterations, Object.keys(valuedPaths), role), pathValues: valuedPaths, e4x: st.sample.dataType !== "JSON", refs: stepRefs,
    codes: role === "value" ? bindingCodes(node) : [], bindingStrength: node?.binding?.strength });
  // Elements the last test or compilation reported: marked in the tree.
  const errorsByKey = new Map();
  for (const error of [...(st.testResult?.errors || []), ...(st.scriptResult?.errors || [])]) {
    if (error.key && diagnosticHere(error)) errorsByKey.set(error.key, [...(errorsByKey.get(error.key) || []), error.message]);
  }

  const field = (label, control, hint) => h("div", { className: "field" }, h("label", null, label), control, hint ? h("div", { className: "hint" }, hint) : null);
  const number = (prop, fallback) =>
    h("input", {
      type: "number",
      min: 0,
      value: element[prop] ?? fallback,
      onChange: (e) => {
        const n = parseInt(e.target.value, 10);
        element[prop] = Number.isFinite(n) && n >= 0 ? n : fallback;
        onChange();
        rerender();
      }
    });
  const text = (prop, placeholder, code) =>
    h(code ? ExpressionField : "input", {
      completionContext: code ? completionFor(tree?.root, "reference") : undefined,
      type: "text",
      placeholder,
      style: code ? { fontFamily: "monospace", fontSize: "12px" } : undefined,
      value: element[prop] ?? "",
      onChange: (e) => {
        element[prop] = e.target.value;
        onChange();
        rerender();
      }
    });

  const hasMappedBelow = (node) => {
    for (const key of allKeys()) if (key === node.key || key.startsWith(node.key + ".") || key.startsWith(node.key + "[")) return true;
    return false;
  };
  const term = (st.search || "").trim().toLowerCase();
  // Extensions and value[x] can reach the entire type graph. Bound the search,
  // check direct children first and stop recursive visits of the same datatype.
  let searchBudget = 2000;
  let searchTruncated = false;
  const searchCache = new Map();
  const matches = (node, depth = 0) => {
    if (node.key.toLowerCase().includes(term)) return true;
    if (depth >= 4) return false;
    const cacheKey = `${depth}:${node.key}`;
    if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);
    const children = tree.children(node) || [];
    if (children.some(child => child.key.toLowerCase().includes(term))) { searchCache.set(cacheKey, true); return true; }
    if (searchBudget-- <= 0) { searchTruncated = true; return false; }
    for (let parent = node.parent; parent; parent = parent.parent) if (node.typeUrl && parent.typeUrl === node.typeUrl) return false;
    const found = children.some(child => matches(child, depth + 1));
    searchCache.set(cacheKey, found);
    return found;
  };
  // Search the selected branch before spending the budget on unrelated datatypes.
  if (term && st.selectedKey && tree) for (const node of (tree.chain(st.selectedKey) || []).slice(1).reverse()) matches(node);
  const opened = (node) => st.expanded.has(node.key) || (!!term && !node.key.toLowerCase().includes(term) && matches(node));
  const visible = (node) => {
    if (element.action === "createBundle" && (node.key === "Bundle.entry" || node.key.startsWith("Bundle.entry."))) return false;
    if (term && !matches(node)) {
      // keep what is below a matching element
      for (let p = node.parent; p; p = p.parent) if (p.depth > 0 && p.key.toLowerCase().includes(term)) return true;
      return false;
    }
    if (st.filter === "mapped") return hasMappedBelow(node);
    if (st.filter === "mustSupport") return node.mustSupport || Number(node.min) >= 1 || hasMappedBelow(node);
    return true;
  };

  const rows = [];
  const rowGroups = [];
  const guides = (node, auxiliary = false) => {
    const levels = [];
    for (let parent = auxiliary ? node : node.parent; parent && parent.depth > 0; parent = parent.parent) levels.push(parent.depth);
    return h("span", { className: "mapper-tree-guides", "aria-hidden": true },
      levels.map((depth) => h("i", { key: depth, style: { left: `${depth * 20 + 11}px` } })),
      levels.length ? h("b", { style: { left: `${(auxiliary ? node.depth + 1 : node.depth) * 20 - 9}px` } }) : null);
  };
  const blocked = st.loading || st.unresolved.length > 0;
  const addNode = (child, list) => {
    if (!visible(child)) return;
    rows.push(row(child, list));
    if (st.iterations.has(child.key)) rows.push(iterationRow(child));
    if (st.conditions.has(child.key)) rows.push(conditionRow(child));
    if (st.translations.has(child.key)) rows.push(translationRow(child));
    if (st.ruleDetails === child.key) rows.push(ruleDetailsRow(child));
    if (opened(child)) addRows(child);
  };
  const addRows = (node) => {
    const list = tree.children(node);
    if (list === null) {
      rows.push(h("tr", { key: node.key + "/loading" }, h("td", { colSpan: 3, style: { paddingLeft: `${(node.depth + 1) * 20 + 26}px` } }, guides(node, true), h("span", { className: "text-text-faint" }, tr("Loading…")))));
      return;
    }
    for (const child of list) {
      addNode(child, list);
    }
  };
  const row = (node, siblings) => {
    const open = opened(node);
    const canExpand = tree.expandable(node);
    const count = siblings.filter((s) => s.keyBase === node.keyBase).length;
    const iterated = st.iterations.has(node.key);
    const canAdd = !iterated && node.repeats && node.instance === count - 1 && (node.max === "*" || Number(node.max) > count);
    const canIterate = node.repeats && !node.choice;
    const canTranslate = !node.choice && TRANSLATABLE.has(node.code);
    const value = st.values.get(node.key) ?? "";
    const types = node.types.map((t) => shortType(t.code) + (t.profile ? ` (${t.profile.map((p) => p.slice(p.lastIndexOf("/") + 1)).join(", ")})` : "")).join(" | ");
    const placeholder = node.fixed ? `${node.fixed.kind}: ${fixedText(node.fixed)}` : node.choice ? tr("choose a type below")
      : node.binding ? tr("{strength} binding: {valueSet}", { strength: node.binding.strength, valueSet: node.binding.valueSet.replace(/\|.*$/, "").split("/").pop() }) : "";
    const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
    const tool = (label, title, onClick, active) =>
      h("button", { type: "button", className: "btn btn-sm", style: { flex: "none", padding: "0 6px", fontWeight: active ? 700 : 400, borderColor: active ? "var(--accent, #2563eb)" : undefined }, title, disabled: blocked, onClick }, label);
    // Fixed column widths (see the table): the element and type are cut with an ellipsis, the
    // mapping keeps its room, and the actions sit next to it, where they cannot push it away.
    return h(
      "tr",
      { key: node.key, className: [open ? "mapper-node-open" : "", errorsByKey.has(node.key) ? "mapper-node-error" : "", st.selectedKey === node.key ? "mapper-node-selected" : ""].filter(Boolean).join(" ") || undefined, "data-depth": node.depth, ref: diagnosticRef(node.key, "value"),
        onFocus: () => selectNode(node), onClick: () => selectNode(node),
        onContextMenu: event => nodeMenu(event, node), onKeyDown: event => { if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) nodeMenu(event, node); },
        title: errorsByKey.has(node.key) ? tr("{p0}: {p1}", { p0: node.key, p1: errorsByKey.get(node.key).join(" · ") }) : node.short ? tr("{p0}: {p1}", { p0: node.key, p1: node.short }) : node.key },
      h(
        "td",
        { style: { paddingLeft: `${node.depth * 20}px` } },
        guides(node),
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "4px", minWidth: 0 } },
          h(
            "button",
            {
              type: "button",
              className: "btn btn-sm",
              "aria-expanded": canExpand ? open : undefined,
              "aria-label": tr("{p0} {p1}", { p0: open ? "Collapse" : "Expand", p1: node.key }),
              style: { flex: "none", visibility: canExpand ? "visible" : "hidden", minWidth: "22px", padding: "0 4px" },
              onClick: () => toggle(node)
            },
            open ? "▾" : "▸"
          ),
          h("button", { type: "button", className: "mapper-node-label mapper-select", "aria-label": tr("Inspect {p0}", { p0: node.key }), "aria-pressed": st.selectedKey === node.key,
            style: { ...ellipsis, minWidth: 0, fontWeight: node.mustSupport || open ? 600 : 400 }, onClick: () => selectNode(node) }, node.label + (node.instance ? ` [${node.instance}]` : "")),
          h("span", { className: "text-text-faint", style: { flex: "none", fontSize: "11px" } }, tr("{p0}..{p1}", { p0: node.min ?? 0, p1: node.max ?? "*" })),
          node.mustSupport ? h("span", { title: tr("Must Support"), style: { flex: "none", color: "var(--warn, #c2410c)", fontSize: "11px" } }, tr("S")) : null,
          h("a", { className: "mapper-help", href: mapperHelpUrl(version, element.resourceType, node.key), target: "_blank", rel: "noopener noreferrer",
            title: tr("Official FHIR definition"), "aria-label": tr("FHIR help for {p0}", { p0: node.key }) }, "?")
        )
      ),
      h("td", { className: "text-text-faint", style: { ...ellipsis, fontSize: "11px" }, title: types }, types),
      h(
        "td",
        null,
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "4px", minWidth: 0 } },
          node.choice
            ? h("span", { className: "text-text-faint", style: { ...ellipsis, flex: "1 1 auto", fontSize: "11px" } }, placeholder)
            : h(ExpressionField, {
                errors: errorsByKey.get(node.key),
                onEdit: () => ensureCodes(node),
                completionContext: completionFor(node),
                type: "text",
                value,
                disabled: blocked || (element.action === "createBundle" && node.key === "Bundle.type"),
                placeholder,
                title: value || placeholder,
                style: { flex: "1 1 auto", width: "auto", minWidth: "160px", fontFamily: "monospace", fontSize: "12px" },
                onChange: (e) => setValue(node, withSubstitution(node, value, e.target.value)),
                onDrop: (e) => {
                  const dropped = e.dataTransfer && e.dataTransfer.getData("text/plain");
                  const around = iterationsAround(node);
                  if (!dropped || !around.length) return;
                  e.preventDefault();
                  const input = e.target;
                  const start = input.selectionStart ?? input.value.length;
                  const end = input.selectionEnd ?? start;
                  setValue(node, input.value.slice(0, start) + substitute(dropped, around) + input.value.slice(end));
                }
              }),
          canAdd ? tool("+", tr("Add an entry"), () => addInstance(node), false) : null,
          node.instance && node.instance === count - 1 ? tool("−", tr("Remove this entry and its mappings"), () => removeInstance(node), false) : null,
          canIterate ? tool("↻", tr("One entry for each item of a list (for each repetition)"), () => toggleIteration(node), iterated) : null,
          canTranslate ? tool("⇄", tr("Translate the value with ConceptMap/$translate"), () => toggleTranslation(node), st.translations.has(node.key)) : null,
          node.choice ? null : tool("?", tr("Only map this element (and what is below it) when a condition holds"), () => toggleCondition(node), st.conditions.has(node.key)),
          ruleDetailsButton(node), menuButton(node)
        )
      )
    );
  };

  const subRow = (node, suffix, children) =>
    h("tr", { key: `${node.key}/${suffix}`, ref: diagnosticRef(node.key, suffix), "data-owner": node.key }, h("td", { colSpan: 3, style: { paddingLeft: `${node.depth * 20 + 34}px` } }, guides(node, true), h("div", { style: { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" } }, children)));
  const mono = { fontFamily: "monospace", fontSize: "12px" };

  const rulesAt = (node) => parseMappings(element.mappings).filter((rule) => (rule.key || rule.element) === node.key);
  const selectNode = (node) => { if (st.selectedKey !== node.key) { st.selectedKey = node.key; rerender(); } };
  const ruleDetailsButton = (node) => rulesAt(node).length ? h("button", {
    type: "button", className: "btn btn-sm", disabled: blocked,
    "aria-label": tr("Rule details for {p0}", { p0: node.key }), "aria-expanded": st.ruleDetails === node.key,
    onClick: () => { st.ruleDetails = st.ruleDetails === node.key ? null : node.key; rerender(); }
  }, st.disabled.size && rulesAt(node).some((rule) => st.disabled.has(mapperRuleKey(rule))) ? tr("Rules (disabled)") : tr("Rules")) : null;
  const ruleDetailsFields = (node) => rulesAt(node).map((rule) => {
    const key = mapperRuleKey(rule);
    const kind = "each" in rule ? tr("Iteration") : "condition" in rule ? tr("Condition") : "fixed" in rule ? tr("Fixed value") : tr("Value");
    return h("div", { key, style: { flex: "1 1 100%", padding: "4px 0" } },
      h("label", null, h("input", {
        type: "checkbox", checked: !st.disabled.has(key), disabled: blocked,
        "aria-label": tr("Enable {p0} rule for {p1}", { p0: kind.toLowerCase(), p1: node.key }),
        onChange: (e) => { if (e.target.checked) st.disabled.delete(key); else st.disabled.add(key); st.lastPush = 0; save(); st.lastPush = 0; rerender(); }
      }), tr(" {p0} rule", { p0: kind }), st.disabled.has(key) ? tr(" — disabled (kept, not executed)") : ""),
      h("textarea", {
        value: st.notes.get(key) || "", disabled: blocked, rows: 2, placeholder: tr("Rule note…"),
        "aria-label": tr("Note for {p0} rule for {p1}", { p0: kind.toLowerCase(), p1: node.key }),
        style: { display: "block", width: "100%", marginTop: "4px" },
        onChange: (e) => { if (e.target.value) st.notes.set(key, e.target.value); else st.notes.delete(key); save(); rerender(); }
      }));
  });
  const ruleDetailsRow = (node) => subRow(node, "rules", ruleDetailsFields(node));

  const iterationFields = (node) => {
    const it = st.iterations.get(node.key);
    const variable = (it.variable || "item").trim() || "item";
    return [
      h("span", { key: "l", title: node === tree.root ? tr("One resource for each item") : tr("One entry of this element for each item") }, node === tree.root ? tr("↻ One resource for each") : tr("↻ For each")),
      h(ExpressionField, { key: "e", completionContext: completionFor(node, "iteration"), value: it.expression, disabled: blocked, placeholder: "msg['PID']['PID.3']", style: { ...mono, flex: "1 1 240px" }, onChange: (e) => setIteration(node, "expression", e.target.value) }),
      h("span", { key: "a" }, tr("as")),
      h("input", { key: "v", type: "text", value: it.variable, disabled: blocked, style: { ...mono, width: "90px" }, onChange: (e) => setIteration(node, "variable", e.target.value) }),
      h("span", { key: "h", className: "text-text-faint", style: { fontSize: "11px" } }, tr("below: {p0} (the item), {p1}Index (0, 1, …); fields dragged in are rewritten to {p2}[…]", { p0: variable, p1: variable, p2: variable }))
    ];
  };
  const iterationRow = (node) => subRow(node, "each", iterationFields(node));

  const conditionFields = (node) => [
      h("span", { key: "l", title: tr("What is below this element is only mapped when the condition holds") }, node === tree.root ? tr("? Only make the resource if") : tr("? Only if")),
      h(ExpressionField, {
        completionContext: completionFor(node, "condition"),
        key: "c",
        type: "text",
        value: st.conditions.get(node.key) || "",
        disabled: blocked,
        placeholder: st.iterations.has(node.key) ? tr("{p0}['PID.3.5'].toString() == 'PI'", { p0: (st.iterations.get(node.key).variable || "item").trim() }) : "msg['PID']['PID.8']['PID.8.1'].toString() != ''",
        style: { ...mono, flex: "1 1 300px" },
        onChange: (e) => setCondition(node, withSubstitution(node, st.conditions.get(node.key) || "", e.target.value))
      }),
      h("span", { key: "h", className: "text-text-faint", style: { fontSize: "11px" } }, st.iterations.has(node.key) ? tr("per item: keeps the items it holds for") : tr("false, or an error on a missing segment: nothing below"))
    ];
  const conditionRow = (node) => subRow(node, "condition", conditionFields(node));

  const translationFields = (node, listId = "fhir-profile-mapper-conceptmaps") => {
    const t = st.translations.get(node.key);
    const test = st.tests.get(node.key) || {};
    const allMaps = st.conceptMaps?.list || [];
    const recommended = matchingConceptMaps(allMaps, { source: t.source, target: t.target, valueSet: node.binding?.valueSet,
      systems: bindingCodes(node).map(code => code.system).filter(Boolean) });
    const maps = st.allConceptMaps ? allMaps : recommended;
    const localTx = isLocalServer(txServer);
    const needsValue = t.unmapped === "fixed" || t.unmapped === "function";
    return [
      h("span", { key: "l", title: localTx ? tr("ConceptMap/$translate locally, on the ConceptMaps of the Profile Packages") : tr("ConceptMap/$translate on the terminology server") }, localTx ? tr("⇄ ConceptMap (local)") : tr("⇄ ConceptMap")),
      h("input", {
        key: "m",
        type: "text",
        list: listId,
        value: t.conceptMap,
        disabled: blocked,
        placeholder: tr("canonical URL of the ConceptMap"),
        style: { ...mono, flex: "1 1 220px" },
        "aria-label": tr("ConceptMap for {p0}", { p0: node.key }),
        onFocus: () => { loadConceptMaps(); ensureCodes(node); },
        onChange: (e) => setTranslation(node, "conceptMap", e.target.value)
      }),
      h("datalist", { key: "d", id: listId }, maps.map((m) => h("option", { key: m.url, value: m.url }, m.title || m.name || m.url))),
      h("label", { key: "all", className: "hint" }, h("input", { type: "checkbox", checked: !!st.allConceptMaps,
        onChange: event => { st.allConceptMaps = event.target.checked; loadConceptMaps(); rerender(); } }), tr(" All ConceptMaps ({p0} matching)", { p0: recommended.length })),
      h("input", { key: "s", type: "text", value: t.source, disabled: blocked, placeholder: tr("source system (optional)"), title: tr("system of the source code"), style: { ...mono, flex: "1 1 160px" }, onChange: (e) => setTranslation(node, "source", e.target.value) }),
      h("input", { key: "t", type: "text", value: t.target, disabled: blocked, placeholder: tr("target system (optional)"), title: tr("targetsystem of $translate"), style: { ...mono, flex: "1 1 140px" }, onChange: (e) => setTranslation(node, "target", e.target.value) }),
      h(
        "select",
        { key: "u", value: t.unmapped || "none", disabled: blocked, title: tr("When $translate gives no match"), onChange: (e) => setTranslation(node, "unmapped", e.target.value) },
        h("option", { value: "none" }, tr("no match: leave empty")),
        h("option", { value: "source" }, tr("no match: keep the source code")),
        h("option", { value: "fixed" }, tr("no match: fixed value")),
        h("option", { value: "function" }, tr("no match: expression")),
        h("option", { value: "error" }, tr("no match: error"))
      ),
      node.code === "CodeableConcept"
        ? h(
            "label",
            { key: "k", className: "check", title: tr("Add the source code as a second coding") },
            h("input", { type: "checkbox", checked: !!t.keepSource, disabled: blocked, onChange: (e) => setTranslation(node, "keepSource", e.target.checked) }),
            tr(" + source coding")
          )
        : null,
      needsValue
        ? h(t.unmapped === "function" ? ExpressionField : "input", {
            completionContext: t.unmapped === "function" ? completionFor(node, "translation") : undefined,
            key: "f",
            type: "text",
            value: t.value || "",
            disabled: blocked,
            placeholder: t.unmapped === "fixed" ? tr("code or system|code") : "myFunction(code, system)",
            title:
              t.unmapped === "fixed"
                ? tr("The value for codes without a match: a code, or system|code")
                : tr("JavaScript with code and system (the source code and its system), e.g. a code template function; gives a code, system|code or {system, code, display}, or null for no value"),
            style: { ...mono, flex: "1 1 180px" },
            onChange: (e) => setTranslation(node, "value", e.target.value)
          })
        : null,
      h("input", {
        key: "c",
        type: "text",
        value: test.code || "",
        placeholder: tr("code"),
        title: tr("a source code to try"),
        style: { ...mono, width: "70px" },
        onChange: (e) => {
          st.tests.set(node.key, { ...test, code: e.target.value });
          rerender();
        }
      }),
      h("button", { key: "b", type: "button", className: "btn btn-sm", disabled: !t.conceptMap || !test.code, onClick: () => testTranslation(node) }, tr("Test")),
      test.result ? h("span", { key: "r", className: "text-text-faint", style: { fontSize: "11px" } }, test.result) : null
    ];
  };
  const translationRow = (node) => subRow(node, "translate", translationFields(node));
  const branchRules = node => parseMappings(element.mappings).filter(rule => inBranch(rule.key || rule.element || "", node.key));
  const nodeMenu = (event, node) => {
    selectNode(node);
    const rules = branchRules(node);
    const enable = rules.length > 0 && rules.every(rule => st.disabled.has(mapperRuleKey(rule)));
    const count = node.parent ? tree.children(node.parent)?.filter(sibling => sibling.keyBase === node.keyBase).length : 0;
    const action = (label, onClick, disabled = false) => ({ label, onClick, disabled: blocked || disabled });
    showContextMenu(platform, event, [
      action(tr("Inspect element"), () => { st.selectedKey = node.key; rerender(); }),
      action(tr("Add an entry"), () => addInstance(node), !node.repeats || st.iterations.has(node.key) || (node.max !== "*" && count >= Number(node.max))),
      action(tr("Duplicate branch"), () => duplicate(node), !node.repeats || st.iterations.has(node.key) || !rules.length || (node.max !== "*" && count >= Number(node.max))),
      action(tr("Toggle iteration"), () => toggleIteration(node), !(node.repeats && !node.choice) && !(node.resourceRoot && !createBundle && bundle)),
      action(tr("Toggle condition"), () => toggleCondition(node), !!node.choice),
      action(tr("Toggle translation"), () => toggleTranslation(node), !TRANSLATABLE.has(node.code)),
      action(enable ? tr("Enable branch rules") : tr("Disable branch rules"), () => {
        for (const rule of rules) { const key = mapperRuleKey(rule); if (enable) st.disabled.delete(key); else st.disabled.add(key); }
        st.lastPush = 0; save(); st.lastPush = 0; rerender();
      }, !rules.length),
      action(tr("Copy branch as JSON"), async () => {
        try { await navigator.clipboard.writeText(JSON.stringify(rules, null, 2)); }
        catch (error) { st.error = errorText(error); rerender(); }
      }, !rules.length)
    ]);
  };
  const menuButton = node => h("button", { type: "button", className: "btn btn-sm", "aria-label": tr("Actions for {p0}", { p0: node.key }),
    "aria-haspopup": "menu", disabled: blocked || !platform.ui?.contextMenu,
    onClick: event => nodeMenu(event, node) }, "⋯");
  const createBundle = element.action === "createBundle";
  const declarations = mapperBundleDeclarations(platform, element);
  const targets = parseMappings(element.bundleTargets);
  const bundle = createBundle || targets.length > 0;
  const updateTarget = (name, change) => {
    const next = change === null ? targets.filter((t) => t.name !== name) : targets.some((t) => t.name === name)
      ? targets.map((t) => t.name === name ? { ...t, ...change } : t) : [...targets, { name, ...change }];
    element.bundleTargets = JSON.stringify(next);
    onChange();
    rerender();
  };
  if (tree) {
    const rootTool = (label, title, onClick, active) =>
      h("button", { type: "button", className: "btn btn-sm", style: { marginLeft: "6px", padding: "0 6px", fontWeight: active ? 700 : 400, borderColor: active ? "var(--accent, #2563eb)" : undefined }, title, disabled: blocked, onClick }, label);
    rows.push(
      h(
        "tr",
        { key: tree.root.key, ref: diagnosticRef(tree.root.key, "value"), onFocus: () => selectNode(tree.root), onClick: () => selectNode(tree.root),
          onContextMenu: event => nodeMenu(event, tree.root), onKeyDown: event => { if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) nodeMenu(event, tree.root); } },
        h(
          "td",
          { colSpan: 3 },
          h("button", { type: "button", className: "mapper-node-label mapper-select", "aria-label": tr("Inspect {p0}", { p0: tree.root.key }), "aria-pressed": st.selectedKey === tree.root.key, onClick: () => selectNode(tree.root) }, tree.root.label),
          h("span", { className: "text-text-faint", style: { marginLeft: "8px" } }, st.rootIndex.sd.url + (st.rootIndex.sd.version ? ` | ${st.rootIndex.sd.version}` : "")),
          bundle && !createBundle ? rootTool("↻", tr("One resource for each item of a list (e.g. each OBX)"), () => toggleIteration(tree.root), st.iterations.has(tree.root.key)) : null,
          rootTool("?", tr("Only make the resource when a condition holds"), () => toggleCondition(tree.root), st.conditions.has(tree.root.key)),
          ruleDetailsButton(tree.root), menuButton(tree.root)
        )
      )
    );
    if (st.iterations.has(tree.root.key)) rows.push(iterationRow(tree.root));
    if (st.conditions.has(tree.root.key)) rows.push(conditionRow(tree.root));
    if (st.ruleDetails === tree.root.key) rows.push(ruleDetailsRow(tree.root));
    rowGroups.push(h("tbody", { key: "root" }, rows.splice(0)));
    const children = tree.children(tree.root);
    if (children) for (const child of children) {
      if (!visible(child)) continue;
      addNode(child, children);
      const grouped = st.expanded.has(child.key) || st.iterations.has(child.key) || st.conditions.has(child.key) || st.translations.has(child.key);
      rowGroups.push(h("tbody", { key: child.key, className: grouped ? "mapper-branch-open" : undefined, "aria-label": child.key }, rows.splice(0)));
    }
  }
  // Alt+↑/↓ moves between the fields of the tree, Alt+→/← opens or closes the element.
  const treeKeys = (e) => {
    if (!e.altKey || !["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const row = e.target.closest?.("tr");
    if (!row) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const toggleButton = row.querySelector("button[aria-label^='Expand '], button[aria-label^='Collapse ']");
      if (toggleButton && (toggleButton.getAttribute("aria-expanded") === "true") === (e.key === "ArrowLeft")) toggleButton.click();
      return;
    }
    const rows = [...row.closest("table").querySelectorAll("tbody tr")].filter((r) => r.querySelector("[role=combobox], .mapper-expression-editing"));
    const next = rows[rows.indexOf(row) + (e.key === "ArrowDown" ? 1 : -1)];
    next?.querySelector("[role=combobox]")?.focus();
  };
  // The fields of the sample message with their values: click to insert into the field being edited, or drag.
  const sourcePane = () => {
    const serialized = st.sample.dataType === "HL7V2" ? st.serialized : st.sample;
    const fields = serialized ? sourcePaths(sourceTree(serialized)).filter((f) => f.value !== null && f.value !== "" && f.path !== "msg") : [];
    const filter = (st.sourceFilter || "").toLowerCase();
    const shown = fields.filter((f) => !filter || `${f.path} ${f.value}`.toLowerCase().includes(filter)).slice(0, 300);
    const accessor = (f) => (st.sample.dataType === "JSON" ? f.path : `${f.path}.toString()`);
    return h("details", { className: "mapper-source-pane", open: !!st.sourceOpen, onToggle: (e) => { if (st.sourceOpen !== e.currentTarget.open) { st.sourceOpen = e.currentTarget.open; rerender(); } }, style: { marginBottom: "8px" } },
      h("summary", { style: { cursor: "pointer" } }, tr("Sample fields ({p0})", { p0: fields.length }),
        h("span", { className: "hint text-text-faint", style: { marginLeft: "8px", fontSize: "11px" } }, tr("values of the sample message of the Test tab — click to insert into the field being edited, or drag onto a field"))),
      st.sourceOpen ? h("div", null,
        h("input", { type: "search", value: st.sourceFilter || "", placeholder: tr("Filter fields and values…"), "aria-label": tr("Filter sample fields"), style: { width: "260px", margin: "6px 0", height: "26px", minHeight: "26px", padding: "2px 8px" },
          onChange: (e) => { st.sourceFilter = e.target.value; rerender(); } }),
        fields.length ? h("div", { className: "border border-line rounded", style: { maxHeight: "220px", overflow: "auto" } },
          h("table", { className: "dt", style: { width: "100%", tableLayout: "fixed" } }, h("tbody", null, shown.map((f) =>
            h("tr", { key: f.path, draggable: true, style: { cursor: "grab" }, title: accessor(f),
              onDragStart: (e) => { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", accessor(f)); e.dataTransfer.setData("application/x-oie-accessor", accessor(f)); },
              onMouseDown: (e) => { if (activeExpressionEditor) e.preventDefault(); },
              onClick: () => { if (activeExpressionEditor) activeExpressionEditor.insert(accessor(f)); else navigator.clipboard?.writeText(accessor(f)).then(() => platform.ui?.toast?.("Path copied: click a field first to insert it directly.", "info"), () => {}); } },
              h("td", { style: { fontFamily: "monospace", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "60%" } }, f.path.replace(/^msg/, "")),
              h("td", { style: { fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, f.value))))))
          : h("div", { className: "hint" }, tr("No field: paste a sample message in the Test tab (HL7 v2 is read by the server)."))) : null);
  };
  const check = tree ? completeness(tree, parseMappings(element.mappings)) : { required: [], mustSupport: [] };
  // A Bundle step sets its type; its entries come from the resource steps that select it.
  const entryKey = (k) => k === "Bundle.entry" || k.startsWith("Bundle.entry.") || k.startsWith("Bundle.entry:");
  if (createBundle) {
    check.required = check.required.filter((k) => k !== "Bundle.type" && !entryKey(k));
    check.mustSupport = check.mustSupport.filter((k) => !entryKey(k));
  }
  const entryNote = createBundle && tree
    ? h("div", { className: "hint", style: { marginTop: "6px" } }, tr("Bundle.entry is filled by the resource steps that select this Bundle in “Add to Bundles”."))
    : null;
  const testResult = st.testResult;

  const profileOptions = (st.profileList || []).map((p) => h("option", { key: p.url, value: p.url }, tr("{p0} ({p1})", { p0: p.title || p.name || p.url, p1: p.type })));

  const propertiesPanel = h(
    React.Fragment,
    null,
    h(
      "div",
      { className: "mapper-settings" },
      field(tr("Action"), h("select", {
        value: element.action || "",
        onChange: (e) => {
          element.action = e.target.value;
          if (element.action === "resource") element.bundleName = "";
          else element.bundleTargets = "[]";
          onChange();
          if (element.action === "createBundle" && element.resourceType !== "Bundle") {
            element.profileUrl = "Bundle";
            load("Bundle");
          } else rerender();
        }
      },
      h("option", { value: "createBundle" }, tr("Create a Bundle")), h("option", { value: "resource" }, tr("Build a resource"))),
      tr("Bundles are named and created explicitly; results are completed after the last FHIR mapper.")),
      createBundle ? field(tr("Bundle Name"), text("bundleName", "labo"), tr("Internal name used by resource steps; separate from the FHIR id and profile URL.")) : null,
      h("div", { className: "mapper-wide" }, field(tr("FHIR context"),
        h("select", { value: element.context || "", "aria-label": tr("FHIR context"), onChange: (e) => setContext(e.target.value) },
          h("option", { value: "" }, tr("(none: this step's own packages and terminology server)")),
          (cachedFhirSettings()?.contexts || []).map((c) => h("option", { key: c.name, value: c.name }, tr("{p0} — {p1}, {p2}", { p0: c.name, p1: c.fhirVersion, p2: (c.packages || []).join("; ") || tr("no package") }))),
          element.context && !shared && st.settingsReady ? h("option", { value: element.context }, tr("{p0} (not defined on this server)", { p0: element.context })) : null),
        shared ? tr("Packages: {p0} · terminology: {p1} · validation: {p2}. Defined in Settings › FHIR Mapper.", { p0: (shared.packages || []).join("; ") || tr("none"), p1: shared.terminologyServer || tr("local"), p2: shared.validation })
          : tr("A context of Settings › FHIR Mapper gives the packages, the terminology server and the validation policy to every step that names it."))),
      field(
        tr("FHIR Version"),
        h(
          "select",
          {
            disabled: !!shared,
            value: version,
            onChange: (e) => {
              element.fhirVersion = e.target.value;
              onChange();
              rerender();
            }
          },
          ["R4", "R4B", "R5"].map((v) => h("option", { key: v, value: v }, v))
        )
      ),
      shared ? null : field(tr("Profile Packages"), text("profiles", "/profiles"), tr("Server-side profile files or folders, separated by ';'.")),
      h(
        "div",
        { className: "mapper-wide" },
        field(
          tr("Target Profile"),
          h(
            "div",
            { className: "mapper-actions" },
            h("input", {
              type: "text",
              list: "fhir-profile-mapper-profiles",
              placeholder: tr("Canonical URL of the profile, or a resource type (Patient)"),
              value: element.profileUrl ?? "",
              onFocus: () => {
                if (st.profileList === null && profiles) loadProfileList();
              },
              onChange: (e) => {
                element.profileUrl = e.target.value;
                rerender();
              }
            }),
            h("datalist", { id: "fhir-profile-mapper-profiles" }, profileOptions),
            h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !element.profileUrl, onClick: () => load(element.profileUrl.trim()) }, st.loading ? tr("Loading…") : tr("Load")),
            h("button", { type: "button", className: "btn btn-sm", disabled: !profiles, onClick: loadProfileList }, tr("List profiles"))
          ),
          tr("Loading another profile keeps the mappings of the elements it also has.")
        )
      ),
      shared ? null : h(
        "div",
        { className: "mapper-wide" },
        field(
          tr("Terminology Server"),
          text("terminologyServer", tr("n/a")),
          tr("Empty or n/a: translate locally using Profile Packages. Otherwise, enter the terminology server URL as reached by OIE.")
        )
      ),
      shared ? null : h(
        "details",
        { className: "mapper-wide" },
        h("summary", { className: "text-text-faint", style: { cursor: "pointer", fontSize: "12px" } }, tr("Terminology server options")),
        h(
          "div",
          { className: "mapper-settings", style: { marginTop: "8px" } },
          h("div", { className: "mapper-wide" }, field(tr("Authorization"), text("terminologyAuthorization", "'Bearer ' + $cfg('tx.token')", true), tr("JavaScript expression of the Authorization header; empty for none."))),
          field(tr("Cache (seconds)"), number("terminologyCacheSeconds", 300), tr("How long answers of the server are reused; 0 for not at all.")),
          field(tr("Timeout (seconds)"), number("terminologyTimeoutSeconds", 10), tr("How long to wait for the server."))
        )
      ),
      h(React.Fragment, null,
        createBundle ? field(tr("Bundle Type"), h("select", {
          value: element.bundleType || "transaction",
          disabled: !!st.rootIndex?.byId.get("Bundle.type")?.fixedCode,
          onChange: (e) => { element.bundleType = e.target.value; onChange(); rerender(); }
        }, ["transaction", "batch", "collection", "document", "message"].map((v) => h("option", { key: v, value: v }, v))),
        tr("Defines the Bundle and its entry rules. A fixed type in the target profile takes precedence.")) : null,
        createBundle || !bundle ? field(tr("Result destination"), h("select", {
          value: element.variable ? "variable" : "message",
          onChange: (e) => { element.variable = e.target.value === "variable" ? (element.bundleName ? `bundle_${element.bundleName}` : "resourceResult") : ""; onChange(); rerender(); }
        }, h("option", { value: "message" }, tr("Outbound message")), h("option", { value: "variable" }, tr("Channel map variable"))),
        createBundle ? tr("The completed Bundle is published here after the configured checks of all named Bundles.") : tr("Destination of this standalone resource.")) : null,
        (createBundle || !bundle) && element.variable ? field(tr("Variable name"), text("variable", "bundleDocument"), tr("FHIR JSON in the channel map; use it from another destination.")) : null,
        !createBundle ? h("section", { className: "mapper-wide bundle-routing", "aria-label": tr("Add to Bundles") },
          h("div", { className: "bundle-routing-title" }, tr("Add to Bundles")),
          h("div", { className: "hint" }, tr("Build this resource once, then add the same resource to each selected Bundle. Leave all unchecked for a standalone result.")),
          targets.length ? field(tr("Reference Name"), text("refName", "'patient'", true), tr("Common to the selected Bundles. fhirRef(name) must resolve to the same resource in these Bundles.")) : null,
          !declarations.length && !targets.length ? h("div", { className: "hint", style: { marginTop: "8px" } }, tr("Create a Bundle earlier in this transformer to select it here.")) : null,
          [...declarations, ...targets.filter((t) => !declarations.some((b) => b.bundleName === t.name)).map((t) => ({ bundleName: t.name }))].map((b) => {
            const target = targets.find((t) => t.name === b.bundleName);
            const request = target && ["transaction", "batch"].includes(b.bundleType);
            return h("div", { key: b.bundleName, className: "bundle-target", "data-bundle": b.bundleName },
              h("label", { className: "bundle-choice" }, h("input", { type: "checkbox", checked: !!target, onChange: (e) => updateTarget(b.bundleName, e.target.checked ? { requestMethod: "POST", requestUrl: "", ifNoneExist: "" } : null) }),
                b.bundleName, h("span", { className: "hint" }, b.bundleType || tr("not declared earlier"))),
              b.name ? h("div", { className: "hint" }, tr("Created by step “{p0}”.", { p0: b.name })) : null,
              request ? h("div", { className: "bundle-request" },
                field(tr("Method"), h("select", { value: target.requestMethod || "POST", onChange: (e) => updateTarget(b.bundleName, { requestMethod: e.target.value }) },
                  ["POST", "PUT", "PATCH", "DELETE", "GET", "HEAD"].map((v) => h("option", { key: v, value: v }, v)))),
                field(tr("Request URL"), h(ExpressionField, { completionContext: completionFor(tree?.root, "reference"), value: target.requestUrl || "", placeholder: tr("Empty: the resource type or type/id"), onChange: (e) => updateTarget(b.bundleName, { requestUrl: e.target.value }), style: mono }))) : null,
              request && (!target.requestMethod || target.requestMethod === "POST") ? field(tr("If-None-Exist"), h(ExpressionField, { completionContext: completionFor(tree?.root, "reference"), value: target.ifNoneExist || "", placeholder: "'identifier=' + ...", onChange: (e) => updateTarget(b.bundleName, { ifNoneExist: e.target.value }), style: mono }), tr("Conditional creation for this Bundle entry.")) : null,
              target && !request ? h("div", { className: "hint", style: { marginTop: "8px" } }, b.bundleType ? tr("No request for a {p0} Bundle.", { p0: b.bundleType }) : tr("This Bundle must be created earlier in the transformer.")) : null
            );
          })
        ) : null
      ),
      h(
        "div",
        { className: "mapper-wide" },
        field(
          tr("Options"),
          h(
            "div",
            { className: "mapper-checks" },
            h(
              "label",
              { className: "check" },
              h("input", {
                type: "checkbox",
                checked: asBool(element.addMetaProfile, true),
                onChange: (e) => {
                  element.addMetaProfile = e.target.checked;
                  onChange();
                  rerender();
                }
              }),
              tr(" Add the profile to meta.profile")
            ),
            h("label", { className: "check" },
              bundle && !createBundle ? tr("Validate this preview ") : tr("Validate FHIR output "),
              h("select", { "aria-label": tr("Validation"), style: { width: "auto" },
                value: element.validation || (asBool(element.validateOutput, true) ? "always" : "off"),
                onChange: (e) => { element.validation = e.target.value; element.validateOutput = e.target.value !== "off"; element.formatVersion = 2; onChange(); rerender(); } },
                element.context ? h("option", { value: "inherit" }, tr("as the context says{p0}", { p0: shared ? ` (${shared.validation})` : "" })) : null,
                h("option", { value: "always" }, tr("always")), h("option", { value: "off" }, tr("off"))),
              bundle && !createBundle ? tr(" (final validation is set on each Bundle)") : null
            ),
            h(
              "label",
              { className: "check" },
              h("input", {
                type: "checkbox",
                checked: asBool(element.setLastUpdated, false),
                onChange: (e) => {
                  element.setLastUpdated = e.target.checked;
                  onChange();
                  rerender();
                }
              }),
              tr(" Set meta.lastUpdated")
            )
          )
        )
      ),
      h(
        "div",
        { className: "mapper-wide" },
        field(
          tr("Trace"),
          h("div", { className: "mapper-checks" },
            h("label", { className: "check" },
              h("input", { type: "checkbox", checked: asBool(element.traceMessages, false),
                onChange: (e) => { element.traceMessages = e.target.checked; if (!e.target.checked) element.traceCaptureValues = false; onChange(); rerender(); } }),
              tr(" Trace processed messages")),
            h("label", { className: "check", title: tr("Also record the scalar values of this step's rules (256 characters per value). They may contain patient data.") },
              h("input", { type: "checkbox", checked: asBool(element.traceCaptureValues, false), disabled: !asBool(element.traceMessages, false),
                onChange: (e) => { element.traceCaptureValues = e.target.checked; onChange(); rerender(); } }),
              tr(" Include scalar values"))),
          tr("Each message processed by the deployed channel keeps this step's events, and the finalization of its Bundles, in the connector map (fhirMapperTrace). Off by default; redeploy to apply.")
        )
      )
    ),
    h("div", { className: "mapper-wide" },
      h("div", { className: "mapper-actions" },
        h("button", { type: "button", className: "btn btn-sm", disabled: !tree, onClick: importTable }, tr("Import value table")),
        h("button", { type: "button", className: "btn btn-sm", onClick: () => exportTable("csv") }, tr("Export CSV table")),
        h("button", { type: "button", className: "btn btn-sm", onClick: () => exportTable("markdown") }, tr("Export Markdown table")),
        h("button", { type: "button", className: "btn btn-sm", onClick: () => exportTable("markdown", true) }, tr("Export Markdown documentation")),
        h("button", { type: "button", className: "btn btn-sm", onClick: () => exportTable("html", true) }, tr("Export HTML documentation"))),
      h("p", { className: "hint" }, tr("Tables edit value expressions and notes only. Other rules remain in the step. Empty expressions remove their value mapping."))),
    h("details", { style: { marginTop: "10px" } },
      h("summary", { style: { cursor: "pointer" } }, tr("Edit as JSON")),
      h("div", { className: "hint", style: { margin: "6px 0" } }, tr("The whole step — properties and rules — as text: copy it to another step or channel, paste a mapping written by hand or by an AI agent, or make bulk edits. Validate and apply compiles it on the server first.")),
      h("div", { className: "mapper-actions" },
        h("button", { type: "button", className: "btn btn-sm", onClick: () => { st.jsonDraft = JSON.stringify(element, null, 2); rerender(); } }, tr("Read current step")),
        h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !st.jsonDraft.trim(), onClick: async () => {
          try {
            const next = mapperJsonImport(element, st.jsonDraft);
            const result = JSON.parse(await platform.api.post(`${MAPPER_API}/script`, JSON.stringify(next), { contentType: "text/plain", raw: true }));
            if (result.errors?.length) throw new Error(result.errors.map((e) => e.message).join("\n"));
            Object.assign(element, next);
            state.current = null;
            onChange(); rerender();
          } catch (error) { st.error = errorText(error); rerender(); }
        } }, tr("Validate and apply"))),
      h(CodeBox, { value: st.jsonDraft, language: "json", height: "260px", label: tr("Step mapping JSON"),
        onChange: (text) => { if (text !== st.jsonDraft) { st.jsonDraft = text; rerender(); } } }),
      h("div", { className: "hint" }, tr("Applies to this step only; its OIE sequence and enabled state are preserved. Save the channel to persist changes.")))
  );
  const messages = h(
    React.Fragment,
    null,
    st.error ? h("div", { className: "hint", style: { color: "var(--err, #b91c1c)", marginTop: "6px" } }, st.error) : null,
    st.notice ? h("div", { className: "hint", style: { color: "var(--warn, #b45309)", marginTop: "6px" } }, st.notice) : null,
    st.versionNotice
      ? h(
          "div",
          { className: "hint", style: { color: "var(--warn, #b45309)", marginTop: "6px" } },
          st.versionNotice + " ",
          h(
            "button",
            {
              type: "button",
              className: "btn btn-sm",
              onClick: () => {
                element.profileVersion = st.rootIndex.sd.version || "";
                st.versionNotice = "";
                onChange();
                rerender();
              }
            },
            tr("Checked")
          )
        )
      : null,
    st.unresolved.length
      ? h(
          "div",
          { className: "hint", style: { color: "var(--warn, #b45309)", marginTop: "6px" } },
          tr("Cannot find these mapped elements in the profile (editing is blocked so they are not lost): {p0}. ", { p0: st.unresolved.join(", ") }),
          h("button", { type: "button", className: "btn btn-sm", onClick: removeUnresolved }, tr("Remove these mappings"))
        )
      : null
  );
  const fullTree = tree ? makeTree(st.rootIndex, { ...ctx, showAll: true }) : null;
  const loadExtensions = async () => {
    if (st.extensions) return;
    try {
      const text = await platform.api.get(`${MAPPER_API}/catalog`, { kind: "extension", context: element.context || "", fhirVersion: version, profiles }, { raw: true });
      if (state.current !== st) return;
      st.extensions = JSON.parse(text);
    } catch (error) { st.error = errorText(error); }
    rerender();
  };
  const addCatalogExtension = async (container, url) => {
    if (!url || blocked) return;
    try {
      const nodes = (fullTree.children(container) || []).filter(node => node.jsonName === "extension" && !node.sliceName && node.max !== "0");
      if (!nodes.length || nodes[0].el.slicing?.rules === "closed") return;
      let node = nodes.find(candidate => ![...allKeys()].some(key => inBranch(key, candidate.key)));
      if (!node && nodes[0].max !== "*" && nodes.length >= Number(nodes[0].max)) throw new Error(tr("No extension occurrence is available."));
      if (!sdLoaded.has(sdKey(version, profiles, nodes[0].typeUrl))) await fetchSd(platform, version, profiles, nodes[0].typeUrl);
      if (state.current !== st) return;
      const key = node ? node.key : `${nodes[0].keyBase}[${nodes.length}]`;
      if (!node) st.instances.set(nodes[0].keyBase, nodes.length + 1);
      st.values.set(`${key}.url`, JSON.stringify(url));
      st.showAll = true; st.search = ""; st.filter = "all";
      st.expanded.add(container.key); st.expanded.add(key); st.selectedKey = key;
      st.lastPush = 0; save(); st.lastPush = 0; rerender();
    } catch (error) { st.error = errorText(error); rerender(); }
  };
  const extensionPanel = node => {
    const declared = profileExtensions(fullTree, node);
    const generic = (fullTree.children(node) || []).find(child => child.jsonName === "extension" && !child.sliceName && child.max !== "0");
    if (!declared.length && !generic) return null;
    const open = generic && generic.el.slicing?.rules !== "closed";
    return h("section", { "aria-label": tr("Extensions") }, h("h4", null, tr("Extensions")),
      declared.length ? h("select", { "aria-label": tr("Profile extension"), value: "", disabled: blocked,
        onChange: event => { const key = event.target.value; if (key) { revealDiagnostic({ key }); st.expanded.add(key); rerender(); } } },
        h("option", { value: "" }, tr("Choose an extension of the profile…")),
        declared.map(item => h("option", { key: item.key, value: item.key }, tr("{p0} — {p1}", { p0: item.label, p1: item.url })))) : null,
      open ? h("div", null,
        h("button", { type: "button", className: "btn btn-sm", disabled: blocked, onClick: loadExtensions }, tr("List context extensions")),
        st.extensions ? h("select", { "aria-label": tr("Add context extension"), value: "", disabled: blocked,
          onChange: event => addCatalogExtension(node, event.target.value) },
          h("option", { value: "" }, st.extensions.length ? tr("Add an extension by URL…") : tr("No extension in this context")),
          st.extensions.map(item => h("option", { key: item.url, value: item.url }, tr("{p0} — {p1}", { p0: item.title || item.name || item.url, p1: item.url })))) : null) : null);
  };
  const selectedChain = fullTree && st.selectedKey ? fullTree.chain(st.selectedKey) : null;
  const selected = selectedChain?.[selectedChain.length - 1];
  const inspector = () => h(Inspector, { key: selected?.key || "empty", h, node: selected,
    extensions: selected ? extensionPanel(selected) : null,
    helpUrl: selected ? mapperHelpUrl(version, element.resourceType, selected.key) : "",
    diagnostics: selected ? [...(st.testResult?.errors || []), ...(st.scriptResult?.errors || [])]
      .filter(error => error.key === selected.key).map((error, index) => diagnosticView(error, index)) : [] },
    selected ? h("div", { className: "mapper-inspector-rules" },
      !selected.resourceRoot && !selected.choice ? field(tr("Expression"), h(ExpressionField, {
        "aria-label": tr("Inspector expression for {p0}", { p0: selected.key }), value: st.values.get(selected.key) || "",
        completionContext: completionFor(selected), errors: errorsByKey.get(selected.key), onEdit: () => ensureCodes(selected),
        disabled: blocked || (createBundle && selected.key === "Bundle.type"),
        onChange: (e) => setValue(selected, withSubstitution(selected, st.values.get(selected.key) || "", e.target.value))
      })) : null,
      st.iterations.has(selected.key) ? h("div", { className: "mapper-inspector-fields" }, iterationFields(selected)) : null,
      st.conditions.has(selected.key) ? h("div", { className: "mapper-inspector-fields" }, conditionFields(selected)) : null,
      st.translations.has(selected.key) ? h("div", { className: "mapper-inspector-fields" }, translationFields(selected, "fhir-inspector-conceptmaps")) : null,
      ruleDetailsFields(selected),
      !rulesAt(selected).length ? h("p", { className: "hint" }, tr("No saved rule for this element.")) : null) : null);
  const mapperPanel = tree
      ? h(
          "div",
          null,
          h(
            "div",
            { className: "mapper-toolbar" },
            h("span", { className: "text-text-faint" }, tr("Show")),
            h(
              "select",
              {
                value: st.filter,
                onChange: (e) => {
                  st.filter = e.target.value;
                  rerender();
                }
              },
              h("option", { value: "all" }, tr("All elements")),
              h("option", { value: "mustSupport" }, tr("Must Support and required")),
              h("option", { value: "mapped" }, tr("Mapped only"))
            ),
            h(
              "label",
              { className: "check", title: tr("Also show extension, modifierExtension and id of every element (to add an extension the profile does not have)") },
              h("input", {
                type: "checkbox",
                checked: st.showAll,
                onChange: (e) => {
                  st.showAll = e.target.checked;
                  rerender();
                }
              }),
              tr(" extensions & ids")
            ),
            h("input", { type: "search", value: st.search || "", placeholder: tr("Search elements…"), "aria-label": tr("Search elements"), style: { width: "180px", flex: "none", height: "26px", minHeight: "26px", padding: "2px 8px" },
              onChange: (e) => { st.search = e.target.value; rerender(); } }),
            h("button", { type: "button", className: "btn btn-sm", title: tr("Expand the mapped elements"), onClick: () => {
              for (const key of allKeys()) { const parts = key.split("."); for (let i = 1; i < parts.length; i++) st.expanded.add(parts.slice(0, i).join(".")); }
              rerender(); } }, tr("Expand mapped")),
            h("button", { type: "button", className: "btn btn-sm", title: tr("Collapse every element"), onClick: () => { st.expanded = new Set([tree.root.key]); rerender(); } }, tr("Collapse all")),
            h("button", { type: "button", className: "btn btn-sm", title: tr("Undo the last change of the mappings"), disabled: !(st.undo || []).length || blocked, onClick: () => travel(st.undo, st.redo) }, tr("↶ Undo")),
            h("button", { type: "button", className: "btn btn-sm", title: tr("Redo"), disabled: !(st.redo || []).length || blocked, onClick: () => travel(st.redo, st.undo) }, tr("↷ Redo")),
            h("span", { className: "hint text-text-faint", style: { fontSize: "11px" } }, tr("Click a field to edit it with completion. {p0}: functions, scoped variables and sample paths. ↑/↓ to choose, Enter/Tab to insert, Esc to close. Guard optional values.", { p0: COMPLETION_HINT }))
          ),
          sourcePane(),
          searchTruncated ? h("p", { className: "hint" }, tr("Search is limited to part of the loaded tree. Select a branch or narrow the search.")) : null,
          h("div", { className: "mapper-workspace" },
          h(
            "div",
            { className: "dt-wrap border border-line rounded", style: { maxHeight: "none", overflowX: "auto", overflowY: "visible" }, onKeyDownCapture: treeKeys },
            h(
              "table",
              { className: "dt mapper-tree", style: { tableLayout: "fixed", width: "100%", minWidth: "720px" } },
              h("colgroup", null, h("col", { style: { width: "36%" } }), h("col", { style: { width: "14%" } }), h("col", { style: { width: "50%" } })),
              h("thead", null, h("tr", null, h("th", null, tr("Element")), h("th", null, tr("Type")), h("th", null, tr("Mapping")))),
              rowGroups
            )
          ), inspector()),
          check.required.length || check.mustSupport.length
            ? h(
                "div",
                { className: "hint", style: { marginTop: "6px" } },
                check.required.length ? h("div", { style: { color: "var(--err, #b91c1c)" } }, tr("Required, not mapped: {p0}", { p0: check.required.join(", ") })) : null,
                check.mustSupport.length ? h("div", { style: { color: "var(--warn, #b45309)" } }, tr("Must Support, not mapped: {p0}", { p0: check.mustSupport.join(", ") })) : null
              )
            : h("div", { className: "hint", style: { marginTop: "6px", color: "var(--ok, #15803d)" } }, tr("Every required element below the mapped ones has a mapping or a fixed value.")),
          entryNote
        )
      : h("div", { className: "hint" }, st.loading ? tr("Loading the target profile…") : tr("Load a target profile in Properties to map its elements."));
  const testPanel = tree
      ? h(
            "div",
            { className: "mapper-test" },
            h("div", { className: "mapper-test-controls" },
            h(
              "div",
              { style: { display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", margin: "6px 0" } },
              h(
                "select",
                {
                  style: { width: "auto", flex: "none" },
                  value: st.sample.dataType,
                  onChange: (e) => {
                    st.sample.dataType = e.target.value;
                    if (activeSample) updateActive({ dataType: e.target.value }); else saveSample();
                    rerender();
                  }
                },
                ["HL7V2", "XML", "JSON", "RAW"].map((v) => h("option", { key: v, value: v }, v))
              ),
              h("select", { style: { width: "auto", flex: "none", maxWidth: "260px" }, value: activeSample ? activeSample.id : "", "aria-label": tr("Sample"), title: tr("Samples saved with the step"),
                onChange: (e) => selectSample(e.target.value) },
                h("option", { value: "" }, tr("(unsaved sample, this browser)")),
                samples.map((s) => h("option", { key: s.id, value: s.id }, s.name + (s.expected ? " ✓" : "")))),
              h("select", { value: st.previewScope, "aria-label": tr("Preview scope"), style: { width: "auto", flex: "none" }, disabled: st.testing,
                onChange: e => { st.previewScope = e.target.value; st.testResult = null; if (activeSample) updateActive({ scope: st.previewScope }); rerender(); } },
                h("option", { value: "step" }, tr("This step only")),
                h("option", { value: "transformer", disabled: !mapperContext(platform, element) }, tr("Profile Mapper steps of this transformer"))),
              h("button", { type: "button", className: "btn btn-sm", disabled: st.testing || !st.sample.message.trim(), onClick: runTest }, st.testing ? tr("Running…") : tr("Run")),
              !activeSample ? h("button", { type: "button", className: "btn btn-sm", disabled: !st.sample.message.trim(), title: tr("Keep this message in the step, so it is saved with the channel"), onClick: saveAsSample }, tr("Save as sample")) : null,
              activeSample ? h("button", { type: "button", className: "btn btn-sm", title: tr("Remove this sample from the step"), onClick: () => { st.activeSample = null; writeSamples(samples.filter((s) => s.id !== activeSample.id)); } }, tr("Delete sample")) : null,
              samples.length ? h("button", { type: "button", className: "btn btn-sm", disabled: st.testing, title: tr("Run every saved sample and compare with its expected result"), onClick: runAllSamples }, tr("Run all ({p0})", { p0: samples.length })) : null,
              h("button", { type: "button", className: "btn btn-sm", onClick: showScript }, st.scriptResult ? tr("Hide the script") : tr("Generated script")),
              h("span", { className: "text-text-faint", style: { fontSize: "11px" } }, st.previewScope === "transformer" ? tr("Runs enabled Profile Mapper steps in order, with real references and Bundle finalization. Other step types are excluded.") : tr("Runs this step on the server and validates what it makes; fhirRef() of earlier steps gives stand-ins."))
            ),
            h("div", { style: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "6px" } },
              h("label", null, h("input", { type: "checkbox", checked: st.traceOptions.enabled,
                onChange: (e) => { st.traceOptions.enabled = e.target.checked; if (!e.target.checked) st.traceOptions.captureValues = false; rerender(); } }), tr(" Trace")),
              h("label", { title: tr("Explicitly include scalar values in the trace and its JSON export (256 characters per value).") },
                h("input", { type: "checkbox", checked: st.traceOptions.captureValues, disabled: !st.traceOptions.enabled,
                  onChange: (e) => { st.traceOptions.captureValues = e.target.checked; rerender(); } }), tr(" Include scalar values")),
              h("label", null, tr("Max events "), h("input", { type: "number", min: 1, max: 1000, value: st.traceOptions.maxEvents,
                disabled: !st.traceOptions.enabled, style: { width: "80px" },
                onChange: (e) => { st.traceOptions.maxEvents = Number(e.target.value); rerender(); } }))
            ),
            ),
            h("div", { className: "mapper-test-inputs" },
            field(tr("Sample message"), h(CodeBox, {
              value: st.sample.message, language: languageOf(st.sample.dataType), height: "100%", label: tr("Sample message"),
              onChange: (text) => {
                if (text === st.sample.message) return;
                st.sample.message = text;
                if (activeSample) updateActive({ message: text }); else saveSample();
                rerender();
              }
            })),
            testResult?.source ? field(tr("Prepared message"), h(CodeBox, {
              value: testResult.source.dataType === "JSON" ? prettyJson(testResult.source.message) : testResult.source.message,
              language: languageOf(testResult.source.dataType), readOnly: true, height: "100%", label: tr("Prepared message") })) : null),
            testResult || st.suite || st.scriptResult ? h("div", { className: "mapper-test-results" },
            st.suite ? h("div", { className: "mapper-test-diagnostics" }, h("table", { className: "dt", style: { margin: "8px 0", width: "100%" }, "aria-label": tr("Results of the saved samples") },
              h("tbody", null, st.suite.map((r) => h("tr", { key: r.id, style: { cursor: "pointer" }, onClick: () => selectSample(r.id) },
                h("td", { style: { width: "70px", color: r.ok ? "var(--ok, #15803d)" : "var(--err, #b91c1c)", fontWeight: 600 } }, r.ok ? tr("passed") : tr("failed")),
                h("td", null, r.name), h("td", { className: "text-text-faint" }, r.detail)))))) : null,
            testResult
              ? h(
                  "div",
                  { className: "mapper-test-result" },
                  h("div", { className: "mapper-test-diagnostics" },
                  testResult.errors.map((e, i) => diagnosticView(e, `e${i}`)),
                  testResult.steps ? h("details", { open: true },
                    h("summary", null, tr("Produced resources by step")),
                    testResult.steps.map((result, i) => h("details", { key: i },
                      h("summary", null, `${result.step.sequenceNumber} · ${result.step.name || result.step.resourceType} (${result.resources.length})`),
                      result.resources.map((resource, j) => h("pre", { key: j, style: { maxHeight: "300px", overflow: "auto", whiteSpace: "pre-wrap" } }, prettyJson(resource)))))) : null,
                  Object.keys(testResult.variables || {}).length ? h("details", { open: true },
                    h("summary", null, tr("Published channel variables")),
                    Object.entries(testResult.variables).map(([name, value]) => h("details", { key: name }, h("summary", null, name),
                      h("pre", { style: { maxHeight: "360px", overflow: "auto", whiteSpace: "pre-wrap" } }, prettyJson(value))))) : null,
                  testResult.trace ? h("details", { style: { marginTop: "8px" } },
                    h("summary", { style: { cursor: "pointer" } },
                      tr("Execution trace: {p0} event(s){p1}", { p0: testResult.trace.events.length, p1: testResult.trace.truncated ? " — truncated" : "" })),
                    h("button", { type: "button", className: "btn btn-sm", onClick: () => downloadMapperTrace(testResult.trace) }, tr("Export trace JSON")),
                    h("div", { className: "hint" }, testResult.trace.captureValues ? tr("Scalar values included.") : tr("Runtime values not captured.")),
                    h("ol", { style: { maxHeight: "360px", overflow: "auto", fontSize: "12px" } },
                      mapperTraceRows(testResult.trace).map(({ event, label, duration, iterations }, index) =>
                        h("li", { key: index, style: { margin: "6px 0" } },
                          h("strong", null, tr("{p0} · {p1}", { p0: label, p1: event.status })),
                          h("span", { style: { marginLeft: "6px" } }, duration),
                          event.key && tree && diagnosticHere({ step: testResult.trace.steps?.find(step => String(step.sequenceNumber) === String(event.step)) || testResult.trace.step }) ? h("button", { type: "button", className: "btn btn-sm", onClick: () => revealDiagnostic({ ...event, step: testResult.trace.steps?.find(step => String(step.sequenceNumber) === String(event.step)) || testResult.trace.step }) }, tr("Go to rule")) : null,
                          iterations ? h("div", null, iterations) : null,
                          event.reason ? h("div", null, event.reason) : null,
                          event.count !== undefined ? h("div", null, tr("{p0} item(s)", { p0: event.count })) : null,
                          event.value ? h("pre", { style: { whiteSpace: "pre-wrap", margin: "4px 0" } }, JSON.stringify(event.value)) : null)))
                    ) : null),
                  testResult.output !== null && testResult.output !== undefined
                    ? h(
                        "div",
                        { className: "mapper-test-output" },
                        h("div", { className: "mapper-test-diagnostics" },
                        h(
                          "div",
                          { style: { fontSize: "12px", margin: "4px 0", color: testResult.issues.some((i) => i.severity === "error" || i.severity === "fatal") ? "var(--err, #b91c1c)" : "var(--ok, #15803d)" } },
                          testResult.validationPerformed === false ? tr("FHIR validation disabled.") : (testResult.issues.length ? tr("{p0} validation issue(s):", { p0: testResult.issues.length }) : tr("Valid."))
                        ),
                        testResult.issues.map((i, n) => h("div", { key: `i${n}`, style: { fontSize: "11px", fontFamily: "monospace" } }, tr("{p0} {p1}: {p2}", { p0: i.severity, p1: i.location, p2: i.message }))),
                        activeSample ? h("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", margin: "6px 0" } },
                          sampleVerdict(activeSample, testResult) === true ? h("strong", { style: { color: "var(--ok, #15803d)" } }, tr("Matches the expected result.")) : null,
                          sampleVerdict(activeSample, testResult) === false ? h("strong", { style: { color: "var(--err, #b91c1c)" } }, tr("Differs from the expected result.")) : null,
                          h("button", { type: "button", className: "btn btn-sm", title: tr("Random identities (urn:uuid) and meta.lastUpdated are ignored when comparing"), onClick: () => updateActive({ expected: testResult.output }) },
                            activeSample.expected ? tr("Replace the expected result with this one") : tr("Use this result as expected")),
                          activeSample.expected ? h("button", { type: "button", className: "btn btn-sm", onClick: () => updateActive({ expected: null }) }, tr("Clear the expected result")) : null) : null,
                        activeSample && sampleVerdict(activeSample, testResult) === false
                          ? h(ResultDiff, { expected: normalizeResult(activeSample.expected), actual: normalizeResult(testResult.output) }) : null),
                        h(CodeBox, { value: prettyJson(testResult.output), language: String(testResult.output).trim().startsWith("<") ? "xml" : "json", readOnly: true, height: "100%", label: tr("Result") })
                      )
                    : null
                )
              : null,
            st.scriptResult
              ? h(
                  "div",
                  { className: "mapper-test-script" },
                  st.scriptResult.errors.map((e, i) => diagnosticView(e, `s${i}`)),
                  h(CodeBox, { value: st.scriptResult.script || "", language: "javascript", readOnly: true, height: "100%", label: tr("Generated script") })
                )
              : null) : null
          )
      : h("div", { className: "hint" }, st.loading ? tr("Loading the target profile…") : tr("Load a target profile in Properties to test this step."));

  const tabs = [
    { id: "properties", label: tr("Properties"), panel: propertiesPanel },
    { id: "mapper", label: tr("Mapper"), panel: mapperPanel,
      badge: check.required.length ? { text: String(check.required.length), title: tr("{p0} required element(s) not mapped", { p0: check.required.length }) } : null },
    { id: "test", label: tr("Test"), panel: testPanel,
      badge: testResult?.errors?.length ? { text: "!", title: tr("The last test failed") } : null }
  ];
  const current = tabs.find((t) => t.id === st.tab) || tabs[0];
  const tabKeys = (e) => {
    const index = tabs.indexOf(current);
    const next = e.key === "ArrowRight" ? (index + 1) % tabs.length : e.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length
      : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    st.tab = tabs[next].id;
    rerender();
    e.currentTarget.querySelectorAll("[role=tab]")[next]?.focus();
  };
  return h(
    "div",
    { className: "fhir-profile-mapper" + (st.fullScreen ? " mapper-fullscreen" : "") + (current.id === "test" && tree ? " mapper-testing-layout" : "") },
    h("div", { className: "mapper-tabs", role: "tablist", "aria-label": tr("FHIR mapper sections"), onKeyDown: tabKeys },
      tabs.map((t) => h("button", {
        key: t.id, id: `${tabId}-${t.id}`, type: "button", role: "tab", "aria-selected": t === current, "aria-controls": `${tabId}-panel`,
        tabIndex: t === current ? 0 : -1, onClick: () => { st.tab = t.id; rerender(); }
      }, t.label, t.badge ? h("span", { className: "mapper-tab-badge", title: t.badge.title }, t.badge.text) : null)),
      h("span", { style: { marginLeft: "auto", alignSelf: "center", marginRight: "6px", display: "inline-flex" } }, h(HelpButton, { key: current.id, ...(MAPPER_HELP[current.id] || MAPPER_HELP.mapper) })),
      h("button", { type: "button", className: "btn btn-sm", style: { alignSelf: "center" }, title: tr("Edit this step on the whole page (Esc to come back)"), onClick: toggleFullScreen },
        st.fullScreen ? tr("Exit full screen (Esc)") : tr("⤢ Full screen"))),
    messages,
    h("div", { className: "mapper-tab-panel", id: `${tabId}-panel`, role: "tabpanel", "aria-labelledby": `${tabId}-${current.id}` }, current.panel)
  );
}

function prettyJson(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return String(text);
  }
}

function registerProfileMapper(platform) {
  bindReact(platform.React);
  // The transformer editor names step types from this list (else from the class name).
  try {
    if (platform.oie && platform.oie.STEP_TYPES && !platform.oie.STEP_TYPES[MAPPER_TYPE]) platform.oie.STEP_TYPES[MAPPER_TYPE] = { label: "FHIR Profile Mapper" };
  } catch {
    // an administrator without that list: the class name is shown
  }
  platform.registerStepType(MAPPER_TYPE, {
    label: "FHIR Profile Mapper",
    create: () => ({
      __type: MAPPER_TYPE,
      name: "",
      enabled: true,
      fhirVersion: "R4",
      profiles: "",
      profileUrl: "",
      resourceType: "",
      profileVersion: "",
      addMetaProfile: true,
      validateOutput: true,
      setLastUpdated: false,
      variable: "",
      action: "resource",
      bundleName: "",
      bundleTargets: "[]",
      bundleType: "transaction",
      refName: "",
      terminologyServer: "",
      terminologyAuthorization: "",
      terminologyCacheSeconds: 300,
      terminologyTimeoutSeconds: 10,
      formatVersion: 2,
      context: "",
      validation: "always",
      mappings: "[]",
      samples: "[]",
      traceMessages: false,
      traceCaptureValues: false
    }),
    validate: (el) => {
      if (!["createBundle", "resource"].includes(el.action)) return tr("Choose the action: create a Bundle or build a resource.");
      if (!el.profileUrl || !String(el.profileUrl).trim()) return tr("Choose the target profile.");
      if (!el.resourceType) return tr("Load the target profile.");
      if (el.action === "createBundle" && !String(el.bundleName || "").trim()) return tr("Give the Bundle a name.");
      if (el.action === "createBundle" && el.resourceType !== "Bundle") return tr("Create a Bundle needs a Bundle target profile.");
      const entries = parseMappings(el.mappings);
      const noValue = entries.find((e) => e.translate && (e.translate.unmapped === "fixed" || e.translate.unmapped === "function") && !String(e.translate.value || "").trim());
      if (noValue) return tr("The translation of {p0} needs a {p1} for codes without a match.", { p0: noValue.key, p1: noValue.translate.unmapped === "fixed" ? "fixed value" : "expression" });
      const bad = entries.find((e) => typeof e.each === "string" && !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e.variable || ""));
      if (bad) return tr("The variable of the iteration on {p0} must be a JavaScript name.", { p0: bad.key });
      if (!(el.action === "createBundle" || parseMappings(el.bundleTargets).length) && entries.some((e) => typeof e.each === "string" && Array.isArray(e.path) && !e.path.length))
        return tr("One resource for each item needs a named Bundle target.");
      return "";
    },
    component: ProfileMapperEditor
  });
}

export function register(platform) {
  registerProfileMapper(platform);
}
