// SPDX-License-Identifier: MPL-2.0
import { t as tr } from "../i18n/index.js";
import { parseMappings } from "./model.js";
export const MAPPER_TYPE = "org.oie.fhir.mapper.FhirProfileMapperStep";
export function mapperSourcePaths(sample) {
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

export function mapperHelpUrl(version, type, key = type) {
  const release = ["R4", "R4B", "R5"].includes(version) ? version : "R4";
  if (!/^[A-Z][A-Za-z0-9]+$/.test(type || "")) return `https://hl7.org/fhir/${release}/`;
  const field = key.split(".")[1]?.replace(/:[^.]*/, "").replace(/\[\d+\]/g, "");
  return `https://hl7.org/fhir/${release}/${type.toLowerCase()}-definitions.html#${encodeURIComponent(type + (field ? "." + field : ""))}`;
}

export function mapperJsonImport(element, text) {
  const patch = JSON.parse(text);
  if (!patch || Array.isArray(patch) || typeof patch !== "object") throw new Error(tr("Expected a step JSON object."));
  for (const key of ["__proto__", "constructor", "prototype"]) if (Object.prototype.hasOwnProperty.call(patch, key)) throw new Error(tr("Invalid step property: {p0}", { p0: key }));
  if (patch.__type && patch.__type !== MAPPER_TYPE) throw new Error(tr("This is not a FHIR Profile Mapper step."));
  const merged = { ...element, ...patch, __type: element.__type || MAPPER_TYPE,
    sequenceNumber: element.sequenceNumber, enabled: element.enabled };
  if (!["resource", "createBundle"].includes(merged.action) || !merged.resourceType) throw new Error(tr("An action and resourceType are required."));
  for (const field of ["mappings", "bundleTargets"]) {
    if (typeof (merged[field] ?? "[]") !== "string" || !Array.isArray(JSON.parse(merged[field] || "[]")))
      throw new Error(tr("{p0} must be a string containing a JSON array.", { p0: field }));
  }
  const allowed = new Set(["id", "key", "element", "type", "expression", "path", "each", "variable", "condition", "fixed", "when", "translate", "note", "disabled"]);
  for (const rule of JSON.parse(merged.mappings || "[]")) {
    if (!rule || typeof rule !== "object" || !Array.isArray(rule.path)) throw new Error(tr("Every rule needs a path."));
    for (const key of Object.keys(rule)) if (!allowed.has(key)) throw new Error(tr("Unknown rule property: {p0}", { p0: key }));
  }
  merged.mappings = JSON.stringify(mapperRuleIds(JSON.parse(merged.mappings || "[]"), parseMappings(element.mappings)));
  return merged;
}

export function mapperRuleKey(rule) {
  return `${"each" in rule ? "each" : "condition" in rule ? "condition" : "fixed" in rule ? "fixed" : "value"}:${rule.key || rule.element}`;
}

export function mapperRuleIds(entries, previous = [], createId = () => crypto.randomUUID()) {
  const identity = mapperRuleKey;
  const known = new Map(previous.filter((rule) => rule.id).map((rule) => [identity(rule), rule.id]));
  const used = new Set();
  return entries.map((rule) => {
    const id = rule.id === undefined ? known.get(identity(rule)) || createId() : rule.id;
    if (typeof id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(id) || used.has(id)) throw new Error(tr("Rule ids must be valid and unique within a step."));
    used.add(id);
    return { ...rule, id };
  });
}
