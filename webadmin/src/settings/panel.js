// SPDX-License-Identifier: MPL-2.0
import { t as tr } from "../i18n/index.js";
// Settings › FHIR Mapper: the FHIR contexts of the server. A context names a set of
// profile packages, a terminology server and a validation policy; the FHIR steps
// that name it share them. Laid out with Web Admin's own panel classes.
import { platform, toast } from "../host/platform.js";
import { loadFhirSettings, saveFhirSettings } from "../host/settings.js";
import { HelpButton } from "../host/help.js";
import { SETTINGS_HELP } from "../host/help-texts.js";

const emptyContext = () => ({ name: "", fhirVersion: "R4", packages: [], terminologyServer: "", terminologyAuthorization: "", cacheSeconds: 300, timeoutSeconds: 10, validation: "always" });

function errorText(e) {
  const m = /<detailMessage>([\s\S]*?)<\/detailMessage>/.exec((e && e.body) || "");
  return m ? m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&") : (e && e.message) || String(e);
}

export function FhirSettingsPanel() {
  const React = platform().React;
  const h = React.createElement;
  const [contexts, setContexts] = React.useState(null);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    loadFhirSettings(true).then(s => setContexts((s.contexts || []).map(c => ({ ...emptyContext(), ...c }))), e => { setContexts([]); setError(errorText(e)); });
  }, []);
  if (!contexts) return h("div", { className: "hint" }, tr("Loading…"));
  const update = (index, patch) => setContexts(contexts.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const saved = await saveFhirSettings({ contexts });
      setContexts(saved.contexts.map(c => ({ ...emptyContext(), ...c })));
      toast(tr("FHIR contexts saved. Redeploy the channels that use a changed context."), "info");
    } catch (e) {
      setError(/Manage FHIR mapper settings|403/.test(errorText(e)) || e?.status === 403
        ? tr("Changing the FHIR contexts requires the permission “Manage FHIR mapper settings”.") : errorText(e));
    }
    setSaving(false);
  };
  const field = (label, control, hint) => h("div", { className: "field" }, h("label", null, label), control, hint ? h("div", { className: "hint" }, hint) : null);
  return h("div", { className: "fhir-mapper-settings" },
    h("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: "6px" } }, h(HelpButton, SETTINGS_HELP)),
    h("p", { className: "hint" }, tr("A FHIR context is a named set of profile packages, a terminology server and a validation policy. FHIR Profile Mapper and FHIR FML Transform steps that name a context share them; a step without a context keeps its own. A deployed channel takes a change when it is redeployed.")),
    contexts.map((c, i) => h("div", { key: i, className: "panel", style: { marginBottom: "12px" }, "data-context": c.name },
      h("div", { className: "panel-header", style: { display: "flex", alignItems: "center", gap: "8px" } }, c.name || tr("New context"),
        h("button", { type: "button", className: "btn btn-sm btn-danger", style: { marginLeft: "auto" }, onClick: () => setContexts(contexts.filter((_, n) => n !== i)) }, tr("Delete"))),
      h("div", { className: "panel-body form-grid" },
        field(tr("Name"), h("input", { type: "text", value: c.name, placeholder: "labo", "aria-label": tr("Context name"), onChange: e => update(i, { name: e.target.value }) }), tr("Letters, digits, '_', '.', '-'. Steps refer to this name.")),
        field(tr("FHIR version"), h("select", { value: c.fhirVersion, onChange: e => update(i, { fhirVersion: e.target.value }) }, ["R4", "R4B", "R5"].map(v => h("option", { key: v, value: v }, v)))),
        h("div", { className: "span-2" }, field(tr("Packages and profile files"),
          h("textarea", { rows: 3, value: (c.packages || []).join("\n"), "aria-label": tr("Packages"), style: { width: "100%", fontFamily: "monospace" },
            onChange: e => update(i, { packages: e.target.value.split("\n") }) }),
          tr("One path per line, on the OIE server: files, folders or .tgz packages (profiles, ConceptMaps, FML maps)."))),
        field(tr("Terminology server"), h("input", { type: "text", value: c.terminologyServer, placeholder: tr("empty: translate with the packages"), onChange: e => update(i, { terminologyServer: e.target.value }) }),
          tr("Base URL as the OIE server reaches it; empty to translate locally.")),
        field(tr("Authorization"), h("input", { type: "text", value: c.terminologyAuthorization, placeholder: "'Bearer ' + $cfg('tx.token')", style: { fontFamily: "monospace" },
          onChange: e => update(i, { terminologyAuthorization: e.target.value }) }), tr("JavaScript expression of the Authorization header; empty for none.")),
        field(tr("Cache (seconds)"), h("input", { type: "number", min: 0, value: c.cacheSeconds, onChange: e => update(i, { cacheSeconds: Number(e.target.value) }) })),
        field(tr("Timeout (seconds)"), h("input", { type: "number", min: 1, value: c.timeoutSeconds, onChange: e => update(i, { timeoutSeconds: Number(e.target.value) }) })),
        field(tr("Validation of results"), h("select", { value: c.validation, onChange: e => update(i, { validation: e.target.value }) },
          h("option", { value: "always" }, tr("always")), h("option", { value: "off" }, tr("off"))), tr("For the steps whose validation is “as the context says”."))))),
    error ? h("div", { className: "hint", role: "alert", style: { color: "var(--err, #b91c1c)", marginBottom: "8px" } }, error) : null,
    h("div", { style: { display: "flex", gap: "8px" } },
      h("button", { type: "button", className: "btn", onClick: () => setContexts([...contexts, emptyContext()]) }, tr("New context")),
      h("button", { type: "button", className: "btn btn-primary", disabled: saving, onClick: save }, saving ? tr("Saving…") : tr("Save contexts"))));
}
