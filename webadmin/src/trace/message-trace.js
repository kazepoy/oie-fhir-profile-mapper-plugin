// SPDX-License-Identifier: MPL-2.0
// The FHIR mapping trace of a processed message: found in the connector maps of
// the message (fhirMapperTrace, fhirMapperResponseTrace) and shown as text.

export const TRACE_KEYS = ["fhirMapperTrace", "fhirMapperResponseTrace"];

/**
 * Every trace in a message as Web Admin holds it (XStream as JSON: map entries are
 * arrays or objects of strings). Looks for a known key followed by its JSON text.
 * @returns {{ key: string, trace: any }[]}
 */
export function findTraces(message) {
  const found = [];
  const seen = new Set();
  const take = (key, text) => {
    if (typeof text !== "string" || seen.has(text)) return;
    try {
      const trace = JSON.parse(text);
      if (trace && typeof trace === "object" && Array.isArray(trace.events)) { seen.add(text); found.push({ key, trace }); }
    } catch { /* not a trace */ }
  };
  const walk = (value, depth) => {
    if (!value || typeof value !== "object" || depth > 14) return;
    if (Array.isArray(value)) {
      value.forEach((item, i) => { if (TRACE_KEYS.includes(item)) take(item, value[i + 1]); });
      for (const item of value) walk(item, depth + 1);
      return;
    }
    for (const [name, item] of Object.entries(value)) {
      if (TRACE_KEYS.includes(name)) take(name, item);
      walk(item, depth + 1);
    }
  };
  walk(message, 0);
  return found;
}

const ms = nanos => `${(Number(nanos || 0) / 1e6).toFixed(2)} ms`;

/** A trace as lines of text: its identity, its steps, then one line per event. */
export function traceText(trace) {
  const lines = [];
  if (trace.channel) lines.push(`Channel ${trace.channel.name || trace.channel.id}, revision ${trace.channel.revision}`);
  if (trace.connector) lines.push(`Connector ${trace.connector.name} (${trace.connector.transformer})`);
  const steps = new Map((trace.steps || []).map(s => [s.sequenceNumber, s]));
  if (steps.size) lines.push(`Steps: ${[...steps.values()].map(s => `${Number(s.sequenceNumber) + 1}. ${s.name} (${s.action === "createBundle" ? `Bundle ${s.bundleName}` : s.resourceType})`).join(", ")}`);
  lines.push(`${(trace.events || []).length} event(s)${trace.truncated ? ", truncated" : ""}`, "");
  let current;
  for (const e of trace.events || []) {
    if (e.step !== current) {
      current = e.step;
      const step = steps.get(e.step);
      lines.push(step ? `── ${step.name}` : "── finalization");
    }
    const what = e.phase === "reference" ? `${e.name}[${e.index ?? 0}] ${e.fullUrl || ""}`
      : e.phase === "bundle-entry" ? `${e.resourceType} ${e.refName || ""} → ${(e.bundles || []).join(", ")}`
      : e.phase === "publication" ? `${e.target || ""}${e.variable ? ` ${e.variable}` : ""}`
      : e.key || (e.bundle ? `Bundle ${e.bundle}` : "");
    const extra = [e.count !== undefined ? `${e.count} item(s)` : "", e.reason || "", e.errorType || "", e.value?.text !== undefined ? `= ${e.value.text}` : "",
      (e.iterations || []).length ? `item ${e.iterations.map(i => i.index).join("/")}` : ""].filter(Boolean).join(" · ");
    lines.push(`   ${String(e.phase).padEnd(12)} ${String(e.status).padEnd(9)} ${what}${extra ? `   (${extra})` : ""}   ${ms(e.durationNanos)}`);
  }
  return lines.join("\n");
}
