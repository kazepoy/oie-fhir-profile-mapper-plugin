// SPDX-License-Identifier: MPL-2.0
// End-to-end checks against the running demo (cd demo && docker compose up -d).
//   npm run test:e2e          (DEMO_URL and OIE_DEMO_PASSWORD override the defaults)
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { openStep, signIn } from "./session.js";

describe("the step editors in the demo", () => {
  let session;
  before(async () => { session = await signIn(); });
  after(() => session.close());

  test("both steps, the references and the trace action are registered", async () => {
    const state = await session.page.evaluate(async () => {
      const { platform } = await import("@oie/web-shell");
      return {
        steps: [...platform.stepTypes().keys()].filter(type => type.includes("fhir")),
        references: platform.references().filter(r => r.category === "FHIR Mapper").length,
        action: platform.messageActions().some(a => a.id === "fhir-mapper-trace")
      };
    });
    assert.deepEqual(state.steps, ["org.oie.fhir.mapper.FhirProfileMapperStep", "org.oie.fhir.fml.FhirFmlTransformStep"]);
    assert.ok(state.references >= 8);
    assert.equal(state.action, true);
  });

  test("an expression is edited in the code editor with the mapper's completion, and undone", async () => {
    const { page } = session;
    await openStep(page, "ORU R01 vers Patient FHIR", "Patient");
    const mapper = page.locator(".fhir-profile-mapper");
    await mapper.locator("table.mapper-tree tbody tr").nth(3).waitFor();
    await mapper.getByRole("button", { name: /Full screen/ }).click();
    await mapper.getByLabel("Search elements").fill("family");
    const field = mapper.locator("tr[title^='Patient.name.family'] input[role=combobox]").first();
    const before = await field.inputValue();
    await field.click();
    await page.locator(".mapper-expression-editing .monaco-editor").waitFor();
    await page.waitForTimeout(500);
    await page.keyboard.type(" + fhirU", { delay: 60 });
    await page.locator(".suggest-widget .monaco-list-row").first().waitFor();
    assert.match((await page.locator(".suggest-widget .monaco-list-row").allInnerTexts()).join("\n"), /fhirUuid\(\)/);
    await page.keyboard.press("Enter");
    await mapper.getByLabel("Search elements").click();
    await assert.doesNotReject(mapper.locator("tr[title^='Patient.name.family'] input[role=combobox]").first().waitFor());
    assert.equal(await mapper.locator("tr[title^='Patient.name.family'] input[role=combobox]").first().inputValue(), `${before} + fhirUuid()`);
    while (await mapper.getByRole("button", { name: /Undo/ }).isEnabled()) await mapper.getByRole("button", { name: /Undo/ }).click();
    assert.equal(await mapper.locator("tr[title^='Patient.name.family'] input[role=combobox]").first().inputValue(), before);
  });

  test("a bound element offers the codes of its value set", async () => {
    const { page } = session;
    const mapper = page.locator(".fhir-profile-mapper");
    await mapper.getByLabel("Search elements").fill("gender");
    const field = mapper.locator("tr[title^='Patient.gender'] input[role=combobox]").first();
    assert.match(await field.getAttribute("placeholder"), /required binding: administrative-gender/);
    const before = await field.inputValue();
    await field.click();
    await page.locator(".mapper-expression-editing .monaco-editor").waitFor();
    await page.waitForTimeout(1500); // the codes are read when the field is first edited
    await page.keyboard.type(" || fem", { delay: 60 });
    await page.locator(".suggest-widget .monaco-list-row").first().waitFor();
    assert.match((await page.locator(".suggest-widget .monaco-list-row").allInnerTexts()).join("\n"), /'female'/);
    await page.keyboard.press("Escape");
    await mapper.getByLabel("Search elements").click();
    while (await mapper.getByRole("button", { name: /Undo/ }).isEnabled()) await mapper.getByRole("button", { name: /Undo/ }).click();
    assert.equal(await mapper.locator("tr[title^='Patient.gender'] input[role=combobox]").first().inputValue(), before);
  });

  test("the step names a FHIR context of the server, defined in Settings", async () => {
    const { page } = session;
    const mapper = page.locator(".fhir-profile-mapper");
    await mapper.getByRole("tab", { name: "Properties" }).click();
    assert.equal(await mapper.locator("select[aria-label='FHIR context']").inputValue(), "demo-labo");
    assert.equal(await mapper.locator("select[aria-label=Validation]").inputValue(), "inherit");
    const settings = await page.evaluate(async () => {
      const { platform } = await import("@oie/web-shell");
      return { panel: platform.settingsPanels().some(p => p.label === "FHIR Mapper"),
        contexts: JSON.parse(await platform.api.get("/extensions/fhir-profile-mapper/settings", {}, { raw: true })).contexts.map(c => c.name) };
    });
    assert.deepEqual(settings, { panel: true, contexts: ["demo-labo"] });
  });

  test("the samples saved with the step run and match their expected results", async () => {
    const { page } = session;
    const mapper = page.locator(".fhir-profile-mapper");
    await mapper.getByRole("tab", { name: "Test" }).click();
    assert.equal(await mapper.locator("select[aria-label=Sample] option").count(), 3);
    await mapper.getByRole("button", { name: /Run all/ }).click();
    const rows = mapper.locator("table[aria-label='Results of the saved samples'] tr");
    await rows.nth(1).waitFor({ timeout: 90000 });
    await mapper.getByRole("button", { name: /Run all/ }).and(mapper.locator(":enabled")).waitFor({ timeout: 90000 });
    const results = await rows.allInnerTexts();
    assert.equal(results.length, 2);
    for (const line of results) assert.match(line, /^passed\t.*matches the expected result/);
    await page.keyboard.press("Escape");
  });

  test("a map written in the step is highlighted and checked", async () => {
    const { page } = session;
    await openStep(page, "ORU R01 vers Patient FHIR (FML inline)", "Patient (FML inline)");
    const fml = page.locator(".fhir-fml");
    await fml.getByRole("tab", { name: "Map" }).click();
    await fml.locator(".fml-map-editor .monaco-editor").waitFor();
    const language = await page.evaluate(() => window.monaco.editor.getEditors().map(e => e.getModel().getLanguageId()).pop());
    assert.equal(language, "fml");
    await fml.getByRole("button", { name: "Check" }).click();
    await fml.locator(".fml-ok").waitFor({ timeout: 90000 });
    assert.match(await fml.locator(".fml-ok").innerText(), /No problem found in OruR01ToPatient/);
  });

  test("no plugin error was logged", () => {
    assert.deepEqual(session.pluginErrors(), []);
  });
});
