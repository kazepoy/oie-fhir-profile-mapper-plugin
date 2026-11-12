// SPDX-License-Identifier: MPL-2.0
// Diagnostics of the compiler and the test API, and the events of a trace, as
// the editor shows them and links them to rules.

export function mapperDiagnostic(error) {
  const step = error.step || {};
  const label = [step.name || (step.sequenceNumber ? `Step ${step.sequenceNumber}` : ""), error.phase, error.errorType, error.key,
    error.line ? `line ${error.line}` : ""].filter(Boolean).join(" · ");
  const target = Array.isArray(error.path) ? [step.resourceType || "", ...error.path.map(([name, instance]) => name + (instance === undefined ? "" : `[${instance}]`))].filter(Boolean).join(".") : "";
  const kind = error.operation === "iteration" ? "each" : error.operation === "condition" ? "condition" : error.phase === "translation" ? "translate" : "value";
  return { label, target, kind };
}

export function traceRows(trace) {
  return trace.events.map(event => ({
    event,
    label: mapperDiagnostic({ ...event, step: trace.step }).label,
    duration: `${(Number(event.durationNanos) / 1000000).toFixed(3)} ms`,
    iterations: (event.iterations || []).map(item => `rule ${item.ruleIndex}, item ${item.index}`).join(" / ")
  }));
}

export const traceExport = trace => JSON.stringify(trace, null, 2);

/** The events of a trace grouped by step then rule, for the tree view. */
export function traceTree(trace) {
  const steps = new Map();
  for (const event of trace.events || []) {
    const stepKey = event.step ?? "step";
    if (!steps.has(stepKey)) steps.set(stepKey, { step: stepKey, rules: new Map(), global: [] });
    const group = steps.get(stepKey);
    if (event.key == null && event.ruleIndex == null) { group.global.push(event); continue; }
    const ruleKey = event.ruleId || `#${event.ruleIndex}`;
    if (!group.rules.has(ruleKey)) group.rules.set(ruleKey, { rule: ruleKey, key: event.key, events: [] });
    group.rules.get(ruleKey).events.push(event);
  }
  return [...steps.values()].map(s => ({ ...s, rules: [...s.rules.values()] }));
}

/** Errors by rule id (or index) for markers in the tree and the editors. */
export function errorsByRule(errors = []) {
  const map = new Map();
  for (const error of errors) {
    const id = error.ruleId || (error.ruleIndex != null ? `#${error.ruleIndex}` : null);
    if (!id) continue;
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(error);
  }
  return map;
}

/** Masks random identities so two results of the same mapping compare equal. */
export function normalizeResult(text) {
  if (text == null) return "";
  let json;
  try { json = JSON.stringify(JSON.parse(text), null, 2); } catch { json = String(text); }
  return json.replace(/urn:uuid:[0-9a-f-]{36}/gi, "urn:uuid:<uuid>").replace(/"lastUpdated"\s*:\s*"[^"]*"/g, '"lastUpdated": "<time>"');
}
