// SPDX-License-Identifier: MPL-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { openStep, signIn, DEMO_URL } from "./session.js";

test("a temporary restricted role can edit its channel but cannot test or save settings", async () => {
  const admin = await signIn();
  let restricted;
  const username = `mapper-e2e-${Date.now()}`;
  const password = `Mapper-${Date.now()}-e2e!`;
  try {
    await admin.page.evaluate(async ({ username, password }) => {
      const { platform } = await import("@oie/web-shell");
      const api = platform.api;
      const fixture = window.mapperRbacFixture = {};
      const channels = api.asList(await api.channels.list(), "channel");
      const allowed = channels.filter(channel => ["ORU R01 vers Patient FHIR", "ORU R01 vers Patient FHIR (FML inline)"].includes(channel.name));
      if (allowed.length !== 2) throw new Error("The demo Patient channel is required");
      const permissions = ["viewDashboard", "viewChannels", "viewChannelGroups", "manageChannels", "viewCodeTemplates",
        "viewGlobalScripts", "viewTags", "viewResources", "viewServerSettings", "View Settings", "Edit FHIR mappings", "Edit FHIR FML transforms"];
      const role = await api.postXml("/extensions/rbac/roles", `<com.diridium.rbac.Role><name>${username}</name>
        <description>Temporary frontend test</description><permissions>${permissions.map(p => `<string>${p}</string>`).join("")}</permissions>
        <channelIds>${allowed.map(channel => `<string>${channel.id}</string>`).join("")}</channelIds><restricted>true</restricted><isAdmin>false</isAdmin></com.diridium.rbac.Role>`);
      fixture.roleId = role.id;
      await api.users.create({ username, firstName: "Frontend", lastName: "Test" });
      fixture.userId = (await api.users.get(username)).id;
      await api.users.updatePassword(fixture.userId, password);
      await api.users.setPreference(fixture.userId, "firstlogin", "false");
      await api.post(`/extensions/rbac/users/${fixture.userId}/role/${fixture.roleId}`, null);
    }, { username, password });
    restricted = await signIn({ user: username, password, locale: "fr-FR" });
    const { page } = restricted;
    await openStep(page, "ORU R01 vers Patient FHIR", "Patient");
    const mapper = page.locator(".fhir-profile-mapper");
    await mapper.getByRole("tab", { name: "Mappeur", exact: true }).waitFor();
    await mapper.getByRole("tab", { name: "Test", exact: true }).click();
    const mapperDenied = page.waitForResponse(response => response.url().endsWith("/fhir-profile-mapper/test"));
    await mapper.getByRole("button", { name: "Exécuter", exact: true }).click();
    assert.equal((await mapperDenied).status(), 403);
    await mapper.getByText(/permission « Test FHIR mapper steps »/).waitFor();
    await openStep(page, "ORU R01 vers Patient FHIR (FML inline)", "Patient (FML inline)");
    const fml = page.locator(".fhir-fml");
    await fml.getByRole("tab", { name: "Test", exact: true }).click();
    const fmlDenied = page.waitForResponse(response => response.url().endsWith("/fhir-fml/test"));
    await fml.getByRole("button", { name: "Exécuter le test", exact: true }).click();
    assert.equal((await fmlDenied).status(), 403);
    await fml.getByText(/permission « Test FHIR FML transforms »/).waitFor();
    await page.goto(DEMO_URL);
    await page.locator("[data-nav-item]").filter({ hasText: /^Channels$/ }).first().click();
    await page.getByText("ORU R01 vers Patient FHIR", { exact: true }).waitFor();
    assert.equal(await page.getByText("SQL XML vers Patient FHIR", { exact: true }).count(), 0);
    await page.locator("[data-nav-item]").filter({ hasText: /^Settings$/ }).first().click();
    await page.getByText("FHIR Mapper", { exact: true }).click();
    const settings = page.locator(".fhir-mapper-settings");
    const settingsDenied = page.waitForResponse(response => response.url().endsWith("/fhir-profile-mapper/settings") && response.request().method() === "POST");
    await settings.getByRole("button", { name: "Enregistrer les contextes", exact: true }).click();
    assert.equal((await settingsDenied).status(), 403);
    await settings.getByRole("alert").waitFor();
    assert.match(await settings.getByRole("alert").innerText(), /permission « Manage FHIR mapper settings »/);
  } catch (error) {
    if (restricted) await restricted.page.screenshot({ path: "test/e2e/output/rbac-failure.png" });
    throw error;
  } finally {
    if (restricted) await restricted.close();
    try {
      await admin.page.evaluate(async () => {
        const { platform } = await import("@oie/web-shell");
        const fixture = window.mapperRbacFixture || {};
        try {
          if (fixture.userId) await platform.api.users.remove(fixture.userId);
        } finally {
          if (fixture.roleId) await platform.api.del(`/extensions/rbac/roles/${fixture.roleId}`);
        }
      });
    } finally { await admin.close(); }
  }
});
