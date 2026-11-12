// SPDX-License-Identifier: MPL-2.0
// Rules of a step as JSON: stable ids, import of a step written by hand or by an
// agent, format versions, documentation export and table import.
import { parseMappings } from "./structure.js";

export const MAPPER_TYPE = "org.oie.fhir.mapper.FhirProfileMapperStep";
export const FORMAT_VERSION = 2;
const RULE_PROPERTIES = new Set(["id", "key", "element", "type", "expression", "path", "each", "variable", "condition", "fixed", "when", "translate", "note", "disabled"]);

export const ruleForm = rule => ("each" in rule ? "each" : "condition" in rule ? "condition" : "fixed" in rule ? "fixed" : "value");

/** Gives every rule an id: the one it has, the one of the same rule before, or a new one. */
export function ruleIds(entries, previous = [], createId = () => crypto.randomUUID()) {
  const identity = rule => `${ruleForm(rule)}:${rule.key || rule.element}`;
  const known = new Map(previous.filter(rule => rule.id).map(rule => [identity(rule), rule.id]));
  const used = new Set();
  return entries.map(rule => {
    const id = rule.id === undefined ? known.get(identity(rule)) || createId() : rule.id;
    if (typeof id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(id) || used.has(id)) throw new Error("Rule ids must be valid and unique within a step.");
    used.add(id);
    return { ...rule, id };
  });
}

/**
 * Brings a step to the current format: formatVersion, validation from validateOutput,
 * samples as a JSON array text. Idempotent; a v1 step keeps its profiles and
 * terminology fields, which the server still reads when no context is named.
 */
export function migrateStep(step) {
  const next = { ...step };
  const version = Number(next.formatVersion) || 1;
  if (version < 2) {
    next.formatVersion = FORMAT_VERSION;
    if (next.validation === undefined) {
      const v = next.validateOutput;
      next.validation = v === false || v === "false" ? "off" : "always";
    }
    if (next.context === undefined) next.context = "";
    if (next.samples === undefined) next.samples = "[]";
  }
  if (typeof next.samples !== "string") next.samples = JSON.stringify(Array.isArray(next.samples) ? next.samples : []);
  if (typeof next.mappings !== "string") next.mappings = JSON.stringify(Array.isArray(next.mappings) ? next.mappings : []);
  if (typeof next.bundleTargets !== "string") next.bundleTargets = JSON.stringify(Array.isArray(next.bundleTargets) ? next.bundleTargets : []);
  return next;
}

/** Whether a step still needs the migration (so the editor can say so once). */
export const needsMigration = step => (Number(step?.formatVersion) || 1) < FORMAT_VERSION;

/** A step pasted as JSON, merged over the current one; throws on an invalid step. */
export function importStepJson(element, text) {
  const patch = JSON.parse(text);
  if (!patch || Array.isArray(patch) || typeof patch !== "object") throw new Error("Expected a step JSON object.");
  for (const key of ["__proto__", "constructor", "prototype"]) if (Object.prototype.hasOwnProperty.call(patch, key)) throw new Error(`Invalid step property: ${key}`);
  if (patch.__type && patch.__type !== MAPPER_TYPE) throw new Error("This is not a FHIR Profile Mapper step.");
  const merged = migrateStep({ ...element, ...patch, __type: element.__type || MAPPER_TYPE, sequenceNumber: element.sequenceNumber, enabled: element.enabled });
  if (!["resource", "createBundle"].includes(merged.action) || !merged.resourceType) throw new Error("An action and resourceType are required.");
  for (const field of ["mappings", "bundleTargets", "samples"]) {
    if (typeof (merged[field] ?? "[]") !== "string" || !Array.isArray(JSON.parse(merged[field] || "[]")))
      throw new Error(`${field} must be a string containing a JSON array.`);
  }
  for (const rule of JSON.parse(merged.mappings || "[]")) {
    if (!rule || typeof rule !== "object" || !Array.isArray(rule.path)) throw new Error("Every rule needs a path.");
    for (const key of Object.keys(rule)) if (!RULE_PROPERTIES.has(key)) throw new Error(`Unknown rule property: ${key}`);
  }
  merged.mappings = JSON.stringify(ruleIds(JSON.parse(merged.mappings || "[]"), parseMappings(element.mappings)));
  return merged;
}

const pathText = path => path.map(([name, instance]) => name + (instance === undefined ? "" : `[${instance}]`)).join(".");
const cell = s => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

/** The rules of a step as a Markdown table, for analysts and reviews. */
export function documentRules(step) {
  const rules = parseMappings(step.mappings);
  const lines = [`# ${step.name || step.resourceType || "Step"}`, "",
    `- Action: ${step.action === "createBundle" ? `create Bundle "${step.bundleName}" (${step.bundleType || "transaction"})` : `build ${step.resourceType}`}`,
    `- Profile: ${step.profileUrl || "(none)"}${step.profileVersion ? ` version ${step.profileVersion}` : ""}`,
    `- FHIR: ${step.fhirVersion || "R4"}`, ""];
  if (step.action !== "createBundle") {
    const targets = parseMappings(step.bundleTargets);
    if (targets.length) lines.push(`- Added to: ${targets.map(t => t.name).join(", ")}${step.refName ? ` as ${step.refName}` : ""}`, "");
  }
  lines.push("| Element | Rule | Expression | Type | Note |", "|---|---|---|---|---|");
  for (const rule of rules) {
    const form = ruleForm(rule);
    const text = form === "each" ? `each ${rule.each} as ${rule.variable}` : form === "condition" ? `if ${rule.condition}`
      : form === "fixed" ? `fixed ${typeof rule.fixed === "object" ? JSON.stringify(rule.fixed) : rule.fixed}` : rule.expression;
    const kind = form === "value" ? (rule.translate ? `value, translate ${rule.translate.conceptMap}` : "value") : form;
    lines.push(`| ${cell(rule.key || rule.element)} | ${cell(kind)}${rule.disabled ? " (disabled)" : ""} | \`${cell(text)}\` | ${cell(rule.type || "")} | ${cell(rule.note || "")} |`);
  }
  lines.push("", `Paths: ${rules.filter(r => r.path?.length).map(r => `${r.key || r.element} → ${pathText(r.path)}`).join("; ")}`);
  return lines.join("\n") + "\n";
}

/**
 * Rows of a mapping table (CSV, TSV or a Markdown table) as {key, expression, note}:
 * the first column is the element key (Patient.name.family), the second the
 * expression, the third an optional note. A header row is skipped.
 */
export function parseRuleTable(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    let cells;
    if (line.startsWith("|")) {
      if (/^\|?\s*:?-{2,}/.test(line)) continue;
      cells = line.replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map(c => c.replace(/\\\|/g, "|").trim().replace(/^`|`$/g, ""));
    } else if (line.includes("\t")) cells = line.split("\t").map(c => c.trim());
    else cells = splitCsv(line);
    if (cells.length < 2) continue;
    const [key, expression, note = ""] = cells;
    if (!/^[A-Z][A-Za-z0-9]*(\.[A-Za-z0-9_\[\]:/-]+)+$/.test(key)) continue;
    rows.push({ key, expression, note });
  }
  return rows;
}

function splitCsv(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (c === '"') quoted = false;
      else current += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { cells.push(current.trim()); current = ""; }
    else current += c;
  }
  cells.push(current.trim());
  return cells;
}
