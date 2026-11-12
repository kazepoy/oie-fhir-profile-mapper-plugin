// SPDX-License-Identifier: MPL-2.0
import { createExpressionEditor } from "../host/code-editor.js";
import { monacoItems, scopeDts } from "../fhir/completion.js";
import { snapshot, restore } from "../fhir/history.js";
import { CodeBox, languageOf } from "../host/code-box.js";
import { HelpButton } from "../host/help.js";
import { MAPPER_HELP } from "../host/help-texts.js";
import { cachedFhirSettings, fhirContext, loadFhirSettings } from "../host/settings.js";
import { normalizeResult } from "../fhir/diagnostics.js";
import { sourceTree, sourcePaths } from "../fhir/source.js";
import { createDiff } from "../host/code-editor.js";

const PKG = "org.oie.fhir.mapper";

// ---------------------------------------------------------------------------------------------
// FHIR Profile Mapper transformer step (FhirProfileMapperStep). The tree of the target profile is
// built from its snapshot (GET /api/extensions/fhir-profile-mapper/structure); data types and extension
// profiles without children in the snapshot are loaded when they are opened. Every element can get
// a JavaScript expression, usually a path in msg (drag it from the Message Trees panel). The step is
// saved with the compiled mappings, so the server needs no profile to generate the script.
// ---------------------------------------------------------------------------------------------

const MAPPER_TYPE = `${PKG}.FhirProfileMapperStep`;
const MAPPER_API = "/extensions/fhir-profile-mapper";
const FHIR_BASE = "http://hl7.org/fhir/StructureDefinition/";

const MAPPER_STYLES = `
.fhir-profile-mapper { container-type: inline-size; min-width: 0; }
.fhir-profile-mapper .mapper-settings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; align-items: start; }
.fhir-profile-mapper .mapper-settings > *, .fhir-profile-mapper .field { min-width: 0; }
.fhir-profile-mapper .mapper-settings .field { margin-bottom: 0; }
.fhir-profile-mapper .mapper-wide { grid-column: 1 / -1; }
.fhir-profile-mapper .mapper-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.fhir-profile-mapper .mapper-actions input[type=text] { flex: 1 1 240px; min-width: 0; width: auto; }
.fhir-profile-mapper .mapper-actions select { flex: none; width: auto; }
.fhir-profile-mapper .mapper-actions button { flex: none; white-space: nowrap; }
.fhir-profile-mapper .mapper-checks { display: flex; flex-wrap: wrap; gap: 10px 20px; }
.fhir-profile-mapper .check { white-space: nowrap; }
.fhir-profile-mapper .mapper-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-bottom: 8px; }
.fhir-profile-mapper .mapper-toolbar select { width: auto; max-width: 100%; }
.fhir-profile-mapper .mapper-toolbar .hint { flex: 1 1 280px; }
.fhir-profile-mapper .mapper-expression { display: inline-flex; width: 100%; min-width: 0; }
.fhir-profile-mapper .mapper-functions { position: fixed; inset: auto; margin: 0; padding: 4px; border: 1px solid #94a3b8; border-radius: 6px; background: var(--bg, white); color: var(--text, #1e293b); box-shadow: 0 4px 16px #0003; overflow: auto; box-sizing: border-box; }
.fhir-profile-mapper .mapper-functions [role=option] { padding: 6px 8px; cursor: pointer; border-radius: 4px; font-size: 12px; white-space: normal; }
.fhir-profile-mapper .mapper-functions [aria-selected=true] { background: #dbeafe; color: #1e293b; }
.fhir-profile-mapper .mapper-functions code { display: block; overflow-wrap: anywhere; }
.fhir-profile-mapper table.mapper-tree td { padding: 3px 8px; }
.fhir-profile-mapper .mapper-tree input:not([type=checkbox]), .fhir-profile-mapper .mapper-tree select { box-sizing: border-box; height: 26px; min-height: 26px; padding: 2px 6px; line-height: 20px; }
.fhir-profile-mapper .mapper-tree .mapper-expression { padding: 0; min-height: 0; vertical-align: middle; }
.fhir-profile-mapper .mapper-tree .btn { height: 22px; min-height: 22px; line-height: 18px; font-size: 11px; }
.fhir-profile-mapper .mapper-help { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; flex: 0 0 16px; width: 16px; height: 16px; min-height: 0; padding: 0; margin: 0; border: 1px solid currentColor; border-radius: 50%; font-size: 11px; line-height: 1; text-decoration: none; }
.fhir-profile-mapper .mapper-help:focus-visible { outline: 2px solid var(--accent, #2563eb); outline-offset: 2px; }
.fhir-profile-mapper .mapper-tree tbody > tr > td:first-child { position: relative; border-left: 2px solid transparent; }
.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr > td { background: color-mix(in srgb, var(--accent, #2563eb) 4%, var(--bg2, white)); }
.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr > td:first-child { border-left-color: color-mix(in srgb, var(--accent, #2563eb) 40%, transparent); }
.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr:first-child > td { border-top: 1px solid color-mix(in srgb, var(--accent, #2563eb) 25%, transparent); background: color-mix(in srgb, var(--accent, #2563eb) 8%, var(--bg2, white)); }
.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr:last-child > td { border-bottom: 1px solid color-mix(in srgb, var(--accent, #2563eb) 25%, transparent); }
.fhir-profile-mapper .mapper-node-open .mapper-node-label { font-weight: 600; }
.fhir-profile-mapper .mapper-tree tr:focus-within > td, .fhir-profile-mapper .mapper-tree .mapper-branch-open tr:focus-within > td { background: color-mix(in srgb, var(--accent, #2563eb) 12%, var(--bg2, white)); }
.fhir-profile-mapper .mapper-tree-guides { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.fhir-profile-mapper .mapper-tree-guides i { position: absolute; top: -1px; bottom: -1px; border-left: 1px solid color-mix(in srgb, var(--text-faint, #64748b) 45%, transparent); }
.fhir-profile-mapper .mapper-tree-guides b { position: absolute; top: 50%; width: 20px; border-top: 1px solid color-mix(in srgb, var(--text-faint, #64748b) 45%, transparent); }
.fhir-profile-mapper .bundle-routing { padding: 14px; border: 1px solid #93c5fd; border-radius: 8px; background: color-mix(in srgb, #3b82f6 7%, var(--bg, white)); }
.fhir-profile-mapper .bundle-routing-title { margin-bottom: 4px; font-weight: 600; }
.fhir-profile-mapper .bundle-target { margin-top: 10px; padding: 12px; border: 1px solid #bfdbfe; border-radius: 6px; background: var(--bg, white); }
.fhir-profile-mapper .bundle-choice { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; text-transform: none; letter-spacing: normal; font-weight: 600; }
.fhir-profile-mapper .bundle-choice input[type=checkbox] { width: 16px; height: 16px; margin: 0; flex: none; }
.fhir-profile-mapper .bundle-request { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 10px; margin-top: 10px; }
.fhir-profile-mapper .bundle-target .field { margin-top: 8px; }
.fhir-profile-mapper .mapper-tabs { display: flex; gap: 2px; margin-bottom: 12px; border-bottom: 1px solid color-mix(in srgb, var(--text-faint, #64748b) 35%, transparent); }
.fhir-profile-mapper .mapper-tabs [role=tab] { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; margin-bottom: -1px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--text-faint, #64748b); font: inherit; font-weight: 600; cursor: pointer; }
.fhir-profile-mapper .mapper-tabs [role=tab]:hover { color: var(--text, #1e293b); }
.fhir-profile-mapper .mapper-tabs [role=tab][aria-selected=true] { color: var(--text, #1e293b); border-bottom-color: var(--accent, #2563eb); }
.fhir-profile-mapper .mapper-tabs [role=tab]:focus-visible { outline: 2px solid var(--accent, #2563eb); outline-offset: -2px; }
.fhir-profile-mapper .mapper-tab-badge { min-width: 16px; padding: 0 5px; border-radius: 8px; background: #b91c1c; color: white; font-size: 11px; line-height: 16px; text-align: center; }
.fhir-profile-mapper .mapper-tab-panel > details:first-child, .fhir-profile-mapper .mapper-tab-panel > .mapper-settings + details { margin-top: 14px; }
@container (max-width: 640px) {
  .fhir-profile-mapper .mapper-settings { grid-template-columns: minmax(0, 1fr); }
}
`;

let React = null;
const h = (...args) => React.createElement(...args);

let MAPPER_FUNCTIONS = [];
let mapperFunctionsRequest = null;

function functionCompletion(value, caret, selectionEnd = caret, context = {}, forced = false) {
  // Ignore strings and comments, including an unfinished one at the caret.
  const before = value.slice(0, caret).replace(/"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?|`(?:\\.|[^`\\])*`?|\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/g, (s) => " ".repeat(s.length));
  const token = /[A-Za-z_$][\w$]*$/.exec(before);
  if (caret && before[caret - 1] !== value[caret - 1]) return null;
  if ((!token || token[0].length < 3) && !forced) return null;
  const start = token ? token.index : caret;
  if (before.slice(0, start).trimEnd().endsWith(".")) return null;
  const symbols = [...MAPPER_FUNCTIONS.filter((fn) => !context.role || fn.contexts.includes(context.role)),
    ...[...new Set(["msg", "tmp", "channelMap", "sourceMap", "connectorMap", "configurationMap", ...(context.variables || [])])]
      .map((name) => ({ name, signature: name, example: name, description: "Variable available in this scope.", kind: "variable" })),
    ...(context.paths || []).map((name) => ({ name, signature: name, example: name, description: "Source path from the sample; guard optional values.", kind: "path" }))];
  const prefix = token ? token[0] : "";
  const items = symbols.filter((fn) => fn.name.startsWith(prefix) || (forced && `${fn.signature} ${fn.description}`.toLowerCase().includes(prefix.toLowerCase())));
  if (!items.length) return null;
  const end = selectionEnd > caret ? selectionEnd : caret + /^[\w$]*/.exec(value.slice(caret))[0].length;
  return { start, end, items };
}

function completeFunction(value, completion, fn) {
  const tail = value.slice(completion.end);
  const text = !fn.kind && /^\s*\(/.test(tail) ? fn.name : fn.example;
  return { value: value.slice(0, completion.start) + text + tail, caret: completion.start + text.length };
}

function mapperSourcePaths(sample) {
  const paths = [];
  const add = (path) => { if (!paths.includes(path) && paths.length < 200) paths.push(path); };
  try {
    if (sample.dataType === "JSON") {
      const walk = (value, path, depth) => {
        if (depth > 5 || paths.length >= 200 || !value || typeof value !== "object") return;
        if (Array.isArray(value)) { if (value.length) { add(`${path}[0]`); walk(value[0], `${path}[0]`, depth + 1); } }
        else for (const key of Object.keys(value)) { const next = `${path}[${JSON.stringify(key)}]`; add(next); walk(value[key], next, depth + 1); }
      };
      walk(JSON.parse(sample.message), "msg", 0);
    } else if (sample.dataType === "XML") {
      const doc = new DOMParser().parseFromString(sample.message, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) return [];
      const walk = (node, path, depth) => {
        if (depth > 5 || paths.length >= 200) return;
        for (const child of node.children) { const next = `${path}[${JSON.stringify(child.localName)}]`; add(next); walk(child, next, depth + 1); }
      };
      walk(doc.documentElement, "msg", 0);
    }
  } catch { /* An incomplete sample offers no source paths. */ }
  return paths;
}

function mapperHelpUrl(version, type, key = type) {
  const release = ["R4", "R4B", "R5"].includes(version) ? version : "R4";
  if (!/^[A-Z][A-Za-z0-9]+$/.test(type || "")) return `https://hl7.org/fhir/${release}/`;
  const field = key.split(".")[1]?.replace(/:[^.]*/, "").replace(/\[\d+\]/g, "");
  return `https://hl7.org/fhir/${release}/${type.toLowerCase()}-definitions.html#${encodeURIComponent(type + (field ? "." + field : ""))}`;
}

function mapperJsonImport(element, text) {
  const patch = JSON.parse(text);
  if (!patch || Array.isArray(patch) || typeof patch !== "object") throw new Error("Expected a step JSON object.");
  for (const key of ["__proto__", "constructor", "prototype"]) if (Object.prototype.hasOwnProperty.call(patch, key)) throw new Error(`Invalid step property: ${key}`);
  if (patch.__type && patch.__type !== MAPPER_TYPE) throw new Error("This is not a FHIR Profile Mapper step.");
  const merged = { ...element, ...patch, __type: element.__type || MAPPER_TYPE,
    sequenceNumber: element.sequenceNumber, enabled: element.enabled };
  if (!["resource", "createBundle"].includes(merged.action) || !merged.resourceType) throw new Error("An action and resourceType are required.");
  for (const field of ["mappings", "bundleTargets"]) {
    if (typeof (merged[field] ?? "[]") !== "string" || !Array.isArray(JSON.parse(merged[field] || "[]")))
      throw new Error(`${field} must be a string containing a JSON array.`);
  }
  const allowed = new Set(["id", "key", "element", "type", "expression", "path", "each", "variable", "condition", "fixed", "when", "translate", "note", "disabled"]);
  for (const rule of JSON.parse(merged.mappings || "[]")) {
    if (!rule || typeof rule !== "object" || !Array.isArray(rule.path)) throw new Error("Every rule needs a path.");
    for (const key of Object.keys(rule)) if (!allowed.has(key)) throw new Error(`Unknown rule property: ${key}`);
  }
  merged.mappings = JSON.stringify(mapperRuleIds(JSON.parse(merged.mappings || "[]"), parseMappings(element.mappings)));
  return merged;
}

function mapperRuleIds(entries, previous = [], createId = () => crypto.randomUUID()) {
  const identity = (rule) => `${"each" in rule ? "each" : "condition" in rule ? "condition" : "fixed" in rule ? "fixed" : "value"}:${rule.key || rule.element}`;
  const known = new Map(previous.filter((rule) => rule.id).map((rule) => [identity(rule), rule.id]));
  const used = new Set();
  return entries.map((rule) => {
    const id = rule.id === undefined ? known.get(identity(rule)) || createId() : rule.id;
    if (typeof id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(id) || used.has(id)) throw new Error("Rule ids must be valid and unique within a step.");
    used.add(id);
    return { ...rule, id };
  });
}

function mapperCompletionContext(node, iterationMap, paths, role = "value") {
  const iterations = [];
  for (let current = role === "iteration" ? node?.parent : node; current; current = current.parent) {
    const iteration = iterationMap.get(current.key);
    if (iteration) iterations.push(iteration);
  }
  const variables = iterations.flatMap((it) => [it.variable, `${it.variable}Index`]);
  if (role === "translation") variables.push("code", "system");
  const normalize = (path) => path.replace(/\[['"]([^'"]+)['"]\]/g, (_, key) => `[${JSON.stringify(key)}]`);
  const aliases = paths.map((path) => {
    let alias = path;
    for (let round = 0; round < iterations.length; round++) {
      for (const it of iterations) {
        const prefix = normalize(it.expression.trim());
        if (alias.startsWith(prefix + "[")) alias = it.variable + alias.slice(prefix.length).replace(/^\[0\]/, "");
      }
    }
    return alias;
  });
  return { role, variables, paths: [...new Set([...paths, ...aliases])], targetType: node?.code };
}

/**
 * Ctrl+Space opens the suggestions; macOS keeps it by default to switch input
 * sources, so Alt/Option+Space does the same everywhere.
 */
function isCompletionShortcut(e) {
  return (e.code === "Space" || e.key === " " || e.key === "\u00a0") && !e.metaKey && !e.shiftKey && e.ctrlKey !== e.altKey;
}

const COMPLETION_HINT = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "")
  ? "⌥Space (or ⌃Space) for suggestions"
  : "Ctrl+Space or Alt+Space for suggestions";

function MapperExpression({ style, onChange, completionContext = {}, ...props }) {
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
      ...props, ref: input, type: "text", autoComplete: "off", role: "combobox", "aria-label": props["aria-label"] || "JavaScript expression",
      title: props.title || `${completionContext.role || "value"}${completionContext.targetType ? ` → FHIR ${completionContext.targetType}` : ""}. ${COMPLETION_HINT}.`,
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
    h("div", { ref: popup, id, popover: "manual", role: "listbox", "aria-label": "Mapper functions", className: "mapper-functions" },
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
    className: "mapper-expression-view", role: "combobox", tabIndex: 0, "aria-label": label || "JavaScript expression", "aria-expanded": false, title, style: { ...style, fontFamily: undefined, fontSize: undefined }, "data-value": value,
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
let activeExpressionEditor = null;

function ExpressionField(props) {
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
          ...(context().codes || []).map((c) => ({ label: `'${c.code}'${c.display ? ` — ${c.display}` : ""}`, filterText: `${c.code} ${c.display || ""}`, kind: "variable",
            insertText: `'${c.code}'`, detail: `code of the ${context().bindingStrength || ""} binding${c.system ? ` · ${c.system}` : ""}`, sortText: `0code${c.code}` })),
          ...(context().refs || []).map((ref) => ({ label: `fhirRef(${ref.expression})`, filterText: `fhirRef ${ref.expression}`, kind: "function",
            insertText: `fhirRef(${ref.expression})`, detail: `reference · ${ref.resourceType || ""} built by step “${ref.step}”`, sortText: `0ref${ref.expression}` }))
        ],
        getDts: () => scopeDts(MAPPER_FUNCTIONS, context())
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

/** Indexed StructureDefinitions per "version|packages|url": a promise, and the value once loaded. */
const sdPromises = new Map();
const sdLoaded = new Map();

const sdKey = (version, profiles, url) => `${version}|${profiles}|${url}`;

function indexSd(sd) {
  const elements = (sd.snapshot && sd.snapshot.element) || [];
  const byParent = new Map();
  const byId = new Map();
  for (const el of elements) byId.set(el.id, el);
  for (const el of elements.slice(1)) {
    const parent = el.id.slice(0, el.id.lastIndexOf("."));
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(el);
  }
  return { sd, root: elements[0], byParent, byId };
}

function fetchSd(platform, version, profiles, url) {
  const key = sdKey(version, profiles, url);
  if (!sdPromises.has(key)) {
    const promise = platform.api
      .get(`${MAPPER_API}/structure`, { url, fhirVersion: version, profiles }, { raw: true })
      .then((text) => {
        const index = indexSd(JSON.parse(text));
        sdLoaded.set(key, index);
        return index;
      })
      .catch((e) => {
        sdPromises.delete(key);
        throw e;
      });
    sdPromises.set(key, promise);
  }
  return sdPromises.get(key);
}

/**
 * A profile with every data type and extension profile it uses, in one request
 * (GET /catalog/elements): the tree then opens without loading types one by one.
 * Falls back to the profile alone on a server without that route.
 */
function fetchElements(platform, version, profiles, url) {
  const key = sdKey(version, profiles, url);
  if (sdPromises.has(key)) return sdPromises.get(key);
  const promise = platform.api.get(`${MAPPER_API}/catalog/elements`, { url, fhirVersion: version, profiles }, { raw: true }).then((text) => {
    const answer = JSON.parse(text);
    const index = indexSd(answer.root);
    sdLoaded.set(key, index);
    for (const [typeUrl, sd] of Object.entries(answer.types || {})) {
      const typeKey = sdKey(version, profiles, typeUrl);
      if (sdLoaded.has(typeKey)) continue;
      const typeIndex = indexSd(sd);
      sdLoaded.set(typeKey, typeIndex);
      sdPromises.set(typeKey, Promise.resolve(typeIndex));
    }
    return index;
  }).catch(() => {
    sdPromises.delete(key);
    return fetchSd(platform, version, profiles, url);
  });
  sdPromises.set(key, promise);
  return promise;
}

/** The message of a failed request: the engine answers a ClientException as XStream XML. */
function errorText(e) {
  const body = (e && e.body) || "";
  const m = /<detailMessage>([\s\S]*?)<\/detailMessage>/.exec(body);
  if (m) return m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  return (e && e.message) || String(e);
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const lastSegment = (id) => id.slice(id.lastIndexOf(".") + 1);
const shortType = (code) => (code || "").replace("http://hl7.org/fhirpath/System.", "").replace(/^http:\/\/hl7\.org\/fhirpath\//, "");
const isPrimitive = (code) => /^[a-z]/.test(code) || code.startsWith("http://hl7.org/fhirpath/");
const NOT_EXPANDED = new Set(["Resource", "BackboneElement", "Element"]);

function fixedOf(el) {
  for (const k of Object.keys(el)) {
    if (/^(fixed|pattern)[A-Z]/.test(k)) return { kind: k.startsWith("fixed") ? "fixed" : "pattern", value: el[k] };
  }
  return null;
}

function hiddenElement(el, parent, showAll) {
  if (el.max === "0") return true;
  const name = lastSegment(el.id).split(":")[0];
  if (showAll) return (el.type || []).some((t) => t.code === "Resource");
  if ((name === "extension" || name === "modifierExtension") && !el.sliceName) return true;
  if (name === "id" && !parent.resourceRoot) return true;
  return (el.type || []).some((t) => t.code === "Resource");
}

/**
 * The tree of a step. Nodes are built on demand from the loaded StructureDefinitions; repeated
 * instances of an element (instances: keyBase -> count) are separate nodes, keys "x.given[1]".
 */
function makeTree(rootIndex, ctx) {
  const root = {
    key: rootIndex.sd.type,
    label: rootIndex.sd.type,
    el: rootIndex.root,
    sdx: rootIndex,
    path: [],
    depth: 0,
    resourceRoot: true,
    instance: 0,
    index: 0,
    code: rootIndex.sd.type,
    min: 1,
    max: "1"
  };
  const cache = new Map();

  function makeNode(parent, el, sdx, choiceType, instance, index) {
    const name = lastSegment(el.id).split(":")[0];
    let types = el.type || [];
    let sliceName = el.sliceName || null;
    let jsonName;
    let label;
    let choice = false;
    if (choiceType) {
      types = [choiceType];
      jsonName = name.replace("[x]", "") + cap(choiceType.code);
      label = jsonName;
      sliceName = null;
    } else if (name.endsWith("[x]")) {
      const base = name.slice(0, -3);
      // A type slice (value[x]:valueQuantity) may keep all the types of its base in the snapshot.
      const sliced = sliceName ? types.filter((t) => base + cap(t.code) === sliceName) : [];
      if (sliced.length === 1) types = sliced;
      if (types.length === 1) {
        jsonName = sliceName && sliceName.startsWith(base) ? sliceName : base + cap(types[0].code);
        label = jsonName;
        sliceName = null;
      } else {
        choice = true;
        label = sliceName ? `${name}:${sliceName}` : name;
        jsonName = null;
      }
    } else {
      jsonName = name;
      label = sliceName ? `${name}:${sliceName}` : name;
    }
    const baseMax = (el.base && el.base.max) || el.max || "1";
    const repeats = !choiceType && !choice && baseMax !== "1" && baseMax !== "0";
    const keyBase = `${parent.key}.${label}`;
    const key = keyBase + (instance ? `[${instance}]` : "");
    const segment = repeats ? [jsonName, `${sliceName || ""}#${instance}`] : [jsonName];
    const code = types.length === 1 ? types[0].code : null;
    const primitive = !!code && isPrimitive(code);
    let typeUrl = null;
    if (!choice && code && !primitive && !NOT_EXPANDED.has(code)) {
      typeUrl = (types[0].profile && types[0].profile[0]) || FHIR_BASE + code;
    }
    return {
      key,
      keyBase,
      label,
      jsonName,
      el,
      sdx,
      choiceType,
      choice,
      sliceName,
      repeats,
      instance,
      index,
      path: jsonName == null ? parent.path : parent.path.concat([segment]),
      code,
      primitive,
      typeUrl,
      types,
      min: choiceType ? parent.min : el.min,
      max: choiceType ? parent.max : el.max,
      short: el.short || "",
      mustSupport: !!el.mustSupport || (choiceType ? parent.mustSupport : false),
      binding: el.binding && el.binding.valueSet ? { strength: el.binding.strength || "", valueSet: el.binding.valueSet } : null,
      fixed: choiceType ? null : fixedOf(el),
      depth: parent.depth + 1,
      parent
    };
  }

  /** The child elements of a node, or null while the StructureDefinition of its type is loading. */
  function childElements(node) {
    if (node.choice) return node.types.map((t) => ({ el: node.el, sdx: node.sdx, choiceType: t }));
    const own = node.choiceType ? [] : node.sdx.byParent.get(node.el.id) || [];
    if (own.length) return own.map((el) => ({ el, sdx: node.sdx }));
    if (!node.typeUrl) return [];
    const typeIndex = sdLoaded.get(sdKey(ctx.version, ctx.profiles, node.typeUrl));
    if (!typeIndex) return null;
    return (typeIndex.byParent.get(typeIndex.root.id) || []).map((el) => ({ el, sdx: typeIndex }));
  }

  function children(node) {
    if (cache.has(node.key)) return cache.get(node.key);
    const elements = childElements(node);
    if (elements === null) return null;
    const list = [];
    for (const { el, sdx, choiceType } of elements) {
      if (!choiceType && hiddenElement(el, node, ctx.showAll)) continue;
      const first = makeNode(node, el, sdx, choiceType, 0, list.length);
      const count = Math.max(1, ctx.instances.get(first.keyBase) || 1);
      list.push(first);
      for (let i = 1; i < count; i++) list.push(makeNode(node, el, sdx, choiceType, i, list.length));
    }
    cache.set(node.key, list);
    return list;
  }

  const expandable = (node) => node.choice || !!node.typeUrl || (!node.choiceType && (node.sdx.byParent.get(node.el.id) || []).length > 0);

  /** The nodes from the root to a key, or null when it is not (or not yet) in the loaded tree. */
  function chain(key) {
    if (key === root.key) return [root];
    if (!key.startsWith(root.key + ".")) return null;
    const result = [root];
    let node = root;
    for (const segment of key.slice(root.key.length + 1).split(".")) {
      const list = children(node);
      if (!list) return null;
      node = list.find((n) => n.key === `${node.key}.${segment}`);
      if (!node) return null;
      result.push(node);
    }
    return result;
  }

  /** Discriminator paths of a slice ("system", "url", "type.coding.code"), relative to the slice. */
  function discriminators(node) {
    if (!node.sliceName) return [];
    const base = node.sdx.byId.get(node.el.id.replace(/:[^.:]+$/, ""));
    return ((base && base.slicing && base.slicing.discriminator) || []).map((d) => d.path).filter((p) => p && p !== "$this");
  }

  return { root, children, expandable, chain, discriminators };
}

/** Keys and their count of instances, from the keys of saved mappings. */
function instancesOf(keys) {
  const instances = new Map();
  for (const key of keys) {
    const parts = key.split(".");
    for (let i = 1; i < parts.length; i++) {
      const m = /^(.*)\[(\d+)\]$/.exec(parts[i]);
      if (m) {
        const keyBase = parts.slice(0, i).join(".") + "." + m[1];
        instances.set(keyBase, Math.max(instances.get(keyBase) || 1, Number(m[2]) + 1));
      }
    }
  }
  return instances;
}

function parseMappings(text) {
  try {
    const list = JSON.parse(text || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * The mappings saved with the step: the values and iterations in tree order (that is the order of
 * the entries of repeating elements), then the fixed and pattern values of the entries they create:
 * of the slices and elements on the way, and of required elements and slice discriminators below
 * them. iterations: key -> {expression, variable}; translations: key -> {conceptMap, source, target, unmapped}.
 */
function compile(tree, values, iterations, translations, conditions) {
  const entries = [];
  const fixed = new Map();
  for (const [key, it] of iterations) {
    const nodes = it.expression.trim() ? tree.chain(key) : null;
    if (!nodes) continue;
    const node = nodes[nodes.length - 1];
    // the resource itself: one resource per item (Bundle output)
    if (node !== tree.root && !node.repeats) continue;
    entries.push({ key, each: it.expression.trim(), variable: (it.variable || "item").trim(), path: node.path, order: node === tree.root ? [] : nodes.map((n) => n.index) });
  }
  for (const [key, condition] of conditions) {
    const nodes = condition.trim() ? tree.chain(key) : null;
    if (!nodes) continue;
    const node = nodes[nodes.length - 1];
    entries.push({ key, condition: condition.trim(), path: node.path, order: node === tree.root ? [] : nodes.map((n) => n.index) });
  }
  const mapped = new Set([...values.keys()].filter((k) => values.get(k).trim() !== ""));
  for (const key of mapped) {
    const nodes = tree.chain(key);
    if (!nodes) continue;
    const leaf = nodes[nodes.length - 1];
    if (leaf.choice) continue;
    const entry = {
      key,
      element: key,
      type: shortType(leaf.code),
      expression: values.get(key).trim(),
      path: leaf.path,
      order: nodes.map((n) => n.index)
    };
    const t = translations.get(key);
    if (t && t.conceptMap && t.conceptMap.trim()) {
      entry.translate = { conceptMap: t.conceptMap.trim(), source: (t.source || "").trim(), target: (t.target || "").trim(), unmapped: t.unmapped || "none", keepSource: !!t.keepSource };
      if (entry.translate.unmapped === "fixed" || entry.translate.unmapped === "function") entry.translate.value = (t.value || "").trim();
    }
    entries.push(entry);
    const onChain = new Set(nodes.map((n) => n.key));
    for (const container of nodes.slice(0, -1)) {
      const when = container.path.length;
      if (container !== tree.root && container.fixed && container.jsonName != null && !fixed.has(container.key)) {
        fixed.set(container.key, { key: container.key, element: container.key, fixed: container.fixed.value, when, path: container.path });
      }
      const discriminators = tree.discriminators(container);
      const walk = (node, rel, required) => {
        for (const d of tree.children(node) || []) {
          if (d.instance || onChain.has(d.key) || mapped.has(d.key) || d.jsonName == null) continue;
          const path = rel ? `${rel}.${d.jsonName}` : d.jsonName;
          const req = required && Number(d.min) >= 1;
          if (d.fixed && (req || discriminators.includes(path))) {
            if (!fixed.has(d.key)) fixed.set(d.key, { key: d.key, element: d.key, fixed: d.fixed.value, when, path: d.path });
          } else if (req || discriminators.some((p) => p.startsWith(path + "."))) {
            walk(d, path, req);
          }
        }
      };
      walk(container, "", true);
    }
  }
  const cmp = (a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
    return a.length - b.length;
  };
  entries.sort((a, b) => cmp(a.order, b.order));
  return [...entries.map(({ order, ...e }) => e), ...fixed.values()];
}

/**
 * Required (min 1) and Must Support elements that nothing maps, below the resource and below every
 * element that gets something: not mapped, not iterated, no fixed value. Only the loaded tree.
 */
function completeness(tree, saved) {
  const entries = saved.filter((e) => e.key || e.element).map((e) => ({ ...e, key: e.key || e.element }));
  const covered = (node) =>
    entries.some((e) => e.key === node.key || e.key.startsWith(node.key + ".") || e.key.startsWith(node.key + ":") || (e.key.startsWith(node.key + "[") && /^\[\d+\]/.test(e.key.slice(node.key.length))));
  const required = [];
  const mustSupport = [];
  const walk = (node) => {
    for (const child of tree.children(node) || []) {
      if (child.instance || child.choiceType) continue;
      if (covered(child) || child.fixed) {
        if (!child.primitive) walk(child);
      } else if (Number(child.min) >= 1) {
        required.push(child.key);
      } else if (child.mustSupport) {
        mustSupport.push(child.key);
      }
    }
  };
  walk(tree.root);
  return { required, mustSupport };
}

/** The text an edit inserted at once (a paste, or a click in the Message Trees panel), or null. */
function inserted(before, after) {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let end = 0;
  while (end < before.length - start && end < after.length - start && before[before.length - 1 - end] === after[after.length - 1 - end]) end++;
  const text = after.slice(start, after.length - end);
  return text.length > 1 ? { start, end: after.length - end, text } : null;
}

const asBool = (v, def) => (v === undefined || v === null || v === "" ? def : v === true || v === "true");
const fixedText = (f) => (typeof f.value === "object" ? JSON.stringify(f.value) : String(f.value));
const TRANSLATABLE = new Set(["code", "string", "Coding", "CodeableConcept"]);
const isLocalServer = (server) => !String(server || "").trim() || String(server).trim().toLowerCase() === "n/a";
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A field dragged from the Message Trees panel into an element below an iteration: the path of the
 * iterated list becomes its variable (msg['PID']['PID.3'][0]['PID.3.1'] -> item['PID.3.1']), as the
 * Iterator step does with its prefix substitutions. The innermost iteration that matches wins.
 */
function substitute(text, iterations) {
  for (const it of iterations) {
    const prefix = it.expression.trim().replace(/\.toString\(\)$/, "");
    if (!prefix) continue;
    const m = new RegExp("^" + escapeRegExp(prefix) + "(\\[\\d+\\])?").exec(text);
    if (m) return (it.variable || "item") + text.slice(m[0].length);
  }
  return text;
}

/** Locate this step in the channel being edited, including destination/response transformers. */
function mapperContext(platform, element) {
  const channel = platform.store?.getState("editingChannel");
  if (!channel) return null;
  const connectors = [channel.sourceConnector, ...(platform.oie.destinationsOf(channel) || [])].filter(Boolean);
  const matches = [];
  for (const connector of connectors) {
    for (const transformer of [connector.transformer, connector.responseTransformer]) {
      const steps = platform.oie.elementsToArray(transformer?.elements);
      const index = steps.findIndex((s) => s.__type === MAPPER_TYPE && String(s.sequenceNumber) === String(element.sequenceNumber)
        && s.name === element.name && s.profileUrl === element.profileUrl);
      if (index >= 0) matches.push({ channel, connector, transformer, steps, index, response: transformer === connector.responseTransformer });
    }
  }
  return matches.length === 1 ? matches[0] : null;
}

/** Only Bundles declared before this step, in the same connector's transformer. */
function mapperBundleDeclarations(platform, element) {
  const ctx = mapperContext(platform, element);
  return ctx ? ctx.steps.slice(0, ctx.index).filter((s) => s.__type === MAPPER_TYPE && s.action === "createBundle" && asBool(s.enabled, true)) : [];
}

/** A destination tests its own inbound template, which may already contain cleaned source data. */
function mapperSample(platform, element) {
  const ctx = mapperContext(platform, element);
  const message = ctx?.transformer.inboundTemplate || "";
  const inbound = ctx?.transformer.inboundDataType || "HL7V2";
  const dataType = inbound === "FHIR" ? (message.trim().startsWith("{") ? "JSON" : "XML")
    : ["HL7V2", "XML", "JSON", "RAW"].includes(inbound) ? inbound : "RAW";
  const key = ctx ? `fhir-profile-mapper-sample:${ctx.channel.id}:${ctx.connector.metaDataId}:${ctx.response ? "response" : "transformer"}` : "fhir-profile-mapper-sample:unknown";
  return { key, sample: { message, dataType } };
}

function mapperDiagnostic(error) {
  const step = error.step || {};
  const label = [step.name || (step.sequenceNumber ? `Step ${step.sequenceNumber}` : ""), error.phase, error.errorType, error.key,
    error.line ? `line ${error.line}` : ""].filter(Boolean).join(" · ");
  const target = Array.isArray(error.path) ? [step.resourceType || "", ...error.path.map(([name, instance]) => name + (instance === undefined ? "" : `[${instance}]`))].filter(Boolean).join(".") : "";
  const kind = error.operation === "iteration" ? "each" : error.operation === "condition" ? "condition" : error.phase === "translation" ? "translate" : "value";
  return { label, target, kind };
}

function mapperTraceRows(trace) {
  return trace.events.map((event) => ({
    event,
    label: mapperDiagnostic({ ...event, step: trace.step }).label,
    duration: `${(Number(event.durationNanos) / 1000000).toFixed(3)} ms`,
    iterations: (event.iterations || []).map((item) => `rule ${item.ruleIndex}, item ${item.index}`).join(" / ")
  }));
}

function mapperTraceExport(trace) {
  return JSON.stringify(trace, null, 2);
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

function ProfileMapperEditor({ element, onChange, platform }) {
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
      // shown when something below an extension, modifierExtension or id (that "extensions & ids" shows) is mapped
      showAll: [...values.keys(), ...iterations.keys(), ...conditions.keys()].some((k) => /\.(extension|modifierExtension|id)(\[\d+\])?(\.|$)/.test(k)),
      sample,
      activeSample: savedSamples.length ? savedSamples[0].id : null,
      sampleKey: initial.key,
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
      .then((text) => { MAPPER_FUNCTIONS = JSON.parse(text); })
      .catch((error) => { mapperFunctionsRequest = null; throw error; });
    mapperFunctionsRequest.then(() => { if (active) rerender(); }).catch((error) => {
      if (active) { st.error = `Function catalogue: ${errorText(error)}`; rerender(); }
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
  const revealDiagnostic = (error) => {
    const chain = st.rootIndex && makeTree(st.rootIndex, { ...ctx, showAll: true }).chain(error.key);
    if (!chain) {
      st.notice = `The element ${error.key} is not in the loaded profile.`;
    } else {
      st.showAll = true;
      st.filter = "all";
      for (const node of chain.slice(0, -1)) st.expanded.add(node.key);
      st.pendingDiagnostic = { key: error.key, kind: mapperDiagnostic(error).kind };
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
    return h("div", { key: id, style: { color: "#b91c1c", fontSize: "12px", marginBottom: "6px" } },
      h("strong", null, display.label),
      error.key && tree ? h("button", { type: "button", className: "btn btn-sm", style: { marginLeft: "6px" }, onClick: () => revealDiagnostic(error) }, "Go to rule") : null,
      h("div", null, error.message),
      display.target ? h("div", { style: { fontFamily: "monospace" } }, `Target: ${display.target}`) : null,
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
    const rules = mapperRuleIds(compile(makeTree(index, { ...local, showAll: true }), st.values, st.iterations, st.translations, st.conditions), previous);
    // What the editor does not edit yet is kept on the rule it belongs to: its note, and that it is disabled.
    const kept = new Map(previous.filter((rule) => rule.id && (rule.note || rule.disabled)).map((rule) => [rule.id, rule]));
    return JSON.stringify(rules.map((rule) => {
      const before = kept.get(rule.id);
      return before ? { ...rule, ...(before.note ? { note: before.note } : {}), ...(before.disabled ? { disabled: true } : {}) } : rule;
    }));
  };

  const save = () => {
    if (!tree) return;
    element.mappings = compiled(st.rootIndex, ctx);
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
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector(".suggest-widget.visible, .mapper-expression-editing")) return;
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
        st.versionNotice = `The profile is now version ${sdVersion}; these mappings were made with version ${element.profileVersion}. Check them (elements no longer in the profile are listed).`;
      }
      if (sameProfile) {
        st.unresolved = unresolved;
        const before = parseMappings(element.mappings).filter((e) => "fixed" in e).length;
        const now = compiled(index, local);
        if (!unresolved.length && JSON.parse(now).filter((e) => "fixed" in e).length > before) {
          element.mappings = now;
          st.notice = "Fixed values of required elements were added to the mappings.";
          onChange();
        }
      } else {
        for (const key of unresolved) forget(key);
        if (unresolved.length) st.notice = `Not in this profile, removed: ${unresolved.join(", ")}.`;
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
        st.error = `${node.typeUrl}: ${errorText(e)}`;
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
  // The step is sent without its samples: the server does not need them to run one.
  const testOn = async (sample, trace) => {
    try {
      const text = await platform.api.post(`${MAPPER_API}/test`, JSON.stringify({ step: { ...element, samples: "[]" }, message: sample.message, dataType: sample.dataType || "HL7V2", trace }), {
        contentType: "text/plain",
        raw: true,
        timeoutMs: 60000
      });
      return JSON.parse(text);
    } catch (e) {
      const message = errorText(e);
      return { output: null, issues: [], errors: [{ key: null, line: null, message: e?.status === 403 || /Test FHIR mapper steps/.test(message)
        ? "Testing a step runs its code on the server, like a deployed channel: it requires the permission “Test FHIR mapper steps”."
        : message }] };
    }
  };
  const runTest = async () => {
    st.testing = true;
    st.testResult = null;
    st.suite = null;
    rerender();
    st.testResult = await testOn(st.sample, st.traceOptions);
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
    if (chosen) st.sample = { message: chosen.message, dataType: chosen.dataType || "HL7V2" };
    st.testResult = null;
    rerender();
  };
  const saveAsSample = async () => {
    const ask = platform.ui?.promptDialog;
    const name = ask ? await ask("Save the sample with the step", "Name", `Sample ${samples.length + 1}`) : `Sample ${samples.length + 1}`;
    if (!name || !String(name).trim()) return;
    const id = crypto.randomUUID();
    st.activeSample = id;
    writeSamples([...samples, { id, name: String(name).trim(), dataType: st.sample.dataType, message: st.sample.message, expected: null }]);
  };
  const runAllSamples = async () => {
    st.testing = true;
    st.suite = [];
    st.testResult = null;
    rerender();
    for (const sample of samples) {
      const result = await testOn(sample, { enabled: false });
      const verdict = sampleVerdict(sample, result);
      const invalid = result.issues.some((i) => i.severity === "error" || i.severity === "fatal");
      st.suite.push({ id: sample.id, name: sample.name, ok: !result.errors.length && !invalid && verdict !== false,
        detail: result.errors.length ? result.errors[0].message : invalid ? "invalid FHIR result" : verdict === false ? "differs from the expected result" : verdict === true ? "matches the expected result" : "runs (no expected result)" });
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
      test.result = match ? `→ ${[match.system, match.code].filter(Boolean).join("|")}${match.display ? ` (${match.display})` : ""}` : "→ no match (then the rule chosen for no match)";
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
    if (error.key) errorsByKey.set(error.key, [...(errorsByKey.get(error.key) || []), error.message]);
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
  // A search looks in the loaded tree, a few levels below each node.
  const matches = (node, depth = 0) => node.key.toLowerCase().includes(term)
    || (depth < 4 && (tree.children(node) || []).some((child) => matches(child, depth + 1)));
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
    if (opened(child)) addRows(child);
  };
  const addRows = (node) => {
    const list = tree.children(node);
    if (list === null) {
      rows.push(h("tr", { key: node.key + "/loading" }, h("td", { colSpan: 3, style: { paddingLeft: `${(node.depth + 1) * 20 + 26}px` } }, guides(node, true), h("span", { className: "text-text-faint" }, "Loading…"))));
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
    const placeholder = node.fixed ? `${node.fixed.kind}: ${fixedText(node.fixed)}` : node.choice ? "choose a type below"
      : node.binding ? `${node.binding.strength} binding: ${node.binding.valueSet.replace(/\|.*$/, "").split("/").pop()}` : "";
    const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
    const tool = (label, title, onClick, active) =>
      h("button", { type: "button", className: "btn btn-sm", style: { flex: "none", padding: "0 6px", fontWeight: active ? 700 : 400, borderColor: active ? "#2563eb" : undefined }, title, disabled: blocked, onClick }, label);
    // Fixed column widths (see the table): the element and type are cut with an ellipsis, the
    // mapping keeps its room, and the actions sit next to it, where they cannot push it away.
    return h(
      "tr",
      { key: node.key, className: [open ? "mapper-node-open" : "", errorsByKey.has(node.key) ? "mapper-node-error" : ""].filter(Boolean).join(" ") || undefined, "data-depth": node.depth, ref: diagnosticRef(node.key, "value"),
        title: errorsByKey.has(node.key) ? `${node.key}: ${errorsByKey.get(node.key).join(" · ")}` : node.short ? `${node.key}: ${node.short}` : node.key },
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
              "aria-label": `${open ? "Collapse" : "Expand"} ${node.key}`,
              style: { flex: "none", visibility: canExpand ? "visible" : "hidden", minWidth: "22px", padding: "0 4px" },
              onClick: () => toggle(node)
            },
            open ? "▾" : "▸"
          ),
          h("span", { className: "mapper-node-label", style: { ...ellipsis, minWidth: 0, fontWeight: node.mustSupport || open ? 600 : 400 } }, node.label + (node.instance ? ` [${node.instance}]` : "")),
          h("span", { className: "text-text-faint", style: { flex: "none", fontSize: "11px" } }, `${node.min ?? 0}..${node.max ?? "*"}`),
          node.mustSupport ? h("span", { title: "Must Support", style: { flex: "none", color: "#c2410c", fontSize: "11px" } }, "S") : null,
          h("a", { className: "mapper-help", href: mapperHelpUrl(version, element.resourceType, node.key), target: "_blank", rel: "noopener noreferrer",
            title: "Official FHIR definition", "aria-label": `FHIR help for ${node.key}` }, "?")
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
          canAdd ? tool("+", "Add an entry", () => addInstance(node), false) : null,
          node.instance && node.instance === count - 1 ? tool("−", "Remove this entry and its mappings", () => removeInstance(node), false) : null,
          canIterate ? tool("↻", "One entry for each item of a list (for each repetition)", () => toggleIteration(node), iterated) : null,
          canTranslate ? tool("⇄", "Translate the value with ConceptMap/$translate", () => toggleTranslation(node), st.translations.has(node.key)) : null,
          node.choice ? null : tool("?", "Only map this element (and what is below it) when a condition holds", () => toggleCondition(node), st.conditions.has(node.key))
        )
      )
    );
  };

  const subRow = (node, suffix, children) =>
    h("tr", { key: `${node.key}/${suffix}`, ref: diagnosticRef(node.key, suffix), "data-owner": node.key }, h("td", { colSpan: 3, style: { paddingLeft: `${node.depth * 20 + 34}px` } }, guides(node, true), h("div", { style: { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" } }, children)));
  const mono = { fontFamily: "monospace", fontSize: "12px" };

  const iterationRow = (node) => {
    const it = st.iterations.get(node.key);
    const variable = (it.variable || "item").trim() || "item";
    return subRow(node, "each", [
      h("span", { key: "l", title: node === tree.root ? "One resource for each item" : "One entry of this element for each item" }, node === tree.root ? "↻ One resource for each" : "↻ For each"),
      h(ExpressionField, { key: "e", completionContext: completionFor(node, "iteration"), value: it.expression, disabled: blocked, placeholder: "msg['PID']['PID.3']", style: { ...mono, flex: "1 1 240px" }, onChange: (e) => setIteration(node, "expression", e.target.value) }),
      h("span", { key: "a" }, "as"),
      h("input", { key: "v", type: "text", value: it.variable, disabled: blocked, style: { ...mono, width: "90px" }, onChange: (e) => setIteration(node, "variable", e.target.value) }),
      h("span", { key: "h", className: "text-text-faint", style: { fontSize: "11px" } }, `below: ${variable} (the item), ${variable}Index (0, 1, …); fields dragged in are rewritten to ${variable}[…]`)
    ]);
  };

  const conditionRow = (node) =>
    subRow(node, "condition", [
      h("span", { key: "l", title: "What is below this element is only mapped when the condition holds" }, node === tree.root ? "? Only make the resource if" : "? Only if"),
      h(ExpressionField, {
        completionContext: completionFor(node, "condition"),
        key: "c",
        type: "text",
        value: st.conditions.get(node.key) || "",
        disabled: blocked,
        placeholder: st.iterations.has(node.key) ? `${(st.iterations.get(node.key).variable || "item").trim()}['PID.3.5'].toString() == 'PI'` : "msg['PID']['PID.8']['PID.8.1'].toString() != ''",
        style: { ...mono, flex: "1 1 300px" },
        onChange: (e) => setCondition(node, withSubstitution(node, st.conditions.get(node.key) || "", e.target.value))
      }),
      h("span", { key: "h", className: "text-text-faint", style: { fontSize: "11px" } }, st.iterations.has(node.key) ? "per item: keeps the items it holds for" : "false, or an error on a missing segment: nothing below")
    ]);

  const translationRow = (node) => {
    const t = st.translations.get(node.key);
    const test = st.tests.get(node.key) || {};
    const maps = (st.conceptMaps && st.conceptMaps.list) || [];
    const listId = "fhir-profile-mapper-conceptmaps";
    const localTx = isLocalServer(txServer);
    const needsValue = t.unmapped === "fixed" || t.unmapped === "function";
    return subRow(node, "translate", [
      h("span", { key: "l", title: localTx ? "ConceptMap/$translate locally, on the ConceptMaps of the Profile Packages" : "ConceptMap/$translate on the terminology server" }, localTx ? "⇄ ConceptMap (local)" : "⇄ ConceptMap"),
      h("input", {
        key: "m",
        type: "text",
        list: listId,
        value: t.conceptMap,
        disabled: blocked,
        placeholder: "canonical URL of the ConceptMap",
        style: { ...mono, flex: "1 1 220px" },
        onFocus: loadConceptMaps,
        onChange: (e) => setTranslation(node, "conceptMap", e.target.value)
      }),
      h("datalist", { key: "d", id: listId }, maps.map((m) => h("option", { key: m.url, value: m.url }, m.title || m.name || m.url))),
      h("input", { key: "s", type: "text", value: t.source, disabled: blocked, placeholder: "source system (optional)", title: "system of the source code", style: { ...mono, flex: "1 1 160px" }, onChange: (e) => setTranslation(node, "source", e.target.value) }),
      h("input", { key: "t", type: "text", value: t.target, disabled: blocked, placeholder: "target system (optional)", title: "targetsystem of $translate", style: { ...mono, flex: "1 1 140px" }, onChange: (e) => setTranslation(node, "target", e.target.value) }),
      h(
        "select",
        { key: "u", value: t.unmapped || "none", disabled: blocked, title: "When $translate gives no match", onChange: (e) => setTranslation(node, "unmapped", e.target.value) },
        h("option", { value: "none" }, "no match: leave empty"),
        h("option", { value: "source" }, "no match: keep the source code"),
        h("option", { value: "fixed" }, "no match: fixed value"),
        h("option", { value: "function" }, "no match: expression"),
        h("option", { value: "error" }, "no match: error")
      ),
      node.code === "CodeableConcept"
        ? h(
            "label",
            { key: "k", className: "check", title: "Add the source code as a second coding" },
            h("input", { type: "checkbox", checked: !!t.keepSource, disabled: blocked, onChange: (e) => setTranslation(node, "keepSource", e.target.checked) }),
            " + source coding"
          )
        : null,
      needsValue
        ? h(t.unmapped === "function" ? ExpressionField : "input", {
            completionContext: t.unmapped === "function" ? completionFor(node, "translation") : undefined,
            key: "f",
            type: "text",
            value: t.value || "",
            disabled: blocked,
            placeholder: t.unmapped === "fixed" ? "code or system|code" : "myFunction(code, system)",
            title:
              t.unmapped === "fixed"
                ? "The value for codes without a match: a code, or system|code"
                : "JavaScript with code and system (the source code and its system), e.g. a code template function; gives a code, system|code or {system, code, display}, or null for no value",
            style: { ...mono, flex: "1 1 180px" },
            onChange: (e) => setTranslation(node, "value", e.target.value)
          })
        : null,
      h("input", {
        key: "c",
        type: "text",
        value: test.code || "",
        placeholder: "code",
        title: "a source code to try",
        style: { ...mono, width: "70px" },
        onChange: (e) => {
          st.tests.set(node.key, { ...test, code: e.target.value });
          rerender();
        }
      }),
      h("button", { key: "b", type: "button", className: "btn btn-sm", disabled: !t.conceptMap || !test.code, onClick: () => testTranslation(node) }, "Test"),
      test.result ? h("span", { key: "r", className: "text-text-faint", style: { fontSize: "11px" } }, test.result) : null
    ]);
  };
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
      h("button", { type: "button", className: "btn btn-sm", style: { marginLeft: "6px", padding: "0 6px", fontWeight: active ? 700 : 400, borderColor: active ? "#2563eb" : undefined }, title, disabled: blocked, onClick }, label);
    rows.push(
      h(
        "tr",
        { key: tree.root.key, ref: diagnosticRef(tree.root.key, "value") },
        h(
          "td",
          { colSpan: 3 },
          h("strong", null, tree.root.label),
          h("span", { className: "text-text-faint", style: { marginLeft: "8px" } }, st.rootIndex.sd.url + (st.rootIndex.sd.version ? ` | ${st.rootIndex.sd.version}` : "")),
          bundle && !createBundle ? rootTool("↻", "One resource for each item of a list (e.g. each OBX)", () => toggleIteration(tree.root), st.iterations.has(tree.root.key)) : null,
          rootTool("?", "Only make the resource when a condition holds", () => toggleCondition(tree.root), st.conditions.has(tree.root.key))
        )
      )
    );
    if (st.iterations.has(tree.root.key)) rows.push(iterationRow(tree.root));
    if (st.conditions.has(tree.root.key)) rows.push(conditionRow(tree.root));
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
      const toggleButton = row.querySelector("button[aria-expanded]");
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
      h("summary", { style: { cursor: "pointer" } }, `Sample fields (${fields.length})`,
        h("span", { className: "hint text-text-faint", style: { marginLeft: "8px", fontSize: "11px" } }, "values of the sample message of the Test tab — click to insert into the field being edited, or drag onto a field")),
      st.sourceOpen ? h("div", null,
        h("input", { type: "search", value: st.sourceFilter || "", placeholder: "Filter fields and values…", "aria-label": "Filter sample fields", style: { width: "260px", margin: "6px 0", height: "26px", minHeight: "26px", padding: "2px 8px" },
          onChange: (e) => { st.sourceFilter = e.target.value; rerender(); } }),
        fields.length ? h("div", { className: "border border-line rounded", style: { maxHeight: "220px", overflow: "auto" } },
          h("table", { className: "dt", style: { width: "100%", tableLayout: "fixed" } }, h("tbody", null, shown.map((f) =>
            h("tr", { key: f.path, draggable: true, style: { cursor: "grab" }, title: accessor(f),
              onDragStart: (e) => { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", accessor(f)); e.dataTransfer.setData("application/x-oie-accessor", accessor(f)); },
              onMouseDown: (e) => { if (activeExpressionEditor) e.preventDefault(); },
              onClick: () => { if (activeExpressionEditor) activeExpressionEditor.insert(accessor(f)); else navigator.clipboard?.writeText(accessor(f)).then(() => platform.ui?.toast?.("Path copied: click a field first to insert it directly.", "info"), () => {}); } },
              h("td", { style: { fontFamily: "monospace", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "60%" } }, f.path.replace(/^msg/, "")),
              h("td", { style: { fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, f.value))))))
          : h("div", { className: "hint" }, "No field: paste a sample message in the Test tab (HL7 v2 is read by the server).")) : null);
  };
  const check = tree ? completeness(tree, parseMappings(element.mappings)) : { required: [], mustSupport: [] };
  // A Bundle step sets its type; its entries come from the resource steps that select it.
  const entryKey = (k) => k === "Bundle.entry" || k.startsWith("Bundle.entry.") || k.startsWith("Bundle.entry:");
  if (createBundle) {
    check.required = check.required.filter((k) => k !== "Bundle.type" && !entryKey(k));
    check.mustSupport = check.mustSupport.filter((k) => !entryKey(k));
  }
  const entryNote = createBundle && tree
    ? h("div", { className: "hint", style: { marginTop: "6px" } }, "Bundle.entry is filled by the resource steps that select this Bundle in “Add to Bundles”.")
    : null;
  const testResult = st.testResult;

  const profileOptions = (st.profileList || []).map((p) => h("option", { key: p.url, value: p.url }, `${p.title || p.name || p.url} (${p.type})`));

  const propertiesPanel = h(
    React.Fragment,
    null,
    h(
      "div",
      { className: "mapper-settings" },
      field("Action", h("select", {
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
      h("option", { value: "createBundle" }, "Create a Bundle"), h("option", { value: "resource" }, "Build a resource")),
      "Bundles are named and created explicitly; results are completed after the last FHIR mapper."),
      createBundle ? field("Bundle Name", text("bundleName", "labo"), "Internal name used by resource steps; separate from the FHIR id and profile URL.") : null,
      h("div", { className: "mapper-wide" }, field("FHIR context",
        h("select", { value: element.context || "", "aria-label": "FHIR context", onChange: (e) => setContext(e.target.value) },
          h("option", { value: "" }, "(none: this step's own packages and terminology server)"),
          (cachedFhirSettings()?.contexts || []).map((c) => h("option", { key: c.name, value: c.name }, `${c.name} — ${c.fhirVersion}, ${(c.packages || []).join("; ") || "no package"}`)),
          element.context && !shared && st.settingsReady ? h("option", { value: element.context }, `${element.context} (not defined on this server)`) : null),
        shared ? `Packages: ${(shared.packages || []).join("; ") || "none"} · terminology: ${shared.terminologyServer || "local"} · validation: ${shared.validation}. Defined in Settings › FHIR Mapper.`
          : "A context of Settings › FHIR Mapper gives the packages, the terminology server and the validation policy to every step that names it.")),
      field(
        "FHIR Version",
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
      shared ? null : field("Profile Packages", text("profiles", "/profiles"), "Server-side profile files or folders, separated by ';'."),
      h(
        "div",
        { className: "mapper-wide" },
        field(
          "Target Profile",
          h(
            "div",
            { className: "mapper-actions" },
            h("input", {
              type: "text",
              list: "fhir-profile-mapper-profiles",
              placeholder: "Canonical URL of the profile, or a resource type (Patient)",
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
            h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !element.profileUrl, onClick: () => load(element.profileUrl.trim()) }, st.loading ? "Loading…" : "Load"),
            h("button", { type: "button", className: "btn btn-sm", disabled: !profiles, onClick: loadProfileList }, "List profiles")
          ),
          "Loading another profile keeps the mappings of the elements it also has."
        )
      ),
      shared ? null : h(
        "div",
        { className: "mapper-wide" },
        field(
          "Terminology Server",
          text("terminologyServer", "n/a"),
          "Empty or n/a: translate locally using Profile Packages. Otherwise, enter the terminology server URL as reached by OIE."
        )
      ),
      shared ? null : h(
        "details",
        { className: "mapper-wide" },
        h("summary", { className: "text-text-faint", style: { cursor: "pointer", fontSize: "12px" } }, "Terminology server options"),
        h(
          "div",
          { className: "mapper-settings", style: { marginTop: "8px" } },
          h("div", { className: "mapper-wide" }, field("Authorization", text("terminologyAuthorization", "'Bearer ' + $cfg('tx.token')", true), "JavaScript expression of the Authorization header; empty for none.")),
          field("Cache (seconds)", number("terminologyCacheSeconds", 300), "How long answers of the server are reused; 0 for not at all."),
          field("Timeout (seconds)", number("terminologyTimeoutSeconds", 10), "How long to wait for the server.")
        )
      ),
      h(React.Fragment, null,
        createBundle ? field("Bundle Type", h("select", {
          value: element.bundleType || "transaction",
          disabled: !!st.rootIndex?.byId.get("Bundle.type")?.fixedCode,
          onChange: (e) => { element.bundleType = e.target.value; onChange(); rerender(); }
        }, ["transaction", "batch", "collection", "document", "message"].map((v) => h("option", { key: v, value: v }, v))),
        "Defines the Bundle and its entry rules. A fixed type in the target profile takes precedence.") : null,
        createBundle || !bundle ? field("Result destination", h("select", {
          value: element.variable ? "variable" : "message",
          onChange: (e) => { element.variable = e.target.value === "variable" ? (element.bundleName ? `bundle_${element.bundleName}` : "resourceResult") : ""; onChange(); rerender(); }
        }, h("option", { value: "message" }, "Outbound message"), h("option", { value: "variable" }, "Channel map variable")),
        createBundle ? "The completed Bundle is published here after the configured checks of all named Bundles." : "Destination of this standalone resource.") : null,
        (createBundle || !bundle) && element.variable ? field("Variable name", text("variable", "bundleDocument"), "FHIR JSON in the channel map; use it from another destination.") : null,
        !createBundle ? h("section", { className: "mapper-wide bundle-routing", "aria-label": "Add to Bundles" },
          h("div", { className: "bundle-routing-title" }, "Add to Bundles"),
          h("div", { className: "hint" }, "Build this resource once, then add the same resource to each selected Bundle. Leave all unchecked for a standalone result."),
          targets.length ? field("Reference Name", text("refName", "'patient'", true), "Common to the selected Bundles. fhirRef(name) must resolve to the same resource in these Bundles.") : null,
          !declarations.length && !targets.length ? h("div", { className: "hint", style: { marginTop: "8px" } }, "Create a Bundle earlier in this transformer to select it here.") : null,
          [...declarations, ...targets.filter((t) => !declarations.some((b) => b.bundleName === t.name)).map((t) => ({ bundleName: t.name }))].map((b) => {
            const target = targets.find((t) => t.name === b.bundleName);
            const request = target && ["transaction", "batch"].includes(b.bundleType);
            return h("div", { key: b.bundleName, className: "bundle-target", "data-bundle": b.bundleName },
              h("label", { className: "bundle-choice" }, h("input", { type: "checkbox", checked: !!target, onChange: (e) => updateTarget(b.bundleName, e.target.checked ? { requestMethod: "POST", requestUrl: "", ifNoneExist: "" } : null) }),
                b.bundleName, h("span", { className: "hint" }, b.bundleType || "not declared earlier")),
              b.name ? h("div", { className: "hint" }, `Created by step “${b.name}”.`) : null,
              request ? h("div", { className: "bundle-request" },
                field("Method", h("select", { value: target.requestMethod || "POST", onChange: (e) => updateTarget(b.bundleName, { requestMethod: e.target.value }) },
                  ["POST", "PUT", "PATCH", "DELETE", "GET", "HEAD"].map((v) => h("option", { key: v, value: v }, v)))),
                field("Request URL", h(ExpressionField, { completionContext: completionFor(tree?.root, "reference"), value: target.requestUrl || "", placeholder: "Empty: the resource type or type/id", onChange: (e) => updateTarget(b.bundleName, { requestUrl: e.target.value }), style: mono }))) : null,
              request && (!target.requestMethod || target.requestMethod === "POST") ? field("If-None-Exist", h(ExpressionField, { completionContext: completionFor(tree?.root, "reference"), value: target.ifNoneExist || "", placeholder: "'identifier=' + ...", onChange: (e) => updateTarget(b.bundleName, { ifNoneExist: e.target.value }), style: mono }), "Conditional creation for this Bundle entry.") : null,
              target && !request ? h("div", { className: "hint", style: { marginTop: "8px" } }, b.bundleType ? `No request for a ${b.bundleType} Bundle.` : "This Bundle must be created earlier in the transformer.") : null
            );
          })
        ) : null
      ),
      h(
        "div",
        { className: "mapper-wide" },
        field(
          "Options",
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
              " Add the profile to meta.profile"
            ),
            h("label", { className: "check" },
              bundle && !createBundle ? "Validate this preview " : "Validate FHIR output ",
              h("select", { "aria-label": "Validation", style: { width: "auto" },
                value: element.validation || (asBool(element.validateOutput, true) ? "always" : "off"),
                onChange: (e) => { element.validation = e.target.value; element.validateOutput = e.target.value !== "off"; element.formatVersion = 2; onChange(); rerender(); } },
                element.context ? h("option", { value: "inherit" }, `as the context says${shared ? ` (${shared.validation})` : ""}`) : null,
                h("option", { value: "always" }, "always"), h("option", { value: "off" }, "off")),
              bundle && !createBundle ? " (final validation is set on each Bundle)" : null
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
              " Set meta.lastUpdated"
            )
          )
        )
      ),
      h(
        "div",
        { className: "mapper-wide" },
        field(
          "Trace",
          h("div", { className: "mapper-checks" },
            h("label", { className: "check" },
              h("input", { type: "checkbox", checked: asBool(element.traceMessages, false),
                onChange: (e) => { element.traceMessages = e.target.checked; if (!e.target.checked) element.traceCaptureValues = false; onChange(); rerender(); } }),
              " Trace processed messages"),
            h("label", { className: "check", title: "Also record the scalar values of this step's rules (256 characters per value). They may contain patient data." },
              h("input", { type: "checkbox", checked: asBool(element.traceCaptureValues, false), disabled: !asBool(element.traceMessages, false),
                onChange: (e) => { element.traceCaptureValues = e.target.checked; onChange(); rerender(); } }),
              " Include scalar values")),
          "Each message processed by the deployed channel keeps this step's events, and the finalization of its Bundles, in the connector map (fhirMapperTrace). Off by default; redeploy to apply."
        )
      )
    ),
    h("details", { style: { marginTop: "10px" } },
      h("summary", { style: { cursor: "pointer" } }, "Edit as JSON"),
      h("div", { className: "hint", style: { margin: "6px 0" } }, "The whole step — properties and rules — as text: copy it to another step or channel, paste a mapping written by hand or by an AI agent, or make bulk edits. Validate and apply compiles it on the server first."),
      h("div", { className: "mapper-actions" },
        h("button", { type: "button", className: "btn btn-sm", onClick: () => { st.jsonDraft = JSON.stringify(element, null, 2); rerender(); } }, "Read current step"),
        h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !st.jsonDraft.trim(), onClick: async () => {
          try {
            const next = mapperJsonImport(element, st.jsonDraft);
            const result = JSON.parse(await platform.api.post(`${MAPPER_API}/script`, JSON.stringify(next), { contentType: "text/plain", raw: true }));
            if (result.errors?.length) throw new Error(result.errors.map((e) => e.message).join("\n"));
            Object.assign(element, next);
            state.current = null;
            onChange(); rerender();
          } catch (error) { st.error = errorText(error); rerender(); }
        } }, "Validate and apply")),
      h(CodeBox, { value: st.jsonDraft, language: "json", height: "260px", label: "Step mapping JSON",
        onChange: (text) => { if (text !== st.jsonDraft) { st.jsonDraft = text; rerender(); } } }),
      h("div", { className: "hint" }, "Applies to this step only; its OIE sequence and enabled state are preserved. Save the channel to persist changes."))
  );
  const messages = h(
    React.Fragment,
    null,
    st.error ? h("div", { className: "hint", style: { color: "#b91c1c", marginTop: "6px" } }, st.error) : null,
    st.notice ? h("div", { className: "hint", style: { color: "#b45309", marginTop: "6px" } }, st.notice) : null,
    st.versionNotice
      ? h(
          "div",
          { className: "hint", style: { color: "#b45309", marginTop: "6px" } },
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
            "Checked"
          )
        )
      : null,
    st.unresolved.length
      ? h(
          "div",
          { className: "hint", style: { color: "#b45309", marginTop: "6px" } },
          `Cannot find these mapped elements in the profile (editing is blocked so they are not lost): ${st.unresolved.join(", ")}. `,
          h("button", { type: "button", className: "btn btn-sm", onClick: removeUnresolved }, "Remove these mappings")
        )
      : null
  );
  const mapperPanel = tree
      ? h(
          "div",
          null,
          h(
            "div",
            { className: "mapper-toolbar" },
            h("span", { className: "text-text-faint" }, "Show"),
            h(
              "select",
              {
                value: st.filter,
                onChange: (e) => {
                  st.filter = e.target.value;
                  rerender();
                }
              },
              h("option", { value: "all" }, "All elements"),
              h("option", { value: "mustSupport" }, "Must Support and required"),
              h("option", { value: "mapped" }, "Mapped only")
            ),
            h(
              "label",
              { className: "check", title: "Also show extension, modifierExtension and id of every element (to add an extension the profile does not have)" },
              h("input", {
                type: "checkbox",
                checked: st.showAll,
                onChange: (e) => {
                  st.showAll = e.target.checked;
                  rerender();
                }
              }),
              " extensions & ids"
            ),
            h("input", { type: "search", value: st.search || "", placeholder: "Search elements…", "aria-label": "Search elements", style: { width: "180px", flex: "none", height: "26px", minHeight: "26px", padding: "2px 8px" },
              onChange: (e) => { st.search = e.target.value; rerender(); } }),
            h("button", { type: "button", className: "btn btn-sm", title: "Expand the mapped elements", onClick: () => {
              for (const key of allKeys()) { const parts = key.split("."); for (let i = 1; i < parts.length; i++) st.expanded.add(parts.slice(0, i).join(".")); }
              rerender(); } }, "Expand mapped"),
            h("button", { type: "button", className: "btn btn-sm", title: "Collapse every element", onClick: () => { st.expanded = new Set([tree.root.key]); rerender(); } }, "Collapse all"),
            h("button", { type: "button", className: "btn btn-sm", title: "Undo the last change of the mappings", disabled: !(st.undo || []).length || blocked, onClick: () => travel(st.undo, st.redo) }, "↶ Undo"),
            h("button", { type: "button", className: "btn btn-sm", title: "Redo", disabled: !(st.redo || []).length || blocked, onClick: () => travel(st.redo, st.undo) }, "↷ Redo"),
            h("span", { className: "hint text-text-faint", style: { fontSize: "11px" } }, `Click a field to edit it with completion. ${COMPLETION_HINT}: functions, scoped variables and sample paths. ↑/↓ to choose, Enter/Tab to insert, Esc to close. Guard optional values.`)
          ),
          sourcePane(),
          h(
            "div",
            { className: "dt-wrap border border-line rounded", style: { maxHeight: "none", overflowX: "auto", overflowY: "visible" }, onKeyDownCapture: treeKeys },
            h(
              "table",
              { className: "dt mapper-tree", style: { tableLayout: "fixed", width: "100%", minWidth: "720px" } },
              h("colgroup", null, h("col", { style: { width: "36%" } }), h("col", { style: { width: "14%" } }), h("col", { style: { width: "50%" } })),
              h("thead", null, h("tr", null, h("th", null, "Element"), h("th", null, "Type"), h("th", null, "Mapping"))),
              rowGroups
            )
          ),
          check.required.length || check.mustSupport.length
            ? h(
                "div",
                { className: "hint", style: { marginTop: "6px" } },
                check.required.length ? h("div", { style: { color: "#b91c1c" } }, `Required, not mapped: ${check.required.join(", ")}`) : null,
                check.mustSupport.length ? h("div", { style: { color: "#b45309" } }, `Must Support, not mapped: ${check.mustSupport.join(", ")}`) : null
              )
            : h("div", { className: "hint", style: { marginTop: "6px", color: "#15803d" } }, "Every required element below the mapped ones has a mapping or a fixed value."),
          entryNote
        )
      : h("div", { className: "hint" }, st.loading ? "Loading the target profile…" : "Load a target profile in Properties to map its elements.");
  const testPanel = tree
      ? h(
            "div",
            null,
            h(
              "div",
              { style: { display: "flex", gap: "6px", alignItems: "center", margin: "6px 0" } },
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
              h("select", { style: { width: "auto", flex: "none", maxWidth: "260px" }, value: activeSample ? activeSample.id : "", "aria-label": "Sample", title: "Samples saved with the step",
                onChange: (e) => selectSample(e.target.value) },
                h("option", { value: "" }, "(unsaved sample, this browser)"),
                samples.map((s) => h("option", { key: s.id, value: s.id }, s.name + (s.expected ? " ✓" : "")))),
              h("button", { type: "button", className: "btn btn-sm", disabled: st.testing || !st.sample.message.trim(), onClick: runTest }, st.testing ? "Running…" : "Run"),
              !activeSample ? h("button", { type: "button", className: "btn btn-sm", disabled: !st.sample.message.trim(), title: "Keep this message in the step, so it is saved with the channel", onClick: saveAsSample }, "Save as sample") : null,
              activeSample ? h("button", { type: "button", className: "btn btn-sm", title: "Remove this sample from the step", onClick: () => { st.activeSample = null; writeSamples(samples.filter((s) => s.id !== activeSample.id)); } }, "Delete sample") : null,
              samples.length ? h("button", { type: "button", className: "btn btn-sm", disabled: st.testing, title: "Run every saved sample and compare with its expected result", onClick: runAllSamples }, `Run all (${samples.length})`) : null,
              h("button", { type: "button", className: "btn btn-sm", onClick: showScript }, st.scriptResult ? "Hide the script" : "Generated script"),
              h("span", { className: "text-text-faint", style: { fontSize: "11px" } }, "Runs this step on the server and validates what it makes; fhirRef() of earlier steps gives stand-ins.")
            ),
            h("div", { style: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "6px" } },
              h("label", null, h("input", { type: "checkbox", checked: st.traceOptions.enabled,
                onChange: (e) => { st.traceOptions.enabled = e.target.checked; if (!e.target.checked) st.traceOptions.captureValues = false; rerender(); } }), " Trace"),
              h("label", { title: "Explicitly include scalar values in the trace and its JSON export (256 characters per value)." },
                h("input", { type: "checkbox", checked: st.traceOptions.captureValues, disabled: !st.traceOptions.enabled,
                  onChange: (e) => { st.traceOptions.captureValues = e.target.checked; rerender(); } }), " Include scalar values"),
              h("label", null, "Max events ", h("input", { type: "number", min: 1, max: 1000, value: st.traceOptions.maxEvents,
                disabled: !st.traceOptions.enabled, style: { width: "80px" },
                onChange: (e) => { st.traceOptions.maxEvents = Number(e.target.value); rerender(); } }))
            ),
            h(CodeBox, {
              value: st.sample.message, language: languageOf(st.sample.dataType), height: "170px", label: "Sample message",
              onChange: (text) => {
                if (text === st.sample.message) return;
                st.sample.message = text;
                if (activeSample) updateActive({ message: text }); else saveSample();
                rerender();
              }
            }),
            st.suite ? h("table", { className: "dt", style: { margin: "8px 0", width: "100%" }, "aria-label": "Results of the saved samples" },
              h("tbody", null, st.suite.map((r) => h("tr", { key: r.id, style: { cursor: "pointer" }, onClick: () => selectSample(r.id) },
                h("td", { style: { width: "70px", color: r.ok ? "#15803d" : "#b91c1c", fontWeight: 600 } }, r.ok ? "passed" : "failed"),
                h("td", null, r.name), h("td", { className: "text-text-faint" }, r.detail))))) : null,
            testResult
              ? h(
                  "div",
                  { style: { marginTop: "6px" } },
                  testResult.errors.map((e, i) => diagnosticView(e, `e${i}`)),
                  testResult.trace ? h("details", { style: { marginTop: "8px" } },
                    h("summary", { style: { cursor: "pointer" } },
                      `Execution trace: ${testResult.trace.events.length} event(s)${testResult.trace.truncated ? " — truncated" : ""}`),
                    h("button", { type: "button", className: "btn btn-sm", onClick: () => downloadMapperTrace(testResult.trace) }, "Export trace JSON"),
                    h("div", { className: "hint" }, testResult.trace.captureValues ? "Scalar values included." : "Runtime values not captured."),
                    h("ol", { style: { maxHeight: "360px", overflow: "auto", fontSize: "12px" } },
                      mapperTraceRows(testResult.trace).map(({ event, label, duration, iterations }, index) =>
                        h("li", { key: index, style: { margin: "6px 0" } },
                          h("strong", null, `${label} · ${event.status}`),
                          h("span", { style: { marginLeft: "6px" } }, duration),
                          event.key && tree ? h("button", { type: "button", className: "btn btn-sm", onClick: () => revealDiagnostic(event) }, "Go to rule") : null,
                          iterations ? h("div", null, iterations) : null,
                          event.reason ? h("div", null, event.reason) : null,
                          event.count !== undefined ? h("div", null, `${event.count} item(s)`) : null,
                          event.value ? h("pre", { style: { whiteSpace: "pre-wrap", margin: "4px 0" } }, JSON.stringify(event.value)) : null)))
                    ) : null,
                  testResult.output !== null && testResult.output !== undefined
                    ? h(
                        "div",
                        null,
                        h(
                          "div",
                          { style: { fontSize: "12px", margin: "4px 0", color: testResult.issues.some((i) => i.severity === "error" || i.severity === "fatal") ? "#b91c1c" : "#15803d" } },
                          testResult.validationPerformed === false ? "FHIR validation disabled." : (testResult.issues.length ? `${testResult.issues.length} validation issue(s):` : "Valid.")
                        ),
                        testResult.issues.map((i, n) => h("div", { key: `i${n}`, style: { fontSize: "11px", fontFamily: "monospace" } }, `${i.severity} ${i.location}: ${i.message}`)),
                        activeSample ? h("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", margin: "6px 0" } },
                          sampleVerdict(activeSample, testResult) === true ? h("strong", { style: { color: "#15803d" } }, "Matches the expected result.") : null,
                          sampleVerdict(activeSample, testResult) === false ? h("strong", { style: { color: "#b91c1c" } }, "Differs from the expected result.") : null,
                          h("button", { type: "button", className: "btn btn-sm", title: "Random identities (urn:uuid) and meta.lastUpdated are ignored when comparing", onClick: () => updateActive({ expected: testResult.output }) },
                            activeSample.expected ? "Replace the expected result with this one" : "Use this result as expected"),
                          activeSample.expected ? h("button", { type: "button", className: "btn btn-sm", onClick: () => updateActive({ expected: null }) }, "Clear the expected result") : null) : null,
                        activeSample && sampleVerdict(activeSample, testResult) === false
                          ? h(ResultDiff, { expected: normalizeResult(activeSample.expected), actual: normalizeResult(testResult.output) }) : null,
                        h(CodeBox, { value: prettyJson(testResult.output), language: String(testResult.output).trim().startsWith("<") ? "xml" : "json", readOnly: true, height: "360px", label: "Result" })
                      )
                    : null
                )
              : null,
            st.scriptResult
              ? h(
                  "div",
                  { style: { marginTop: "6px" } },
                  st.scriptResult.errors.map((e, i) => diagnosticView(e, `s${i}`)),
                  h(CodeBox, { value: st.scriptResult.script || "", language: "javascript", readOnly: true, height: "360px", label: "Generated script" })
                )
              : null
          )
      : h("div", { className: "hint" }, st.loading ? "Loading the target profile…" : "Load a target profile in Properties to test this step.");

  const tabs = [
    { id: "properties", label: "Properties", panel: propertiesPanel },
    { id: "mapper", label: "Mapper", panel: mapperPanel,
      badge: check.required.length ? { text: String(check.required.length), title: `${check.required.length} required element(s) not mapped` } : null },
    { id: "test", label: "Test", panel: testPanel,
      badge: testResult?.errors?.length ? { text: "!", title: "The last test failed" } : null }
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
    { className: "fhir-profile-mapper" + (st.fullScreen ? " mapper-fullscreen" : "") },
    h("style", null, MAPPER_STYLES),
    h("div", { className: "mapper-tabs", role: "tablist", "aria-label": "FHIR mapper sections", onKeyDown: tabKeys },
      tabs.map((t) => h("button", {
        key: t.id, id: `${tabId}-${t.id}`, type: "button", role: "tab", "aria-selected": t === current, "aria-controls": `${tabId}-panel`,
        tabIndex: t === current ? 0 : -1, onClick: () => { st.tab = t.id; rerender(); }
      }, t.label, t.badge ? h("span", { className: "mapper-tab-badge", title: t.badge.title }, t.badge.text) : null)),
      h("span", { style: { marginLeft: "auto", alignSelf: "center", marginRight: "6px", display: "inline-flex" } }, h(HelpButton, { key: current.id, ...(MAPPER_HELP[current.id] || MAPPER_HELP.mapper) })),
      h("button", { type: "button", className: "btn btn-sm", style: { alignSelf: "center" }, title: "Edit this step on the whole page (Esc to come back)", onClick: toggleFullScreen },
        st.fullScreen ? "Exit full screen (Esc)" : "⤢ Full screen")),
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
  React = platform.React;
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
      if (!["createBundle", "resource"].includes(el.action)) return "Choose the action: create a Bundle or build a resource.";
      if (!el.profileUrl || !String(el.profileUrl).trim()) return "Choose the target profile.";
      if (!el.resourceType) return "Load the target profile.";
      if (el.action === "createBundle" && !String(el.bundleName || "").trim()) return "Give the Bundle a name.";
      if (el.action === "createBundle" && el.resourceType !== "Bundle") return "Create a Bundle needs a Bundle target profile.";
      const entries = parseMappings(el.mappings);
      const noValue = entries.find((e) => e.translate && (e.translate.unmapped === "fixed" || e.translate.unmapped === "function") && !String(e.translate.value || "").trim());
      if (noValue) return `The translation of ${noValue.key} needs a ${noValue.translate.unmapped === "fixed" ? "fixed value" : "expression"} for codes without a match.`;
      const bad = entries.find((e) => typeof e.each === "string" && !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e.variable || ""));
      if (bad) return `The variable of the iteration on ${bad.key} must be a JavaScript name.`;
      if (!(el.action === "createBundle" || parseMappings(el.bundleTargets).length) && entries.some((e) => typeof e.each === "string" && Array.isArray(e.path) && !e.path.length))
        return "One resource for each item needs a named Bundle target.";
      return "";
    },
    component: ProfileMapperEditor
  });
}

export function register(platform) {
  registerProfileMapper(platform);
}
