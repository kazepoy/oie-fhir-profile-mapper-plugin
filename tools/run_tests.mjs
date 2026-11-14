#!/usr/bin/env node
// Valider hors ligne ou rejouer les samples d'exports JSON/XML, sans déployer de canal.
// SPDX-License-Identifier: MPL-2.0

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeResult } from "../webadmin/src/fhir/diagnostics.js";
import { steps as channelSteps } from "./channel_mapping.mjs";
import { errors } from "./check_mapping.mjs";

export function groups(path) {
  const filePath = String(path);
  const text = readFileSync(filePath, "utf8");
  if (extname(filePath).toLowerCase() === ".xml") {
    const [, entries] = channelSteps(text);
    const grouped = {};
    for (const [connector, kind, , step] of entries) {
      const key = `${connector}/${kind}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(step);
    }
    return grouped;
  }
  const value = JSON.parse(text);
  const steps = Array.isArray(value) ? value : [value];
  if (!steps.every((step) => step && typeof step === "object" && !Array.isArray(step))) {
    throw new Error("Une étape objet ou une liste d'étapes objets est requise.");
  }
  return { steps };
}

export function normalize(text) {
  if (text === null || text === undefined) return null;
  return normalizeResult(text);
}

export async function replay(path, post = null) {
  let count = 0;
  for (const [group, steps] of Object.entries(groups(path))) {
    for (let index = 0; index < steps.length; index++) {
      const problems = [...errors(steps[index])];
      if (problems.length > 0) {
        throw new Error(`${group}, étape ${index}: ${problems.join("; ")}`);
      }
    }
    const enabled = steps.filter((step) => String(step.enabled ?? true).toLowerCase() !== "false");
    for (const step of enabled) {
      const samples = JSON.parse(step.samples || "[]");
      for (const sample of samples) {
        const label = `${path} [${group}] ${step.name ?? step.resourceType} / ${sample.name}`;
        if (post !== null) {
          const selection =
            sample.scope === "transformer"
              ? { steps: enabled.map((s) => ({ ...s, samples: "[]" })) }
              : { step: { ...step, samples: "[]" } };
          const result = await post({
            ...selection,
            message: sample.message,
            dataType: sample.dataType || "HL7V2",
          });
          const invalid = (result.issues || []).filter((issue) =>
            ["error", "fatal"].includes(issue.severity)
          );
          if ((result.errors && result.errors.length > 0) || invalid.length > 0) {
            throw new Error(
              `${label}: ${JSON.stringify(result.errors?.length ? result.errors : invalid)}`
            );
          }
          const expected = sample.expected;
          if (expected !== null && expected !== undefined && expected !== "" && normalize(expected) !== normalize(result.output)) {
            throw new Error(`${label}: résultat différent de l’attendu`);
          }
        }
        count += 1;
        console.log(`OK ${label}${post === null ? " (structure seulement)" : ""}`);
      }
    }
  }
  return count;
}

export function client(url, user, password, insecure) {
  const endpoint = new URL(url.replace(/\/+$/, "") + "/extensions/fhir-profile-mapper/test");
  const auth = "Basic " + Buffer.from(`${user}:${password}`, "utf8").toString("base64");
  const transport = endpoint.protocol === "https:" ? https : http;

  return function post(body) {
    const payload = Buffer.from(JSON.stringify(body), "utf8");
    return new Promise((resolvePromise, rejectPromise) => {
      const req = transport.request(
        endpoint,
        {
          method: "POST",
          rejectUnauthorized: !insecure,
          timeout: 120_000,
          headers: {
            Authorization: auth,
            "X-Requested-With": "OpenAPI",
            "Content-Type": "text/plain; charset=UTF-8",
            Accept: "application/json",
            "Content-Length": payload.length,
          },
        },
        (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            if (res.statusCode < 200 || res.statusCode >= 300) {
              rejectPromise(new Error(`HTTP ${res.statusCode} lors de l’aperçu : ${text.slice(0, 300)}`));
              return;
            }
            try {
              resolvePromise(JSON.parse(text));
            } catch (err) {
              rejectPromise(new Error(`Réponse JSON invalide : ${err.message}`));
            }
          });
        }
      );
      req.on("error", rejectPromise);
      req.on("timeout", () => req.destroy(new Error("Délai dépassé lors de l’aperçu")));
      req.end(payload);
    });
  };
}

function collectFiles(paths) {
  const found = new Set();
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (
        entry.isFile() &&
        (entry.name.toLowerCase().endsWith(".xml") ||
          entry.name.endsWith(".step.json") ||
          entry.name.endsWith(".steps.json"))
      ) {
        found.add(full);
      }
    }
  }
  for (const p of paths) {
    const st = statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else if (st.isFile()) {
      found.add(p);
    }
  }
  return [...found].sort();
}

export async function main(argv = process.argv.slice(2), clientFactory = client) {
  let offline = false;
  let url = process.env.OIE_API || "https://localhost:8443/api";
  let user = process.env.OIE_USER || "admin";
  let insecure = false;
  const paths = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--offline") offline = true;
    else if (arg === "--insecure") insecure = true;
    else if (arg === "--url") url = argv[++i];
    else if (arg === "--user") user = argv[++i];
    else if (arg.startsWith("-")) {
      console.error(`Option inconnue : ${arg}`);
      return 2;
    } else {
      paths.push(arg);
    }
  }

  if (paths.length === 0) {
    console.error("Usage: node tools/run_tests.mjs [--offline] [--insecure] [--url URL] [--user USER] <paths...>");
    return 2;
  }
  const password = process.env.OIE_PASSWORD;
  if (!offline && !password) {
    console.error("Définir OIE_PASSWORD pour le rejeu serveur (ou utiliser --offline).");
    return 2;
  }
  if (paths.some((p) => !existsSync(p))) {
    console.error("Un chemin demandé n’existe pas.");
    return 2;
  }
  const files = collectFiles(paths);
  if (files.length === 0) {
    console.error("Aucun export trouvé.");
    return 2;
  }

  let failed = false;
  let count = 0;
  const post = offline ? null : clientFactory(url, user, password, insecure);
  for (const path of files) {
    try {
      count += await replay(path, post);
    } catch (err) {
      console.error(`ERREUR ${path}: ${err.message}`);
      failed = true;
    }
  }
  if (!offline && count === 0) {
    console.error("ERREUR aucun sample exécuté.");
    failed = true;
  }
  console.log(
    `${files.length} export(s), ${count} sample(s) ${offline ? "contrôlé(s) hors ligne" : "exécuté(s)"}. Compte rendu : ${failed ? "ÉCHEC" : "OK"}.`
  );
  return failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code));
}
