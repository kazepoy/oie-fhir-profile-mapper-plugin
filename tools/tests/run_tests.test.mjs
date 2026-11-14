// SPDX-License-Identifier: MPL-2.0
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { groups, main, normalize, replay } from "../run_tests.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHANNELS_DIR = join(ROOT, "demo/oie-init/data/channels");

function sampleFile(directory, scope = "step") {
  const path = join(directory, "fixture.step.json");
  const step = {
    name: "Patient",
    action: "resource",
    resourceType: "Patient",
    samples: JSON.stringify([
      {
        id: "one",
        name: "One",
        message: "{}",
        dataType: "JSON",
        scope,
        expected: '{"resourceType":"Patient","id":"expected"}',
      },
    ]),
  };
  writeFileSync(
    path,
    JSON.stringify([
      step,
      { action: "createBundle", resourceType: "Bundle", bundleName: "disabled", enabled: false },
    ]),
    "utf8"
  );
  return path;
}

test("ordered transformer selection and result mismatch", async () => {
  const directory = mkdtempSync(join(tmpdir(), "fhir-mapper-replay-"));
  try {
    const path = sampleFile(directory, "transformer");
    const requests = [];
    const post = async (req) => {
      requests.push(req);
      return { errors: [], issues: [], output: '{"id":"expected","resourceType":"Patient"}' };
    };
    assert.equal(await replay(path, post), 1);
    assert.equal(requests[0].steps.length, 1);
    assert.equal(requests[0].steps[0].samples, "[]");

    await assert.rejects(
      () => replay(path, async () => ({ output: '{"resourceType":"Patient","id":"wrong"}' })),
      /différent/
    );
    await assert.rejects(
      () => replay(path, async () => ({ errors: [{ message: "forbidden" }] })),
      /forbidden/
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("offline checks samples and exit status is nonzero for invalid exports", async () => {
  const directory = mkdtempSync(join(tmpdir(), "fhir-mapper-offline-"));
  try {
    const path = sampleFile(directory);
    assert.equal(await main([path, "--offline"]), 0);
    const value = JSON.parse(readFileSync(path, "utf8"));
    value[0].samples = '[{"id":"bad"}]';
    writeFileSync(path, JSON.stringify(value), "utf8");
    assert.equal(await main([path, "--offline"]), 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("demo exports keep connector and response groups separate", () => {
  let count = 0;
  for (const file of readdirSync(CHANNELS_DIR).filter((f) => f.endsWith(".xml"))) {
    for (const [group, stepList] of Object.entries(groups(join(CHANNELS_DIR, file)))) {
      assert.match(group, /^\d+\/(transformer|responseTransformer)$/);
      count += stepList.length;
    }
  }
  assert.ok(count > 20);
});

test("online cli exits with failure when the expected output differs", async () => {
  const directory = mkdtempSync(join(tmpdir(), "fhir-mapper-online-"));
  const prevPassword = process.env.OIE_PASSWORD;
  try {
    process.env.OIE_PASSWORD = "test";
    const path = sampleFile(directory);
    const fakeClientFactory = () => async () => ({ output: "{}" });
    assert.equal(await main([path], fakeClientFactory), 1);
  } finally {
    if (prevPassword === undefined) delete process.env.OIE_PASSWORD;
    else process.env.OIE_PASSWORD = prevPassword;
    rmSync(directory, { recursive: true, force: true });
  }
});

test("comparison preserves uuid reference relationships", () => {
  const a = "urn:uuid:11111111-1111-1111-1111-111111111111";
  const b = "urn:uuid:22222222-2222-2222-2222-222222222222";
  const value = JSON.stringify({ entry: [{ fullUrl: a }, { fullUrl: b, reference: a }] });
  assert.equal(
    normalize(value),
    normalize(value.replaceAll(a, "urn:uuid:33333333-3333-3333-3333-333333333333"))
  );
  assert.notEqual(
    normalize(value),
    normalize(JSON.stringify({ entry: [{ fullUrl: a }, { fullUrl: b, reference: b }] }))
  );
});
