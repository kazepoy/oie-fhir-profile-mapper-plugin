// SPDX-License-Identifier: MPL-2.0
// ---------------------------------------------------------------------------------------------
// FHIR FML Transform transformer step (org.oie.fhir.fml.FhirFmlTransformStep). The step runs an FML
// map (StructureMap) found in its profile locations on the message, seen through the generic OIE
// logical model (OieMessage), and publishes the FHIR resource it makes. The maps are written
// elsewhere: this editor only chooses one and tests it on a sample message.
// ---------------------------------------------------------------------------------------------

import { createExpressionEditor, registerLanguage } from "../host/code-editor.js";
import { FML_LANGUAGE, FML_TEMPLATE } from "./language.js";
import { CodeBox, languageOf } from "../host/code-box.js";
import { HelpButton } from "../host/help.js";
import { FML_HELP } from "../host/help-texts.js";
import { cachedFhirSettings, fhirContext, loadFhirSettings } from "../host/settings.js";

export const FML_TYPE = "org.oie.fhir.fml.FhirFmlTransformStep";
const FML_API = "/extensions/fhir-fml";
const DATA_TYPES = ["HL7V2", "XML", "JSON", "RAW", "DELIMITED"];

const FML_STYLES = `
.fhir-fml { container-type: inline-size; min-width: 0; }
.fhir-fml .fml-settings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; align-items: start; }
.fhir-fml .fml-settings > *, .fhir-fml .field { min-width: 0; }
.fhir-fml .fml-wide { grid-column: 1 / -1; }
.fhir-fml .fml-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.fhir-fml .fml-row > select, .fhir-fml .fml-row > input[type=text] { flex: 1 1 240px; min-width: 0; width: auto; }
.fhir-fml .fml-row > button { flex: none; white-space: nowrap; }
.fhir-fml .fml-tabs { display: flex; gap: 2px; margin-bottom: 12px; border-bottom: 1px solid color-mix(in srgb, var(--text-faint, #64748b) 35%, transparent); }
.fhir-fml .fml-tabs [role=tab] { padding: 6px 14px; margin-bottom: -1px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--text-faint, #64748b); font: inherit; font-weight: 600; cursor: pointer; }
.fhir-fml .fml-tabs [role=tab]:hover { color: var(--text, #1e293b); }
.fhir-fml .fml-tabs [role=tab][aria-selected=true] { color: var(--text, #1e293b); border-bottom-color: var(--accent, #2563eb); }
.fhir-fml pre.fml-json { max-height: 420px; overflow: auto; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; white-space: pre; }
.fhir-fml .fml-error { color: #b91c1c; overflow-wrap: anywhere; }
.fhir-fml .fml-issue-warning { color: #b45309; }
.fhir-fml .fml-ok { color: #15803d; }
@container (max-width: 640px) { .fhir-fml .fml-settings { grid-template-columns: minmax(0, 1fr); } }
`;

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
  return { key, sample: { message: ctx?.transformer.inboundTemplate || "", dataType: DATA_TYPES.includes(inbound) ? inbound : "RAW" } };
}

/** The map editor: the host's code editor in the fml language; markers are the problems of the last check. */
function FmlMapEditor({ value, onChange, problems }) {
  const host = React.useRef(null);
  const editor = React.useRef(null);
  const latest = React.useRef(onChange);
  latest.current = onChange;
  React.useEffect(() => {
    const ed = createExpressionEditor({ value, language: "fml", multiline: true, minHeight: "360px", ariaLabel: "FML map", onChange: (text) => latest.current(text) });
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
    state.current = { tab: "settings", maps: null, mapErrors: {}, loading: false, loadError: "", sampleKey: initial.key, sample, testing: false, result: null };
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
        ? "Testing a step requires the permission “Test FHIR FML transforms”." : message }] };
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
  const inline = !!String(element.mapSource || "").trim();
  const mapPanel = h("div", null,
    h("div", { className: "hint", style: { marginBottom: "8px" } }, "A map written here is saved with the channel and runs instead of the map chosen in Properties. It may import the maps and use the profiles and ConceptMaps of the profile locations."),
    h("div", { className: "fml-row", style: { marginBottom: "8px" } },
      h("button", { type: "button", className: "btn btn-sm", disabled: st.checking || !inline, onClick: checkMap }, st.checking ? "Checking…" : "Check"),
      !inline ? h("button", { type: "button", className: "btn btn-sm", onClick: () => { st.check = null; set("mapSource", FML_TEMPLATE); } }, "Start from an example") : null,
      inline ? h("button", { type: "button", className: "btn btn-sm", title: "Empty the map: the step then runs the map chosen in Properties", onClick: () => { st.check = null; set("mapSource", ""); } }, "Clear") : null,
      st.check && !st.check.errors.length ? h("span", { className: "fml-ok" }, `No problem found${st.check.name ? ` in ${st.check.name}` : ""}${st.check.groups?.length ? ` (groups: ${st.check.groups.join(", ")})` : ""}.`) : null,
      st.check && st.check.errors.length ? h("span", { className: "fml-error" }, `${st.check.errors.length} problem(s)`) : null),
    h(FmlMapEditor, { value: element.mapSource || "", problems: st.check?.errors || [], onChange: (text) => { element.mapSource = text; onChange(); if (!!text.trim() !== inline) rerender(); } }),
    (st.check?.errors || []).map((e, i) => h("div", { key: i, className: "fml-error", style: { marginTop: "4px" } }, `Line ${e.line}, column ${e.column}: ${e.message}`)));
  const mapOptions = st.maps || [];
  const knownMap = mapOptions.some((m) => m.url === element.mapUrl);
  const settings = h(
    "div",
    { className: "fml-settings" },
    field("FHIR context", h("select", { value: element.context || "", "aria-label": "FHIR context", onChange: (e) => { set("context", e.target.value); setTimeout(() => loadMaps(false), 0); } },
      h("option", { value: "" }, "(none: this step's own version and locations)"),
      (cachedFhirSettings()?.contexts || []).map((c) => h("option", { key: c.name, value: c.name }, `${c.name} — ${c.fhirVersion}, ${(c.packages || []).join("; ") || "no package"}`)),
      element.context && !shared && st.settingsReady ? h("option", { value: element.context }, `${element.context} (not defined on this server)`) : null),
      shared ? `Locations: ${(shared.packages || []).join("; ") || "none"} · validation policy of the context: ${shared.validation}.` : "A context of Settings › FHIR Mapper gives the version and the locations to every step that names it.", true),
    field("FHIR version", h("select", { disabled: !!shared, value: version, onChange: (e) => set("fhirVersion", e.target.value) },
      ["R4", "R4B", "R5"].map((v) => h("option", { key: v, value: v }, v))), "Version of the resources the map produces."),
    field("Result destination", h("select", {
      value: element.variable ? "variable" : "message",
      onChange: (e) => set("variable", e.target.value === "variable" ? element.variable || "fhirResource" : "")
    }, h("option", { value: "message" }, "Outbound message"), h("option", { value: "variable" }, "Channel Map variable")),
    "The outbound template (tmp) if there is one, else msg.") ,
    element.variable ? field("Variable", text("variable", "fhirResource")) : null,
    field(shared ? "Maps of the context" : "Profile locations", h("div", { className: "fml-row" },
      shared ? null : text("profiles", "/opt/fhir/ig;/opt/fhir/maps"),
      h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !locations.trim(), onClick: () => loadMaps(false) }, st.loading ? "Loading…" : "Load maps"),
      h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !locations.trim(), title: "Read the map files again", onClick: () => loadMaps(true) }, "Reload")),
    "Files and folders on the OIE server, separated by ';': FML files (.fml, .map), StructureMaps, profiles, ConceptMaps and packages (.tgz).", true),
    field("Map", h("div", { className: "fml-row" },
      h("select", { value: knownMap ? element.mapUrl : "", onChange: (e) => set("mapUrl", e.target.value) },
        h("option", { value: "" }, st.maps ? (mapOptions.length ? "Choose a map…" : "No map in these locations") : "Load the maps first"),
        mapOptions.map((m) => h("option", { key: m.url, value: m.url }, `${m.title || m.name} — ${m.url}`)))),
    inline ? "Not used: the step runs the map written in the Map tab." : knownMap || !element.mapUrl ? "The map runs with the message as its source (OieMessage) and builds its target." : `Map ${element.mapUrl} is not in the loaded list.`, true),
    st.loadError ? h("div", { className: "fml-wide fml-error" }, st.loadError) : null,
    Object.keys(st.mapErrors).length ? h("div", { className: "fml-wide fml-error" }, "Unreadable files: ",
      Object.entries(st.mapErrors).map(([file, message]) => h("div", { key: file }, `${file}: ${message}`))) : null,
    field("Context variables", text("contextVariables", "site, sendingFacility"),
      "Variables of the OIE maps ($) copied to context.variable of the model, separated by commas."),
    field("Validation", h("label", { className: "check" },
      h("input", { type: "checkbox", checked: element.validateOutput !== false && element.validateOutput !== "false", onChange: (e) => set("validateOutput", e.target.checked) }),
      " Validate the result"), "Against the profiles in meta.profile, else the base definition. An invalid result stops the message.")
  );

  const result = st.result;
  const test = h(
    "div",
    null,
    h("div", { className: "fml-settings" },
      field("Data type", h("select", { value: st.sample.dataType, onChange: (e) => { st.sample.dataType = e.target.value; saveSample(); rerender(); } },
        DATA_TYPES.map((v) => h("option", { key: v, value: v }, v)))),
      h("div", { className: "field" }, h("label", null, " "),
        h("button", { type: "button", className: "btn btn-primary", disabled: st.testing || !(element.mapUrl || inline), onClick: runTest }, st.testing ? "Running…" : "Run test")),
      field("Sample message", h(CodeBox, { value: st.sample.message, language: languageOf(st.sample.dataType), height: "190px", label: "Sample message",
        onChange: (text) => { if (text !== st.sample.message) { st.sample.message = text; saveSample(); rerender(); } } }), null, true)),
    result ? h("div", null,
      (result.errors || []).map((e, i) => h("div", { key: `e${i}`, className: "fml-error" }, `${e.phase}: ${e.message}`)),
      result.validationPerformed && !(result.issues || []).some((i) => ["error", "fatal"].includes(i.severity)) && !(result.errors || []).length
        ? h("div", { className: "fml-ok" }, "Valid.") : null,
      (result.issues || []).filter((i) => i.severity !== "information").map((i, n) =>
        h("div", { key: `i${n}`, className: i.severity === "warning" ? "fml-issue-warning" : "fml-error" }, `${i.severity} ${i.location || ""}: ${i.message}`)),
      result.output ? h("div", null, h("h4", null, "Result"), h(CodeBox, { value: pretty(result.output), language: "json", readOnly: true, height: "360px", label: "Result" })) : null,
      result.model ? h("details", null, h("summary", null, "OIE model of the message (source of the map)"), h(CodeBox, { value: pretty(result.model), language: "json", readOnly: true, height: "360px", label: "OIE model" })) : null)
      : null
  );

  // Full screen as in the Profile Mapper: a style of the editor's own element.
  React.useEffect(() => {
    if (!st.fullScreen) return undefined;
    const onKey = (e) => { if (e.key === "Escape" && !e.defaultPrevented) { st.fullScreen = false; rerender(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [st.fullScreen]);
  const tabs = [{ id: "settings", label: "Properties", panel: settings }, { id: "map", label: "Map", panel: mapPanel }, { id: "test", label: "Test", panel: test }];
  const current = tabs.find((t) => t.id === st.tab) || tabs[0];
  return h(
    "div",
    { className: "fhir-fml" + (st.fullScreen ? " mapper-fullscreen" : "") },
    h("style", null, FML_STYLES),
    h("div", { className: "fml-tabs", role: "tablist" }, tabs.map((t) =>
      h("button", { key: t.id, type: "button", role: "tab", "aria-selected": t.id === current.id, onClick: () => { st.tab = t.id; rerender(); } }, t.label)),
      h("span", { style: { marginLeft: "auto", alignSelf: "center", marginRight: "6px", display: "inline-flex" } }, h(HelpButton, { key: current.id, ...(FML_HELP[current.id] || FML_HELP.settings) })),
      h("button", { type: "button", className: "btn btn-sm", style: { alignSelf: "center" }, title: "Edit this step on the whole page (Esc to come back)",
        onClick: () => { st.fullScreen = !st.fullScreen; rerender(); } }, st.fullScreen ? "Exit full screen (Esc)" : "⤢ Full screen")),
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
      context: "",
      variable: "",
      validateOutput: true,
      contextVariables: ""
    }),
    validate: (el) => {
      if (!String(el.mapUrl || "").trim() && !String(el.mapSource || "").trim()) return "Write the map in the Map tab, or choose the map to run.";
      if (el.variable !== undefined && el.variable !== "" && !String(el.variable).trim()) return "Give the Channel Map variable a name.";
      return "";
    },
    component: FmlTransformEditor
  });
}
