// SPDX-License-Identifier: MPL-2.0
import { t as tr } from "../i18n/index.js";
import { React, h } from "../host/react.js";
import { createExpressionEditor } from "../host/code-editor.js";
import { functionCompletion as completeSymbols, completeFunction, monacoItems, scopeDts } from "../fhir/completion.js";
let functions = [];
export const setExpressionFunctions = value => { functions = value; };
const functionCompletion = (...args) => completeSymbols(functions, ...args);
/**
 * Ctrl+Space opens the suggestions; macOS keeps it by default to switch input
 * sources, so Alt/Option+Space does the same everywhere.
 */
export function isCompletionShortcut(e) {
  return (e.code === "Space" || e.key === " " || e.key === "\u00a0") && !e.metaKey && !e.shiftKey && e.ctrlKey !== e.altKey;
}

export const COMPLETION_HINT = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "")
  ? tr("⌥Space (or ⌃Space) for suggestions")
  : tr("Ctrl+Space or Alt+Space for suggestions");

export function MapperExpression({ style, onChange, completionContext = {}, ...props }) {
  const input = React.useRef(null);
  const popup = React.useRef(null);
  const selection = React.useRef({});
  const caret = React.useRef(null);
  const id = React.useId();
  const [menu, setMenu] = React.useState(null);
  const [active, setActive] = React.useState(0);
  const update = (el, forced = false) => {
    const next = { value: el.value, start: el.selectionStart, end: el.selectionEnd };
    const previous = selection.current;
    if (!forced && previous.value === next.value && previous.start === next.start && previous.end === next.end) return;
    selection.current = next;
    setMenu(functionCompletion(el.value, el.selectionStart, el.selectionEnd, completionContext, forced));
    setActive(0);
  };
  const accept = (fn) => {
    const next = completeFunction(input.current.value, menu, fn);
    caret.current = next.caret;
    onChange({ target: { value: next.value } });
    setMenu(null);
  };
  React.useLayoutEffect(() => {
    if (caret.current !== null) {
      input.current.focus();
      input.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });
  React.useLayoutEffect(() => {
    const panel = popup.current;
    if (!menu) {
      if (panel.matches(":popover-open")) panel.hidePopover();
      return;
    }
    const position = (e) => {
      if (e?.type === "scroll" && panel.contains(e.target)) return;
      const box = input.current.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) { setMenu(null); return; }
      const width = Math.min(Math.max(box.width, 360), window.innerWidth - 16);
      const below = window.innerHeight - box.bottom - 8;
      const above = box.top - 8;
      const down = below >= Math.min(260, above);
      panel.style.width = `${width}px`;
      panel.style.left = `${Math.max(8, Math.min(box.left, window.innerWidth - width - 8))}px`;
      panel.style.top = down ? `${box.bottom + 4}px` : "auto";
      panel.style.bottom = down ? "auto" : `${window.innerHeight - box.top + 4}px`;
      panel.style.maxHeight = `${Math.min(300, Math.max(0, down ? below : above))}px`;
      if (!panel.matches(":popover-open")) panel.showPopover();
      const selected = panel.children[active];
      if (selected.offsetTop < panel.scrollTop) panel.scrollTop = selected.offsetTop;
      else if (selected.offsetTop + selected.offsetHeight > panel.scrollTop + panel.clientHeight)
        panel.scrollTop = selected.offsetTop + selected.offsetHeight - panel.clientHeight;
    };
    position();
    window.addEventListener("scroll", position, true);
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("scroll", position, true);
      window.removeEventListener("resize", position);
    };
  }, [menu, active]);
  return h("span", { className: "mapper-expression", style },
    h("input", {
      ...props, ref: input, type: "text", autoComplete: "off", role: "combobox", "aria-label": props["aria-label"] || tr("JavaScript expression"),
      title: props.title || tr("{p0}{p1}. {p2}.", { p0: completionContext.role || "value", p1: completionContext.targetType ? ` → FHIR ${completionContext.targetType}` : "", p2: COMPLETION_HINT }),
      "aria-autocomplete": "list", "aria-expanded": !!menu, "aria-controls": id, "aria-activedescendant": menu ? `${id}-${active}` : undefined,
      style: { ...style, flex: undefined, width: "100%", minWidth: 0 },
      onChange: (e) => { onChange(e); update(e.target); },
      onSelect: (e) => update(e.target),
      onBlur: () => setMenu(null),
      onKeyDown: (e) => {
        if (e.nativeEvent.isComposing) return;
        if (isCompletionShortcut(e)) { e.preventDefault(); e.stopPropagation(); update(e.target, true); return; }
        if (!menu) return;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setActive((active + (e.key === "ArrowDown" ? 1 : menu.items.length - 1)) % menu.items.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          accept(menu.items[active]);
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          setMenu(null);
        }
      }
    }),
    h("div", { ref: popup, id, popover: "manual", role: "listbox", "aria-label": tr("Mapper functions"), className: "mapper-functions" },
      menu ? menu.items.map((fn, index) => h("div", {
        key: fn.name, id: `${id}-${index}`, role: "option", "aria-selected": index === active,
        onMouseDown: (e) => e.preventDefault(), onClick: () => accept(fn)
      }, h("code", null, fn.signature + (fn.returnType ? ` → ${fn.returnType}` : "")), h("div", null, fn.description), h("code", null, fn.example))) : null)
  );
}

/** Expressions already coloured by the editor's tokenizer, by text. */
const coloured = new Map();

/** An expression that is not being edited, with the colours of the code editor; a click or the focus edits it. */
function ColouredExpression({ value, style, title, label, onActivate, onDropText }) {
  const [html, setHtml] = React.useState(coloured.get(value) || null);
  React.useEffect(() => {
    if (coloured.has(value)) { setHtml(coloured.get(value)); return undefined; }
    const monaco = typeof window !== "undefined" ? window.monaco : null;
    if (!monaco?.editor?.colorize) { setHtml(null); return undefined; }
    let active = true;
    monaco.editor.colorize(value, "javascript", {}).then((text) => {
      if (coloured.size > 2000) coloured.clear();
      coloured.set(value, text);
      if (active) setHtml(text);
    }, () => {});
    return () => { active = false; };
  }, [value]);
  return h("div", {
    className: "mapper-expression-view", role: "combobox", tabIndex: 0, "aria-label": label || tr("JavaScript expression"), "aria-expanded": false, title, style: { ...style, fontFamily: undefined, fontSize: undefined }, "data-value": value,
    onFocus: onActivate, onClick: onActivate,
    onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; },
    onDrop: (e) => {
      const text = e.dataTransfer.getData("application/x-oie-accessor") || e.dataTransfer.getData("text/plain");
      if (!text) return;
      e.preventDefault();
      e.stopPropagation();
      onDropText(text);
    }
  }, html ? h("span", { dangerouslySetInnerHTML: { __html: html } }) : value);
}

/**
 * An expression field: a plain input until it gets the focus, then the host's code
 * editor (Monaco, one line) with the mapper's completions and typings. Only the field
 * being edited holds an editor, so a large tree stays light.
 */
/** The expression editor being used, so that a click on a sample field can insert into it. */
export let activeExpressionEditor = null;

export function ExpressionField(props) {
  const [editing, setEditing] = React.useState(false);
  const host = React.useRef(null);
  const editor = React.useRef(null);
  const latest = React.useRef(props);
  latest.current = props;
  const available = typeof createExpressionEditor === "function" && typeof document !== "undefined";
  React.useEffect(() => {
    if (!editing || !host.current) return undefined;
    const context = () => latest.current.completionContext || {};
    latest.current.onEdit?.();
    let ed;
    try {
      ed = createExpressionEditor({
        value: latest.current.value ?? "", ariaLabel: latest.current["aria-label"] || "JavaScript expression",
        onChange: (value) => latest.current.onChange({ target: { value } }),
        onEnter: () => setEditing(false),
        // Inside quotes only the codes of the element's value set make sense; elsewhere they come quoted.

        getItems: () => [
          // The functions themselves are offered once, by Web Admin's Reference entries (host/references.js).
          ...monacoItems([], context()),
          ...(context().codes || []).map((c) => ({ label: tr("'{p0}'{p1}", { p0: c.code, p1: c.display ? ` — ${c.display}` : "" }), filterText: `${c.code} ${c.display || ""}`, kind: "variable",
            insertText: `'${c.code}'`, detail: tr("code of the {p0} binding{p1}", { p0: context().bindingStrength || "", p1: c.system ? ` · ${c.system}` : "" }), sortText: `0code${c.code}` })),
          ...(context().refs || []).map((ref) => ({ label: tr("fhirRef({p0})", { p0: ref.expression }), filterText: `fhirRef ${ref.expression}`, kind: "function",
            insertText: `fhirRef(${ref.expression})`, detail: tr("reference · {p0} built by step “{p1}”", { p0: ref.resourceType || "", p1: ref.step }), sortText: `0ref${ref.expression}` }))
        ],
        getDts: () => scopeDts(functions, context())
      });
    } catch (error) { console.error("[fhir-mapper] expression editor:", error); setEditing(false); return undefined; }
    editor.current = ed;
    activeExpressionEditor = ed;
    ed.setMarkers(latest.current.errors || []);
    host.current.appendChild(ed.el);
    ed.focus();
    // Another field taking the focus (Tab, Alt+arrows) ends this edition; the sample fields list does not.
    const focusElsewhere = (e) => { if (host.current && !host.current.contains(e.target) && !e.target.closest?.(".suggest-widget, .monaco-hover, .mapper-source-pane")) setEditing(false); };
    document.addEventListener("focusin", focusElsewhere, true);
    const focusWhenReady = setInterval(() => { if (ed.hasMonaco()) { clearInterval(focusWhenReady); ed.focus(); } }, 60);
    const outside = (e) => { if (host.current && !host.current.contains(e.target) && !e.target.closest?.(".suggest-widget, .monaco-hover, .parameter-hints-widget, .mapper-source-pane")) setEditing(false); };
    const onKey = (e) => { if (e.key === "Tab" && host.current?.contains(e.target) && !document.querySelector(".suggest-widget.visible")) setEditing(false); };
    document.addEventListener("mousedown", outside, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      clearInterval(focusWhenReady);
      document.removeEventListener("mousedown", outside, true);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusin", focusElsewhere, true);
      if (activeExpressionEditor === ed) activeExpressionEditor = null;
      editor.current = null;
      ed.dispose();
    };
  }, [editing]);
  React.useEffect(() => {
    if (editor.current && (props.value ?? "") !== editor.current.getValue()) editor.current.setValue(props.value ?? "");
  }, [props.value]);
  React.useEffect(() => { editor.current?.setMarkers(props.errors || []); }, [(props.errors || []).join("\n")]);
  const { errors, onEdit, ...plain } = props;
  // Not edited and not empty: shown with the editor's colours once Monaco is on the page.
  if (available && !editing && !props.disabled && (props.value ?? "") !== "" && window.monaco?.editor?.colorize) {
    return h("span", { className: "mapper-expression", style: props.style },
      h(ColouredExpression, { value: props.value, title: props.title, label: props["aria-label"], style: props.style, onActivate: () => setEditing(true),
        onDropText: (text) => props.onChange({ target: { value: `${props.value}${text}` } }) }));
  }
  if (!available || !editing || props.disabled) return h(MapperExpression, { ...plain, onFocus: () => { if (available && !props.disabled) setEditing(true); } });
  return h("span", { className: "mapper-expression mapper-expression-editing", style: props.style, ref: host });
}
