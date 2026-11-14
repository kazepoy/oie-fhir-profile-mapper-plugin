// SPDX-License-Identifier: MPL-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { openStep, signIn } from "./session.js";

test("a transformer preview assembles two Bundles and exposes every step and published variable", async () => {
  const session = await signIn();
  const { page } = session;
  try {
    await openStep(page, "ORU R01 to Two Lab Bundles", "Observation");
    const mapper = page.locator(".fhir-profile-mapper");
    await mapper.getByRole("tab", { name: "Test", exact: true }).click();
    await mapper.locator(".fm-code-box[data-language=hl7v2] .monaco-editor").waitFor();
    await page.evaluate(message => {
      const editor = window.monaco.editor.getEditors().find(editor => editor.getDomNode()?.closest(".fm-code-box[data-language=hl7v2]"));
      editor.setValue(message);
    }, await readFile("../examples/hl7v2/oru-r01-labo.er7", "utf8"));
    await mapper.getByLabel("Preview scope", { exact: true }).selectOption("transformer");
    const response = page.waitForResponse(response => response.url().endsWith("/fhir-profile-mapper/test"));
    await mapper.getByRole("button", { name: "Run", exact: true }).click();
    const result = await (await response).json();
    assert.deepEqual(result.errors, []);
    const transaction = JSON.parse(result.output), document = JSON.parse(result.variables.bundleDocument);
    assert.equal(transaction.entry.length, 12);
    assert.equal(document.entry.length, 14);
    const shared = new Map(document.entry.map(entry => [entry.fullUrl, entry.resource]));
    for (const entry of transaction.entry) assert.deepEqual(shared.get(entry.fullUrl), entry.resource);
    await mapper.getByText("Produced resources by step", { exact: true }).waitFor();
    await mapper.getByText("Published channel variables", { exact: true }).waitFor();
    assert.equal(result.steps.length, 10);
    await mapper.locator("details details > summary").filter({ hasText: "Observation" }).first().click();
    const publishedVariable = mapper.locator("details details > summary").filter({ hasText: "bundleDocument" }).first();
    await publishedVariable.click();
    await mapper.getByText("Produced resources by step", { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: "test/e2e/output/multi-step-preview.png", animations: "disabled" });
    assert.deepEqual(session.pluginErrors(), []);
  } finally { await session.close(); }
});

test("value tables import atomically, undo in one operation and export with their notes", async () => {
  const session = await signIn();
  const { page } = session;
  try {
    // Exercise the host's standard download fallback in an automated browser.
    await openStep(page, "ORU R01 to FHIR Patient", "Patient");
    await page.evaluate(() => { window.showSaveFilePicker = undefined; });
    const mapper = page.locator(".fhir-profile-mapper");
    await mapper.getByRole("tab", { name: "Properties", exact: true }).click();
    const downloadText = async name => {
      const downloading = page.waitForEvent("download");
      await mapper.getByRole("button", { name, exact: true }).click();
      return readFile(await (await downloading).path(), "utf8");
    };
    const before = await downloadText("Export CSV table");
    const importFile = async content => {
      const chooser = page.waitForEvent("filechooser");
      await mapper.getByRole("button", { name: "Import value table", exact: true }).click();
      await (await chooser).setFiles({ name: "values.csv", mimeType: "text/csv", buffer: Buffer.from(content) });
    };
    await importFile('key,expression,note\nPatient.active,true,"Imported note <example>"\n');
    await mapper.getByText("Imported 1 value edit(s).", { exact: true }).waitFor();
    const changed = await downloadText("Export CSV table");
    assert.match(changed, /"Patient.active","true","Imported note <example>"/);
    const html = await downloadText("Export HTML documentation");
    assert.match(html, /Imported note &lt;example&gt;/);
    await page.screenshot({ path: "test/e2e/output/value-table-actions.png", animations: "disabled" });
    const documentation = await page.context().newPage();
    await documentation.setContent(html);
    await documentation.screenshot({ path: "test/e2e/output/mapping-documentation.png", animations: "disabled", fullPage: true });
    await documentation.close();
    await importFile('key,expression,note\nPatient.active,false,rejected\nPatient.missing,true,bad\n');
    await mapper.getByText("Invalid or duplicate value target: Patient.missing", { exact: true }).waitFor();
    assert.equal(await downloadText("Export CSV table"), changed);
    await mapper.getByRole("tab", { name: "Mapper", exact: true }).click();
    await mapper.getByRole("button", { name: "↶ Undo", exact: true }).click();
    await mapper.getByRole("tab", { name: "Properties", exact: true }).click();
    assert.equal(await downloadText("Export CSV table"), before);
    assert.deepEqual(session.pluginErrors(), []);
  } finally { await session.close(); }
});
