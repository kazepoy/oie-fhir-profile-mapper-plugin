// SPDX-License-Identifier: MPL-2.0
// Translations. Every visible text goes through t(); catalogs live in locales/.
//   t("mapper.title")                        → "FHIR Profile Mapper"
//   t("tree.required", { count: 3 })         → "3 required elements not mapped"
import en from "./locales/en.js";
import fr from "./locales/fr.js";

/** @type {Record<string, Record<string, any>>} */
const CATALOGS = { en, fr };
const FALLBACK = "en";

let locale = FALLBACK;

/** Picks the first supported language among the preferred ones (BCP 47 tags). */
export function resolveLocale(preferred = []) {
  for (const tag of preferred) {
    if (!tag) continue;
    if (CATALOGS[tag]) return tag;
    const base = tag.split("-")[0];
    if (CATALOGS[base]) return base;
  }
  return FALLBACK;
}

export function setLocale(preferred) {
  locale = resolveLocale(preferred);
}

export const currentLocale = () => locale;

function lookup(catalog, key) {
  let value = catalog;
  for (const part of key.split(".")) value = value?.[part];
  return value;
}

/**
 * @param {string} key dotted path in the catalog
 * @param {Record<string, string | number>} [params] values for {name} placeholders;
 *   `count` also selects the plural form when the entry has several
 * @returns {string}
 */
export function t(key, params = {}) {
  let value = lookup(CATALOGS[locale], key) ?? lookup(CATALOGS[FALLBACK], key);
  if (value == null) return key;
  if (typeof value === "object") {
    const form = new Intl.PluralRules(locale).select(Number(params.count ?? 0));
    value = value[form] ?? value.other;
  }
  return String(value).replace(/\{(\w+)\}/g, (match, name) => (name in params ? formatValue(params[name]) : match));
}

const formatValue = value => (typeof value === "number" ? formatNumber(value) : String(value));

export const formatNumber = number => new Intl.NumberFormat(locale).format(number);

/** The catalogs, for tests. */
export const catalogs = () => CATALOGS;
