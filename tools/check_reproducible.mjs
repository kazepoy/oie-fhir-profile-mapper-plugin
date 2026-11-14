#!/usr/bin/env node
// Rebuild in a fresh directory with a stale frontend and compare the complete ZIP.
// SPDX-License-Identifier: MPL-2.0

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IGNORED_NAMES = new Set([
  ".git",
  ".vscode",
  "node_modules",
  "target",
  "__pycache__",
  ".env",
  "output",
  "reports",
  ".DS_Store",
]);

export function readZipEntries(buffer) {
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Invalid ZIP archive (EOCD not found)");
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = new Map();

  for (let i = 0; i < totalEntries; i++) {
    if (buffer.readUInt32LE(cdOffset) !== 0x02014b50) {
      throw new Error("Invalid ZIP central directory header");
    }
    const method = buffer.readUInt16LE(cdOffset + 10);
    const crc32 = buffer.readUInt32LE(cdOffset + 16);
    const compressedSize = buffer.readUInt32LE(cdOffset + 20);
    const uncompressedSize = buffer.readUInt32LE(cdOffset + 24);
    const nameLen = buffer.readUInt16LE(cdOffset + 28);
    const extraLen = buffer.readUInt16LE(cdOffset + 30);
    const commentLen = buffer.readUInt16LE(cdOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(cdOffset + 42);
    const name = buffer.subarray(cdOffset + 46, cdOffset + 46 + nameLen).toString("utf8");

    const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const rawData = buffer.subarray(dataStart, dataStart + compressedSize);

    entries.set(name, {
      name,
      method,
      crc32,
      compressedSize,
      uncompressedSize,
      readContent() {
        if (method === 0) return rawData;
        if (method === 8) return inflateRawSync(rawData);
        throw new Error(`Unsupported ZIP compression method: ${method}`);
      },
    });
    cdOffset += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

export function diffZipBuffers(refBuf, rebBuf) {
  const a = readZipEntries(refBuf);
  const b = readZipEntries(rebBuf);
  const diffs = [];
  for (const name of new Set([...a.keys(), ...b.keys()])) {
    const ea = a.get(name);
    const eb = b.get(name);
    if (!ea) diffs.push(`+ ${name}`);
    else if (!eb) diffs.push(`- ${name}`);
    else if (ea.crc32 !== eb.crc32 || ea.uncompressedSize !== eb.uncompressedSize) {
      diffs.push(
        `! ${name} (ref crc=${ea.crc32.toString(16)} size=${ea.uncompressedSize}, rebuilt crc=${eb.crc32.toString(16)} size=${eb.uncompressedSize})`
      );
    }
  }
  return diffs;
}

export function main() {
  const targetDir = join(ROOT, "target");
  const archives = readdirSync(targetDir)
    .filter((name) => /^fhir-profile-mapper-.*\.zip$/.test(name))
    .map((name) => join(targetDir, name));
  if (archives.length !== 1) {
    console.error("Run mvn clean package first (one ZIP expected).");
    return 1;
  }
  const reference = readFileSync(archives[0]);
  const temporary = mkdtempSync(join(tmpdir(), "fhir-mapper-repro-"));
  try {
    const checkout = join(temporary, "project");
    cpSync(ROOT, checkout, {
      recursive: true,
      filter(src) {
        const name = basename(src);
        if (IGNORED_NAMES.has(name) || name.startsWith(".env.")) return false;
        return true;
      },
    });
    writeFileSync(
      join(checkout, "webadmin/web/plugin.js"),
      "STALE_FRONTEND_MUST_NOT_BE_PACKAGED",
      "utf8"
    );
    execFileSync("mvn", ["-B", "-ntp", "-q", "-DskipTests", "clean", "package"], {
      cwd: checkout,
      stdio: "inherit",
    });
    const rebuiltPath = join(checkout, "target", basename(archives[0]));
    const rebuilt = readFileSync(rebuiltPath);
    const entries = readZipEntries(rebuilt);
    const frontendEntry = [...entries.values()].find((e) => e.name.endsWith("/webadmin/web/plugin.js"));
    if (!frontendEntry) {
      throw new Error("webadmin/web/plugin.js missing in rebuilt ZIP archive.");
    }
    if (frontendEntry.readContent().includes(Buffer.from("STALE_FRONTEND_MUST_NOT_BE_PACKAGED"))) {
      throw new Error("Stale frontend bundle was packaged instead of being rebuilt.");
    }
    if (!rebuilt.equals(reference)) {
      const diffs = diffZipBuffers(reference, rebuilt);
      console.error("The two ZIP archives differ:", diffs.length ? diffs.join(", ") : "envelope bytes differ");
      return 1;
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
  console.log("Identical ZIP after clean rebuild in another directory; stale frontend replaced.");
  console.log("SHA-256:", createHash("sha256").update(reference).digest("hex"));
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
