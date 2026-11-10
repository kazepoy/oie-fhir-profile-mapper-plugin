// Tests of the Flows view model (web/flow-dashboard.js).
import test from "node:test";
import assert from "node:assert/strict";
import { statsOf, channelLanes, groupLanes } from "../web/flow-dashboard.js";

const KEY = "com.mirth.connect.donkey.model.message.Status";
const stats = (received, filtered, sent, error) => ({ "@class": "linked-hash-map",
  entry: [[ "RECEIVED", received ], [ "FILTERED", filtered ], [ "SENT", sent ], [ "ERROR", error ]].map(([s, n]) => ({ [KEY]: s, long: n })) });
const connector = (metaDataId, name, more = {}) => ({ channelId: "c", metaDataId, name, state: "STARTED", queued: 0,
  statusType: metaDataId ? "DESTINATION_CONNECTOR" : "SOURCE_CONNECTOR", statistics: stats(0, 0, 0, 0), waitForPrevious: true, ...more });
const status = (channelId, name, children) => ({ channelId, name, state: "STARTED", statistics: stats(10, 1, 9, 2), lifetimeStatistics: stats(100, 0, 0, 0),
  queued: 3, childStatuses: { dashboardStatus: children } });

test("counters read the engine's status map, queued included", () => {
  assert.deepEqual(statsOf(status("a", "A", [])), { RECEIVED: 10, FILTERED: 1, QUEUED: 3, SENT: 9, ERROR: 2 });
  assert.equal(statsOf(status("a", "A", []), true).RECEIVED, 100);
  assert.deepEqual(statsOf({ statistics: { entry: { [KEY]: "SENT", long: 4 } } }), { RECEIVED: 0, FILTERED: 0, QUEUED: 0, SENT: 4, ERROR: 0 });
});

test("destinations form chains from waitForPrevious, in metaDataId order", () => {
  const lane = channelLanes(status("a", "A", [connector(3, "Audit", { waitForPrevious: false }), connector(0, "Source"),
    connector(2, "Archive"), connector(1, "FHIR", { waitForPrevious: false, queued: 5 })]));
  assert.equal(lane.source.name, "Source");
  assert.deepEqual(lane.chains.map(chain => chain.map(c => c.name)), [["FHIR", "Archive"], ["Audit"]]);
  assert.equal(lane.chains[0][0].stats.QUEUED, 5);
});

test("channels are grouped by name, ungrouped ones last, with group totals and a name filter", () => {
  const statuses = [status("a", "Lab ORU", [connector(0, "Source")]), status("b", "Admissions", [connector(0, "Source")]), status("c", "Lab CSV", [connector(0, "Source")])];
  const groups = [{ id: "g2", name: "Laboratory", channels: { channel: [{ id: "c" }, { id: "a" }] } }, { id: "g1", name: "Empty", channels: null }];
  const out = groupLanes(statuses, groups);
  assert.deepEqual(out.map(g => [g.name, g.lanes.map(l => l.name)]), [["Laboratory", ["Lab CSV", "Lab ORU"]], ["Default Group", ["Admissions"]]]);
  assert.equal(out[0].stats.RECEIVED, 20);
  assert.deepEqual(groupLanes(statuses, groups, { filter: "csv" }).map(g => g.lanes.map(l => l.id)), [["c"]]);
});

test("chains follow the channel configuration, since statuses always report waitForPrevious false", async () => {
  const { waitsOf } = await import("../web/flow-dashboard.js");
  const config = { destinationConnectors: { connector: [{ metaDataId: 1, waitForPrevious: true }, { metaDataId: 2, waitForPrevious: true }, { metaDataId: 3, waitForPrevious: false }] } };
  const children = [connector(0, "Source"), ...[1, 2, 3].map(n => connector(n, `D${n}`, { waitForPrevious: false }))];
  assert.deepEqual(channelLanes(status("a", "A", children), false, waitsOf(config)).chains.map(c => c.map(d => d.name)), [["D1", "D2"], ["D3"]]);
});

test("each counter maps to the Messages status it opens; Received means any status", async () => {
  const { STATUS_FILTER, messagesPath } = await import("../web/flow-dashboard.js");
  assert.deepEqual(STATUS_FILTER, { RECEIVED: null, FILTERED: "FILTERED", QUEUED: "QUEUED", SENT: "SENT", ERROR: "ERROR" });
  assert.equal(messagesPath("a b", 2), "/messages/a%20b?metaDataId=2");
  assert.equal(messagesPath("a"), "/messages/a");
});
