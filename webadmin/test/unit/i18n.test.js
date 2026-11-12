// SPDX-License-Identifier: MPL-2.0
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { t, resolveLocale, setLocale, currentLocale, catalogs } from "../../src/i18n/index.js";
import { compile, indexSd, makeTree } from "../../src/fhir/model.js";

afterEach(() => setLocale(["en"]));
test("the first supported browser language is used, with English as fallback", () => {
  assert.equal(resolveLocale(["es-ES", "fr-CA"]), "fr");
  assert.equal(resolveLocale(["en-AU", "fr"]), "en");
  assert.equal(resolveLocale(["FR-fr"]), "fr");
  assert.equal(resolveLocale(["constructor", "zh-CN"]), "en");
  assert.equal(resolveLocale([]), "en");
});
test("French UI text interpolates values once and leaves unknown technical text intact", () => {
  setLocale(["fr-FR"]);
  assert.equal(currentLocale(), "fr");
  assert.equal(t("Properties"), "Propriétés");
  assert.equal(t("Inspect {p0}", { p0: "Patient.name[{p0}]" }), "Inspecter Patient.name[{p0}]");
  assert.equal(t("server error: Patient.active"), "server error: Patient.active");
  assert.equal(t("constructor"), "constructor");
  assert.deepEqual(Object.keys(catalogs.en).sort(), Object.keys(catalogs.fr).sort());
});
test("changing locale does not change generated rules, FHIR paths or expressions", () => {
  const definition = indexSd({ type: "Patient", snapshot: { element: [
    { id: "Patient", path: "Patient" }, { id: "Patient.active", path: "Patient.active", min: 0, max: "1", type: [{ code: "boolean" }] }
  ] } });
  const build = () => compile(makeTree(definition, { version: "R4", profiles: "", instances: new Map(), showAll: true }),
    new Map([["Patient.active", "msg.active"]]), new Map(), new Map(), new Map());
  const english = build();
  setLocale(["fr"]);
  assert.deepEqual(build(), english);
  assert.equal(english[0].expression, "msg.active");
});
