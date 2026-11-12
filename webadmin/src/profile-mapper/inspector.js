// SPDX-License-Identifier: MPL-2.0
import { t as tr } from "../i18n/index.js";
// Presentation only: mapping edits and selection remain owned by the editor.
export function Inspector({ h, node, helpUrl, children, diagnostics, extensions }) {
  if (!node) return h("aside", { className: "mapper-inspector", "aria-label": tr("Element inspector") },
    h("h3", null, tr("Element inspector")), h("p", null, tr("Select an element in the tree to inspect its definition and rules.")));
  const el = node.el || {};
  const item = (label, value) => value == null || value === "" ? null : h("div", { key: label }, h("dt", null, label), h("dd", null, value));
  return h("aside", { className: "mapper-inspector", "aria-label": tr("Element inspector") },
    h("h3", null, node.key),
    h("dl", null,
      item(tr("Type"), (node.types || el.type || []).map(type => type.code).join(" | ") || node.code),
      item(tr("Cardinality"), `${node.min ?? el.min ?? 0}..${node.max ?? el.max ?? "*"}`),
      item(tr("Must Support"), node.mustSupport || el.mustSupport ? tr("Yes") : tr("No")),
      item(tr("Slice"), node.sliceName || el.sliceName),
      item(tr("Description"), node.short || el.short),
      item(tr("Definition"), el.definition),
      item(tr("Binding"), node.binding ? `${node.binding.strength}: ${node.binding.valueSet}` : null),
      item(node.fixed?.kind === "pattern" ? tr("Pattern") : tr("Fixed value"), node.fixed ? JSON.stringify(node.fixed.value) : null)),
    (el.example || []).map((example, index) => h("p", { key: index },
      h("strong", null, example.label || tr("Example")), ": ", JSON.stringify(Object.entries(example).find(([key]) => key.startsWith("value"))?.[1]))),
    h("a", { href: helpUrl, target: "_blank", rel: "noopener noreferrer" }, tr("Official FHIR definition")),
    extensions,
    h("h4", null, tr("Rules")), children,
    h("h4", null, tr("Diagnostics")), diagnostics.length ? diagnostics : h("p", { className: "hint" }, tr("No diagnostic reported for this element.")));
}
