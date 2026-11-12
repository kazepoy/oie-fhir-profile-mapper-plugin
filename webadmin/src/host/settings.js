// SPDX-License-Identifier: MPL-2.0
// The FHIR contexts of the server (GET/POST /settings of the plugin), loaded once
// and shared by the step editors and the Settings panel.
import { platform } from "./platform.js";
import { MAPPER_API } from "./api.js";

let cache = null;
let request = null;
const listeners = new Set();

/** The settings if they are loaded: { contexts: [{ name, fhirVersion, packages: [], terminologyServer, …, validation }] }. */
export const cachedFhirSettings = () => cache;

export function loadFhirSettings(force = false) {
  if (force) request = null;
  if (!request) {
    request = platform().api.get(`${MAPPER_API}/settings`, {}, { raw: true }).then(text => {
      cache = JSON.parse(text);
      listeners.forEach(listener => listener(cache));
      return cache;
    }).catch(error => {
      request = null;
      throw error;
    });
  }
  return request;
}

export async function saveFhirSettings(settings) {
  const text = await platform().api.post(`${MAPPER_API}/settings`, JSON.stringify(settings), { contentType: "text/plain", raw: true });
  cache = JSON.parse(text);
  request = Promise.resolve(cache);
  listeners.forEach(listener => listener(cache));
  return cache;
}

export function onFhirSettings(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The context a step names, or null: none named, settings not loaded, or unknown name. */
export function fhirContext(name) {
  const key = String(name || "").trim();
  return key && cache ? (cache.contexts || []).find(c => c.name === key) || null : null;
}
