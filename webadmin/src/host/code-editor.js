// SPDX-License-Identifier: MPL-2.0
// Expression and map editors on the host's code editor (Monaco when it loads,
// a textarea otherwise): a one-line mode for expressions, the mapper's
// completions (functions, iteration variables, sample paths, snippets), typings
// for hover and signature help, and error markers.
//
// The host offers no completion hook for plugins: the provider below is
// registered on the global Monaco the host exposes (window.monaco) and answers
// only for the models of this plugin's editors (doc/architecture/doc/architecture/limites-plateforme.md, WA-17).
import { platform } from "./platform.js";

const OWNER = "fhir-mapper";
const SCOPE_LIB = "ts:fhir-mapper-scope.d.ts";
/** model uri -> { getItems, getDts } */
const models = new Map();
let providerRegistered = false;
let scopeLib = null;

const monaco = () => /** @type {any} */ (window).monaco || null;

function kindOf(m, kind) {
  const kinds = m.languages.CompletionItemKind;
  return kind === "function" ? kinds.Function : kind === "variable" ? kinds.Variable : kind === "path" ? kinds.Field : kind === "snippet" ? kinds.Snippet : kinds.Text;
}

function registerProvider(m) {
  if (providerRegistered) return;
  providerRegistered = true;
  const provider = {
    triggerCharacters: ["'", "["],
    provideCompletionItems(model, position) {
      const entry = models.get(model.uri.toString());
      if (!entry) return { suggestions: [] };
      const word = model.getWordUntilPosition(position);
      const line = model.getLineContent(position.lineNumber);
      // Inside a string: only sample paths and codes make sense; after a dot: nothing of ours.
      const before = line.slice(0, position.column - 1);
      const quotes = (before.match(/'/g) || []).length + (before.match(/"/g) || []).length;
      const inString = quotes % 2 === 1;
      const afterDot = before.trimEnd().endsWith(".");
      if (afterDot && !inString) return { suggestions: [] };
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
      const suggestions = [];
      for (const item of entry.getItems({ inString })) {
        suggestions.push({
          label: item.label, filterText: item.filterText || item.label, kind: kindOf(m, item.kind), detail: item.detail, documentation: item.documentation,
          insertText: item.insertText, sortText: item.sortText, range,
          insertTextRules: item.snippet ? m.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined
        });
      }
      return { suggestions };
    }
  };
  m.languages.registerCompletionItemProvider("javascript", provider);
  m.languages.registerCompletionItemProvider("fml", provider);
}

/** Typings of the active expression's scope, replacing the previous ones. */
function installScope(m, dts) {
  try {
    const defaults = m.languages.typescript?.javascriptDefaults;
    if (!defaults) return;
    if (scopeLib) scopeLib.dispose();
    scopeLib = defaults.addExtraLib(dts, SCOPE_LIB);
  } catch {
    // typescript service unavailable: completion still works
  }
}

function singleLine(m, instance, el, onEnter) {
  instance.updateOptions({
    lineNumbers: "off", glyphMargin: false, folding: false, lineDecorationsWidth: 0, lineNumbersMinChars: 0,
    renderLineHighlight: "none", scrollBeyondLastLine: false, scrollBeyondLastColumn: 2, overviewRulerLanes: 0, hideCursorInOverviewRuler: true,
    overviewRulerBorder: false, scrollbar: { vertical: "hidden", horizontal: "hidden", alwaysConsumeMouseWheel: false, handleMouseWheel: false },
    wordWrap: "off", minimap: { enabled: false }, fixedOverflowWidgets: true, contextmenu: false, quickSuggestions: true,
    suggestOnTriggerCharacters: true, acceptSuggestionOnEnter: "on", find: { addExtraSpaceOnTop: false }, padding: { top: 3, bottom: 3 },
    renderWhitespace: "none", cursorBlinking: "smooth", lineHeight: 18
  });
  el.style.height = "26px";
  instance.layout();
  instance.addCommand(m.KeyCode.Enter, () => onEnter?.(), "!suggestWidgetVisible");
  instance.addCommand(m.KeyCode.Enter | m.KeyMod.Shift, () => onEnter?.(), "!suggestWidgetVisible");
  instance.onDidChangeModelContent(() => {
    const value = instance.getValue();
    if (value.includes("\n")) instance.setValue(value.replace(/\s*\n\s*/g, " "));
  });
}

/**
 * An expression editor. Options: value, onChange(text), onEnter, onFocus, onBlur, placeholder,
 * ariaLabel, completionScope (channel code templates), multiline, language,
 * getItems() → completion items (fhir/completion.js monacoItems), getDts() → typings.
 * Returns { el, getValue, setValue, focus, dispose, setMarkers(messages), insert(text), ready }.
 */
export function createExpressionEditor(options) {
  const { value = "", onChange, onEnter, onFocus, onBlur, placeholder, ariaLabel, completionScope, multiline = false, language = "javascript", getItems, getDts, minHeight, readOnly = false } = options;
  const editor = platform().createCodeEditor({
    value, language, onChange, completionScope, ariaLabel, readOnly, minHeight: multiline ? minHeight || "120px" : undefined,
    popoutable: multiline, popoutTitle: ariaLabel
  });
  const el = editor.el;
  el.classList.add("fm-code-editor", multiline ? "fm-code-editor--multi" : "fm-code-editor--line");
  if (placeholder) el.dataset.placeholder = placeholder;
  const area = el.querySelector("textarea");
  if (area) {
    if (placeholder) area.placeholder = placeholder;
    area.addEventListener("focus", () => onFocus?.());
    area.addEventListener("blur", () => onBlur?.());
    if (!multiline) area.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); onEnter?.(); } });
  }
  let disposed = false;
  let instance = null;
  const subscriptions = [];
  const upgraded = () => {
    const m = monaco();
    instance = editor.monaco;
    if (!m || !instance || disposed) return;
    registerProvider(m);
    const model = instance.getModel();
    const uri = model.uri.toString();
    if (getItems) models.set(uri, { getItems, getDts });
    if (!multiline) singleLine(m, instance, el, onEnter);
    // Suggestions on demand. macOS keeps Ctrl+Space for input sources, so Alt/Option+Space asks too;
    // the key is taken before it types a (non-breaking) space.
    const suggest = () => instance.trigger("keyboard", "editor.action.triggerSuggest", {});
    instance.addCommand(m.KeyMod.Alt | m.KeyCode.Space, suggest);
    instance.addCommand(m.KeyMod.WinCtrl | m.KeyCode.Space, suggest);
    instance.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Space, suggest);
    // The side panel of a suggestion stays closed: its documentation is in the list's detail.
    instance.updateOptions({ suggest: { showStatusBar: false, preview: false, showInlineDetails: true }, quickSuggestionsDelay: 80 });
    // Start typing at the end of the expression, as in the plain field it replaces.
    if (!multiline) { const text = instance.getValue(); instance.setPosition({ lineNumber: 1, column: text.length + 1 }); }
    subscriptions.push(instance.onDidFocusEditorText(() => { if (getDts) installScope(m, getDts()); onFocus?.(); }));
    subscriptions.push(instance.onDidBlurEditorText(() => onBlur?.()));
    updatePlaceholder();
    subscriptions.push(instance.onDidChangeModelContent(updatePlaceholder));
    if (pendingMarkers) setMarkers(pendingMarkers);
  };
  const updatePlaceholder = () => { if (instance) el.classList.toggle("fm-code-editor--empty", !instance.getValue()); };
  // The host upgrades the editor asynchronously; watch for it (no event is offered).
  const watch = setInterval(() => {
    if (disposed) { clearInterval(watch); return; }
    if (editor.monaco) { clearInterval(watch); upgraded(); }
  }, 50);
  setTimeout(() => clearInterval(watch), 15000);
  let pendingMarkers = null;
  const setMarkers = messages => {
    pendingMarkers = messages;
    const m = monaco();
    if (!m || !instance) return;
    const model = instance.getModel();
    const text = model.getValue();
    const lines = text.split("\n");
    // A text marks the whole expression; { line, column, message } marks from there to the end of its line.
    m.editor.setModelMarkers(model, OWNER, (messages || []).map(item => typeof item === "string"
      ? { severity: m.MarkerSeverity.Error, message: item, startLineNumber: 1, startColumn: 1, endLineNumber: lines.length, endColumn: (lines[lines.length - 1]?.length || 0) + 1 }
      : { severity: m.MarkerSeverity.Error, message: item.message, startLineNumber: Math.min(item.line || 1, lines.length), startColumn: item.column || 1,
          endLineNumber: Math.min(item.line || 1, lines.length), endColumn: (lines[Math.min(item.line || 1, lines.length) - 1]?.length || 0) + 1 }));
    el.classList.toggle("fm-code-editor--invalid", !!(messages && messages.length));
  };
  const insert = text => {
    if (instance) {
      const m = monaco();
      const pos = instance.getPosition();
      instance.executeEdits("fhir-mapper", [{ range: new m.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text, forceMoveMarkers: true }]);
      instance.focus();
      return;
    }
    if (area) {
      const start = area.selectionStart ?? area.value.length;
      const end = area.selectionEnd ?? start;
      area.value = area.value.slice(0, start) + text + area.value.slice(end);
      area.selectionStart = area.selectionEnd = start + text.length;
      area.dispatchEvent(new Event("input", { bubbles: true }));
      area.focus();
    }
  };
  return {
    el,
    getValue: () => editor.getValue(),
    setValue: text => { if (editor.getValue() !== (text ?? "")) editor.setValue(text ?? ""); updatePlaceholder(); },
    focus: () => editor.focus && editor.focus(),
    setMarkers,
    insert,
    hasMonaco: () => !!instance,
    dispose: () => {
      disposed = true;
      clearInterval(watch);
      for (const s of subscriptions) s.dispose?.();
      if (instance) models.delete(instance.getModel()?.uri.toString());
      try { editor.dispose && editor.dispose(); } catch { /* already gone */ }
      el.remove();
    }
  };
}

/** Whether Monaco is on the page (after a first editor upgraded). */
export const monacoLoaded = () => !!monaco();

/** Registers a Monarch language once Monaco asks for it (for the FML map editor). */
export function registerLanguage(id, definition, host) {
  const p = host || platform();
  if (typeof p.registerEditorLanguage !== "function") return false;
  try {
    p.registerEditorLanguage(id, { load: () => definition, aliases: definition.aliases, extensions: definition.extensions });
    return true;
  } catch {
    return false; // already registered (a reload of the plugin)
  }
}

/** A read-only side-by-side diff of two texts; degrades to two panes without Monaco. */
export function createDiff(original, modified, language = "json") {
  const factory = platform().createDiffEditor;
  if (typeof factory === "function") return factory({ original, modified, language });
  const el = document.createElement("div");
  el.className = "fm-diff-fallback";
  for (const text of [original, modified]) {
    const pre = document.createElement("pre");
    pre.textContent = text;
    el.appendChild(pre);
  }
  return { el, setModels: () => {}, layout: () => {}, dispose: () => el.remove() };
}
