// SPDX-License-Identifier: MPL-2.0
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { checkDocs } from "../check_doc_links.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("repository documentation has valid local links and no orphan pages", () => {
  const { files, broken, orphans } = checkDocs(ROOT);
  assert.ok(files.size >= 70);
  assert.deepEqual(broken, []);
  assert.deepEqual(orphans, []);
});

test("detects broken links, orphan pages under doc/, and ignores fenced code blocks", () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "fhir-mapper-docs-"));
  try {
    mkdirSync(join(tempRoot, "doc"), { recursive: true });
    writeFileSync(
      join(tempRoot, "doc/README.md"),
      [
        "# Index",
        "- [Guide](guide.md)",
        "```markdown",
        "[Ignored link inside code fence](does-not-exist.md)",
        "```",
      ].join("\n"),
      "utf8"
    );
    writeFileSync(
      join(tempRoot, "doc/guide.md"),
      "# Guide\nVoir [manquant](missing.md).\n",
      "utf8"
    );
    writeFileSync(join(tempRoot, "doc/orphan.md"), "# Orphelin\n", "utf8");

    const { broken, orphans } = checkDocs(tempRoot);
    assert.equal(broken.length, 1);
    assert.equal(broken[0][1], "missing.md");
    assert.equal(orphans.length, 1);
    assert.ok(orphans[0].endsWith("doc/orphan.md"));
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
