#!/usr/bin/env node
// Lister, extraire et modifier une étape mapper ou FML dans un export XML OIE.
// SPDX-License-Identifier: MPL-2.0

import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { errors, FML_PROPERTIES, fmlErrors, SCHEMA } from "./check_mapping.mjs";

export const TYPE = "fr.kazepoy.fhir.mapper.FhirProfileMapperStep";
export const FML_TYPE = "fr.kazepoy.fhir.fml.FhirFmlTransformStep";
export const PATTERN = new RegExp(`<${TYPE.replaceAll(".", "\\.")}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${TYPE.replaceAll(".", "\\.")}>`, "g");

export function decodeXml(text = "") {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g, (_, entity) => {
    if (entity === "lt") return "<";
    if (entity === "gt") return ">";
    if (entity === "amp") return "&";
    if (entity === "quot") return '"';
    if (entity === "apos") return "'";
    if (entity.startsWith("#x")) return String.fromCodePoint(parseInt(entity.slice(2), 16));
    return String.fromCodePoint(parseInt(entity.slice(1), 10));
  });
}

export function encodeXml(text = "") {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function findDirectChild(xml, tagName) {
  const re = new RegExp(`<${tagName.replaceAll(".", "\\.")}(?:\\s[^>]*)?\\/>|<${tagName.replaceAll(".", "\\.")}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName.replaceAll(".", "\\.")}>`);
  const m = re.exec(xml);
  if (!m) return null;
  return m[1] === undefined ? "" : decodeXml(m[1]);
}

export function findPathText(xml, path) {
  const parts = path.split("/").filter(Boolean);
  let current = xml;
  for (let i = 0; i < parts.length; i++) {
    const tag = parts[i].replaceAll(".", "\\.");
    if (i === parts.length - 1) {
      return findDirectChild(current, parts[i]);
    }
    const m = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`).exec(current);
    if (!m) return null;
    current = m[1];
  }
  return null;
}

function parseStepChildren(stepXml, tagName) {
  const openEnd = stepXml.indexOf(">");
  const closeStart = stepXml.lastIndexOf(`</${tagName}>`);
  if (openEnd < 0 || closeStart < 0) {
    throw new Error(`Élément XML invalide : ${tagName}`);
  }
  const inner = stepXml.slice(openEnd + 1, closeStart);
  const childRe = /<([A-Za-z0-9_.-]+)(?:\s[^>]*)?\/>|<([A-Za-z0-9_.-]+)(?:\s[^>]*)?>([\s\S]*?)<\/\2>/g;
  const step = {};
  const childSpans = new Map();
  let match;
  while ((match = childRe.exec(inner)) !== null) {
    const childTag = match[1] || match[2];
    const value = match[1] ? "" : decodeXml(match[3]);
    step[childTag] = value;
    childSpans.set(childTag, {
      relStart: openEnd + 1 + match.index,
      relEnd: openEnd + 1 + match.index + match[0].length,
    });
  }
  return { step, childSpans };
}

function findBlocks(xml, tagName, baseOffset = 0) {
  const escaped = tagName.replaceAll(".", "\\.");
  const re = new RegExp(`<${escaped}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${escaped}>`, "g");
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push({
      tag: tagName,
      start: baseOffset + m.index,
      end: baseOffset + m.index + m[0].length,
      xml: m[0],
    });
  }
  return results;
}

export function steps(xml, { includeFml = false } = {}) {
  const trimmed = xml.replace(/^\uFEFF/, "").replace(/^(?:\s*<\?xml[^?]*\?>|\s*<!--[\s\S]*?-->)*/g, "").trim();
  if (!/^<channel(?:\s|>)/.test(trimmed) || !trimmed.endsWith("</channel>")) {
    throw new Error("Un export XML d'un seul channel est requis.");
  }
  const root = {
    xml,
    findtext(path) {
      return findPathText(xml, path);
    },
  };

  const connectorBlocks = [];
  const sourceBlock = findBlocks(xml, "sourceConnector")[0];
  if (sourceBlock) connectorBlocks.push(sourceBlock);
  const destContainer = findBlocks(xml, "destinationConnectors")[0];
  if (destContainer) {
    connectorBlocks.push(...findBlocks(destContainer.xml, "connector", destContainer.start));
  }

  const targetTypes = includeFml ? [TYPE, FML_TYPE] : [TYPE];
  const entries = [];

  for (const connector of connectorBlocks) {
    const cid = findDirectChild(connector.xml, "metaDataId");
    for (const kind of ["transformer", "responseTransformer"]) {
      const trBlock = findBlocks(connector.xml, kind, connector.start)[0];
      if (!trBlock) continue;
      const elBlock = findBlocks(trBlock.xml, "elements", trBlock.start)[0];
      if (!elBlock) continue;
      const stepNodes = targetTypes
        .flatMap((t) => findBlocks(elBlock.xml, t, elBlock.start))
        .sort((a, b) => a.start - b.start);
      for (const node of stepNodes) {
        const { step, childSpans } = parseStepChildren(node.xml, node.tag);
        Object.defineProperty(step, "__type", {
          value: node.tag,
          enumerable: false,
          configurable: true,
          writable: true,
        });
        entries.push([cid, kind, { ...node, childSpans }, step]);
      }
    }
  }
  return [root, entries];
}

export function select(xml, connector, sequence, response = false) {
  const [root, entries] = steps(xml, { includeFml: true });
  const expectedKind = response ? "responseTransformer" : "transformer";
  const matches = entries
    .filter(([cid, kind, , step]) => cid === String(connector) && step.sequenceNumber === String(sequence) && kind === expectedKind)
    .map(([, , node, step]) => [node, step]);
  if (matches.length !== 1) {
    throw new Error("La sélection doit désigner exactement une étape mapper ou FML (connecteur/séquence/réponse).");
  }
  return [root, matches[0][0], matches[0][1]];
}

function updateStepXml(node, patch) {
  let stepXml = node.xml;
  const { childSpans } = parseStepChildren(stepXml, node.tag);
  const indentMatch = stepXml.match(/\n([ \t]+)<[A-Za-z0-9_.-]+/);
  const childIndent = indentMatch ? indentMatch[1] : "            ";
  const closeIndentMatch = stepXml.match(/\n([ \t]*)<\/[^>]+>\s*$/);
  const closeIndent = closeIndentMatch ? closeIndentMatch[1] : "          ";

  const replacements = [];
  const additions = [];
  for (const [key, rawValue] of Object.entries(patch)) {
    if (key === "__type" || key === "sequenceNumber" || key === "enabled") continue;
    const strVal = typeof rawValue === "boolean" ? String(rawValue).toLowerCase() : String(rawValue ?? "");
    const encoded = encodeXml(strVal);
    const rendered = `<${key}>${encoded}</${key}>`;
    if (childSpans.has(key)) {
      const span = childSpans.get(key);
      replacements.push({ start: span.relStart, end: span.relEnd, text: rendered });
    } else {
      additions.push(`${childIndent}${rendered}`);
    }
  }

  replacements.sort((a, b) => b.start - a.start);
  for (const r of replacements) {
    stepXml = stepXml.slice(0, r.start) + r.text + stepXml.slice(r.end);
  }
  if (additions.length > 0) {
    const closeTag = `</${node.tag}>`;
    const closeIdx = stepXml.lastIndexOf(closeTag);
    const prefix = stepXml.slice(0, closeIdx).replace(/[ \t]*$/, "");
    const newline = prefix.endsWith("\n") ? "" : "\n";
    stepXml = `${prefix}${newline}${additions.join("\n")}\n${closeIndent}${closeTag}`;
  }
  return stepXml;
}

export function apply(xml, connector, sequence, patch, response = false) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new Error("Une étape JSON objet est requise.");
  }
  const [, node, current] = select(xml, connector, sequence, response);
  const expectedType = current.__type || TYPE;
  if ((patch.__type ?? expectedType) !== expectedType) {
    throw new Error("Type d'étape incompatible.");
  }

  const { __type: _ignore, ...cleanPatch } = patch;
  const merged = {
    ...current,
    ...cleanPatch,
    sequenceNumber: current.sequenceNumber,
    enabled: current.enabled ?? "true",
  };

  if (expectedType === TYPE) {
    const problems = [...errors(merged)];
    if (problems.length > 0) {
      throw new Error(problems.join("\n"));
    }
    for (const key of Object.keys(patch)) {
      if (key === "__type" || key === "sequenceNumber" || key === "enabled") continue;
      if (!Object.prototype.hasOwnProperty.call(SCHEMA.properties, key) && !node.childSpans.has(key)) {
        throw new Error(`Propriété inconnue : ${key}`);
      }
    }
  } else if (expectedType === FML_TYPE) {
    for (const key of Object.keys(patch)) {
      if (key === "__type" || key === "sequenceNumber" || key === "enabled") continue;
      if (!FML_PROPERTIES.has(key) && !node.childSpans.has(key)) {
        throw new Error(`Propriété FML inconnue : ${key}`);
      }
    }
    const problems = [...fmlErrors(merged)];
    if (problems.length > 0) {
      throw new Error(problems.join("\n"));
    }
  }

  const replacement = updateStepXml(node, patch);
  return xml.slice(0, node.start) + replacement + xml.slice(node.end);
}

export function explainStep(step) {
  if (step.__type === FML_TYPE) {
    return {
      __type: FML_TYPE,
      name: step.name,
      fhirVersion: step.fhirVersion || "R4",
      context: step.context || "",
      profiles: step.profiles || "",
      mapUrl: step.mapUrl || "",
      hasInlineMap: Boolean((step.mapSource || "").trim()),
      sourceModel: step.sourceModel || "oie-message",
      sourceModelUrl: step.sourceModelUrl || "",
      variable: step.variable || "",
      validateOutput: step.validateOutput ?? "true",
      contextVariables: step.contextVariables || "",
    };
  }
  const rules = JSON.parse(step.mappings || "[]");
  return {
    __type: TYPE,
    name: step.name,
    action: step.action,
    resourceType: step.resourceType,
    fhirVersion: step.fhirVersion || "R4",
    profileUrl: step.profileUrl || "",
    context: step.context || "",
    validation: step.validation || "",
    formatVersion: step.formatVersion ?? "1",
    variable: step.variable || "",
    bundleName: step.bundleName || "",
    bundleType: step.bundleType || "",
    refName: step.refName || "",
    targets: JSON.parse(step.bundleTargets || "[]"),
    validateOutput: step.validateOutput ?? "true",
    rules: rules.map((r) => {
      const entry = {
        id: r.id,
        key: r.key ?? r.element,
        path: r.path,
        operation: "each" in r ? "iteration" : "condition" in r ? "condition" : "fixed" in r ? "fixed" : "value",
        expression: r.expression ?? r.condition ?? r.each ?? r.fixed,
      };
      if (r.variable !== undefined) entry.variable = r.variable;
      if (r.type !== undefined) entry.type = r.type;
      if (r.when !== undefined) entry.when = r.when;
      if (r.translate !== undefined) entry.translate = r.translate;
      if (r.note !== undefined) entry.note = r.note;
      if (r.disabled !== undefined) entry.disabled = r.disabled;
      return entry;
    }),
  };
}

export function main(argv = process.argv.slice(2)) {
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      options: {
        connector: { type: "string", default: "0" },
        sequence: { type: "string" },
        response: { type: "boolean", default: false },
        step: { type: "string" },
        output: { type: "string" },
        "assign-ids": { type: "boolean", default: false },
        "include-fml": { type: "boolean", default: false },
      },
      allowPositionals: true,
    });
    const [command, channelPath] = positionals;
    if (!["list", "extract", "apply", "explain"].includes(command) || !channelPath) {
      throw new Error("Usage: node tools/channel_mapping.mjs <list|extract|apply|explain> <channel.xml> [options]");
    }
    const xml = readFileSync(channelPath, "utf8");
    let result;
    if (command === "list") {
      const [, entries] = steps(xml, { includeFml: values["include-fml"] });
      result = entries.map(([cid, kind, , step]) => ({
        connector: cid,
        response: kind === "responseTransformer",
        ...step,
      }));
    } else {
      if (values.sequence === undefined) {
        throw new Error("--sequence est requis ; list permet de trouver la sélection.");
      }
      const [, , step] = select(xml, values.connector, values.sequence, values.response);
      if (command === "apply") {
        if (!values.step || !values.output) {
          throw new Error("apply exige --step et --output.");
        }
        const patch = JSON.parse(readFileSync(values.step, "utf8"));
        const patched = apply(xml, values.connector, values.sequence, patch, values.response);
        writeFileSync(values.output, patched, "utf8");
        return 0;
      }
      if (step.__type === TYPE) {
        const rules = JSON.parse(step.mappings || "[]");
        if (values["assign-ids"]) {
          for (const rule of rules) {
            if (!rule.id) rule.id = randomUUID();
          }
          step.mappings = JSON.stringify(rules);
        }
      }
      result = command === "explain" ? explainStep(step) : step;
    }
    const text = JSON.stringify(result, null, 2) + "\n";
    if (values.output) {
      writeFileSync(values.output, text, "utf8");
    } else {
      process.stdout.write(text);
    }
    return 0;
  } catch (err) {
    console.error(err.message);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
