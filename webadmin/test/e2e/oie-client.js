// SPDX-License-Identifier: MPL-2.0
// Shared Playwright API and HTTP helpers for verifying the running demo channels.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { request as playwrightRequest } from "playwright";
import { normalizeResult } from "../../src/fhir/diagnostics.js";

export const REPO_ROOT = resolve(import.meta.dirname, "../../..");
export const OIE_URL = process.env.OIE_URL || new URL(process.env.DEMO_URL || "https://localhost:8443/oie-webadmin/").origin;
export const PASSWORD = process.env.OIE_DEMO_PASSWORD || "admin";
export const DEMO_HOST = process.env.OIE_DEMO_HOST || "127.0.0.1";

const API_HEADERS = { "X-Requested-With": "OpenAPI", Accept: "application/json" };

export const asList = value => (Array.isArray(value) ? value : value == null ? [] : [value]);

export const readRepoFile = rel => readFile(resolve(REPO_ROOT, rel), "utf8");
export const readExample = rel => readRepoFile(`examples/${rel}`);
export const readJsonExample = async rel => JSON.parse(await readExample(rel));
export const loadManifest = async () => JSON.parse(await readExample("channels.json"));

/** Reads the <id> of a channel export XML in demo/oie-init/data/channels/. */
export async function channelId(channelFile) {
  const xml = await readRepoFile(`demo/oie-init/data/channels/${channelFile}`);
  const id = xml.match(/<channel[^>]*>\s*<id>([^<]+)<\/id>/)?.[1];
  if (!id) throw new Error(`Missing channel id in ${channelFile}`);
  return id.trim();
}

const withoutNulls = obj => Object.fromEntries(Object.entries(obj).filter(([, value]) => value != null));

/** Collects enabled FhirProfileMapperStep definitions from an OIE transformer JSON object. */
export function mapperSteps(transformer) {
  return asList(transformer?.elements?.["fr.kazepoy.fhir.mapper.FhirProfileMapperStep"])
    .filter(step => step.enabled !== false && step.enabled !== "false")
    .sort((a, b) => Number(a.sequenceNumber) - Number(b.sequenceNumber))
    .map(step => withoutNulls({ ...step, samples: "[]" }));
}

/** Collects enabled FhirFmlTransformStep definitions from an OIE transformer JSON object. */
export function fmlSteps(transformer) {
  return asList(transformer?.elements?.["fr.kazepoy.fhir.fml.FhirFmlTransformStep"])
    .filter(step => step.enabled !== false && step.enabled !== "false")
    .sort((a, b) => Number(a.sequenceNumber) - Number(b.sequenceNumber))
    .map(withoutNulls);
}

/** Finds connectorMessage by metaDataId inside an OIE XStream message JSON object. */
export function connectorOf(message, metaDataId = 0) {
  for (const entry of asList(message?.connectorMessages?.entry)) {
    const cm = entry.connectorMessage || entry;
    if (Number(entry.int ?? cm?.metaDataId) === metaDataId) return cm;
  }
  return null;
}

/** Extracts XStream metaDataMap entries from a connectorMessage into a plain object. */
export function metaMapOf(connectorMessage) {
  const result = {};
  for (const entry of asList(connectorMessage?.metaDataMap?.entry)) {
    if (Array.isArray(entry.string)) {
      result[entry.string[0]] = entry.string[1] ?? "";
    } else if (typeof entry.string === "string") {
      const valueKey = Object.keys(entry).find(k => k !== "string");
      if (valueKey) result[entry.string] = entry[valueKey];
    }
  }
  return result;
}

/** Asserts that two FHIR JSON strings match modulo sorted keys, urn:uuid renaming and lastUpdated. */
export function assertNormalizedEqual(actual, expected, message) {
  const actualText = typeof actual === "string" ? actual : JSON.stringify(actual);
  const expectedText = typeof expected === "string" ? expected : JSON.stringify(expected);
  assert.equal(normalizeResult(actualText), normalizeResult(expectedText), message);
}

/** Asserts that a test API response has no execution errors and no fatal/error FHIR issues. */
export function assertCleanTestResult(result, label) {
  assert.deepEqual(result.errors || [], [], `${label}: unexpected execution errors`);
  const blocking = (result.issues || []).filter(issue => issue.severity === "fatal" || issue.severity === "error");
  assert.deepEqual(blocking, [], `${label}: unexpected blocking FHIR issues`);
}

export async function createOieClient() {
  const admin = await playwrightRequest.newContext({ baseURL: OIE_URL, ignoreHTTPSErrors: true });
  const listeners = await playwrightRequest.newContext();
  const login = await admin.post("/api/users/_login", {
    headers: API_HEADERS,
    form: { username: "admin", password: PASSWORD }
  });
  assert.equal(login.status(), 200, `OIE login failed (${login.status()}): ${await login.text()}`);

  const getJson = async path => {
    const response = await admin.get(path, { headers: API_HEADERS });
    assert.equal(response.status(), 200, `GET ${path} -> ${response.status()}: ${await response.text()}`);
    return response.json();
  };

  const getText = async (path, accept = "application/xml") => {
    const response = await admin.get(path, { headers: { ...API_HEADERS, Accept: accept } });
    assert.equal(response.status(), 200, `GET ${path} -> ${response.status()}: ${await response.text()}`);
    return response.text();
  };

  const putXml = async (path, xml) => {
    const response = await admin.put(path, {
      headers: { ...API_HEADERS, "Content-Type": "application/xml", Accept: "application/xml" },
      data: xml,
      timeout: 60000
    });
    assert.ok(response.status() >= 200 && response.status() < 300, `PUT ${path} -> ${response.status()}: ${await response.text()}`);
    return response.status();
  };

  const postTest = async (endpoint, payload) => {
    const response = await admin.post(endpoint, {
      headers: { ...API_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
      data: typeof payload === "string" ? payload : JSON.stringify(payload),
      timeout: 60000
    });
    assert.equal(response.status(), 200, `POST ${endpoint} -> ${response.status()}: ${await response.text()}`);
    return response.json();
  };

  const postChannel = async (port, route, body, contentType = "application/json") => {
    const prefixed = route.startsWith("/") ? route : `/${route}`;
    const path = prefixed.endsWith("/") ? prefixed : `${prefixed}/`;
    const response = await listeners.post(`http://${DEMO_HOST}:${port}${path}`, {
      headers: { "Content-Type": `${contentType}; charset=utf-8` },
      data: body,
      timeout: 30000
    });
    return { status: response.status(), text: await response.text() };
  };

  const latestMessageId = async id => {
    const data = await getJson(`/api/channels/${id}/messages?limit=1&includeContent=false`);
    const first = asList(data?.list?.message)[0];
    return first ? Number(first.messageId) : 0;
  };

  const waitNextMessages = async (id, previousMaxId, count = 1, timeoutMs = 10000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const data = await getJson(`/api/channels/${id}/messages?limit=${Math.max(count + 2, 10)}&includeContent=true`);
      const newest = asList(data?.list?.message)
        .filter(m => Number(m.messageId) > previousMaxId && m.processed)
        .sort((a, b) => Number(a.messageId) - Number(b.messageId));
      if (newest.length >= count) return newest;
      await new Promise(resolveDelay => setTimeout(resolveDelay, 120));
    }
    throw new Error(`Timed out waiting for ${count} processed message(s) > ${previousMaxId} on channel ${id}`);
  };

  const waitNextMessage = async (id, previousMaxId, timeoutMs = 10000) => {
    const list = await waitNextMessages(id, previousMaxId, 1, timeoutMs);
    return list[list.length - 1];
  };

  return {
    getJson,
    getText,
    putXml,
    postTest,
    postChannel,
    latestMessageId,
    waitNextMessage,
    waitNextMessages,
    channel: async id => (await getJson(`/api/channels/${id}`)).channel,
    close: async () => {
      await admin.dispose();
      await listeners.dispose();
    }
  };
}
