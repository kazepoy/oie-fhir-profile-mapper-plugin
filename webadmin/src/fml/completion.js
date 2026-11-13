// SPDX-License-Identifier: MPL-2.0
const KEYWORDS = ["map", "uses", "alias", "as", "imports", "group", "extends", "source", "target", "where", "check", "then", "default", "first", "last", "share", "collate", "log"];
const TRANSFORMS = ["create", "copy", "truncate", "escape", "cast", "append", "translate", "reference", "dateOp", "uuid", "pointer", "evaluate", "cc", "c", "qty", "id", "cp"];
const FHIRPATH = ["exists", "empty", "first", "last", "where", "select", "all", "count", "toString", "toDecimal", "substring", "length", "startsWith", "contains"];

/** Symbols declared by the map plus the stable FML/FHIRPath vocabulary. */
export function fmlCompletions(source, paths = []) {
  const text = String(source || "");
  const items = new Map();
  const add = (label, kind, detail, insertText = label) => items.set(`${kind}:${label}`, { label, kind, detail, insertText, sortText: `${kind === "variable" ? "1" : kind === "path" ? "2" : "3"}-${label}` });
  for (const word of KEYWORDS) add(word, "keyword", "FML keyword");
  for (const word of TRANSFORMS) add(word, "function", "FML transform", `${word}()`);
  for (const word of FHIRPATH) add(word, "function", "FHIRPath function", `${word}()`);
  for (const match of text.matchAll(/\buses\s+"[^"]+"\s+alias\s+([A-Za-z_]\w*)/g)) add(match[1], "variable", "Structure alias");
  for (const match of text.matchAll(/\bgroup\s+([A-Za-z_]\w*)/g)) add(match[1], "function", "FML group", `${match[1]}()`);
  for (const match of text.matchAll(/\b(?:source|target)\s+([A-Za-z_]\w*)|\bas\s+([A-Za-z_]\w*)/g)) add(match[1] || match[2], "variable", "Map variable");
  for (const path of paths) add(path, "path", "StructureDefinition path", path.split(".").pop());
  return [...items.values()];
}

export function fmlSkeleton({ sourceUrl, targetUrl, required = [] }) {
  const source = sourceUrl || "http://oie.org/fhir/StructureDefinition/OieMessage";
  const target = targetUrl || "http://hl7.org/fhir/StructureDefinition/Patient";
  const name = (target.split("/").pop() || "Target").replace(/[^A-Za-z0-9_]/g, "_");
  const reminders = required.length ? required.map(path => `  // TODO required: ${path}`).join("\n") : "  // Add source -> target rules here.";
  return `map "http://example.org/fhir/StructureMap/${name}Map" = "${name}Map"\n\nuses "${source}" alias Source as source\nuses "${target}" alias Target as target\n\ngroup ${name}Map(source src : Source, target tgt : Target) {\n${reminders}\n}\n`;
}
