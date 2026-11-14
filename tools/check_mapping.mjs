#!/usr/bin/env node
// Contrôle structurel hors ligne des étapes JSON/XML du mapper.
// SPDX-License-Identifier: MPL-2.0

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SCHEMA = JSON.parse(
  readFileSync(resolve(ROOT, "doc/reference/schemas/mapping-step.schema.json"), "utf8")
);

function resolveRef(ref, rootSchema = SCHEMA) {
  if (!ref.startsWith("#/")) throw new Error(`Unsupported $ref: ${ref}`);
  return ref
    .slice(2)
    .split("/")
    .reduce((acc, part) => acc?.[part], rootSchema);
}

export function checkSchema(schema = SCHEMA, rootSchema = schema) {
  if (typeof schema === "boolean") return;
  if (!schema || typeof schema !== "object") throw new Error("Invalid schema node");
  if (schema.$ref && !resolveRef(schema.$ref, rootSchema)) {
    throw new Error(`Unresolved $ref: ${schema.$ref}`);
  }
  if (schema.pattern) new RegExp(schema.pattern);
  for (const sub of Object.values(schema.properties || {})) checkSchema(sub, rootSchema);
  for (const sub of Object.values(schema.$defs || {})) checkSchema(sub, rootSchema);
  for (const key of ["items", "additionalProperties", "not", "if", "then", "else", "contentSchema"]) {
    if (schema[key] !== undefined) checkSchema(schema[key], rootSchema);
  }
  for (const key of ["prefixItems", "allOf", "anyOf", "oneOf"]) {
    for (const sub of schema[key] || []) checkSchema(sub, rootSchema);
  }
}

function matchesType(value, type) {
  if (Array.isArray(type)) return type.some((t) => matchesType(value, t));
  switch (type) {
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return false;
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function* validateNode(value, schema, path = "$", rootSchema = SCHEMA) {
  if (schema === true) return;
  if (schema === false) {
    yield `${path}: valeur interdite par le schéma`;
    return;
  }
  if (schema.$ref) {
    yield* validateNode(value, resolveRef(schema.$ref, rootSchema), path, rootSchema);
    return;
  }

  if (schema.type !== undefined && !matchesType(value, schema.type)) {
    yield `${path}: ${JSON.stringify(value)} n'est pas de type ${JSON.stringify(schema.type)}`;
    return;
  }
  if (schema.const !== undefined && !deepEqual(value, schema.const)) {
    yield `${path}: ${JSON.stringify(schema.const)} attendu`;
  }
  if (schema.enum !== undefined && !schema.enum.some((item) => deepEqual(value, item))) {
    yield `${path}: ${JSON.stringify(value)} n'appartient pas à ${JSON.stringify(schema.enum)}`;
  }
  if (typeof value === "string" && schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
    yield `${path}: ${JSON.stringify(value)} ne respecte pas le motif ${schema.pattern}`;
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    yield `${path}: ${value} est inférieur au minimum ${schema.minimum}`;
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      yield `${path}: ${JSON.stringify(value)} contient moins de ${schema.minItems} élément(s)`;
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      yield `${path}: ${JSON.stringify(value)} contient plus de ${schema.maxItems} élément(s)`;
    }
    const prefixLen = Array.isArray(schema.prefixItems) ? schema.prefixItems.length : 0;
    if (prefixLen > 0) {
      for (let i = 0; i < Math.min(value.length, prefixLen); i++) {
        yield* validateNode(value[i], schema.prefixItems[i], `${path}[${i}]`, rootSchema);
      }
    }
    if (schema.items === false && value.length > prefixLen) {
      yield `${path}: éléments supplémentaires non autorisés au-delà de ${prefixLen}`;
    } else if (schema.items && typeof schema.items === "object") {
      for (let i = prefixLen; i < value.length; i++) {
        yield* validateNode(value[i], schema.items, `${path}[${i}]`, rootSchema);
      }
    }
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    if (Array.isArray(schema.required)) {
      for (const req of schema.required) {
        if (!Object.prototype.hasOwnProperty.call(value, req)) {
          yield `${path}: propriété obligatoire manquante '${req}'`;
        }
      }
    }
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(value)) {
      if (Object.prototype.hasOwnProperty.call(props, k)) {
        yield* validateNode(v, props[k], `${path}.${k}`, rootSchema);
      } else if (schema.additionalProperties === false) {
        yield `${path}: propriété supplémentaire non autorisée '${k}'`;
      }
    }
  }

  if (Array.isArray(schema.allOf)) {
    for (const sub of schema.allOf) {
      yield* validateNode(value, sub, path, rootSchema);
    }
  }
  if (Array.isArray(schema.anyOf)) {
    const ok = schema.anyOf.some((sub) => [...validateNode(value, sub, path, rootSchema)].length === 0);
    if (!ok) yield `${path}: aucune branche anyOf n'est satisfaite`;
  }
  if (Array.isArray(schema.oneOf)) {
    const matches = schema.oneOf.filter((sub) => [...validateNode(value, sub, path, rootSchema)].length === 0).length;
    if (matches !== 1) yield `${path}: exactement une branche oneOf doit être satisfaite (${matches} trouvée(s))`;
  }
  if (schema.not !== undefined) {
    if ([...validateNode(value, schema.not, path, rootSchema)].length === 0) {
      yield `${path}: la contrainte not est violée`;
    }
  }
  if (schema.if !== undefined) {
    const condOk = [...validateNode(value, schema.if, path, rootSchema)].length === 0;
    if (condOk && schema.then !== undefined) {
      yield* validateNode(value, schema.then, path, rootSchema);
    } else if (!condOk && schema.else !== undefined) {
      yield* validateNode(value, schema.else, path, rootSchema);
    }
  }
}

export function* errors(step) {
  yield* validateNode(step, SCHEMA, "$", SCHEMA);
  if (!step || typeof step !== "object" || Array.isArray(step)) return;

  for (const field of ["mappings", "bundleTargets", "samples"]) {
    const value = step[field] ?? "[]";
    if (typeof value !== "string") continue;
    let content;
    try {
      content = value.trim() ? JSON.parse(value) : [];
    } catch (err) {
      yield `$.${field}: JSON invalide : ${err.message}`;
      continue;
    }
    const subSchema = { ...SCHEMA.properties[field].contentSchema, $defs: SCHEMA.$defs };
    for (const err of validateNode(content, subSchema, "$", subSchema)) {
      yield `$.${field} (décodé)${err.slice(1)}`;
    }
    if (field === "mappings" && Array.isArray(content)) {
      const ids = content
        .filter((rule) => rule && typeof rule === "object" && typeof rule.id === "string")
        .map((rule) => rule.id);
      if (ids.length !== new Set(ids).size) {
        yield "$.mappings : les ids de règle doivent être uniques dans une étape.";
      }
    }
  }
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) {
    console.error("Usage: node tools/check_mapping.mjs <fichier.json|fichier.xml> [...]");
    return argv.includes("-h") || argv.includes("--help") ? 0 : 2;
  }
  checkSchema(SCHEMA);
  let failed = false;
  for (const file of argv) {
    let problems = [];
    let stepList = [];
    try {
      const raw = readFileSync(file, "utf8");
      if (file.toLowerCase().endsWith(".xml")) {
        const { steps } = await import("./channel_mapping.mjs");
        const [, entries] = steps(raw);
        stepList = entries.map(([, , , step]) => step);
      } else {
        const value = JSON.parse(raw);
        stepList = Array.isArray(value) ? value : [value];
      }
      problems = stepList.flatMap((step, i) => [...errors(step)].map((err) => `${file}, étape ${i}: ${err}`));
    } catch (err) {
      problems = [`${file}: ${err.message}`];
    }
    if (problems.length > 0) {
      failed = true;
      console.error(problems.join("\n"));
    } else {
      console.log(`OK ${file} (${stepList.length} étape(s), structure seulement)`);
    }
  }
  return failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code));
}
