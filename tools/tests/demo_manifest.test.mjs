// Cohérence hors ligne entre examples/channels.json, les exports XML, les groupes/tags et tools/load.
// SPDX-License-Identifier: MPL-2.0

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { findPathText, FML_TYPE, steps } from "../channel_mapping.mjs";
import { VARIANTES, variante } from "../load/oru_variantes.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const EXAMPLES_DIR = join(ROOT, "examples");
const CHANNELS_DIR = join(ROOT, "demo/oie-init/data/channels");
const GROUPS_DIR = join(ROOT, "demo/oie-init/data/groups");

function findAllBlocks(xml, tagName) {
  const escaped = tagName.replaceAll(".", "\\.");
  const re = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "g");
  return [...xml.matchAll(re)].map((m) => m[1]);
}

test("demo matrix covers exports and their test material", () => {
  const manifest = JSON.parse(readFileSync(join(EXAMPLES_DIR, "channels.json"), "utf8"));
  const cases = manifest.channels;
  const names = cases.map((c) => c.channel);
  assert.equal(names.length, new Set(names).size);

  const actualFiles = new Set(readdirSync(CHANNELS_DIR).filter((f) => f.endsWith(".xml")));
  assert.deepEqual(actualFiles, new Set(names));

  for (const c of cases) {
    assert.ok(c.group, c.channel);
    assert.ok(Array.isArray(c.tags) && c.tags.length > 0, c.channel);
    assert.ok(existsSync(join(EXAMPLES_DIR, c.input)), `${c.channel}: missing ${c.input}`);

    const xml = readFileSync(join(CHANNELS_DIR, c.channel), "utf8");
    const [root, allEntries] = steps(xml, { includeFml: true });
    assert.ok(root.findtext("sourceConnector/transformer/inboundTemplate"), c.channel);

    const mappers = allEntries.filter(([, , , s]) => s.__type !== FML_TYPE).map(([, , , s]) => s);
    const fmls = allEntries.filter(([, , , s]) => s.__type === FML_TYPE).map(([, , , s]) => s);

    if (mappers.length > 0) {
      const samples = mappers.flatMap((s) => JSON.parse(s.samples || "[]"));
      assert.ok(samples.length > 0, `${c.channel}: expected saved samples`);
      assert.ok(samples.every((s) => s.message && s.expected), `${c.channel}: sample missing message/expected`);
    } else if (c.mock) {
      assert.equal(fmls.length, 0, c.channel);
    } else {
      assert.ok(c.preview, `${c.channel}: expected preview definition`);
      assert.ok(existsSync(join(EXAMPLES_DIR, c.preview.input)), c.channel);
      const expectedJson = JSON.parse(readFileSync(join(EXAMPLES_DIR, c.preview.expected), "utf8"));
      assert.ok("resourceType" in expectedJson, c.channel);
    }

    if (c.deployed) {
      const port = Number(root.findtext("sourceConnector/properties/listenerConnectorProperties/port"));
      assert.equal(c.deployed.port, port, c.channel);
      assert.ok(existsSync(join(EXAMPLES_DIR, c.invalid.input)), c.channel);
      assert.ok(c.invalid.diagnostic, c.channel);
      const deployedExpected = JSON.parse(readFileSync(join(EXAMPLES_DIR, c.deployed.expected), "utf8"));
      assert.ok("resourceType" in deployedExpected, c.channel);
    }
  }
});

test("native groups and tags match the demo manifest", () => {
  const manifest = JSON.parse(readFileSync(join(EXAMPLES_DIR, "channels.json"), "utf8"));
  const exportsByChannel = new Map(
    manifest.channels.map((c) => [c.channel, readFileSync(join(CHANNELS_DIR, c.channel), "utf8")])
  );

  const ports = [...exportsByChannel.values()].map((xml) =>
    findPathText(xml, "sourceConnector/properties/listenerConnectorProperties/port")
  );
  assert.equal(ports.length, new Set(ports).size, "Duplicate channel ports found");

  const members = new Set();
  for (const def of manifest.groups) {
    const groupXml = readFileSync(join(GROUPS_DIR, `${def.key}.xml`), "utf8");
    const groupBlock = findAllBlocks(groupXml, "channelGroup")[0];
    assert.ok(groupBlock, `Missing channelGroup in ${def.key}.xml`);
    assert.equal(findPathText(groupBlock, "id"), def.id);
    assert.equal(findPathText(groupBlock, "name"), def.name);

    const expected = new Set(
      manifest.channels
        .filter((c) => c.group === def.key)
        .map((c) => findPathText(exportsByChannel.get(c.channel), "id"))
    );
    const channelsContainer = findAllBlocks(groupBlock, "channels")[0] || "";
    const actual = new Set(
      findAllBlocks(channelsContainer, "channel").map((ch) => findPathText(ch, "id"))
    );
    assert.deepEqual(actual, expected, `Group membership mismatch for ${def.key}`);
    for (const id of actual) {
      assert.ok(!members.has(id), `Channel ${id} belongs to multiple groups`);
      members.add(id);
    }
  }

  const allChannelIds = new Set([...exportsByChannel.values()].map((xml) => findPathText(xml, "id")));
  assert.deepEqual(members, allChannelIds);

  const seenTags = new Map();
  const forbiddenTags = new Set(["IG", "FR-Core-2-2-0", "EU-Lab-2-0-0", "profil-local", "local-profile"]);
  const releases = new Set(["R4", "R5"]);
  const sources = new Set(["CSV", "FHIR", "HL7v2", "HTTP", "JSON", "XML"]);
  const transfos = new Set(["FML", "Mapper", "Mock"]);

  for (const c of manifest.channels) {
    const xml = exportsByChannel.get(c.channel);
    const channelId = findPathText(xml, "id");
    const tagsSection = findAllBlocks(xml, "channelTags")[0] || "";
    const tagBlocks = findAllBlocks(tagsSection, "channelTag");
    const xmlTagNames = tagBlocks.map((b) => findPathText(b, "name"));
    assert.deepEqual(xmlTagNames, c.tags, `Tag order mismatch in ${c.channel}`);

    const canonical = [
      ...xmlTagNames.filter((t) => releases.has(t)).sort(),
      ...xmlTagNames.filter((t) => sources.has(t)).sort(),
      ...xmlTagNames.filter((t) => transfos.has(t)).sort(),
      ...xmlTagNames.filter((t) => !releases.has(t) && !sources.has(t) && !transfos.has(t)).sort(),
    ];
    assert.deepEqual(xmlTagNames, canonical, `Non-canonical tag order in ${c.channel}`);

    for (const tagBlock of tagBlocks) {
      const name = findPathText(tagBlock, "name");
      if (releases.has(name) || sources.has(name) || transfos.has(name)) {
        assert.match(name, /^[A-Za-z0-9-]+$/);
      } else {
        assert.match(name, /^[a-z0-9-]+$/, `Feature tag ${name} must be lowercase kebab-case`);
      }
      assert.ok(!forbiddenTags.has(name), `Forbidden tag ${name}`);
      const idsBlock = findAllBlocks(tagBlock, "channelIds")[0] || "";
      const taggedIds = findAllBlocks(idsBlock, "string");
      assert.deepEqual(taggedIds, [channelId]);

      const r = Number(findPathText(tagBlock, "backgroundColor/red"));
      const g = Number(findPathText(tagBlock, "backgroundColor/green"));
      const b = Number(findPathText(tagBlock, "backgroundColor/blue"));
      assert.notDeepEqual([r, g, b], [192, 192, 192], `Tag ${name} uses default gray color`);
      const spec = `${findPathText(tagBlock, "id")}:${r},${g},${b}`;
      if (seenTags.has(name)) {
        assert.equal(seenTags.get(name), spec, `Inconsistent tag spec for ${name}`);
      } else {
        seenTags.set(name, spec);
      }
    }
  }
});

test("load variant generator produces valid 7-step ORU channel variants", () => {
  assert.equal(VARIANTES.length, 5);
  for (const [nom, port, validation, trace, datatype] of VARIANTES) {
    const { id, xml } = variante(nom, port, validation, trace, datatype);
    const [root, entries] = steps(xml);
    assert.equal(root.findtext("id"), id);
    assert.equal(Number(root.findtext("sourceConnector/properties/listenerConnectorProperties/port")), port);
    assert.equal(entries.length, 7);
    for (const [, , , step] of entries) {
      assert.equal(step.validateOutput, String(validation));
      assert.equal(step.traceMessages, String(trace));
    }
  }
});
