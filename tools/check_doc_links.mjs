#!/usr/bin/env node
// Reject broken local Markdown links and orphan documents under doc/.
// SPDX-License-Identifier: MPL-2.0

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IGNORED_PARTS = new Set([".git", "node_modules", "target", "reports"]);
const LINK = /!?\[[^\]]*\]\(([^)]+)\)/g;

export function stripFencedCodeBlocks(markdown) {
  return markdown.replace(/^( {0,3}(`{3,}|~{3,})).*?\n[\s\S]*?^\1\s*$/gm, "");
}

export function markdownFiles(root = ROOT) {
  const results = new Set();
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (IGNORED_PARTS.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.add(resolve(full));
      }
    }
  }
  walk(root);
  return results;
}

export function localTarget(source, raw, root = ROOT) {
  let value = raw.trim();
  if (value.startsWith("<") && value.includes(">")) {
    value = value.slice(1, value.indexOf(">"));
  } else {
    value = value.split(/\s+/)[0] || "";
  }
  if (!value || value.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return null;
  }
  value = decodeURIComponent(value.split("#", 1)[0]);
  if (!value) return source;
  return value.startsWith("/")
    ? resolve(root, value.replace(/^\/+/, ""))
    : resolve(dirname(source), value);
}

export function checkDocs(root = ROOT) {
  const resolvedRoot = resolve(root);
  const files = markdownFiles(resolvedRoot);
  const graph = new Map([...files].map((p) => [p, new Set()]));
  const broken = [];

  for (const source of [...files].sort()) {
    const content = stripFencedCodeBlocks(readFileSync(source, "utf8"));
    for (const match of content.matchAll(LINK)) {
      const raw = match[1];
      const target = localTarget(source, raw, resolvedRoot);
      if (!target) continue;
      if (!existsSync(target)) {
        broken.push([source, raw]);
      } else if (files.has(target)) {
        graph.get(source).add(target);
      }
    }
  }

  const entry = resolve(resolvedRoot, "doc/README.md");
  const reachable = new Set();
  const pending = existsSync(entry) ? [entry] : [];
  while (pending.length > 0) {
    const current = pending.pop();
    if (reachable.has(current)) continue;
    reachable.add(current);
    for (const next of graph.get(current) || []) {
      pending.push(next);
    }
  }

  const docRoot = resolve(resolvedRoot, "doc") + sep;
  const orphans = [...files]
    .filter((p) => (p === resolve(resolvedRoot, "doc") || p.startsWith(docRoot)) && !reachable.has(p))
    .sort();

  return { files, broken, orphans };
}

export function main(root = ROOT) {
  const { files, broken, orphans } = checkDocs(root);
  for (const [source, raw] of broken) {
    console.error(`Lien local cassé : ${relative(root, source)} -> ${raw}`);
  }
  for (const orphan of orphans) {
    console.error(`Document orphelin : ${relative(root, orphan)}`);
  }
  if (broken.length > 0 || orphans.length > 0) {
    return 1;
  }
  console.log(
    `Documentation : ${files.size} fichiers Markdown, liens locaux valides, aucun document orphelin.`
  );
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
