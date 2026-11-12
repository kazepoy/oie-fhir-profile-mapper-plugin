// SPDX-License-Identifier: MPL-2.0
// Opens the demo's web administrator in Playwright, signs in, and reaches a step
// of a channel's source transformer. Settings come from the environment.
import { chromium, webkit } from "playwright";

export const DEMO_URL = process.env.DEMO_URL || "https://localhost:8443/oie-webadmin/";
export const PASSWORD = process.env.OIE_DEMO_PASSWORD || "demo-oie-password";

export async function signIn({ user = "admin", password = PASSWORD, locale = "en-US", colorScheme = "light" } = {}) {
  // E2E_BROWSER=webkit runs the same checks in Safari's engine.
  const browser = await (process.env.E2E_BROWSER === "webkit" ? webkit : chromium).launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 1100 }, locale, colorScheme });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(DEMO_URL);
  await page.locator("input[type=text]").first().fill(user);
  await page.locator("input[type=password]").first().fill(password);
  await page.keyboard.press("Enter");
  await page.locator("[data-nav-item]").first().waitFor({ timeout: 60000 });
  /** Errors of the page, without the expected 401/404 of the sign-in and optional assets. */
  const pluginErrors = () => errors.filter(error => !/401|404|Failed to load resource/.test(error));
  return { browser, page, pluginErrors, close: () => browser.close() };
}

/** Opens the source transformer of a channel (by its exact name) and selects the step with this name. */
export async function openStep(page, channelName, stepName) {
  // A fresh page: an editor left with unsaved changes would ask before leaving.
  page.once("dialog", dialog => dialog.accept().catch(() => {}));
  await page.goto(DEMO_URL);
  await page.locator("[data-nav-item]").first().waitFor({ timeout: 60000 });
  await page.locator("[data-nav-item]").filter({ hasText: /^Channels$/ }).first().click();
  const row = page.locator("tr").filter({ has: page.getByText(channelName, { exact: true }) }).first();
  await row.waitFor();
  await row.dblclick();
  await page.getByRole("tab", { name: "Source" }).click();
  await page.getByRole("button", { name: /Edit Transformer/i }).first().click();
  const steps = page.locator("table").filter({ hasText: "Enabled" }).locator("tbody tr");
  await steps.first().waitFor();
  const index = await steps.evaluateAll((rows, name) => rows.findIndex(r => [...r.querySelectorAll("input")].some(i => i.value === name)), stepName);
  if (index < 0) throw new Error(`Step ${stepName} not found in ${channelName}`);
  // The names are inputs: select the row by its number cell.
  await steps.nth(index).locator("td").nth(1).click();
}
