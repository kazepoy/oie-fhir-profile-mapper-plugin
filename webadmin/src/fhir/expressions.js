// SPDX-License-Identifier: MPL-2.0
/** The text an edit inserted at once (a paste, or a click in the Message Trees panel), or null. */
export function inserted(before, after) {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let end = 0;
  while (end < before.length - start && end < after.length - start && before[before.length - 1 - end] === after[after.length - 1 - end]) end++;
  const text = after.slice(start, after.length - end);
  return text.length > 1 ? { start, end: after.length - end, text } : null;
}

export const asBool = (v, def) => (v === undefined || v === null || v === "" ? def : v === true || v === "true");
export const fixedText = (f) => (typeof f.value === "object" ? JSON.stringify(f.value) : String(f.value));
export const TRANSLATABLE = new Set(["code", "string", "Coding", "CodeableConcept"]);
export const isLocalServer = (server) => !String(server || "").trim() || String(server).trim().toLowerCase() === "n/a";
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A field dragged from the Message Trees panel into an element below an iteration: the path of the
 * iterated list becomes its variable (msg['PID']['PID.3'][0]['PID.3.1'] -> item['PID.3.1']), as the
 * Iterator step does with its prefix substitutions. The innermost iteration that matches wins.
 */
export function substitute(text, iterations) {
  for (const it of iterations) {
    const prefix = it.expression.trim().replace(/\.toString\(\)$/, "");
    if (!prefix) continue;
    const m = new RegExp("^" + escapeRegExp(prefix) + "(\\[\\d+\\])?").exec(text);
    if (m) return (it.variable || "item") + text.slice(m[0].length);
  }
  return text;
}
