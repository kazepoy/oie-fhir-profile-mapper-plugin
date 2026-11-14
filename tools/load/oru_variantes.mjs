#!/usr/bin/env node
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Variantes du canal « ORU R01 to FHIR Bundle » pour mesurer validation et trace.
//   node tools/load/oru_variantes.mjs deploy    importe et déploie les variantes
//   node tools/load/oru_variantes.mjs remove    les arrête et les supprime

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { encodeXml } from "../channel_mapping.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const SOURCE = resolve(ROOT, "demo/oie-init/data/channels/oru-r01-to-fhir-bundle.xml");
const API = process.env.OIE_API || "https://localhost:8443/api";
const AUTH = Buffer.from(
  `${process.env.OIE_USER || "admin"}:${process.env.OIE_PASSWORD || "demo-oie-password"}`,
  "utf8"
).toString("base64");
const STEP = "fr.kazepoy.fhir.mapper.FhirProfileMapperStep";

// nom, port, validation du mapper, trace du mapper, validation du datatype FHIR en sortie.
export const VARIANTES = [
  ["validation+trace", 10891, true, true, true],
  ["validation", 10892, true, false, true],
  ["trace", 10893, false, true, true],
  ["sans", 10894, false, false, true],
  ["sans-datatype", 10895, false, false, false],
];

// RFC 4122 UUID v5 avec NAMESPACE_URL (6ba7b811-9dad-11d1-80b4-00c04fd430c8)
const NAMESPACE_URL_BYTES = Buffer.from("6ba7b8119dad11d180b400c04fd430c8", "hex");

export function channelId(nom) {
  const hash = createHash("sha1")
    .update(NAMESPACE_URL_BYTES)
    .update(`oie-fhir-profile-mapper/charge/oru/${nom}`, "utf8")
    .digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function setChildXml(blockXml, tag, value, indent = "          ") {
  const escaped = tag.replaceAll(".", "\\.");
  const rendered = `<${tag}>${encodeXml(value)}</${tag}>`;
  const selfClosing = new RegExp(`<${escaped}(?:\\s[^>]*)?\\/>`);
  if (selfClosing.test(blockXml)) {
    return blockXml.replace(selfClosing, rendered);
  }
  const existing = new RegExp(`<${escaped}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${escaped}>`);
  if (existing.test(blockXml)) {
    return blockXml.replace(existing, rendered);
  }
  const closeMatch = blockXml.match(/\n([ \t]*)<\/[^>]+>\s*$/);
  if (!closeMatch) throw new Error(`Closing tag not found when setting <${tag}>`);
  const insertAt = blockXml.lastIndexOf(closeMatch[0]);
  return `${blockXml.slice(0, insertAt)}\n${indent}${rendered}${blockXml.slice(insertAt)}`;
}

export function variante(nom, port, validation, trace, datatype) {
  let xml = readFileSync(SOURCE, "utf8");
  const cid = channelId(nom);
  const desc = `Variante de test de charge (tools/load) : validation mapper ${validation ? "oui" : "non"}, trace ${trace ? "oui" : "non"}, validation datatype ${datatype ? "oui" : "non"}.`;

  xml = xml.replace(/<id>[^<]*<\/id>/, `<id>${cid}</id>`);
  xml = xml.replace(/<name>[^<]*<\/name>/, `<name>Charge ORU – ${encodeXml(nom)}</name>`);
  xml = xml.replace(/<description>[\s\S]*?<\/description>/, `<description>${encodeXml(desc)}</description>`);
  xml = xml.replace(
    /(<listenerConnectorProperties[\s\S]*?<port>)[^<]*(<\/port>)/,
    `$1${port}$2`
  );

  const stepRe = new RegExp(`<${STEP.replaceAll(".", "\\.")}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${STEP.replaceAll(".", "\\.")}>`, "g");
  let stepCount = 0;
  xml = xml.replace(stepRe, (stepBlock) => {
    stepCount += 1;
    let updated = stepBlock;
    updated = setChildXml(updated, "validateOutput", String(validation), "            ");
    updated = setChildXml(updated, "traceMessages", String(trace), "            ");
    updated = setChildXml(updated, "traceCaptureValues", "false", "            ");
    return updated;
  });
  if (stepCount !== 7) {
    throw new Error(`Expected 7 Profile Mapper steps in ${SOURCE}, found ${stepCount}`);
  }

  xml = xml.replace(
    /<outboundProperties[\s\S]*?<\/outboundProperties>/,
    (outboundBlock) =>
      outboundBlock.replace(
        /<serializationProperties[\s\S]*?<\/serializationProperties>/,
        (serBlock) => {
          let updated = setChildXml(serBlock, "validateOutbound", String(datatype), "            ");
          updated = setChildXml(updated, "validateInbound", String(datatype), "            ");
          return updated;
        }
      )
  );
  return { id: cid, xml };
}

function api(method, path, data = null) {
  const endpoint = new URL(API.replace(/\/+$/, "") + path);
  const transport = endpoint.protocol === "https:" ? https : http;
  const payload = data !== null ? Buffer.from(data, "utf8") : null;

  return new Promise((resolvePromise, rejectPromise) => {
    const headers = {
      Authorization: `Basic ${AUTH}`,
      "X-Requested-With": "OpenAPI",
    };
    if (payload !== null) {
      headers["Content-Type"] = "application/xml";
      headers["Content-Length"] = payload.length;
    }
    const req = transport.request(
      endpoint,
      {
        method,
        rejectUnauthorized: false,
        timeout: 300_000,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if (res.statusCode < 200 || res.statusCode >= 300) {
            rejectPromise(new Error(`HTTP ${res.statusCode} sur ${method} ${path} : ${text.slice(0, 500)}`));
            return;
          }
          resolvePromise(text);
        });
      }
    );
    req.on("error", rejectPromise);
    if (payload !== null) req.write(payload);
    req.end();
  });
}

export async function deploy() {
  for (const [nom, port, ...flags] of VARIANTES) {
    const { id: cid, xml } = variante(nom, port, ...flags);
    await api("PUT", `/channels/${cid}?override=true`, xml);
    await api("POST", `/channels/${cid}/_deploy?returnErrors=true`);
    console.log(`déployé  ${port}  ${nom.padEnd(16)} ${cid}`);
  }
}

export async function remove() {
  for (const [nom, port] of VARIANTES) {
    const cid = channelId(nom);
    const existing = await api("GET", `/channels/${cid}`);
    if (!existing.trim()) continue;
    await api("POST", `/channels/${cid}/_undeploy?returnErrors=true`);
    await api("DELETE", `/channels/${cid}`);
    console.log(`supprimé ${port}  ${nom}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2];
  if (cmd === "deploy") await deploy();
  else if (cmd === "remove") await remove();
  else {
    console.error("Usage: node tools/load/oru_variantes.mjs <deploy|remove>");
    process.exit(1);
  }
}
