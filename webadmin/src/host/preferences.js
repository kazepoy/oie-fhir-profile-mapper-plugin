// SPDX-License-Identifier: MPL-2.0
// The user's editor settings, saved in the user's OIE preferences
// ("fhirmapper.settings") so they follow the user from one browser to another;
// kept in this browser when the server refuses (as Flow UI does, WA-06).
import { currentUser, platform, toast } from "./platform.js";
import { t } from "../i18n/index.js";

const PREFERENCE = "fhirmapper.settings";
const LOCAL_KEY = "oie.fhir-mapper.settings";

/** Allowed values of each setting; the first one is the default. */
export const SETTING_CHOICES = {
  treeFilter: ["all", "mustSupport", "mapped"],
  showExtensions: [false, true],
  autoCompile: [true, false],
  traceByDefault: [false, true]
};

export function defaultSettings() {
  return { ...Object.fromEntries(Object.entries(SETTING_CHOICES).map(([key, values]) => [key, values[0]])), hiddenHints: [] };
}

export function sanitize(value) {
  const settings = defaultSettings();
  if (!value || typeof value !== "object") return settings;
  for (const [key, allowed] of Object.entries(SETTING_CHOICES)) {
    if (/** @type {any[]} */ (allowed).includes(value[key])) settings[key] = value[key];
  }
  if (Array.isArray(value.hiddenHints)) settings.hiddenHints = value.hiddenHints.filter(id => typeof id === "string");
  return settings;
}

export function changedSettings(value) {
  const defaults = defaultSettings();
  return Object.fromEntries(Object.entries(value).filter(([key, item]) => JSON.stringify(item) !== JSON.stringify(defaults[key])));
}

let settings = defaultSettings();
let savedOnServer = true;
const listeners = new Set();

export const getSettings = () => settings;

export function subscribeSettings(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"); } catch { return null; }
}

function writeLocal(value) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(value)); } catch { /* nothing more to try */ }
}

export async function loadSettings() {
  const user = currentUser();
  let stored = null;
  try {
    const text = user ? await platform().api.users.getPreference(user.id, PREFERENCE, { raw: true }) : null;
    stored = text ? JSON.parse(text) : readLocal();
  } catch {
    savedOnServer = false;
    stored = readLocal();
  }
  settings = sanitize(stored);
  listeners.forEach(listener => listener(settings));
}

export async function updateSettings(patch) {
  settings = sanitize({ ...settings, ...patch });
  listeners.forEach(listener => listener(settings));
  writeLocal(changedSettings(settings));
  const user = currentUser();
  if (!user || !savedOnServer) return;
  try {
    await platform().api.users.setPreference(user.id, PREFERENCE, JSON.stringify(changedSettings(settings)));
  } catch {
    savedOnServer = false;
    toast(t("settings.savedLocally"), "warn");
  }
}
