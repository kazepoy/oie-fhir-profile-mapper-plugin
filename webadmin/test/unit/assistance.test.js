// SPDX-License-Identifier: MPL-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { matchingConceptMaps } from "../../src/fhir/assistance.js";
import { showContextMenu } from "../../src/host/context-menu.js";

test("ConceptMaps match binding scopes or system pairs without mixing unrelated groups", () => {
  const maps = [
    { url: "right", groups: [{ source: "urn:source", target: "urn:target" }] },
    { url: "crossed", groups: [{ source: "urn:source", target: "urn:other" }, { source: "urn:other", target: "urn:target" }] },
    { url: "scope", source: "urn:source", target: "urn:binding|1" }
  ];
  assert.deepEqual(matchingConceptMaps(maps, { source: "urn:source", target: "urn:target" }).map(map => map.url), ["right"]);
  assert.deepEqual(matchingConceptMaps(maps, { source: "urn:source", systems: ["urn:target"], valueSet: "urn:binding|2" }).map(map => map.url), ["right", "scope"]);
  assert.equal(matchingConceptMaps(maps).length, 3);
  assert.equal(matchingConceptMaps(maps, { source: "urn:missing" }).length, 0);
});

test("the public menu uses the element's position when opened from the keyboard", () => {
  let position;
  const platform = { ui: { contextMenu: (...args) => { position = args; } } };
  let prevented = false;
  const event = { type: "keydown", currentTarget: { getBoundingClientRect: () => ({ left: 12, bottom: 34 }) },
    preventDefault: () => { prevented = true; }, stopPropagation() {} };
  assert.equal(showContextMenu(platform, event, [{ label: "Inspect" }]), true);
  assert.ok(prevented);
  assert.deepEqual(position.slice(0, 2), [12, 34]);
  assert.equal(showContextMenu({}, event, []), false);
});
