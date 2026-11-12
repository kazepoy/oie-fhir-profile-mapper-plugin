// SPDX-License-Identifier: MPL-2.0
import { t as tr } from "../i18n/index.js";
// A small "?" button that opens a panel of contextual help: titled sections of
// short lines, optionally with a key (a symbol, a button name, a shortcut).
// Closes on Escape, on a click outside, or on the button again.
import { platform } from "./platform.js";

/**
 * @param {{ label: string, sections: { title: string, lines: (string | [string, string])[] }[], note?: string }} props
 */
export function HelpButton({ label, sections, note }) {
  const React = platform().React;
  const h = React.createElement;
  const [open, setOpen] = React.useState(false);
  const root = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = e => { if (root.current && !root.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); root.current?.querySelector("button")?.focus(); } };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => { document.removeEventListener("mousedown", onDown, true); document.removeEventListener("keydown", onKey, true); };
  }, [open]);
  return h("span", { ref: root, className: "fm-help" },
    h("button", { type: "button", className: "fm-help__button" + (open ? " fm-help__button--open" : ""), "aria-label": tr(label), title: tr(label), "aria-expanded": open, onClick: () => setOpen(!open) }, "?"),
    open ? h("div", { className: "fm-help__panel", role: "dialog", "aria-label": tr(label) },
      sections.map(section => h("section", { key: section.title },
        h("h4", null, tr(section.title)),
        section.lines.map((line, i) => Array.isArray(line)
          ? h("div", { key: i, className: "fm-help__row" }, h("span", { className: "fm-help__key" }, tr(line[0])), h("span", null, tr(line[1])))
          : h("p", { key: i }, tr(line))))),
      note ? h("p", { className: "fm-help__note" }, tr(note)) : null) : null);
}
