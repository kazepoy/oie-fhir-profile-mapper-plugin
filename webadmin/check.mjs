// SPDX-License-Identifier: MPL-2.0
import { readdir, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { parse } from "acorn";
import { catalogs } from "./src/i18n/index.js";

function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === "object") walk(value, visit);
  }
}
async function sources(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await sources(file));
    else if (file.endsWith(".js")) files.push(file);
  }
  return files;
}
const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
assert.deepEqual(Object.keys(catalogs.en).sort(), Object.keys(catalogs.fr).sort(), "The catalogs must have the same keys");
for (const key of Object.keys(catalogs.en)) {
  assert.equal(typeof catalogs.fr[key], "string", key);
  assert.ok(catalogs.fr[key].length, key);
  assert.deepEqual(placeholders(catalogs.fr[key]), placeholders(catalogs.en[key]), `Translation parameters: ${key}`);
}
const files = [...await sources("src"), ...await sources("test/unit"), "build.mjs", "check.mjs"];
for (const file of files) {
  const ast = parse(await readFile(file, "utf8"), { ecmaVersion: "latest", sourceType: "module" });
  if (!file.startsWith("src/") || file.includes("/locales/")) continue;
  walk(ast, node => {
    if (node.type !== "CallExpression" || !["tr", "t"].includes(node.callee.name)) return;
    const argument = node.arguments[0];
    if (argument?.type === "Literal" && typeof argument.value === "string")
      assert.ok(Object.hasOwn(catalogs.en, argument.value), `${file}: missing message ${argument.value}`);
  });
}
console.log(`${files.length} modules parsed; ${Object.keys(catalogs.en).length} English/French messages checked.`);
