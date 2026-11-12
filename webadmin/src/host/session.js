// SPDX-License-Identifier: MPL-2.0
// Per-browser state that is not worth a user preference: the sample message of
// a step, the open tab, the studio pane widths. JSON in localStorage, which may
// be unavailable (private mode): the view then starts from its default.

const PREFIX = "oie.fhir-mapper.";

/** @template T @param {string} key @param {T} fallback @returns {T} */
export function readLocal(key, fallback) {
  try {
    const text = localStorage.getItem(PREFIX + key);
    return text == null ? fallback : JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function writeLocal(key, value) {
  try {
    if (value === undefined || value === null) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable.
  }
}
