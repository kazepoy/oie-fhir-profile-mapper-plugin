// SPDX-License-Identifier: MPL-2.0
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { openStep, signIn } from "./session.js";

describe("the JSON, FR Core and FHIR demo channels", () => {
  let session;
  before(async () => { session = await signIn(); });
  after(() => session?.close());

  test("native groups and functional tags are visible in Channels", async () => {
    const { page } = session;
    await page.locator("[data-nav-item]").filter({ hasText: /^Channels$/ }).first().click();
    for (const name of ["FHIR - Mapper HL7 v2", "FHIR - Mapper metier", "FHIR - FML"])
      await page.getByText(`[${name}]`, { exact: true }).waitFor();
    const row = page.locator("tr").filter({ has: page.getByText("JSON métier vers Organization R5", { exact: true }) }).first();
    assert.match(await row.innerText(), /Organization-description/);
    assert.match(await row.innerText(), /R5/);
  });

  for (const [channel, step] of [["JSON métier vers Organization R5", "Organization"], ["JSON métier vers Patient FR Core", "Patient"]]) {
    test(`${channel}: its saved sample matches the expected resource`, async () => {
      const { page } = session;
      await openStep(page, channel, step);
      const mapper = page.locator(".fhir-profile-mapper");
      await mapper.locator("table.mapper-tree tbody tr").first().waitFor({ timeout: 90000 });
      await mapper.getByRole("tab", { name: "Test", exact: true }).click();
      await mapper.getByRole("button", { name: /Run all/ }).click();
      const rows = mapper.locator("table[aria-label='Results of the saved samples'] tr");
      await rows.first().waitFor({ timeout: 90000 });
      await mapper.getByRole("button", { name: /Run all/ }).and(mapper.locator(":enabled")).waitFor({ timeout: 90000 });
      assert.equal(await rows.count(), 1);
      assert.match(await rows.first().innerText(), /^passed\t.*matches the expected result/);
    });
  }

  test("the FML source defaults to JSON and its projection keeps false", async () => {
    const { page } = session;
    await openStep(page, "Patient FHIR vers résumé FML", "Résumé Patient");
    const fml = page.locator(".fhir-fml");
    await fml.getByRole("tab", { name: "Test", exact: true }).click();
    assert.equal(await fml.locator("select").first().inputValue(), "JSON");
    await fml.getByRole("button", { name: "Run test", exact: true }).click();
    await fml.locator(".fml-ok").waitFor({ timeout: 90000 });
    assert.equal(await fml.locator(".fml-error").count(), 0);
    const output = await page.evaluate(() => window.monaco.editor.getEditors().map(editor => {
      try { return JSON.parse(editor.getValue()); } catch { return null; }
    }).find(value => value?.resourceType === "Patient" && value.active === false && !value.telecom));
    assert.equal(output.id, "source-fhir-001");
    assert.equal(output.name[0].given[0], "Élodie");
    assert.deepEqual(session.pluginErrors(), []);
  });
});
