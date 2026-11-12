// SPDX-License-Identifier: MPL-2.0
// Source paths dragged, clicked or pasted into an expression.

const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

/** The text an edit inserted at once (a paste, or a click in the Message Trees panel), or null. */
export function inserted(before, after) {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let end = 0;
  while (end < before.length - start && end < after.length - start && before[before.length - 1 - end] === after[after.length - 1 - end]) end++;
  const text = after.slice(start, after.length - end);
  return text.length > 1 ? { start, end: after.length - end, text } : null;
}

/** A dropped accessor rewritten to the iteration variables around the target, when it is a source path. */
export function rewriteDropped(text, iterations) {
  if (!iterations.length || !/^(msg|tmp)\[/.test(text)) return text;
  return substitute(text, iterations);
}
