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
    const field = mapper.locator("tr[title^='Patient.name.family'] [role=combobox]").first();
    const before = await field.evaluate(el => el.value ?? el.dataset.value);
    await field.click();
    await page.locator(".mapper-expression-editing .monaco-editor").waitFor();
    await page.waitForTimeout(500);
    // Alt/Option+Space asks for suggestions (macOS keeps Ctrl+Space), without typing a space.
    await page.keyboard.press("Alt+Space");
    await page.locator(".suggest-widget .monaco-list-row").first().waitFor();
    assert.equal(await page.evaluate(() => window.monaco.editor.getEditors().pop().getValue()), before);
    // No <style> of the editor may be shown as text.
    assert.equal(await page.evaluate(() => [...document.querySelectorAll(".monaco-editor style, .suggest-widget style, .monaco-list style")].filter(e => getComputedStyle(e).display !== "none").length), 0);
    await page.keyboard.press("Escape");
    await page.keyboard.type(" + fhirU", { delay: 60 });
    await page.locator(".suggest-widget .monaco-list-row").first().waitFor();
    assert.match((await page.locator(".suggest-widget .monaco-list-row").allInnerTexts()).join("\n"), /fhirUuid\(\)/);
    await page.keyboard.press("Enter");
    await mapper.getByLabel("Search elements").click();
    await assert.doesNotReject(mapper.locator("tr[title^='Patient.name.family'] [role=combobox]").first().waitFor());
    assert.equal(await mapper.locator("tr[title^='Patient.name.family'] [role=combobox]").first().evaluate(el => el.value ?? el.dataset.value), `${before} + fhirUuid()`);
    while (await mapper.getByRole("button", { name: /Undo/ }).isEnabled()) await mapper.getByRole("button", { name: /Undo/ }).click();
    assert.equal(await mapper.locator("tr[title^='Patient.name.family'] [role=combobox]").first().evaluate(el => el.value ?? el.dataset.value), before);
  });

  test("a bound element offers the codes of its value set", async () => {
    const { page } = session;
    const mapper = page.locator(".fhir-profile-mapper");
    await mapper.getByLabel("Search elements").fill("gender");
    const field = mapper.locator("tr[title^='Patient.gender'] [role=combobox]").first();
    await mapper.getByLabel("Search elements").fill("maritalStatus");
    assert.match(await mapper.locator("tr[title^='Patient.maritalStatus'] input[role=combobox]").first().getAttribute("placeholder"), /binding: marital-status/);
    await mapper.getByLabel("Search elements").fill("gender");
    const before = await field.evaluate(el => el.value ?? el.dataset.value);
    await field.click();
    await page.locator(".mapper-expression-editing .monaco-editor").waitFor();
    await page.waitForTimeout(1500); // the codes are read when the field is first edited
    await page.keyboard.type(" || fem", { delay: 60 });
    await page.locator(".suggest-widget .monaco-list-row").first().waitFor();
    assert.match((await page.locator(".suggest-widget .monaco-list-row").allInnerTexts()).join("\n"), /'female'/);
    await page.keyboard.press("Escape");
    await mapper.getByLabel("Search elements").click();
    while (await mapper.getByRole("button", { name: /Undo/ }).isEnabled()) await mapper.getByRole("button", { name: /Undo/ }).click();
    assert.equal(await mapper.locator("tr[title^='Patient.gender'] [role=combobox]").first().evaluate(el => el.value ?? el.dataset.value), before);
  });

  test("each tab has its contextual help", async () => {
    const { page } = session;
    const mapper = page.locator(".fhir-profile-mapper");
    for (const [tab, title, text] of [["Mapper", "Help: Mapper", /Reading the tree/i], ["Properties", "Help: Properties", /What this step does/i], ["Test", "Help: Test", /What a test runs/i]]) {
      await mapper.getByRole("tab", { name: tab }).click();
      await mapper.getByRole("button", { name: title }).click();
      assert.match(await mapper.getByRole("dialog", { name: title }).innerText(), text);
      await page.keyboard.press("Escape");
      assert.equal(await mapper.getByRole("dialog", { name: title }).count(), 0);
    }
  });

  test("a rule can be documented and disabled, then restored with undo", async () => {
    const mapper = session.page.locator(".fhir-profile-mapper");
    await mapper.getByRole("tab", { name: "Mapper", exact: true }).click();
    await mapper.getByLabel("Search elements").fill("gender");
    await mapper.getByRole("button", { name: "Rule details for Patient.gender", exact: true }).click();
    const enabled = mapper.locator("table.mapper-tree").getByLabel("Enable value rule for Patient.gender", { exact: true });
    const note = mapper.locator("table.mapper-tree").getByLabel("Note for value rule for Patient.gender", { exact: true });
    const before = await note.inputValue();
    assert.equal(await enabled.isChecked(), true);
    await enabled.uncheck();
    await note.fill("Temporary rule note");
    assert.equal(await enabled.isChecked(), false);
    assert.match(await mapper.locator("tr[data-owner='Patient.gender']").last().innerText(), /disabled \(kept, not executed\)/);
    await mapper.getByRole("button", { name: /Undo/ }).click();
    assert.equal(await note.inputValue(), before);
    assert.equal(await enabled.isChecked(), false);
    await mapper.getByRole("button", { name: /Undo/ }).click();
    assert.equal(await enabled.isChecked(), true);
  });

  test("the inspector follows keyboard selection and edits the same rules as the tree", async () => {
    const { page } = session;
    await openStep(page, "ORU R01 vers Patient FHIR", "Patient");
    const mapper = page.locator(".fhir-profile-mapper");
    const inspector = mapper.getByRole("complementary", { name: "Element inspector" });
    await mapper.getByLabel("Search elements").fill("gender");
    const select = mapper.getByRole("button", { name: "Inspect Patient.gender", exact: true });
    await select.focus();
    await page.keyboard.press("Enter");
    assert.equal(await select.getAttribute("aria-pressed"), "true");
    assert.match(await inspector.innerText(), /Patient.gender[\s\S]*Cardinality[\s\S]*1\.\.1/);
    assert.equal(await inspector.getByRole("link", { name: "Official FHIR definition" }).getAttribute("href"), "https://hl7.org/fhir/R4/patient-definitions.html#Patient.gender");
    const expression = inspector.getByRole("combobox", { name: "Inspector expression for Patient.gender" });
    const before = await expression.evaluate(el => el.value ?? el.dataset.value);
    await expression.click();
    await inspector.locator(".mapper-expression-editing .monaco-editor").waitFor();
    await inspector.locator(".monaco-editor").click();
    await page.keyboard.press("End");
    await page.keyboard.type(" || 'unknown'");
    await inspector.getByRole("heading", { name: "Patient.gender", exact: true }).click();
    assert.equal(await mapper.locator("tr[title^='Patient.gender'] [role=combobox]").first().evaluate(el => el.value ?? el.dataset.value), `${before} || 'unknown'`);
    await mapper.getByRole("button", { name: /Undo/ }).click();
    assert.equal(await expression.evaluate(el => el.value ?? el.dataset.value), before);
    await mapper.getByRole("button", { name: /Full screen/ }).click();
    assert.equal(await inspector.isVisible(), true);
    await page.screenshot({ path: "test/e2e/output/inspector-fullscreen.png" });
    await mapper.getByRole("button", { name: /Exit full screen/ }).click();
    // On a narrow editor the inspector stacks below the tree instead of squeezing it.
    const width = await mapper.evaluate(el => { const before = el.style.width; el.style.width = "700px"; return before; });
    const layout = await mapper.locator(".mapper-workspace").evaluate(el => {
      const [tree, inspector] = [...el.children].map(child => child.getBoundingClientRect());
      return { stacked: inspector.top >= tree.bottom, contained: inspector.right <= el.getBoundingClientRect().right + 1 };
    });
    assert.deepEqual(layout, { stacked: true, contained: true });
    await mapper.evaluate((el, width) => { el.style.width = width; }, width);
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
    // The sample is shown in the code editor, in the language of its data type.
    await mapper.locator(".fm-code-box[data-language=hl7v2] .monaco-editor").waitFor();
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
