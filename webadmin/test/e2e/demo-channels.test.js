// SPDX-License-Identifier: MPL-2.0
// Verifies channel groups/tags, FML previews, deployed manifest routes and negative cases.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  asList,
  assertCleanTestResult,
  assertNormalizedEqual,
  channelId,
  connectorOf,
  createOieClient,
  fmlSteps,
  loadManifest,
  mapperSteps,
  readExample
} from "./oie-client.js";

describe("demo channel manifest, FML previews and deployed examples", () => {
  let client;
  let manifest;

  before(async () => {
    client = await createOieClient();
    manifest = await loadManifest();
  });

  after(() => client?.close());

  test("OIE channel groups and functional tags match examples/channels.json", async () => {
    const groupsRes = await client.getJson("/api/channelgroups");
    const tagsRes = await client.getJson("/api/server/channelTags");

    const groups = new Map(asList(groupsRes?.list?.channelGroup).map(g => [g.name, g]));
    const actualTagsByChannel = new Map();
    for (const tag of asList(tagsRes?.set?.channelTag)) {
      for (const id of asList(tag?.channelIds?.string)) {
        if (!actualTagsByChannel.has(id)) actualTagsByChannel.set(id, new Set());
        actualTagsByChannel.get(id).add(tag.name);
      }
    }

    const groupNameByKey = new Map(manifest.groups.map(g => [g.key, g.name]));
    for (const g of manifest.groups) {
      assert.ok(groups.has(g.name), `Missing OIE channel group: ${g.name}`);
    }

    for (const entry of manifest.channels) {
      const id = await channelId(entry.channel);
      const expectedGroupName = groupNameByKey.get(entry.group);
      const group = groups.get(expectedGroupName);
      const groupIds = new Set(asList(group?.channels?.channel).map(c => c.id));
      assert.ok(groupIds.has(id), `${entry.channel} missing from group ${expectedGroupName}`);
      assert.deepEqual(
        [...(actualTagsByChannel.get(id) || [])].sort(),
        [...entry.tags].sort(),
        `${entry.channel}: mismatched channel tags`
      );
    }
  });

  test("all FML preview steps declared in channels.json match their expected outputs", async () => {
    for (const entry of manifest.channels.filter(c => c.preview)) {
      const id = await channelId(entry.channel);
      const ch = await client.channel(id);
      const step = fmlSteps(ch.sourceConnector?.transformer)[0];
      assert.ok(step, `No FhirFmlTransformStep found in ${entry.channel}`);

      const input = await readExample(entry.preview.input);
      const expected = await readExample(entry.preview.expected);
      const result = await client.postTest("/api/extensions/fhir-fml/test", {
        step,
        message: input,
        dataType: entry.preview.dataType
      });

      assertCleanTestResult(result, `FML preview ${entry.channel}`);
      assert.equal(result.validationPerformed, true, `${entry.channel}: expected FHIR validation to run`);
      assertNormalizedEqual(result.output, expected, `FML preview output mismatch for ${entry.channel}`);
    }
  });

  test("all manifest deployed endpoints accept valid inputs and reject invalid ones with diagnostics", async () => {
    for (const entry of manifest.channels.filter(c => c.deployed)) {
      const id = await channelId(entry.channel);
      const { deployed, invalid } = entry;
      const input = await readExample(entry.input);
      const expected = await readExample(deployed.expected);
      const contentType = deployed.contentType || "application/json";

      const prevValidId = await client.latestMessageId(id);
      const ok = await client.postChannel(deployed.port, deployed.route, input, contentType);
      assert.equal(ok.status, 200, `${entry.channel} HTTP ${ok.status}: ${ok.text}`);
      assertNormalizedEqual(ok.text, expected, `${entry.channel} HTTP response mismatch`);

      const msg = await client.waitNextMessage(id, prevValidId);
      const dest1 = connectorOf(msg, 1);
      assert.ok(dest1 && dest1.status !== "ERROR", `${entry.channel}: expected clean connector 1 message`);
      assertNormalizedEqual(dest1.encoded?.content, expected, `${entry.channel} OIE encoded(1) mismatch`);

      if (invalid) {
        const badInput = await readExample(invalid.input);
        const ch = await client.channel(id);
        const mapperStep = mapperSteps(ch.sourceConnector?.transformer)[0];
        const fmlStep = fmlSteps(ch.sourceConnector?.transformer)[0];
        if (mapperStep) {
          const preview = await client.postTest("/api/extensions/fhir-profile-mapper/test", {
            step: mapperStep,
            message: badInput,
            dataType: invalid.dataType || "JSON"
          });
          const previewText = JSON.stringify({ errors: preview.errors, issues: preview.issues });
          assert.ok(previewText.includes(invalid.diagnostic), `${entry.channel} preview missing diagnostic '${invalid.diagnostic}': ${previewText}`);
        } else if (fmlStep && invalid.dataType !== "DELIMITED") {
          const preview = await client.postTest("/api/extensions/fhir-fml/test", {
            step: fmlStep,
            message: badInput,
            dataType: invalid.dataType || "JSON"
          });
          const previewText = JSON.stringify({ errors: preview.errors, issues: preview.issues });
          assert.ok(previewText.includes(invalid.diagnostic), `${entry.channel} FML preview missing diagnostic '${invalid.diagnostic}': ${previewText}`);
        }

        const prevBadId = await client.latestMessageId(id);
        await client.postChannel(deployed.port, deployed.route, badInput, invalid.contentType || contentType);
        const badMsg = await client.waitNextMessage(id, prevBadId);
        const connectors = [connectorOf(badMsg, 0), connectorOf(badMsg, 1)].filter(Boolean);
        assert.ok(connectors.some(cm => cm.status === "ERROR"), `${entry.channel}: expected ERROR status on invalid message`);
        const errorText = connectors.map(cm => cm.processingErrorContent?.content || cm.response?.content || "").join("\n");
        assert.ok(errorText.includes(invalid.diagnostic), `${entry.channel}: expected error containing '${invalid.diagnostic}', got: ${errorText}`);
      }
    }
  });

  test("external terminology unmatched code falls back cleanly via data-absent-reason", async () => {
    const input = await readExample("json/observation-tx-unmatched.json");
    const expected = await readExample("json/observation-tx-unmatched-expected.json");
    const res = await client.postChannel(10816, "/obs-external-tx", input, "application/json");
    assert.equal(res.status, 200, `Unmatched TX -> HTTP ${res.status}: ${res.text}`);
    assertNormalizedEqual(res.text, expected, "External TX unmatched fallback mismatch");
  });
});
