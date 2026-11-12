// SPDX-License-Identifier: MPL-2.0
import { t as tr } from "../i18n/index.js";
// What the expression editors offer: the mapper functions by role, the variables of
// the iterations around an element, the paths of the sample, snippets, and the
// typings (a .d.ts) that give the host's language service hover and signature help.

/** The variables and paths available to an expression of a node, for a role. */
export function completionContext(node, iterationMap, paths, role = "value") {
  const iterations = [];
  for (let current = role === "iteration" ? node?.parent : node; current; current = current.parent) {
    const iteration = iterationMap.get(current.key);
    if (iteration) iterations.push(iteration);
  }
  const variables = iterations.flatMap(it => [it.variable, `${it.variable}Index`]);
  if (role === "translation") variables.push("code", "system");
  const normalize = path => path.replace(/\[['"]([^'"]+)['"]\]/g, (_, key) => `[${JSON.stringify(key)}]`);
  const aliases = paths.map(path => {
    let alias = path;
    for (let round = 0; round < iterations.length; round++) {
      for (const it of iterations) {
        const prefix = normalize(it.expression.trim());
        if (alias.startsWith(prefix + "[")) alias = it.variable + alias.slice(prefix.length).replace(/^\[0\]/, "");
      }
    }
    return alias;
  });
  return { role, variables, iterations, paths: [...new Set([...paths, ...aliases])], targetType: node?.code, targetKey: node?.key };
}

const SCOPE_VARIABLES = ["msg", "tmp", "channelMap", "sourceMap", "connectorMap", "configurationMap"];

/**
 * The completion of a plain text field (the fallback when Monaco is not available):
 * ignores strings and comments, needs 3 characters or forced, replaces the word at the caret.
 */
export function functionCompletion(functions, value, caret, selectionEnd = caret, context = {}, forced = false) {
  const before = value.slice(0, caret).replace(/"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?|`(?:\\.|[^`\\])*`?|\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/g, s => " ".repeat(s.length));
  const token = /[A-Za-z_$][\w$]*$/.exec(before);
  if (caret && before[caret - 1] !== value[caret - 1]) return null;
  if ((!token || token[0].length < 3) && !forced) return null;
  const start = token ? token.index : caret;
  if (before.slice(0, start).trimEnd().endsWith(".")) return null;
  const symbols = completionSymbols(functions, context);
  const prefix = token ? token[0] : "";
  const items = symbols.filter(fn => fn.name.startsWith(prefix) || (forced && `${fn.signature} ${fn.description}`.toLowerCase().includes(prefix.toLowerCase())));
  if (!items.length) return null;
  const end = selectionEnd > caret ? selectionEnd : caret + /^[\w$]*/.exec(value.slice(caret))[0].length;
  return { start, end, items };
}

/** Every symbol an expression may use, in order: functions of the role, scope variables, sample paths. */
export function completionSymbols(functions, context = {}) {
  return [...functions.filter(fn => !context.role || fn.contexts.includes(context.role)),
    ...[...new Set([...SCOPE_VARIABLES, ...(context.variables || [])])]
      .map(name => ({ name, signature: name, example: name, description: tr("Variable available in this scope."), kind: "variable" })),
    ...(context.paths || []).map(name => ({ name, signature: name, example: name, description: tr("Source path from the sample; guard optional values."), kind: "path" }))];
}

export function completeFunction(value, completion, fn) {
  const tail = value.slice(completion.end);
  const text = !fn.kind && /^\s*\(/.test(tail) ? fn.name : fn.example;
  return { value: value.slice(0, completion.start) + text + tail, caret: completion.start + text.length };
}

/** Snippets that guard optional data, offered in every role. */
export const SNIPPETS = [
  { name: "guard", label: tr("guard optional (x != null ? x : undefined)"), insert: "${1:value} != null ? ${1:value} : undefined", description: tr("Give nothing when the source is missing, instead of a TypeError.") },
  { name: "repetition", label: tr("nth repetition if present"), insert: "${1:msg['PID']['PID.3']}.length() > ${2:1} ? ${1:msg['PID']['PID.3']}[${2:1}]${3:['PID.3.1']}.toString() : undefined", description: tr("HL7 v2 repetition guarded by its count.") },
  { name: "find", label: tr("fhirFind(list, function)"), insert: "fhirFind(${1:list}, function (${2:item}) { return ${3:condition}; })", description: tr("First item of a list matching a condition.") },
  { name: "filter", label: tr("fhirFilter(list, function)"), insert: "fhirFilter(${1:list}, function (${2:item}) { return ${3:condition}; })", description: tr("Items of a list matching a condition.") },
  { name: "ternary", label: tr("condition ? a : b"), insert: "${1:condition} ? ${2:a} : ${3:b}", description: tr("A choice between two values.") }
];

/**
 * Items for a Monaco completion provider: [{ label, kind, insertText, snippet, detail, documentation, sortText }].
 * kind: function, variable, path, snippet.
 */
export function monacoItems(functions, context = {}, sampleValues = new Map()) {
  const items = [];
  for (const fn of functions) {
    if (context.role && !fn.contexts.includes(context.role)) continue;
    const params = (fn.parameters || []).map(p => p.name);
    items.push({ label: fn.signature, filterText: fn.name, kind: "function", insertText: params.length ? `${fn.name}(${params.map((p, i) => `\${${i + 1}:${p}}`).join(", ")})` : `${fn.name}()`,
      snippet: true, detail: tr("FHIR Mapper · {p0}", { p0: fn.returnType || "" }), documentation: tr("{p0}\n\nExample: {p1}", { p0: fn.description, p1: fn.example }), sortText: `2${fn.name}` });
  }
  for (const name of context.variables || []) {
    items.push({ label: name, kind: "variable", insertText: name, detail: name.endsWith("Index") ? tr("iteration index (0, 1, …)") : tr("iteration item"), sortText: `0${name}` });
  }
  if (context.role === "translation") {
    // code and system are already in variables
  }
  // Sample paths: those rewritten to an iteration variable first, then the others; only fields
  // that hold a value in the sample when it is known; written as the rules write them.
  const single = path => path.replace(/\["((?:[^"\\]|\\.)*)"\]/g, (_, key) => `['${key.replace(/'/g, "\\'")}']`);
  const variables = new Set(context.variables || []);
  const scoped = path => variables.has(path.split("[")[0]);
  const paths = [...new Set(context.paths || [])];
  const shown = [...paths.filter(scoped), ...paths.filter(path => !scoped(path))].slice(0, 80);
  for (const path of shown) {
    const value = sampleValues.get(path) ?? (context.pathValues ? context.pathValues[path] : undefined);
    const text = single(path) + (context.e4x ? ".toString()" : "");
    items.push({ label: text, filterText: text, kind: "path", insertText: text, detail: value == null || value === "" ? tr("sample path") : tr("sample: {p0}", { p0: String(value).slice(0, 60) }),
      sortText: `${scoped(path) ? "1" : "4"}${path}` });
  }
  for (const s of SNIPPETS) {
    items.push({ label: s.label, filterText: s.name, kind: "snippet", insertText: s.insert, snippet: true, detail: tr("snippet · {p0}", { p0: s.description }), sortText: `5${s.name}` });
  }
  return items;
}

/** TypeScript declarations of the mapper functions and of the scope variables of an expression, for hover and signature help. */
export function scopeDts(functions, context = {}) {
  const lines = ["// FHIR Profile Mapper: functions of the runtime and variables of this expression's scope."];
  for (const fn of functions) {
    const params = (fn.parameters || []).map(p => `${p.name}${p.optional ? "?" : ""}: any`).join(", ");
    lines.push(`/** ${fn.description} Example: ${fn.example} */`, `declare function ${fn.name}(${params}): ${tsType(fn.returnType)};`);
  }
  for (const name of context.variables || []) {
    lines.push(`/** ${name.endsWith("Index") ? "Index of the current item of the iteration (0, 1, …)." : "Current item of the iteration."} */`, `declare const ${name}: ${name.endsWith("Index") ? "number" : "any"};`);
  }
  return lines.join("\n") + "\n";
}

function tsType(returnType) {
  const t = String(returnType || "any");
  if (t === "string") return "string";
  if (t === "string[]") return "string[]";
  if (/undefined/.test(t)) return "any";
  if (/\[\]$/.test(t)) return "any[]";
  if (t === "number") return "number";
  return "any";
}
