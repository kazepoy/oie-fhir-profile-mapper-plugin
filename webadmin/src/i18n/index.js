// SPDX-License-Identifier: MPL-2.0
import en from "./locales/en.js";
import fr from "./locales/fr.js";
export const catalogs = { en, fr };
export function resolveLocale(preferred = []) {
  for (const tag of preferred) {
    const language = String(tag || "").toLowerCase().split(/[-_]/)[0];
    if (Object.hasOwn(catalogs, language)) return language;
  }
  return "en";
}
let locale = resolveLocale(globalThis.navigator?.languages || [globalThis.navigator?.language]);
export const currentLocale = () => locale;
export const setLocale = preferred => { locale = resolveLocale(preferred); };
// Message keys retain the readable English source. Only explicit UI text is translated.
export function t(message, params = {}) {
  const text = (Object.hasOwn(catalogs[locale], message) ? catalogs[locale][message] : Object.hasOwn(catalogs.en, message) ? catalogs.en[message] : message);
  return String(text).replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(params, name) ? String(params[name]) : match);
}
