// SPDX-License-Identifier: MPL-2.0
// Flows: the deployed channels by group, each read left to right (source, then
// its destination chains) with live message counters. A card opens Messages
// filtered on its connector. Loaded by plugin.js; uses only the host's React.
let R;
const h = (...args) => R.createElement(...args);

const REFRESH_MS = 5000;
const STATUS = ["RECEIVED", "FILTERED", "QUEUED", "SENT", "ERROR"];
const SOURCE_COUNTERS = [["RECEIVED", "Received"], ["FILTERED", "Filtered"], ["QUEUED", "Queued"], ["ERROR", "Errored"]];
const DEST_COUNTERS = [["SENT", "Sent"], ["QUEUED", "Queued"], ["FILTERED", "Filtered"], ["ERROR", "Errored"]];
const DEFAULT_GROUP = "Default Group";

/* ---------------------------------------------------------------- model */

const list = (value, key) => {
  const inner = value && typeof value === "object" && !Array.isArray(value) && key in value ? value[key] : value;
  return inner == null || inner === "" ? [] : Array.isArray(inner) ? inner : [inner];
};

// Counters of a dashboard status: the engine sends a map of Status → long.
export function statsOf(status, lifetime = false) {
  const out = { RECEIVED: 0, FILTERED: 0, QUEUED: Number(status?.queued) || 0, SENT: 0, ERROR: 0 };
  for (const entry of list((lifetime ? status?.lifetimeStatistics : status?.statistics)?.entry)) {
    const name = entry["com.mirth.connect.donkey.model.message.Status"] ?? entry.string ?? entry.key;
    const count = Number(entry.long ?? entry.value) || 0;
    if (name in out && name !== "QUEUED") out[name] += count;
  }
  return out;
}

export const addStats = (a, b) => Object.fromEntries(STATUS.map(key => [key, (a[key] || 0) + (b[key] || 0)]));

// metaDataId → waitForPrevious from a channel configuration. Dashboard statuses
// always report false, so chains come from the channel itself.
export function waitsOf(channel) {
  const list2 = channel?.destinationConnectors?.connector ?? channel?.destinationConnectors;
  return new Map(list(list2).map(d => [Number(d.metaDataId), d.waitForPrevious !== false && d.waitForPrevious !== "false"]));
}

// Same chain rule as the engine: a destination that does not wait for the
// previous one starts a new chain. Statuses list deployed connectors only.
export function channelLanes(status, lifetime = false, waitsFor = new Map()) {
  const children = list(status.childStatuses, "dashboardStatus");
  const source = children.find(c => c.statusType === "SOURCE_CONNECTOR" || Number(c.metaDataId) === 0);
  const chains = [];
  for (const child of children.filter(c => c !== source).sort((a, b) => Number(a.metaDataId) - Number(b.metaDataId))) {
    const waits = waitsFor.get(Number(child.metaDataId)) ?? (child.waitForPrevious !== false && child.waitForPrevious !== "false");
    if (!chains.length || !waits) chains.push([]);
    chains[chains.length - 1].push({ metaDataId: Number(child.metaDataId), name: child.name || `Destination ${child.metaDataId}`,
      state: child.state, queueEnabled: !!child.queueEnabled, stats: statsOf(child, lifetime) });
  }
  return {
    id: status.channelId, name: status.name || status.channelId, state: status.state, stats: statsOf(status, lifetime),
    source: { metaDataId: 0, name: source?.name || "Source", state: source?.state || status.state,
      queueEnabled: !!source?.queueEnabled, stats: statsOf(source, lifetime) },
    chains
  };
}

// Groups in the engine's order of names, "Default Group" last for the rest.
export function groupLanes(statuses, groups, { filter = "", lifetime = false, waits = new Map() } = {}) {
  const needle = filter.trim().toLowerCase();
  const lanes = statuses.map(status => channelLanes(status, lifetime, waits.get(status.channelId)))
    .filter(lane => !needle || lane.name.toLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name));
  const byId = new Map(lanes.map(lane => [lane.id, lane]));
  const seen = new Set();
  const out = [...groups].sort((a, b) => String(a.name).localeCompare(String(b.name))).map(group => {
    const members = list(group.channels, "channel").map(c => byId.get(c?.id ?? c)).filter(Boolean);
    members.forEach(lane => seen.add(lane.id));
    return { id: group.id, name: group.name || "Group", lanes: members.sort((a, b) => a.name.localeCompare(b.name)) };
  });
  const rest = lanes.filter(lane => !seen.has(lane.id));
  if (rest.length) out.push({ id: "default", name: DEFAULT_GROUP, lanes: rest });
  return out.filter(group => group.lanes.length)
    .map(group => ({ ...group, stats: group.lanes.reduce((sum, lane) => addStats(sum, lane.stats), {}) }));
}

/* ---------------------------------------------------------------- messages */
// Messages reads the connector from its URL (?metaDataId=) but has no URL for a
// status: the status is ticked in its Status menu, then the search is run again.
// Received counts every message, so it needs no status.
export const STATUS_FILTER = { RECEIVED: null, FILTERED: "FILTERED", QUEUED: "QUEUED", SENT: "SENT", ERROR: "ERROR" };

export function messagesPath(channelId, metaDataId) {
  return `/messages/${encodeURIComponent(channelId)}${metaDataId == null ? "" : `?metaDataId=${metaDataId}`}`;
}

function waitFor(find, timeout = 5000, doc = document) {
  return new Promise(resolve => {
    let done = false;
    const finish = value => { if (!done) { done = true; observer.disconnect(); clearTimeout(timer); resolve(value); } };
    const observer = new MutationObserver(() => { const found = find(); if (found) finish(found); });
    const timer = setTimeout(() => finish(null), timeout);
    observer.observe(doc.body, { childList: true, subtree: true, attributes: true });
    const found = find(); if (found) finish(found);
  });
}

async function selectStatus(platform, status, doc = document) {
  const trigger = await waitFor(() => [...doc.querySelectorAll(".field")]
    .find(field => field.querySelector(":scope > label")?.textContent.trim() === "Status")?.querySelector("button[aria-haspopup='menu']"));
  if (!trigger) return platform.ui?.toast?.(`Messages opened without the ${status} filter: choose it in Status.`, "warn");
  trigger.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, pointerType: "mouse" }));
  const item = await waitFor(() => [...doc.querySelectorAll('[role="menuitemcheckbox"]')].find(node => node.textContent.trim().endsWith(status)));
  if (!item) return;
  if (item.getAttribute("aria-checked") !== "true") item.click();
  doc.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  const search = await waitFor(() => [...doc.querySelectorAll("button")].find(button => button.textContent.trim() === "Search" && !button.disabled));
  search?.click();
}

/* ---------------------------------------------------------------- view */

const STYLES = `
.ofd { --f-bg:var(--bg1,#f3f6f9); --f-surface:var(--bg2,#fff); --f-surface-2:var(--bg1,#f3f6f9); --f-ink:var(--text,#1f2c38);
  --f-dim:var(--text-dim,#4d6173); --f-line:var(--line,#cdd7e0); --f-src:var(--accent,#2e6da4);
  --f-dst:color-mix(in srgb, var(--ok,#2e9e4f) 55%, var(--accent,#2e6da4)); --f-chan:color-mix(in srgb, var(--violet,#b18cff) 70%, var(--text,#1f2c38));
  --f-msg:var(--warn,#b97f0a); --f-ok:var(--ok,#2e9e4f); --f-err:var(--err,#cc3b3b);
  --f-queue:color-mix(in srgb, var(--err,#cc3b3b) 30%, var(--amber,#f0b541)); --f-filter:color-mix(in srgb, var(--accent,#2e6da4) 45%, var(--text-dim,#4d6173)); --f-mono:var(--font-mono,ui-monospace,monospace);
  display:flex; flex-direction:column; flex:1; min-height:0; color:var(--f-ink); font-size:13px; line-height:1.4; }
.ofd button { font:inherit; color:inherit; }
.ofd-bar { flex:none; display:flex; flex-wrap:wrap; align-items:center; gap:8px 16px; padding:10px 16px; border-bottom:1px solid var(--f-line); background:var(--f-surface); }
.ofd-title { font-size:14px; font-weight:600; }
.ofd-totals { display:flex; gap:6px; flex-wrap:wrap; }
.ofd-bar input[type="search"] { flex:none; width:240px; max-width:100%; height:28px; padding:0 10px; border:1px solid var(--f-line); border-radius:6px; background:var(--f-surface); color:var(--f-ink); }
.ofd-bar label { display:inline-flex; align-items:center; gap:6px; color:var(--f-dim); }
.ofd-bar .ofd-push { margin-left:auto; display:flex; align-items:center; gap:10px; }
.ofd-btn { height:28px; padding:0 10px; border:1px solid var(--f-line); border-radius:6px; background:var(--f-surface); cursor:pointer; }
.ofd-btn:hover { border-color:var(--f-src); }
.ofd-muted { color:var(--f-dim); font-size:11.5px; font-variant-numeric:tabular-nums; }
.ofd-body { flex:1; min-height:0; overflow:auto; padding:14px 16px 24px; display:flex; flex-direction:column; gap:14px; background-color:var(--f-bg);
  background-image:radial-gradient(color-mix(in srgb,var(--f-dim) 18%,transparent) 1px,transparent 1px); background-size:22px 22px; }

.ofd-group { border:1px solid color-mix(in srgb,var(--f-chan) 22%,var(--f-line)); border-radius:14px; background:color-mix(in srgb,var(--f-chan) 4%,var(--f-bg)); min-width:max-content; }
.ofd-ghead { display:flex; align-items:center; gap:12px; width:100%; padding:9px 14px; border:0; background:none; cursor:pointer; text-align:left; }
.ofd-ghead svg { width:14px; height:14px; fill:none; stroke:var(--f-dim); stroke-width:2; transition:transform .12s; }
.ofd-ghead[aria-expanded="true"] svg { transform:rotate(90deg); }
.ofd-gname { font-weight:700; font-size:11px; letter-spacing:.09em; text-transform:uppercase; color:var(--f-chan); }
.ofd-lanes { display:flex; flex-direction:column; gap:10px; padding:2px 14px 14px; }

/* Lanes are top-aligned; channel and connector cards share one height so the
   arrows meet at the middle of the first row. */
.ofd-lane { --card-h:84px; display:flex; align-items:flex-start; }
.ofd-chan { flex:none; width:230px; min-height:var(--card-h); box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; gap:4px; padding:10px 12px; margin-right:34px; position:relative;
  border:1px solid var(--f-line); border-radius:10px; background:var(--f-surface); }
.ofd-chan::after { content:""; position:absolute; right:-34px; top:50%; width:32px; border-top:2.5px solid var(--f-msg); }
.ofd-cname { display:flex; align-items:center; gap:7px; min-width:0; padding:0; border:0; background:none; cursor:pointer; text-align:left; font-weight:600; }
.ofd-cname span:last-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ofd-cname:hover span:last-child { color:var(--f-src); text-decoration:underline; }
.ofd-pip { flex:none; width:8px; height:8px; border-radius:50%; background:var(--f-dim); }
.ofd-pip.ok { background:var(--f-ok); } .ofd-pip.warn { background:var(--f-msg); } .ofd-pip.err { background:var(--f-err); }
.ofd-crow { display:flex; align-items:center; gap:8px; }
.ofd-link { padding:0 6px; border:1px solid var(--f-line); border-radius:5px; background:none; cursor:pointer; font-size:11px; color:var(--f-dim); }
.ofd-link:hover { color:var(--f-src); border-color:var(--f-src); }

.ofd-card { --k:var(--f-src); flex:none; width:268px; height:var(--card-h); box-sizing:border-box; display:flex; flex-direction:column; gap:6px; padding:8px 10px; text-align:left;
  border:1px solid color-mix(in srgb,var(--k) 45%,var(--f-line)); border-radius:10px; background:var(--f-surface);
  box-shadow:0 1px 2px color-mix(in srgb,var(--f-ink) 8%,transparent); transition:border-color .12s, box-shadow .12s; }
.ofd-card.is-dst { --k:var(--f-dst); }
.ofd-card.has-queue { border-color:var(--f-queue); }
.ofd-card.has-error { border-color:var(--f-err); box-shadow:inset 3px 0 0 var(--f-err); }
.ofd-card.is-stopped { opacity:.7; border-style:dashed; }
.ofd-ctitle { display:flex; align-items:baseline; gap:8px; min-width:0; width:100%; padding:0; border:0; background:none; text-align:left; cursor:pointer; }
.ofd-ctitle:hover .ofd-name { color:var(--k); text-decoration:underline; }
.ofd-kind { flex:none; font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--k); }
.ofd-name { flex:1; min-width:0; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ofd-state { flex:none; font-size:10px; color:var(--f-dim); }
.ofd-counters { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
.ofd-counter { display:flex; flex-direction:column; align-items:flex-start; min-width:0; padding:3px 5px; border:1px solid transparent; border-radius:5px; background:var(--f-surface-2); text-align:left; cursor:pointer; }
.ofd-counter:hover { border-color:color-mix(in srgb,var(--k) 60%,var(--f-line)); }
.ofd-counter:focus-visible, .ofd-ctitle:focus-visible { outline:2px solid var(--k); outline-offset:1px; }
.ofd-counter b { font:600 13px var(--f-mono); font-variant-numeric:tabular-nums; }
.ofd-counter span { font-size:9.5px; color:var(--f-dim); text-transform:uppercase; letter-spacing:.04em; }
/* Status colours: green = received/sent, orange = queued, red = errored, grey-blue = filtered.
   A non-zero counter is tinted; at zero only its label keeps the colour. */
.ofd-counter.c-RECEIVED, .ofd-total.c-RECEIVED, .ofd-counter.c-SENT, .ofd-total.c-SENT { --s:var(--f-ok); }
.ofd-counter.c-QUEUED, .ofd-total.c-QUEUED { --s:var(--f-queue); }
.ofd-counter.c-ERROR, .ofd-total.c-ERROR { --s:var(--f-err); }
.ofd-counter.c-FILTERED, .ofd-total.c-FILTERED { --s:var(--f-filter); }
.ofd-counter span { color:var(--s); }
.ofd-counter:not(.is-zero) { background:color-mix(in srgb,var(--s) 14%,var(--f-surface)); border-color:color-mix(in srgb,var(--s) 35%,transparent); }
.ofd-counter:not(.is-zero) b { color:var(--s); }
.ofd-counter.is-zero b { color:var(--f-dim); font-weight:400; }
.ofd-counter.is-zero span { opacity:.75; }
.ofd-total { display:inline-flex; align-items:baseline; gap:4px; padding:1px 7px; border-radius:10px; background:var(--f-surface-2); font-size:11px; color:var(--f-dim); }
.ofd-total b { font:600 12px var(--f-mono); color:var(--f-ink); font-variant-numeric:tabular-nums; }
.ofd-total { border-left:3px solid var(--s); border-radius:4px 10px 10px 4px; }
.ofd-total.is-set { background:color-mix(in srgb,var(--s) 12%,var(--f-surface)); } .ofd-total.is-set b { color:var(--s); }

/* Arrows: source → fork → each chain; "then" between chained destinations. */
.ofd-src { position:relative; flex:none; margin-right:44px; }
.ofd-src.has-dest::after { content:""; position:absolute; right:-44px; top:50%; width:44px; border-top:2.5px solid var(--f-msg); }
.ofd-chains { display:flex; flex-direction:column; gap:10px; }
.ofd-chain { position:relative; display:flex; align-items:center; padding-left:30px; }
.ofd-chain::before { content:""; position:absolute; left:0; top:50%; width:22px; border-top:2.5px solid var(--f-msg); }
.ofd-chain::after { content:""; position:absolute; left:21px; top:calc(50% - 6px); border:6px solid transparent; border-left:9px solid var(--f-msg); border-right:0; }
.ofd-chains.is-multi > .ofd-chain > .ofd-fork { position:absolute; left:0; top:-5px; bottom:-5px; border-left:2.5px solid var(--f-msg); }
.ofd-chains.is-multi > .ofd-chain:first-child > .ofd-fork { top:50%; }
.ofd-chains.is-multi > .ofd-chain:last-child > .ofd-fork { bottom:50%; }
.ofd-chains.is-multi > .ofd-chain:first-child > .ofd-fork, .ofd-chains.is-multi > .ofd-chain:last-child > .ofd-fork { margin-top:-1px; }
.ofd-then { position:relative; flex:none; width:58px; height:20px; }
.ofd-then::before { content:""; position:absolute; left:4px; right:12px; top:50%; border-top:1.8px dashed var(--f-dim); }
.ofd-then::after { content:""; position:absolute; right:3px; top:calc(50% - 5px); border:5px solid transparent; border-left:8px solid var(--f-dim); border-right:0; }
.ofd-then span { position:absolute; left:0; right:0; top:-10px; text-align:center; font-size:9.5px; color:var(--f-dim); }
.ofd-none { color:var(--f-dim); font-style:italic; padding-left:30px; line-height:var(--card-h); }
.ofd-empty { margin:40px auto; color:var(--f-dim); text-align:center; }
`;

const pipOf = state => ({ STARTED: "ok", PAUSED: "warn", STOPPED: "err" })[state] || "";
const fmt = n => Number(n).toLocaleString();

function Counters({ stats, counters, open, where }) {
  return h("div", { className: "ofd-counters" }, counters.map(([key, label]) =>
    h("button", { key, type: "button", className: `ofd-counter c-${key}${stats[key] ? "" : " is-zero"}`,
      title: `${where}: open ${STATUS_FILTER[key] ? `${label.toLowerCase()} ` : ""}messages`, onClick: () => open(key) },
      h("b", null, fmt(stats[key])), h("span", null, label))));
}

function Card({ lane, connector, source, go }) {
  const counters = source ? SOURCE_COUNTERS : DEST_COUNTERS;
  const label = source ? "Source" : `D${connector.metaDataId}`;
  const stopped = connector.state && connector.state !== "STARTED";
  const where = `${lane.name} · ${connector.name}`;
  return h("div", {
    className: `ofd-card${source ? "" : " is-dst"}${connector.stats.ERROR ? " has-error" : connector.stats.QUEUED ? " has-queue" : ""}${stopped ? " is-stopped" : ""}` },
    h("button", { type: "button", className: "ofd-ctitle", title: `${where}: open messages`, onClick: () => go.messages(lane.id, connector.metaDataId) },
      h("span", { className: "ofd-kind" }, label),
      h("span", { className: "ofd-name", title: connector.name }, connector.name),
      stopped && h("span", { className: "ofd-state" }, String(connector.state).toLowerCase())),
    h(Counters, { stats: connector.stats, counters, where, open: key => go.messages(lane.id, connector.metaDataId, STATUS_FILTER[key]) }));
}

function Lane({ lane, go }) {
  return h("div", { className: "ofd-lane" },
    h("div", { className: "ofd-chan" },
      h("button", { type: "button", className: "ofd-cname", title: `${lane.name}: open messages`, onClick: () => go.messages(lane.id) },
        h("span", { className: `ofd-pip ${pipOf(lane.state)}`, "aria-label": lane.state }), h("span", null, lane.name)),
      h("div", { className: "ofd-crow" },
        h("span", { className: "ofd-muted" }, String(lane.state || "").toLowerCase()),
        h("button", { type: "button", className: "ofd-link", onClick: () => go.edit(lane.id), title: "Edit the channel (opens its Flow)" }, "Edit"))),
    h("div", { className: `ofd-src${lane.chains.length ? " has-dest" : ""}` }, h(Card, { lane, connector: lane.source, source: true, go })),
    lane.chains.length ? h("div", { className: `ofd-chains${lane.chains.length > 1 ? " is-multi" : ""}` }, lane.chains.map((chain, i) =>
      h("div", { key: i, className: "ofd-chain" }, h("span", { className: "ofd-fork" }),
        chain.map((connector, j) => h(R.Fragment, { key: connector.metaDataId },
          j > 0 && h("span", { className: "ofd-then", title: `Waits for D${chain[j - 1].metaDataId}` }, h("span", null, "then")),
          h(Card, { lane, connector, go }))))))
      : h("span", { className: "ofd-none" }, "No destinations"));
}

const Totals = ({ stats }) => h("span", { className: "ofd-totals" }, [["RECEIVED", "received"], ["FILTERED", "filtered"], ["QUEUED", "queued"], ["SENT", "sent"], ["ERROR", "errored"]]
  .map(([key, label]) => h("span", { key, className: `ofd-total c-${key}${stats[key] ? " is-set" : ""}` }, h("b", null, fmt(stats[key] || 0)), label)));

function FlowsView({ platform }) {
  const [data, setData] = R.useState(null);
  const [error, setError] = R.useState("");
  const [filter, setFilter] = R.useState("");
  const [lifetime, setLifetime] = R.useState(false);
  const [closed, setClosed] = R.useState(() => new Set());
  const [updated, setUpdated] = R.useState(null);

  const [waits, setWaits] = R.useState(() => new Map());
  // Counters refresh every few seconds; groups and chains on load and on Refresh.
  const load = R.useCallback(async (structure = false) => {
    try {
      const [statuses, groups] = await Promise.all([platform.api.status.list(),
        structure ? platform.api.channelGroups.list().catch(() => []) : null]);
      setData(prev => ({ statuses, groups: groups ?? prev?.groups ?? [] })); setError(""); setUpdated(new Date());
      if (structure && statuses.length) {
        const channels = await platform.api.channels.list(statuses.map(s => s.channelId)).catch(() => []);
        setWaits(new Map(list(channels).map(channel => [channel.id, waitsOf(channel)])));
      }
    } catch (e) { setError(e.message || String(e)); }
  }, [platform]);
  R.useEffect(() => {
    load(true);
    const timer = setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const go = {
    messages: (channelId, metaDataId, status) => {
      platform.router.navigate(messagesPath(channelId, metaDataId));
      if (status) selectStatus(platform, status);
    },
    edit: channelId => platform.router.navigate(`/channels/${encodeURIComponent(channelId)}/edit`)
  };
  const groups = data ? groupLanes(data.statuses, data.groups, { filter, lifetime, waits }) : [];
  const totals = groups.reduce((sum, group) => addStats(sum, group.stats), {});
  const toggle = id => setClosed(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  return h("div", { className: "view ofd" }, h("style", null, STYLES),
    h("div", { className: "ofd-bar" },
      h("span", { className: "ofd-title" }, "Flows"),
      h(Totals, { stats: totals }),
      h("input", { type: "search", id: "ofd-filter", placeholder: "Filter channels", value: filter, onChange: e => setFilter(e.target.value), "aria-label": "Filter channels" }),
      h("label", null, h("input", { type: "checkbox", id: "ofd-lifetime", checked: lifetime, onChange: e => setLifetime(e.target.checked) }), "Lifetime"),
      h("span", { className: "ofd-push" },
        h("span", { className: "ofd-muted" }, error ? `Refresh failed: ${error}` : updated ? `Updated ${updated.toLocaleTimeString()}` : "Loading…"),
        h("button", { type: "button", className: "ofd-btn", onClick: () => load(true) }, "Refresh"))),
    h("div", { className: "ofd-body" },
      data && !groups.length && h("div", { className: "ofd-empty" }, filter ? "No channel matches the filter." : "No deployed channels. Deploy a channel to see its flow here."),
      groups.map(group => {
        const open = !closed.has(group.id);
        return h("section", { key: group.id, className: "ofd-group", "aria-label": group.name },
          h("button", { type: "button", className: "ofd-ghead", "aria-expanded": open, onClick: () => toggle(group.id) },
            h("svg", { viewBox: "0 0 24 24", "aria-hidden": true }, h("path", { d: "M9 6l6 6-6 6" })),
            h("span", { className: "ofd-gname" }, group.name),
            h("span", { className: "ofd-muted" }, `${group.lanes.length} channel${group.lanes.length === 1 ? "" : "s"}`),
            h(Totals, { stats: group.stats })),
          open && h("div", { className: "ofd-lanes" }, group.lanes.map(lane => h(Lane, { key: lane.id, lane, go }))));
      })));
}

export function register(platform) {
  R = platform.React;
  platform.registerIcon?.("flows", "M3 6h5v4H3zM16 3h5v4h-5zM16 14h5v4h-5zM8 8h4v8h4M12 5h4M12 16h4");
  platform.registerView("/flows", platform.reactView(() => h(FlowsView, { platform })), { title: "Flows" });
  platform.registerNavItem({ id: "flows", label: "Flows", icon: "flows", path: "/flows", section: "Monitor", order: 0.5, task: "doShowDashboard" });
}
