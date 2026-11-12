// SPDX-License-Identifier: MPL-2.0
// Presentation only: mapping edits and selection remain owned by the editor.
export function Inspector({ h, node, helpUrl, children, diagnostics, extensions }) {
  if (!node) return h("aside", { className: "mapper-inspector", "aria-label": "Element inspector" },
    h("h3", null, "Element inspector"), h("p", null, "Select an element in the tree to inspect its definition and rules."));
  const el = node.el || {};
  const item = (label, value) => value == null || value === "" ? null : h("div", { key: label }, h("dt", null, label), h("dd", null, value));
  return h("aside", { className: "mapper-inspector", "aria-label": "Element inspector" },
    h("h3", null, node.key),
    h("dl", null,
      item("Type", (node.types || el.type || []).map(type => type.code).join(" | ") || node.code),
      item("Cardinality", `${node.min ?? el.min ?? 0}..${node.max ?? el.max ?? "*"}`),
      item("Must Support", node.mustSupport || el.mustSupport ? "Yes" : "No"),
      item("Slice", node.sliceName || el.sliceName),
      item("Description", node.short || el.short),
      item("Definition", el.definition),
      item("Binding", node.binding ? `${node.binding.strength}: ${node.binding.valueSet}` : null),
      item(node.fixed?.kind === "pattern" ? "Pattern" : "Fixed value", node.fixed ? JSON.stringify(node.fixed.value) : null)),
    (el.example || []).map((example, index) => h("p", { key: index },
      h("strong", null, example.label || "Example"), ": ", JSON.stringify(Object.entries(example).find(([key]) => key.startsWith("value"))?.[1]))),
    h("a", { href: helpUrl, target: "_blank", rel: "noopener noreferrer" }, "Official FHIR definition"),
    extensions,
    h("h4", null, "Rules"), children,
    h("h4", null, "Diagnostics"), diagnostics.length ? diagnostics : h("p", { className: "hint" }, "No diagnostic reported for this element."));
}
