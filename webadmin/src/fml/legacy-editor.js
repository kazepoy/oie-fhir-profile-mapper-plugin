// SPDX-License-Identifier: MPL-2.0
// ---------------------------------------------------------------------------------------------
// FHIR FML Transform transformer step (org.oie.fhir.fml.FhirFmlTransformStep). The step runs an FML
// map (StructureMap) found in its profile locations on the message, seen through the generic OIE
// logical model (OieMessage), and publishes the FHIR resource it makes. The maps are written
// elsewhere: this editor only chooses one and tests it on a sample message.
// ---------------------------------------------------------------------------------------------

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
.fhir-fml .fml-tabs { display: flex; gap: 4px; margin: 12px 0 8px; border-bottom: 1px solid #cbd5e1; }
.fhir-fml .fml-tabs button { border: 0; border-bottom: 2px solid transparent; background: none; padding: 6px 10px; cursor: pointer; color: inherit; }
.fhir-fml .fml-tabs button[aria-selected=true] { border-bottom-color: #2563eb; font-weight: 600; }
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

  const loadMaps = async (reload) => {
    st.loading = true;
    st.loadError = "";
    rerender();
    try {
      if (reload) await platform.api.post(`${FML_API}/reload`, "", { contentType: "text/plain", raw: true });
      const answer = JSON.parse(await platform.api.get(`${FML_API}/maps`, { fhirVersion: element.fhirVersion || "R4", profiles: element.profiles || "" }, { raw: true }));
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
    if ((element.profiles || "").trim()) loadMaps(false);
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

  const mapOptions = st.maps || [];
  const knownMap = mapOptions.some((m) => m.url === element.mapUrl);
  const settings = h(
    "div",
    { className: "fml-settings" },
    field("FHIR version", h("select", { value: element.fhirVersion || "R4", onChange: (e) => set("fhirVersion", e.target.value) },
      ["R4", "R4B", "R5"].map((v) => h("option", { key: v, value: v }, v))), "Version of the resources the map produces."),
    field("Result destination", h("select", {
      value: element.variable ? "variable" : "message",
      onChange: (e) => set("variable", e.target.value === "variable" ? element.variable || "fhirResource" : "")
    }, h("option", { value: "message" }, "Outbound message"), h("option", { value: "variable" }, "Channel Map variable")),
    "The outbound template (tmp) if there is one, else msg.") ,
    element.variable ? field("Variable", text("variable", "fhirResource")) : null,
    field("Profile locations", h("div", { className: "fml-row" },
      text("profiles", "/opt/fhir/ig;/opt/fhir/maps"),
      h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !(element.profiles || "").trim(), onClick: () => loadMaps(false) }, st.loading ? "Loading…" : "Load maps"),
      h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !(element.profiles || "").trim(), title: "Read the map files again", onClick: () => loadMaps(true) }, "Reload")),
    "Files and folders on the OIE server, separated by ';': FML files (.fml, .map), StructureMaps, profiles, ConceptMaps and packages (.tgz).", true),
    field("Map", h("div", { className: "fml-row" },
      h("select", { value: knownMap ? element.mapUrl : "", onChange: (e) => set("mapUrl", e.target.value) },
        h("option", { value: "" }, st.maps ? (mapOptions.length ? "Choose a map…" : "No map in these locations") : "Load the maps first"),
        mapOptions.map((m) => h("option", { key: m.url, value: m.url }, `${m.title || m.name} — ${m.url}`)))),
    knownMap || !element.mapUrl ? "The map runs with the message as its source (OieMessage) and builds its target." : `Map ${element.mapUrl} is not in the loaded list.`, true),
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
        h("button", { type: "button", className: "btn btn-primary", disabled: st.testing || !element.mapUrl, onClick: runTest }, st.testing ? "Running…" : "Run test")),
      field("Sample message", h("textarea", { rows: 8, value: st.sample.message, style: { width: "100%", fontFamily: "monospace" },
        onChange: (e) => { st.sample.message = e.target.value; saveSample(); rerender(); } }), null, true)),
    result ? h("div", null,
      (result.errors || []).map((e, i) => h("div", { key: `e${i}`, className: "fml-error" }, `${e.phase}: ${e.message}`)),
      result.validationPerformed && !(result.issues || []).some((i) => ["error", "fatal"].includes(i.severity)) && !(result.errors || []).length
        ? h("div", { className: "fml-ok" }, "Valid.") : null,
      (result.issues || []).filter((i) => i.severity !== "information").map((i, n) =>
        h("div", { key: `i${n}`, className: i.severity === "warning" ? "fml-issue-warning" : "fml-error" }, `${i.severity} ${i.location || ""}: ${i.message}`)),
      result.output ? h("div", null, h("h4", null, "Result"), h("pre", { className: "fml-json" }, pretty(result.output))) : null,
      result.model ? h("details", null, h("summary", null, "OIE model of the message (source of the map)"), h("pre", { className: "fml-json" }, pretty(result.model))) : null)
      : null
  );

  const tabs = [{ id: "settings", label: "Properties", panel: settings }, { id: "test", label: "Test", panel: test }];
  const current = tabs.find((t) => t.id === st.tab) || tabs[0];
  return h(
    "div",
    { className: "fhir-fml" },
    h("style", null, FML_STYLES),
    h("div", { className: "fml-tabs", role: "tablist" }, tabs.map((t) =>
      h("button", { key: t.id, type: "button", role: "tab", "aria-selected": t.id === current.id, onClick: () => { st.tab = t.id; rerender(); } }, t.label))),
    h("div", { role: "tabpanel" }, current.panel)
  );
}

export function register(platform) {
  React = platform.React;
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
      variable: "",
      validateOutput: true,
      contextVariables: ""
    }),
    validate: (el) => {
      if (!String(el.mapUrl || "").trim()) return "Choose the map to run.";
      if (el.variable !== undefined && el.variable !== "" && !String(el.variable).trim()) return "Give the Channel Map variable a name.";
      return "";
    },
    component: FmlTransformEditor
  });
}
