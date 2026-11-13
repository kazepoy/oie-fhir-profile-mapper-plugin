// SPDX-License-Identifier: MPL-2.0
import { t as tr } from "../i18n/index.js";
// ---------------------------------------------------------------------------------------------
// FHIR FML Transform transformer step (fr.kazepoy.fhir.fml.FhirFmlTransformStep). The step runs an FML
// map (StructureMap) found in its profile locations on the message, seen through the generic OIE
// logical model (OieMessage), and publishes the FHIR resource it makes. The maps are written
// elsewhere: this editor only chooses one and tests it on a sample message.
// ---------------------------------------------------------------------------------------------

import { createExpressionEditor, registerLanguage } from "../host/code-editor.js";
import { FML_LANGUAGE, FML_TEMPLATE } from "./language.js";
import { fmlCompletions, fmlSkeleton } from "./completion.js";
import { CodeBox, languageOf } from "../host/code-box.js";
import { HelpButton } from "../host/help.js";
import { FML_HELP } from "../host/help-texts.js";
import { cachedFhirSettings, fhirContext, loadFhirSettings } from "../host/settings.js";

export const FML_TYPE = "fr.kazepoy.fhir.fml.FhirFmlTransformStep";
const FML_API = "/extensions/fhir-fml";
const DATA_TYPES = ["HL7V2", "XML", "JSON", "RAW", "DELIMITED"];


let React;
const h = (...args) => React.createElement(...args);

function errorText(e) {
  const body = (e && e.body) || "";
  const m = /<detailMessage>([\s\S]*?)<\/detailMessage>/.exec(body);
  if (m) return m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  return (e && e.message) || String(e);
}

function pretty(value) {
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2);
  } catch {
    return String(value);
  }
}

/** The inbound template and data type of this step's transformer, as a default sample. */
function fmlSample(platform, element) {
  const channel = platform.store?.getState("editingChannel");
  let found = null;
  if (channel) {
    const connectors = [channel.sourceConnector, ...(platform.oie.destinationsOf(channel) || [])].filter(Boolean);
    for (const connector of connectors) {
      for (const transformer of [connector.transformer, connector.responseTransformer]) {
        const steps = platform.oie.elementsToArray(transformer?.elements);
        if (steps.some((s) => s.__type === FML_TYPE && String(s.sequenceNumber) === String(element.sequenceNumber) && s.name === element.name)) {
          found = found ? "ambiguous" : { channel, connector, transformer };
        }
      }
    }
  }
  const ctx = found && found !== "ambiguous" ? found : null;
  const inbound = ctx?.transformer.inboundDataType || "HL7V2";
  const key = ctx ? `fhir-fml-sample:${ctx.channel.id}:${ctx.connector.metaDataId}` : "fhir-fml-sample:unknown";
  const message = ctx?.transformer.inboundTemplate || "";
  const dataType = inbound === "FHIR" ? (message.trim().startsWith("<") ? "XML" : "JSON")
    : DATA_TYPES.includes(inbound) ? inbound : "RAW";
  return { key, sample: { message, dataType } };
}

/** The map editor: the host's code editor in the fml language; markers are the problems of the last check. */
function FmlMapEditor({ value, onChange, problems, completionPaths }) {
  const host = React.useRef(null);
  const editor = React.useRef(null);
  const latest = React.useRef({ onChange, completionPaths, value });
  latest.current = { onChange, completionPaths, value };
  React.useEffect(() => {
    const ed = createExpressionEditor({ value, language: "fml", multiline: true, minHeight: "360px", ariaLabel: "FML map",
      getItems: () => fmlCompletions(editor.current?.getValue() || latest.current.value, latest.current.completionPaths),
      onChange: (text) => latest.current.onChange(text) });
    editor.current = ed;
    host.current.appendChild(ed.el);
    return () => { editor.current = null; ed.dispose(); };
  }, []);
  React.useEffect(() => { if (editor.current && editor.current.getValue() !== (value || "")) editor.current.setValue(value || ""); }, [value]);
  React.useEffect(() => { editor.current?.setMarkers(problems || []); }, [problems]);
  return h("div", { ref: host, className: "fml-map-editor" });
}

function FmlTransformEditor({ element, onChange, platform }) {
  const [, rerender] = React.useReducer((x) => x + 1, 0);
  const state = React.useRef(null);
  if (state.current === null) {
    const initial = fmlSample(platform, element);
    let sample = initial.sample;
    try {
      sample = JSON.parse(localStorage.getItem(initial.key) || "null") || sample;
    } catch {
      // no storage: the transformer's inbound template
    }
    state.current = { tab: "settings", maps: null, mapErrors: {}, loading: false, loadError: "", sampleKey: initial.key, sample, testing: false, result: null,
      skeletonTarget: "http://hl7.org/fhir/StructureDefinition/Patient", completionPaths: [] };
  }
  const st = state.current;

  const set = (prop, value) => {
    element[prop] = value;
    onChange();
    rerender();
  };
  const field = (label, control, hint, wide) =>
    h("div", { className: wide ? "field fml-wide" : "field" }, h("label", null, label), control, hint ? h("div", { className: "hint" }, hint) : null);
  const text = (prop, placeholder) => h("input", { type: "text", placeholder, value: element[prop] ?? "", onChange: (e) => set(prop, e.target.value) });

  // A step that names a FHIR context of the server takes its version and locations.
  const shared = fhirContext(element.context);
  const version = shared ? shared.fhirVersion : element.fhirVersion || "R4";
  const locations = shared ? (shared.packages || []).join(";") : element.profiles || "";
  React.useEffect(() => {
    let active = true;
    const done = () => { if (active) { st.settingsReady = true; rerender(); if (element.context && fhirContext(element.context)) loadMaps(false); } };
    loadFhirSettings().then(done, done);
    return () => { active = false; };
  }, []);
  const loadMaps = async (reload) => {
    st.loading = true;
    st.loadError = "";
    rerender();
    try {
      if (reload) await platform.api.post(`${FML_API}/reload`, "", { contentType: "text/plain", raw: true });
      const answer = JSON.parse(await platform.api.get(`${FML_API}/maps`, { fhirVersion: version, profiles: locations }, { raw: true }));
      st.maps = answer.maps || [];
      st.mapErrors = answer.errors || {};
    } catch (e) {
      st.maps = null;
      st.loadError = errorText(e);
    }
    st.loading = false;
    rerender();
  };
  React.useEffect(() => {
    if (!element.context && (element.profiles || "").trim()) loadMaps(false);
  }, []);

  const saveSample = () => {
    try {
      localStorage.setItem(st.sampleKey, JSON.stringify(st.sample));
    } catch {
      // no storage: kept while the editor is open
    }
  };
  const runTest = async () => {
    st.testing = true;
    st.result = null;
    rerender();
    try {
      const text = await platform.api.post(`${FML_API}/test`, JSON.stringify({ step: element, message: st.sample.message, dataType: st.sample.dataType }), {
        contentType: "text/plain",
        raw: true,
        timeoutMs: 120000
      });
      st.result = JSON.parse(text);
    } catch (e) {
      const message = errorText(e);
      st.result = { model: null, output: null, issues: [], errors: [{ phase: "request", message: e?.status === 403 || /Test FHIR FML transforms/.test(message)
        ? tr("Testing a step requires the permission “Test FHIR FML transforms”.") : message }] };
    }
    st.testing = false;
    rerender();
  };

  const checkMap = async () => {
    st.checking = true;
    rerender();
    try {
      const text = await platform.api.post(`${FML_API}/check`, JSON.stringify({ mapSource: element.mapSource || "", fhirVersion: version, profiles: locations }),
        { contentType: "text/plain", raw: true, timeoutMs: 120000 });
      st.check = JSON.parse(text);
    } catch (e) {
      st.check = { errors: [{ line: 1, column: 1, message: errorText(e) }] };
    }
    st.checking = false;
    rerender();
  };
  const generateSkeleton = async () => {
    st.generating = true;
    st.skeletonError = "";
    rerender();
    try {
      const target = st.skeletonTarget.trim();
      if (!target) throw new Error(tr("Choose the target profile."));
      const text = await platform.api.get("/extensions/fhir-profile-mapper/catalog/elements",
        { url: target, fhirVersion: version, profiles: locations }, { raw: true });
      const root = JSON.parse(text).root || {};
      const elements = root.snapshot?.element || root.differential?.element || [];
      st.completionPaths = elements.map(item => item.path).filter(Boolean);
      const required = elements.filter(item => Number(item.min || 0) > 0 && item.path && item.path.includes(".")).map(item => item.path);
      const model = element.sourceModel || "oie-message";
      const sourceUrl = model === "oie-message" ? "http://oie.org/fhir/StructureDefinition/OieMessage"
        : String(element.sourceModelUrl || "").trim() || "http://hl7.org/fhir/StructureDefinition/Resource";
      st.check = null;
      set("mapSource", fmlSkeleton({ sourceUrl, targetUrl: target, required }));
    } catch (e) {
      st.skeletonError = errorText(e);
    }
    st.generating = false;
    rerender();
  };
  const inline = !!String(element.mapSource || "").trim();
  const mapPanel = h("div", null,
    h("div", { className: "hint", style: { marginBottom: "8px" } }, tr("A map written here is saved with the channel and runs instead of the map chosen in Properties. It may import the maps and use the profiles and ConceptMaps of the profile locations.")),
    h("div", { className: "fml-row", style: { marginBottom: "8px" } },
      h("button", { type: "button", className: "btn btn-sm", disabled: st.checking || !inline, onClick: checkMap }, st.checking ? tr("Checking…") : tr("Check")),
      !inline ? h("button", { type: "button", className: "btn btn-sm", onClick: () => { st.check = null; set("mapSource", FML_TEMPLATE); } }, tr("Start from an example")) : null,
      h("input", { type: "text", value: st.skeletonTarget, "aria-label": tr("Target profile for the skeleton"), placeholder: tr("Target profile for the skeleton"),
        style: { flex: "1 1 300px" }, onChange: e => { st.skeletonTarget = e.target.value; rerender(); } }),
      h("button", { type: "button", className: "btn btn-sm", disabled: st.generating, onClick: generateSkeleton },
        st.generating ? tr("Generating…") : tr("Generate skeleton")),
      inline ? h("button", { type: "button", className: "btn btn-sm", title: tr("Empty the map: the step then runs the map chosen in Properties"), onClick: () => { st.check = null; set("mapSource", ""); } }, tr("Clear")) : null,
      st.check && !st.check.errors.length ? h("span", { className: "fml-ok" }, tr("No problem found{p0}{p1}.", { p0: st.check.name ? tr(" in {name}", { name: st.check.name }) : "", p1: st.check.groups?.length ? tr(" (groups: {groups})", { groups: st.check.groups.join(", ") }) : "" })) : null,
      st.check && st.check.errors.length ? h("span", { className: "fml-error" }, tr("{p0} problem(s)", { p0: st.check.errors.length })) : null),
    st.skeletonError ? h("div", { className: "fml-error", style: { marginBottom: "6px" } }, st.skeletonError) : null,
    h(FmlMapEditor, { value: element.mapSource || "", problems: st.check?.errors || [], completionPaths: st.completionPaths,
      onChange: (text) => { element.mapSource = text; onChange(); if (!!text.trim() !== inline) rerender(); } }),
    (st.check?.errors || []).map((e, i) => h("div", { key: i, className: "fml-error", style: { marginTop: "4px" } }, tr("Line {p0}, column {p1}: {p2}", { p0: e.line, p1: e.column, p2: e.message }))));
  const mapOptions = st.maps || [];
  const knownMap = mapOptions.some((m) => m.url === element.mapUrl);
  const settings = h(
    "div",
    { className: "fml-settings" },
    field(tr("FHIR context"), h("select", { value: element.context || "", "aria-label": tr("FHIR context"), onChange: (e) => { set("context", e.target.value); setTimeout(() => loadMaps(false), 0); } },
      h("option", { value: "" }, tr("(none: this step's own version and locations)")),
      (cachedFhirSettings()?.contexts || []).map((c) => h("option", { key: c.name, value: c.name }, tr("{p0} — {p1}, {p2}", { p0: c.name, p1: c.fhirVersion, p2: (c.packages || []).join("; ") || tr("no package") }))),
      element.context && !shared && st.settingsReady ? h("option", { value: element.context }, tr("{p0} (not defined on this server)", { p0: element.context })) : null),
      shared ? tr("Locations: {p0} · validation policy of the context: {p1}.", { p0: (shared.packages || []).join("; ") || tr("none"), p1: shared.validation }) : tr("A context of Settings › FHIR Mapper gives the version and the locations to every step that names it."), true),
    field(tr("FHIR version"), h("select", { disabled: !!shared, value: version, onChange: (e) => set("fhirVersion", e.target.value) },
      ["R4", "R4B", "R5"].map((v) => h("option", { key: v, value: v }, v))), tr("Version of the resources the map produces.")),
    field(tr("Source model"), h("select", { value: element.sourceModel || "oie-message", onChange: e => set("sourceModel", e.target.value) },
      h("option", { value: "oie-message" }, tr("Generic OIE message")),
      h("option", { value: "hl7v2-logical" }, tr("Typed HL7 v2 logical model")),
      h("option", { value: "fhir" }, tr("FHIR resource"))),
    tr("The typed HL7 v2 model reads the XML produced by OIE's Strict Parser.")),
    (element.sourceModel || "oie-message") !== "oie-message" ? field(tr("Source model canonical URL"), text("sourceModelUrl", "http://example.org/StructureDefinition/ORU__R01"),
      element.sourceModel === "hl7v2-logical" ? tr("Required. Dots become underscores and existing underscores are doubled.") : tr("Used by the map skeleton; the FHIR resource itself declares its type.")) : null,
    field(tr("Result destination"), h("select", {
      value: element.variable ? "variable" : "message",
      onChange: (e) => set("variable", e.target.value === "variable" ? element.variable || "fhirResource" : "")
    }, h("option", { value: "message" }, tr("Outbound message")), h("option", { value: "variable" }, tr("Channel Map variable"))),
    tr("The outbound template (tmp) if there is one, else msg.")) ,
    element.variable ? field(tr("Variable"), text("variable", "fhirResource")) : null,
    field(shared ? tr("Maps of the context") : tr("Profile locations"), h("div", { className: "fml-row" },
      shared ? null : text("profiles", "/opt/fhir/ig;/opt/fhir/maps"),
      h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !locations.trim(), onClick: () => loadMaps(false) }, st.loading ? tr("Loading…") : tr("Load maps")),
      h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !locations.trim(), title: tr("Read the map files again"), onClick: () => loadMaps(true) }, tr("Reload"))),
    tr("Files and folders on the OIE server, separated by ';': FML files (.fml, .map), StructureMaps, profiles, ConceptMaps and packages (.tgz)."), true),
    field(tr("Map"), h("div", { className: "fml-row" },
      h("select", { value: knownMap ? element.mapUrl : "", onChange: (e) => set("mapUrl", e.target.value) },
        h("option", { value: "" }, st.maps ? (mapOptions.length ? tr("Choose a map…") : tr("No map in these locations")) : tr("Load the maps first")),
        mapOptions.map((m) => h("option", { key: m.url, value: m.url }, tr("{p0} — {p1}", { p0: m.title || m.name, p1: m.url }))))),
    inline ? tr("Not used: the step runs the map written in the Map tab.") : knownMap || !element.mapUrl ? tr("The map runs with the message as its source (OieMessage) and builds its target.") : tr("Map {p0} is not in the loaded list.", { p0: element.mapUrl }), true),
    st.loadError ? h("div", { className: "fml-wide fml-error" }, st.loadError) : null,
    Object.keys(st.mapErrors).length ? h("div", { className: "fml-wide fml-error" }, tr("Unreadable files: "),
      Object.entries(st.mapErrors).map(([file, message]) => h("div", { key: file }, tr("{p0}: {p1}", { p0: file, p1: message })))) : null,
    field(tr("Context variables"), text("contextVariables", "site, sendingFacility"),
      tr("Variables of the OIE maps ($) copied to context.variable of the model, separated by commas.")),
    field(tr("Validation"), h("label", { className: "check" },
      h("input", { type: "checkbox", checked: element.validateOutput !== false && element.validateOutput !== "false", onChange: (e) => set("validateOutput", e.target.checked) }),
      tr(" Validate the result")), tr("Against the profiles in meta.profile, else the base definition. An invalid result stops the message."))
  );

  const result = st.result;
  const test = h(
    "div",
    { className: "fml-test" + (result ? " fml-test--result" : "") },
    h("div", { className: "fml-test-toolbar" },
      field(tr("Data type"), h("select", { value: st.sample.dataType, onChange: (e) => { st.sample.dataType = e.target.value; saveSample(); rerender(); } },
        DATA_TYPES.map((v) => h("option", { key: v, value: v }, v)))),
      h("button", { type: "button", className: "btn btn-primary", disabled: st.testing || !(element.mapUrl || inline), onClick: runTest }, st.testing ? tr("Running…") : tr("Run test"))),
    h("div", { className: "fml-test-inputs" },
      field(tr("Sample message"), h(CodeBox, { value: st.sample.message, language: languageOf(st.sample.dataType), height: "100%", label: tr("Sample message"),
        onChange: (text) => { if (text !== st.sample.message) { st.sample.message = text; saveSample(); rerender(); } } })),
      result?.model ? field(tr("Source instance received by the map"), h(CodeBox, { value: pretty(result.model), language: "json", readOnly: true, height: "100%", label: tr("Source instance") })) : null),
    result ? h("div", { className: "fml-test-result" },
      h("div", { className: "fml-test-diagnostics" },
      (result.errors || []).map((e, i) => h("div", { key: `e${i}`, className: "fml-error" }, tr("{p0}: {p1}", { p0: e.phase, p1: e.message }))),
      result.validationPerformed && !(result.issues || []).some((i) => ["error", "fatal"].includes(i.severity)) && !(result.errors || []).length
        ? h("div", { className: "fml-ok" }, tr("Valid.")) : null,
      (result.issues || []).filter((i) => i.severity !== "information").map((i, n) =>
        h("div", { key: `i${n}`, className: i.severity === "warning" ? "fml-issue-warning" : "fml-error" }, tr("{p0} {p1}: {p2}", { p0: i.severity, p1: i.location || "", p2: i.message })))),
      result.output ? field(tr("Result"), h(CodeBox, { value: pretty(result.output), language: "json", readOnly: true, height: "100%", label: tr("Result") })) : null)
      : null
  );

  // Full screen as in the Profile Mapper: a style of the editor's own element.
  React.useEffect(() => {
    if (!st.fullScreen) return undefined;
    const onKey = (e) => { if (e.key === "Escape" && !e.defaultPrevented) { st.fullScreen = false; rerender(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [st.fullScreen]);
  const tabs = [{ id: "settings", label: tr("Properties"), panel: settings }, { id: "map", label: tr("Map"), panel: mapPanel }, { id: "test", label: tr("Test"), panel: test }];
  const current = tabs.find((t) => t.id === st.tab) || tabs[0];
  return h(
    "div",
    { className: "fhir-fml" + (st.fullScreen ? " mapper-fullscreen" : "") + (current.id === "test" ? " fml-testing-layout" : "") },
    h("div", { className: "fml-tabs", role: "tablist" }, tabs.map((t) =>
      h("button", { key: t.id, type: "button", role: "tab", "aria-selected": t.id === current.id, onClick: () => { st.tab = t.id; rerender(); } }, t.label)),
      h("span", { style: { marginLeft: "auto", alignSelf: "center", marginRight: "6px", display: "inline-flex" } }, h(HelpButton, { key: current.id, ...(FML_HELP[current.id] || FML_HELP.settings) })),
      h("button", { type: "button", className: "btn btn-sm", style: { alignSelf: "center" }, title: tr("Edit this step on the whole page (Esc to come back)"),
        onClick: () => { st.fullScreen = !st.fullScreen; rerender(); } }, st.fullScreen ? tr("Exit full screen (Esc)") : tr("⤢ Full screen"))),
    h("div", { role: "tabpanel" }, current.panel)
  );
}

export function register(platform) {
  React = platform.React;
  registerLanguage("fml", FML_LANGUAGE, platform);
  try {
    if (platform.oie && platform.oie.STEP_TYPES && !platform.oie.STEP_TYPES[FML_TYPE]) platform.oie.STEP_TYPES[FML_TYPE] = { label: "FHIR FML Transform" };
  } catch {
    // an administrator without that list: the class name is shown
  }
  platform.registerStepType(FML_TYPE, {
    label: "FHIR FML Transform",
    create: () => ({
      __type: FML_TYPE,
      name: "",
      enabled: true,
      fhirVersion: "R4",
      profiles: "",
      mapUrl: "",
      mapSource: "",
      sourceModel: "oie-message",
      sourceModelUrl: "",
      context: "",
      variable: "",
      validateOutput: true,
      contextVariables: ""
    }),
    validate: (el) => {
      if (!String(el.mapUrl || "").trim() && !String(el.mapSource || "").trim()) return tr("Write the map in the Map tab, or choose the map to run.");
      if (el.sourceModel === "hl7v2-logical" && !String(el.sourceModelUrl || "").trim()) return tr("The typed HL7 v2 source model requires its canonical URL.");
      if (el.variable !== undefined && el.variable !== "" && !String(el.variable).trim()) return tr("Give the Channel Map variable a name.");
      return "";
    },
    component: FmlTransformEditor
  });
}
