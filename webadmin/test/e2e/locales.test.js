// SPDX-License-Identifier: MPL-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { openStep, signIn, DEMO_URL } from "./session.js";

for (const colorScheme of ["light", "dark"]) test(`French editors and settings in the ${colorScheme} theme`, async () => {
  const session = await signIn({ locale: "fr-FR", colorScheme });
  const { page } = session;
  try {
    await page.evaluate(async theme => {
      const { setTheme } = await import(new URL("core/store.js", document.baseURI).href);
      setTheme(theme);
    }, colorScheme);
    await openStep(page, "ORU R01 to FHIR Patient", "Patient");
    const mapper = page.locator(".fhir-profile-mapper");
    await mapper.getByRole("tab", { name: "Mappeur", exact: true }).waitFor();
    await mapper.getByRole("button", { name: /Plein écran/ }).click();
    await mapper.getByLabel("Rechercher des éléments", { exact: true }).fill("gender");
    await mapper.getByRole("button", { name: "Inspecter Patient.gender", exact: true }).click();
    const inspector = mapper.getByRole("complementary", { name: "Inspecteur d’élément" });
    await inspector.getByRole("heading", { name: "Patient.gender", exact: true }).waitFor();
    // Resource keys and expressions remain data even when their controls are French.
    const expression = inspector.getByRole("combobox", { name: "Expression de l’inspecteur pour Patient.gender", exact: true });
    assert.match(await expression.evaluate(el => el.value ?? el.dataset.value), /msg\['PID'\]/);
    const theme = await mapper.evaluate(el => ({ background: getComputedStyle(el).backgroundColor, text: getComputedStyle(el).color }));
    if (colorScheme === "dark") {
      const channels = theme.background.match(/\d+/g)?.map(Number) ?? [];
      assert.equal(channels.length, 3);
      assert.ok(channels.reduce((sum, value) => sum + value, 0) < 200, `Expected a dark background, got ${theme.background}`);
    } else assert.equal(theme.background, "rgb(255, 255, 255)");
    assert.notEqual(theme.background, theme.text);
    await mapper.getByRole("button", { name: "Aide : mappeur", exact: true }).click();
    assert.match(await mapper.getByRole("dialog", { name: "Aide : mappeur" }).innerText(), /Lire l’arbre/i);
    await page.keyboard.press("Escape");
    await page.screenshot({ path: `test/e2e/output/mapper-fr-${colorScheme}.png`, animations: "disabled" });
    await mapper.getByRole("tab", { name: "Test", exact: true }).click();
    await mapper.getByRole("button", { name: /Tout exécuter/ }).click();
    await mapper.getByRole("button", { name: /Tout exécuter/ }).and(mapper.locator(":enabled")).waitFor({ timeout: 90000 });
    assert.match(await mapper.getByRole("table", { name: "Résultats des exemples enregistrés" }).innerText(), /réussite/);
    await openStep(page, "ORU R01 to FHIR Patient (FML inline)", "Patient (FML inline)");
    const fml = page.locator(".fhir-fml");
    await fml.getByRole("tab", { name: "Propriétés", exact: true }).waitFor();
    await fml.getByRole("tab", { name: "Map", exact: true }).click();
    await fml.getByRole("button", { name: "Vérifier", exact: true }).click();
    await fml.locator(".fml-ok").waitFor({ timeout: 90000 });
    assert.match(await fml.locator(".fml-ok").innerText(), /Aucun problème trouvé/);
    await page.goto(DEMO_URL);
    await page.locator("[data-nav-item]").filter({ hasText: /^Settings$/ }).first().click();
    await page.getByText("FHIR Mapper", { exact: true }).click();
    await page.getByRole("button", { name: "Enregistrer", exact: true }).waitFor();
    assert.equal(await page.getByLabel("Nom du contexte", { exact: true }).first().inputValue(), "demo-labo");
    assert.deepEqual(session.pluginErrors(), []);
  } finally { await session.close(); }
});

test("an unsupported browser language uses English", async () => {
  const session = await signIn({ locale: "es-ES" });
  try {
    await openStep(session.page, "ORU R01 to FHIR Patient", "Patient");
    await session.page.locator(".fhir-profile-mapper").getByRole("tab", { name: "Properties", exact: true }).waitFor();
  } finally { await session.close(); }
});

test("simulated permission denials are explicit in preview and settings", async () => {
  const session = await signIn({ locale: "fr-FR" });
  const { page } = session;
  try {
    // Exercise the UI with the HTTP response a role without these permissions receives.
    await page.route("**/extensions/fhir-profile-mapper/test", route => route.fulfill({ status: 403, body: "Test FHIR mapper steps" }));
    await page.route("**/extensions/fhir-profile-mapper/settings", route => route.request().method() === "POST"
      ? route.fulfill({ status: 403, body: "Manage FHIR mapper settings" }) : route.continue());
    await openStep(page, "ORU R01 to FHIR Patient", "Patient");
    const mapper = page.locator(".fhir-profile-mapper");
    await mapper.getByRole("tab", { name: "Test", exact: true }).click();
    await mapper.getByRole("button", { name: "Exécuter", exact: true }).click();
    await mapper.getByText(/permission « Test FHIR mapper steps »/).waitFor();
    await page.goto(DEMO_URL);
    await page.locator("[data-nav-item]").filter({ hasText: /^Settings$/ }).first().click();
    await page.getByText("FHIR Mapper", { exact: true }).click();
    await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
    await page.locator(".fhir-mapper-settings").getByRole("alert").waitFor();
    assert.match(await page.locator(".fhir-mapper-settings").getByRole("alert").innerText(), /permission « Manage FHIR mapper settings »/);
  } finally { await session.close(); }
});
