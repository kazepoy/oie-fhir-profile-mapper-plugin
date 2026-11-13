// SPDX-License-Identifier: MPL-2.0
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { openStep, signIn } from "./session.js";

const waitForCodeLayout = page => page.waitForFunction(() => window.monaco.editor.getEditors()
  .filter(e => e.getDomNode()?.closest(".fml-test, .mapper-test"))
  .every(e => Math.abs(e.getLayoutInfo().height - e.getDomNode().closest(".fm-code-box").clientHeight) < 6));

describe("the JSON, FR Core and FHIR demo channels", () => {
  let session;
  before(async () => { session = await signIn(); });
  after(() => session?.close());

  test("native groups and functional tags are visible in Channels", async () => {
    const { page } = session;
    await page.locator("[data-nav-item]").filter({ hasText: /^Channels$/ }).first().click();
    for (const name of ["HL7v2 - Mapper", "HL7v2 - FML", "FML versus Mapper", "JSON - Mapper", "CSV - Mapper", "CSV - FML", "XML - Mapper", "FHIR - FML", "HTTP - Mock"])
      await page.getByText(`[${name}]`, { exact: true }).waitFor();
    const row = page.locator("tr").filter({ has: page.getByText("Business JSON to Organization R5", { exact: true }) }).first();
    assert.match(await row.innerText(), /org-description/);
    assert.match(await row.innerText(), /R5/);
  });

  for (const [channel, step] of [["Business JSON to Organization R5", "Organization"], ["Business JSON to Patient FR Core", "Patient"]]) {
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
    await openStep(page, "FHIR Patient to Summary (FML)", "Patient Summary");
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

  test("FML keeps the source beside or below the sample without a second page scrollbar", async () => {
    const { page } = session;
    await openStep(page, "FHIR Patient to Summary (FML)", "Patient Summary");
    const fml = page.locator(".fhir-fml");
    await fml.getByRole("tab", { name: "Test", exact: true }).click();
    await fml.getByRole("button", { name: "Run test", exact: true }).click();
    await fml.locator(".fml-ok").waitFor();

    const checkLayout = async sideBySide => {
      await waitForCodeLayout(page);
      const inputs = fml.locator(".fml-test-inputs > .field");
      const sample = await inputs.nth(0).boundingBox();
      const source = await inputs.nth(1).boundingBox();
      const result = await fml.locator(".fml-test-result").boundingBox();
      assert.ok(sample.height > 40 && source.height > 40);
      if (sideBySide) {
        assert.ok(Math.abs(sample.y - source.y) < 2);
        assert.ok(source.x >= sample.x + sample.width);
      } else {
        assert.ok(source.y >= sample.y + sample.height);
      }
      assert.ok(result.y >= source.y + source.height);
      assert.ok(result.y + result.height <= page.viewportSize().height);
      assert.deepEqual(await fml.evaluate(el => {
        const overflowing = [];
        for (let node = el; node; node = node.parentElement) {
          if (node.scrollHeight > node.clientHeight + 2) overflowing.push(node.className);
        }
        return overflowing;
      }), []);
    };

    await page.setViewportSize({ width: 1600, height: 900 });
    await checkLayout(true);
    await page.setViewportSize({ width: 1400, height: 800 });
    await checkLayout(false);
    await fml.getByRole("button", { name: "⤢ Full screen", exact: true }).click();
    await checkLayout(true);
    // The complete result remains reachable in its own editor.
    assert.ok(await page.evaluate(() => {
      const editor = window.monaco.editor.getEditors().find(e => e.getDomNode()?.closest(".fml-test-result"));
      editor.setScrollTop(editor.getScrollHeight());
      return editor.getScrollTop() > 0;
    }));
    await fml.getByRole("button", { name: "Exit full screen (Esc)", exact: true }).click();
    await checkLayout(false);
    await page.setViewportSize({ width: 1600, height: 1100 });
    assert.deepEqual(session.pluginErrors(), []);
  });

  test("Profile Mapper shows the prepared HL7 XML in both preview scopes without page overflow", async () => {
    const { page } = session;
    await openStep(page, "ORU R01 to FHIR Patient", "Patient");
    const mapper = page.locator(".fhir-profile-mapper");
    await mapper.locator("table.mapper-tree tbody tr").first().waitFor();
    await mapper.getByRole("tab", { name: "Test", exact: true }).click();
    for (const scope of ["step", "transformer"]) {
      await mapper.getByRole("combobox", { name: "Preview scope", exact: true }).selectOption(scope);
      const response = page.waitForResponse(r => r.url().endsWith("/fhir-profile-mapper/test"));
      await mapper.getByRole("button", { name: "Run", exact: true }).click();
      const result = await (await response).json();
      assert.deepEqual(result.errors, []);
      assert.equal(result.source.dataType, "XML");
      assert.match(result.source.message, /<PID/);
      const prepared = mapper.locator(".mapper-test-inputs .field").nth(1);
      await prepared.waitFor();
      assert.equal(await prepared.locator("label").textContent(), "Prepared message");
      await mapper.locator(".mapper-test-output .monaco-editor").waitFor();
      assert.equal(await page.evaluate(() => window.monaco.editor.getEditors()
        .find(e => e.getDomNode()?.closest(".mapper-test-inputs .field:nth-child(2)"))?.getValue()), result.source.message);
      for (const size of [{ width: 1600, height: 900 }, { width: 1400, height: 800 }]) {
        await page.setViewportSize(size);
        await waitForCodeLayout(page);
        assert.deepEqual(await mapper.evaluate(el => {
          const overflowing = [];
          for (let node = el; node; node = node.parentElement)
            if (node.scrollHeight > node.clientHeight + 2) overflowing.push(node.className);
          return overflowing;
        }), []);
        const sample = await mapper.locator(".mapper-test-inputs .field").first().boundingBox();
        const source = await prepared.boundingBox();
        assert.ok(sample.height > 35 && source.height > 35);
        if (size.width === 1600) assert.ok(Math.abs(sample.y - source.y) < 2);
        else assert.ok(source.y >= sample.y + sample.height);
      }
    }
    await mapper.getByRole("button", { name: "⤢ Full screen", exact: true }).click();
    await waitForCodeLayout(page);
    const resultBox = await mapper.locator(".mapper-test-output .fm-code-box").boundingBox();
    assert.ok(resultBox.height > 100 && resultBox.y + resultBox.height <= page.viewportSize().height);
    await mapper.getByRole("button", { name: "Exit full screen (Esc)", exact: true }).click();
    await page.setViewportSize({ width: 1600, height: 1100 });
    assert.deepEqual(session.pluginErrors(), []);
  });
});
