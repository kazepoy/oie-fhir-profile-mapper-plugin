// SPDX-License-Identifier: MPL-2.0
// Channel Flow: a zoomable diagram of how a message moves through the channel
// being edited, with three layouts (Line, Columns, Bands). Every component opens
// its editor; "+" adds a filter rule or a transformer/response step in place.
// Loaded by plugin.js; uses only the host's React.
let R;
const h = (...args) => R.createElement(...args);

const LAYOUTS = [["auto", "Auto"], ["A", "Line"], ["B", "Columns"], ["C", "Bands"]];
const PREF_KEY = "oie.fhir-profile-mapper.flow-layout";
const ICONS = {
  filter: "M3 4h18l-7 8v7l-4 2v-9z", transformer: "M3 7h16l-4-4M21 17H5l4 4", conn: "M4 5h16v12H4zM8 21h8M12 17v4",
  response: "M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3", script: "M8 5l-6 7 6 7M16 5l6 7-6 7",
  att: "M8 13l7-7a3 3 0 014 4L9 20a5 5 0 01-7-7L13 2", ext: "M3 4h18v6H3zM3 14h18v6H3zM7 7h.01M7 17h.01", reply: "M20 12H6m5-6l-6 6 6 6"
};
const SHORT = { "JavaScript": "JS", "Rule Builder": "Rule", "Message Builder": "Builder", "FHIR Profile Mapper": "FHIR",
  "External Script": "Ext", "XSLT Step": "XSLT", "Destination Set Filter": "DestSet", "Iterator": "↻" };
const LABEL = { filter: "Filter", transformer: "Transformer", response: "Response" };
const EMPTY = { filter: "No rules · accepts all", transformer: "No steps", response: "No steps" };

/* ---------------------------------------------------------------- model */

const enabled = value => value !== false && value !== "false";

// True when the script does more than the engine's default template.
export function hasScript(value, preprocessor = false) {
  const trivia = "(?:\\s|//[^\\r\\n]*(?:\\r?\\n|$)|/\\*[\\s\\S]*?\\*/)*";
  return !new RegExp(`^${trivia}(?:return${preprocessor ? "(?:\\s+message)?" : ""}\\s*;?)?${trivia}$`).test(String(value || ""));
}

function endpoint(connector) {
  const props = connector.properties || {}, listener = props.listenerConnectorProperties;
  const host = listener?.host || props.remoteAddress || props.remoteHost || props.host || props.smtpHost
    || props.locationURI || props.url || props.host || props.directory || props.channelId || "";
  const port = listener?.port || props.remotePort || props.port || props.smtpPort;
  let text = String(host).replace(/(\/\/)[^/@\s]+@/, "$1").split(/[?#]/)[0];
  if (port && text && !/^\w+:\/\//.test(text)) text += `:${port}`;
  if (props.contextPath) text += `/${String(props.contextPath).replace(/^\//, "")}`;
  return text === "none" ? "" : text;
}

function typeLabel(platform, section, type) {
  const def = section === "filter" ? platform.ruleType?.(type) : platform.stepType?.(type);
  return def?.label || platform.oie?.elementTypeLabel?.(type) || String(type).split(".").pop();
}

function stepsTile(platform, id, section, connector, ctx, off) {
  const key = section === "response" ? "responseTransformer" : section;
  const items = platform.oie.elementsToArray(connector[key]?.elements).map((element, index) => {
    const label = typeLabel(platform, section, element.__type);
    return { index, name: element.name || label, type: SHORT[label] || label.split(" ")[0], disabled: !enabled(element.enabled) };
  });
  return { id, kind: section, label: LABEL[section], ctx, items, empty: !items.length, off,
    target: { section, metaDataId: connector.metaDataId ?? 0 }, add: true };
}

function scriptTile(channel, id, label, key, ctx) {
  return { id, kind: "script", label, ctx, empty: !hasScript(channel[key], key === "preprocessingScript"),
    target: { section: "script", key }, add: true };
}

function dataTypes(transformer) {
  const input = transformer?.inboundDataType, output = transformer?.outboundDataType;
  return input || output ? `${input || "?"} → ${output || input || "?"}` : "";
}

// Same rule as the engine: a destination that does not wait for the previous one
// opens a new chain; a disabled one never opens a chain but stays where declared.
export function destinationChains(destinations) {
  const chains = [];
  let beforeFirst = [];
  for (const destination of destinations) {
    if (!enabled(destination.enabled)) { (chains[chains.length - 1] || beforeFirst).push(destination); continue; }
    if (!chains.length || !enabled(destination.waitForPrevious)) chains.push(chains.length ? [] : beforeFirst);
    chains[chains.length - 1].push(destination);
  }
  if (!chains.length && beforeFirst.length) chains.push(beforeFirst);
  return chains;
}

export function flowModel(channel, platform) {
  const source = channel.sourceConnector || {};
  const transport = source.transportName || "Source";
  const polled = !!source.properties?.pollConnectorProperties || /Reader$/.test(transport) && transport !== "Channel Reader";
  const settings = source.properties?.sourceConnectorProperties || {};
  const destinations = platform.oie.destinationsOf(channel);
  const chains = destinationChains(destinations).map(chain => chain.map(destination => {
    const off = !enabled(destination.enabled);
    const ctx = `Destination ${destination.metaDataId} · ${destination.name || ""}`;
    const id = `d${destination.metaDataId}`;
    return {
      id: `${id}-block`, metaDataId: destination.metaDataId, kind: "dst", kindLabel: `Destination ${destination.metaDataId}`,
      name: destination.name || `Destination ${destination.metaDataId}`, types: dataTypes(destination.transformer), off,
      target: { section: "connector", metaDataId: destination.metaDataId },
      tiles: [
        stepsTile(platform, `${id}-filter`, "filter", destination, ctx, off),
        stepsTile(platform, `${id}-transformer`, "transformer", destination, ctx, off),
        { id: `${id}-conn`, kind: "conn", label: "Connector", ctx, title: destination.transportName || "Unknown connector",
          detail: endpoint(destination), target: { section: "connector", metaDataId: destination.metaDataId } },
        stepsTile(platform, `${id}-response`, "response", destination, ctx, off)
      ]
    };
  }));
  const attachment = channel.properties?.attachmentProperties?.type || "None";
  const selector = String(settings.responseVariable || "None");
  const chosen = /^d(\d+)$/.exec(selector);
  const chosenName = chosen && destinations.find(d => String(d.metaDataId) === chosen[1])?.name;
  const reply = selector === "None" ? "No response"
    : chosen ? `Destination ${chosen[1]}${chosenName ? ` · ${chosenName}` : ""}`
    : /^Auto-generate|^Postprocessor$/.test(selector) ? selector : `Response map · ${selector}`;
  return {
    sender: { label: polled ? "Polled" : transport === "Channel Reader" ? "Calling channel" : "Sender", detail: endpoint(source) || transport },
    replies: selector !== "None" && !polled,
    source: {
      id: "s-block", kind: "src", kindLabel: "Source", name: transport, types: dataTypes(source.transformer), off: !enabled(source.enabled),
      target: { section: "connector", metaDataId: 0 },
      tiles: [
        { id: "s-conn", kind: "conn", label: "Connector", ctx: "Source", title: transport, detail: endpoint(source),
          target: { section: "connector", metaDataId: 0 } },
        { id: "s-att", kind: "att", label: "Attachments", ctx: "Channel", title: attachment, empty: attachment === "None",
          target: { section: "attachments" } },
        scriptTile(channel, "s-pre", "Preprocessor", "preprocessingScript", "Channel"),
        stepsTile(platform, "s-filter", "filter", { ...source, metaDataId: 0 }, "Source"),
        stepsTile(platform, "s-transformer", "transformer", { ...source, metaDataId: 0 }, "Source")
      ]
    },
    chains,
    lifecycle: { id: "life-block", kind: "chan", kindLabel: "Channel", name: "Lifecycle",
      tiles: [scriptTile(channel, "deploy", "Deploy", "deployScript", "Channel"), scriptTile(channel, "undeploy", "Undeploy", "undeployScript", "Channel")] },
    end: { id: "end-block", kind: "chan", kindLabel: "Channel", name: "Postprocessing",
      tiles: [scriptTile(channel, "post", "Postprocessor", "postprocessingScript", "Channel"),
        { id: "reply", kind: "reply", label: "Response to sender", ctx: "Source settings", title: reply, empty: selector === "None",
          detail: selector === "None" ? "" : enabled(settings.respondAfterProcessing) ? "after processing" : "before processing",
          target: { section: "connector", metaDataId: 0 } }] }
  };
}

// The layout that stays readable for the channel's shape.
export function pickLayout(model) {
  const count = model.chains.flat().length, longest = Math.max(0, ...model.chains.map(chain => chain.length));
  if (count >= 5 || longest >= 3) return "C";
  return model.chains.length >= 2 ? "B" : "A";
}

// Types the editor would offer in its own "Add" dialog.
export function elementTypes(platform, target) {
  const registry = target.section === "filter" ? platform.ruleTypes() : platform.stepTypes();
  return [...registry].filter(([, def]) => String(target.metaDataId) === "0" || !def.onlySource)
    .map(([type, def]) => ({ type, label: def.label || platform.oie.elementTypeLabel(type) }));
}

// Appends a new element exactly as the filter/transformer editor creates one,
// and returns its index. The caller marks the channel as modified.
export function addElement(channel, platform, target, type) {
  const oie = platform.oie, filter = target.section === "filter";
  const connector = String(target.metaDataId) === "0" ? channel.sourceConnector
    : oie.destinationsOf(channel).find(d => String(d.metaDataId) === String(target.metaDataId));
  if (!connector) throw new Error(`Connector ${target.metaDataId} not found`);
  const version = channel["@version"] || platform.store?.getState?.("serverVersion") || "4.5.2";
  const key = target.section === "response" ? "responseTransformer" : target.section;
  const container = connector[key] ||= filter ? oie.emptyFilter(version) : oie.emptyTransformer(version);
  const def = (filter ? platform.ruleTypes() : platform.stepTypes()).get(type);
  const element = def?.create ? def.create() : { __type: type, name: "", enabled: true };
  const items = oie.elementsToArray(container.elements);
  element.__type = type;
  element.name ||= def?.label || oie.elementTypeLabel(type);
  element.enabled = true;
  element["@version"] ||= version;
  if (filter) element.operator = items.length ? "AND" : "NONE";
  items.push(element);
  container.elements = oie.arrayToElements(items);
  return items.length - 1;
}

/* ---------------------------------------------------------------- edges */
// Every link is an arrow. Links join tile edges inside a block and block edges
// outside it, and are routed through the gaps so they never cross a box.

const H = g => (a, b) => { const A = g(a), B = g(b), mx = (A.r + B.l) / 2;
  return Math.abs(A.cy - B.cy) < 1 ? [[A.r, A.cy], [B.l, A.cy]] : [[A.r, A.cy], [mx, A.cy], [mx, B.cy], [B.l, B.cy]]; };
const V = g => (a, b) => { const A = g(a), B = g(b), my = (A.b + B.t) / 2;
  return Math.abs(A.cx - B.cx) < 1 ? [[A.cx, A.b], [A.cx, B.t]] : [[A.cx, A.b], [A.cx, my], [B.cx, my], [B.cx, B.t]]; };
const seq = (ids, route, k = "msg") => ids.slice(1).map((id, i) => ({ pts: route(ids[i], id), k }));
const lastOn = chain => { let i = chain.length - 1; while (i > 0 && chain[i].off) i--; return i; };

function chainLinks(model, route, between = route) {
  const edges = [];
  for (const chain of model.chains) chain.forEach((block, i) => {
    edges.push(...seq(block.tiles.map(t => t.id), route, block.off ? "off" : "msg"));
    if (i) edges.push({ pts: between(chain[i - 1].id, block.id), k: block.off ? "off" : "wait",
      label: block.off ? "disabled" : `waits for D${chain[i - 1].metaDataId}`, at: between === route ? "" : "r" });
  });
  return edges;
}

export function layoutEdges(layout, model, g) {
  const sourceIds = model.source.tiles.map(t => t.id), firsts = model.chains.map(c => c[0]);
  const kind = block => block.off ? "off" : "msg";
  const sb = g("s-block"), eb = g("end-block"), em = g("emitter");
  const edges = [];
  if (layout === "A") {
    edges.push({ pts: H(g)("emitter", "s-block"), k: "msg" }, ...seq(sourceIds, H(g)), ...chainLinks(model, H(g)));
    if (firsts.length) {
      const boxes = firsts.map(b => g(b.id)), tx = Math.min(...boxes.map(f => f.l)) - 48, y0 = sb.b + 32, ex = sb.r + 32;
      boxes.forEach((f, i) => edges.push({ pts: [[sb.r, sb.cy], [ex, sb.cy], [ex, y0], [tx, y0], [tx, f.cy], [f.l, f.cy]], k: kind(firsts[i]),
        label: i === 0 && boxes.length > 1 ? "in parallel" : "", lp: [tx, (boxes[0].cy + boxes[boxes.length - 1].cy) / 2] }));
      const cx = eb.l - 56;
      for (const chain of model.chains) {
        const i = lastOn(chain), b = g(chain[i].id);
        edges.push({ k: kind(chain[i]), pts: i === chain.length - 1 ? [[b.r, b.cy], [cx, b.cy], [cx, eb.cy], [eb.l, eb.cy]]
          : [[b.cx, b.b], [b.cx, b.b + 26], [cx, b.b + 26], [cx, eb.cy], [eb.l, eb.cy]] });
      }
    } else edges.push({ pts: [[sb.r, sb.cy], [eb.l - 40, sb.cy], [eb.l - 40, eb.cy], [eb.l, eb.cy]], k: "msg" });
    edges.push(...seq(["post", "reply"], H(g)));
    if (model.replies) {
      const rp = g("reply"), top = sb.t - 32, rx = eb.r + 40;
      edges.push({ pts: [[eb.r, rp.cy], [rx, rp.cy], [rx, top], [em.cx, top], [em.cx, em.t]], k: "reply", label: "response returned" });
    }
  } else if (layout === "B") {
    edges.push({ pts: V(g)("emitter", "s-block"), k: "msg" }, ...seq(sourceIds, V(g)), ...chainLinks(model, V(g)));
    const boxes = firsts.map(b => g(b.id)), all = model.chains.flat().map(b => g(b.id));
    if (boxes.length) {
      const fy = (sb.b + Math.min(...boxes.map(f => f.t))) / 2;
      boxes.forEach((f, i) => edges.push({ pts: [[sb.cx, sb.b], [sb.cx, fy], [f.cx, fy], [f.cx, f.t]], k: kind(firsts[i]),
        label: i === 0 && boxes.length > 1 ? "in parallel" : "", lp: [sb.cx, (sb.b + fy) / 2], at: "r" }));
      const my = (Math.max(...all.map(b => b.b)) + eb.t) / 2;
      for (const chain of model.chains) {
        const i = lastOn(chain), b = g(chain[i].id), sx = b.r + 32;
        edges.push({ k: kind(chain[i]), pts: i === chain.length - 1 ? [[b.cx, b.b], [b.cx, my], [eb.cx, my], [eb.cx, eb.t]]
          : [[b.r, b.cy], [sx, b.cy], [sx, my], [eb.cx, my], [eb.cx, eb.t]] });
      }
    } else edges.push({ pts: V(g)("s-block", "end-block"), k: "msg" });
    edges.push(...seq(["post", "reply"], V(g)));
    if (model.replies) {
      const rp = g("reply"), lx = Math.min(sb.l, eb.l, em.l, ...all.map(b => b.l)) - 50;
      edges.push({ pts: [[eb.l, rp.cy], [lx, rp.cy], [lx, em.cy], [em.l, em.cy]], k: "reply", label: "response returned" });
    }
  } else {
    const down = (a, b) => { const A = g(a), B = g(b), x = A.l + 85; return [[x, A.b], [x, B.t]]; };
    edges.push({ pts: H(g)("emitter", "s-block"), k: "msg" }, ...seq(sourceIds, H(g)), ...chainLinks(model, H(g), down));
    if (firsts.length) {
      const bs = g("band-src"), bd = g("band-dst"), boxes = firsts.map(b => g(b.id));
      const tx = boxes[0].l - 44, y0 = (bs.b + bd.t) / 2, ex = sb.r + 28;
      boxes.forEach((f, i) => edges.push({ pts: [[sb.r, sb.cy], [ex, sb.cy], [ex, y0], [tx, y0], [tx, f.cy], [f.l, f.cy]], k: kind(firsts[i]) }));
      // Like the bands above, postprocessing reads left to right: enter from its left.
      const be = g("band-end"), cx = Math.max(...model.chains.flat().map(b => g(b.id).r)) + 40, my = (bd.b + be.t) / 2, ix = eb.l - 40;
      for (const chain of model.chains) {
        const i = lastOn(chain), b = g(chain[i].id);
        edges.push({ pts: [[b.r, b.cy], [cx, b.cy], [cx, my], [ix, my], [ix, eb.cy], [eb.l, eb.cy]], k: kind(chain[i]) });
      }
    } else {
      const bs = g("band-src"), ix = eb.l - 40, y0 = bs.b + 22;
      edges.push({ pts: [[sb.r, sb.cy], [sb.r + 28, sb.cy], [sb.r + 28, y0], [ix, y0], [ix, eb.cy], [eb.l, eb.cy]], k: "msg" });
    }
    edges.push(...seq(["post", "reply"], H(g)));
    const rp = g("reply");
    if (model.replies) {
      const y = eb.b + 22;
      edges.push({ pts: [[rp.cx, eb.b], [rp.cx, y], [em.cx, y], [em.cx, em.b]], k: "reply", label: "response returned" });
    }
  }
  return edges;
}

function roundedPath(p, r = 10) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) {
    const [px, py] = p[i - 1], [x, y] = p[i], [nx, ny] = p[i + 1];
    const d1 = Math.hypot(x - px, y - py), d2 = Math.hypot(nx - x, ny - y);
    if (!d1 || !d2) continue;
    const k = Math.min(r, d1 / 2, d2 / 2);
    d += ` L${x - (x - px) / d1 * k},${y - (y - py) / d1 * k} Q${x},${y} ${x + (nx - x) / d2 * k},${y + (ny - y) / d2 * k}`;
  }
  const last = p[p.length - 1];
  return `${d} L${last[0]},${last[1]}`;
}

// Arrowheads are drawn as paths: SVG markers do not render in every host.
export function arrowPaths(edge) {
  const p = edge.pts.map(pt => pt.slice()), q = p[p.length - 1];
  let i = p.length - 2;
  while (i > 0 && Math.hypot(q[0] - p[i][0], q[1] - p[i][1]) < 1) i--;
  const len = Math.hypot(q[0] - p[i][0], q[1] - p[i][1]) || 1, ux = (q[0] - p[i][0]) / len, uy = (q[1] - p[i][1]) / len;
  const L = edge.k === "msg" ? 12 : 10, W = edge.k === "msg" ? 6.5 : 5.5, bx = q[0] - ux * L, by = q[1] - uy * L;
  p[p.length - 1] = [q[0] - ux * (L - 2), q[1] - uy * (L - 2)];
  return { line: roundedPath(p), head: `M${q[0]},${q[1]} L${bx - uy * W},${by + ux * W} L${bx + uy * W},${by - ux * W}Z` };
}

// Mouse wheels scroll by lines or by whole notches (wheelDelta multiple of 120)
// on one axis; trackpads send small pixel deltas, often on both axes.
export function isMouseWheel(event) {
  if (event.deltaMode === 1) return true;
  const notch = event.wheelDeltaY ?? event.wheelDelta;
  return !event.deltaX && !!notch && Math.abs(notch) % 120 === 0;
}

function midpoint(p) {
  let best = 0, at = p[0];
  for (let i = 1; i < p.length; i++) {
    const len = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (len > best) { best = len; at = [(p[i][0] + p[i - 1][0]) / 2, (p[i][1] + p[i - 1][1]) / 2]; }
  }
  return at;
}

/* ---------------------------------------------------------------- navigation */
// Web Admin 1.3 has routes for filters, transformers and responses, but no API to
// pick an editor tab, a destination row or a script: those few steps go through
// the accessible tab and table controls the editor already renders.

export function createNavigator(platform, doc = document, win = window) {
  // One pending wait per purpose: the auto-open of Flow must not cancel the
  // selection of a step in the editor opened from Flow, and vice versa.
  const cancels = {};
  function waitFor(find, timeout = 4000, slot = "open") {
    cancels[slot]?.();
    return new Promise(resolve => {
      let done = false, observer, timer;
      const finish = value => {
        if (done) return;
        done = true; observer?.disconnect(); win.clearTimeout(timer); resolve(value);
      };
      cancels[slot] = () => finish(null);
      const check = () => { const found = find(); if (found) finish(found); };
      observer = new win.MutationObserver(check);
      observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
      timer = win.setTimeout(() => finish(null), timeout);
      check();
    });
  }
  const tab = label => [...doc.querySelectorAll('[role="tablist"][aria-label="Channel sections"] [role="tab"]')]
    .find(node => node.textContent.trim() === label);
  async function showTab(label, slot) {
    return waitFor(() => {
      const control = tab(label);
      if (!control) return null;
      if (control.getAttribute("aria-selected") === "true") return control;
      control.focus(); // Radix tabs activate on focus.
      return null;
    }, 4000, slot);
  }
  async function open(channel, target) {
    const base = `/channels/${encodeURIComponent(channel.id)}`;
    if (["filter", "transformer", "response"].includes(target.section)) {
      platform.store.setState("editingChannel", channel);
      platform.router.navigate(`${base}/${target.section}/${encodeURIComponent(target.metaDataId)}`);
      if (target.index == null) return;
      const row = await waitFor(() => doc.querySelector(`tr[data-path="${target.index}"]`));
      if (row) { row.click(); row.scrollIntoView({ block: "nearest" }); }
      return;
    }
    if (target.section === "script") {
      if (!await showTab("Scripts")) return;
      const select = await waitFor(() => [...doc.querySelectorAll('[role="tabpanel"] select')]
        .find(node => [...node.options].some(option => option.value === target.key)));
      if (select && select.value !== target.key) {
        Object.getOwnPropertyDescriptor(win.HTMLSelectElement.prototype, "value").set.call(select, target.key);
        select.dispatchEvent(new win.Event("change", { bubbles: true }));
      }
      select?.focus();
      return;
    }
    if (target.section === "attachments") { await showTab("Summary"); return; }
    if (String(target.metaDataId) === "0") { await showTab("Source"); return; }
    if (!await showTab("Destinations")) return;
    const row = await waitFor(() => [...doc.querySelectorAll(".dest-grid tbody tr")]
      .find(node => node.querySelector("td.num")?.textContent.trim() === String(target.metaDataId)));
    if (row) { row.click(); row.scrollIntoView({ block: "nearest" }); }
  }
  // Flow opens whenever the channel editor is entered, including on the way back
  // from a filter or transformer editor.
  function autoOpen() {
    const onRoute = () => {
      if (/^\/channels\/[^/?]+\/edit(?:\?.*)?$/.test(platform.router.currentPath())) showTab("Flow", "auto");
      else cancels.auto?.();
    };
    win.addEventListener("route:changed", onRoute);
    onRoute();
    return () => { cancels.auto?.(); win.removeEventListener("route:changed", onRoute); };
  }
  return { open, autoOpen };
}

/* ---------------------------------------------------------------- view */

const STYLES = `
.tab-body:has(.oflow) { display:flex; flex:1; min-height:0; overflow:hidden; }
.tab-body:has(.oflow) > div { display:flex; flex-direction:column; flex:1; height:100%; min-height:0; overflow:hidden; padding:0; }
.oflow { --f-bg:var(--bg1,#f3f6f9); --f-surface:var(--bg2,#fff); --f-surface-2:var(--bg1,#f3f6f9); --f-ink:var(--text,#1f2c38);
  --f-dim:var(--text-dim,#4d6173); --f-line:var(--line,#cdd7e0); --f-src:var(--accent,#2e6da4);
  --f-dst:color-mix(in srgb, var(--ok,#2e9e4f) 55%, var(--accent,#2e6da4)); --f-chan:color-mix(in srgb, var(--violet,#b18cff) 70%, var(--text,#1f2c38));
  --f-msg:var(--warn,#b97f0a); --f-ok:var(--ok,#2e9e4f); --f-mono:var(--font-mono,ui-monospace,monospace);
  position:relative; display:flex; flex-direction:column; flex:1; min-height:0; color:var(--f-ink); font-size:13px; line-height:1.4; }
.oflow button { font:inherit; color:inherit; }
.oflow-bar { flex:none; display:flex; flex-wrap:wrap; align-items:center; gap:8px 16px; padding:8px 12px; border-bottom:1px solid var(--f-line); }
.oflow-seg { display:inline-flex; padding:2px; gap:2px; border-radius:7px; border:1px solid var(--f-line); background:var(--f-surface-2); }
.oflow-seg button { border:0; background:none; padding:3px 10px; border-radius:5px; cursor:pointer; color:var(--f-dim); }
.oflow-seg button[aria-pressed="true"] { background:var(--f-surface); color:var(--f-ink); box-shadow:0 1px 2px color-mix(in srgb,var(--f-ink) 18%,transparent); }
.oflow-zoom { display:inline-flex; align-items:center; gap:4px; margin-left:auto; }
.oflow-zoom button { height:26px; min-width:26px; padding:0 8px; border:1px solid var(--f-line); border-radius:6px; background:var(--f-surface); cursor:pointer; }
.oflow-zoom output { min-width:44px; text-align:center; font:12px var(--f-mono); color:var(--f-dim); }
.oflow-hint { color:var(--f-dim); font-size:11.5px; }
.oflow-vp { position:relative; flex:1; min-height:0; overflow:hidden; cursor:grab; touch-action:none; background-color:var(--f-bg);
  background-image:radial-gradient(color-mix(in srgb,var(--f-dim) 22%,transparent) 1px,transparent 1px); background-size:22px 22px; }
.oflow-vp:focus-visible { outline:2px solid var(--f-src); outline-offset:-2px; }
.oflow-vp.is-panning { cursor:grabbing; }
.oflow-stage { position:absolute; left:0; top:0; transform-origin:0 0; padding:60px; }
.oflow-dz { position:relative; z-index:1; }
.oflow-wires { position:absolute; left:0; top:0; overflow:visible; pointer-events:none; z-index:2; }
.oflow-labels { position:absolute; left:0; top:0; pointer-events:none; z-index:3; }
.oflow-wires path { fill:none; stroke-linecap:round; stroke-linejoin:round; }
.oflow-wires .w-msg { stroke:var(--f-msg); stroke-width:2.5; } .oflow-wires .w-wait { stroke:var(--f-dim); stroke-width:1.8; stroke-dasharray:6 5; }
.oflow-wires .w-reply { stroke:var(--f-chan); stroke-width:2; } .oflow-wires .w-off { stroke:var(--f-dim); stroke-opacity:.55; stroke-width:2; stroke-dasharray:2 5; }
.oflow-wires .h-msg { fill:var(--f-msg); } .oflow-wires .h-wait { fill:var(--f-dim); } .oflow-wires .h-reply { fill:var(--f-chan); } .oflow-wires .h-off { fill:var(--f-dim); fill-opacity:.55; }
.oflow-wl { position:absolute; transform:translate(-50%,-50%); white-space:nowrap; padding:1px 7px; border-radius:10px; background:var(--f-bg); font-size:11px; font-weight:500; }
.oflow-wl.at-r { transform:translate(8px,-50%); }
.oflow-wl.k-msg { color:var(--f-msg); } .oflow-wl.k-reply { color:var(--f-chan); } .oflow-wl.k-wait,.oflow-wl.k-off { color:var(--f-dim); }

.oflow-block { --k:var(--f-src); position:relative; display:flex; flex-direction:column; box-sizing:border-box; background:var(--f-surface);
  border:1px solid color-mix(in srgb,var(--k) 45%,var(--f-line)); border-radius:12px;
  box-shadow:0 1px 2px color-mix(in srgb,var(--f-ink) 8%,transparent),0 6px 18px -10px color-mix(in srgb,var(--k) 45%,transparent); }
.oflow-block.is-dst { --k:var(--f-dst); } .oflow-block.is-chan { --k:var(--f-chan); }
.oflow-head { display:flex; flex-direction:column; gap:2px; min-width:0; padding:8px 14px; border:0; border-bottom:1px solid color-mix(in srgb,var(--k) 25%,var(--f-line));
  border-radius:11px 11px 0 0; background:color-mix(in srgb,var(--k) 10%,var(--f-surface)); text-align:left; }
button.oflow-head { cursor:pointer; } button.oflow-head:hover .oflow-name { color:var(--k); }
.oflow-title { display:flex; align-items:baseline; gap:10px; min-width:0; }
.oflow-kind { flex:none; font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--k); }
.oflow-name { flex:1 1 auto; min-width:0; font-size:14px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.oflow-types { font:11px var(--f-mono); color:var(--f-dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-height:15px; }
.oflow-tag { flex:none; padding:0 6px; border-radius:4px; font-size:10.5px; background:color-mix(in srgb,var(--f-dim) 16%,var(--f-surface)); color:var(--f-dim); }
.oflow-body { display:flex; padding:16px; min-width:0; }
.oflow-body.lay-h { flex-direction:row; gap:36px; align-items:stretch; }
.oflow-body.lay-v { flex-direction:column; gap:30px; }
.oflow-body.lay-hrev { flex-direction:row-reverse; justify-content:flex-end; gap:36px; align-items:stretch; }
.oflow-block.w-h { width:940px; } .oflow-block.w-v { width:250px; }
.oflow-block.w-h .lay-h .oflow-tile { flex:1 1 0; width:auto; min-width:0; }
.oflow-body.lay-v .oflow-tile { width:auto; }
  border-right:1px solid color-mix(in srgb,var(--k) 25%,var(--f-line)); border-radius:11px 0 0 11px; padding:12px 14px; }
.oflow-block.is-off { border-style:dashed; border-color:var(--f-line); box-shadow:none; }
.oflow-block.is-off .oflow-head { background:var(--f-surface-2); }
.oflow-block.is-off .oflow-kind, .oflow-block.is-off .oflow-name { color:var(--f-dim); }
.oflow-block.is-off .oflow-tile { opacity:.6; }

.oflow-tile { position:relative; width:168px; box-sizing:border-box; display:flex; flex-direction:column; gap:6px; padding:9px 10px 10px;
  border:1px solid var(--f-line); border-radius:8px; background:var(--f-surface-2); transition:border-color .12s,background .12s; }
.oflow-tile:hover { border-color:color-mix(in srgb,var(--k) 70%,var(--f-line)); background:color-mix(in srgb,var(--k) 6%,var(--f-surface)); }
.oflow-tile.is-empty { border-style:dashed; background:var(--f-surface); }
.oflow-tile.is-conn { background:color-mix(in srgb,var(--k) 7%,var(--f-surface)); border-color:color-mix(in srgb,var(--k) 35%,var(--f-line)); }
.oflow-main { display:flex; flex-direction:column; gap:3px; padding:0; border:0; background:none; text-align:left; cursor:pointer; min-width:0; }
.oflow-th { display:flex; align-items:center; gap:6px; padding-right:22px; }
.oflow-ic { width:15px; height:15px; flex:none; fill:none; stroke:var(--k); stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.oflow-tl { font-weight:600; font-size:12.5px; }
.oflow-count { margin-left:auto; font:11px var(--f-mono); color:var(--f-dim); }
.oflow-strong { font-weight:500; font-size:12px; overflow-wrap:anywhere; }
.oflow-mono { font:11px var(--f-mono); color:var(--f-dim); overflow-wrap:anywhere; }
.oflow-empty { color:var(--f-dim); font-size:12px; }
.oflow-ok { color:var(--f-ok); font-size:12px; font-weight:500; }
.oflow-chips { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:3px; }
.oflow-chip { display:flex; align-items:center; gap:6px; width:100%; padding:2px 4px; border:0; border-radius:4px; background:none; text-align:left; font-size:11.5px; cursor:pointer; min-width:0; }
.oflow-chip:hover { background:color-mix(in srgb,var(--k) 12%,transparent); }
.oflow-chip.is-off .oflow-cn { text-decoration:line-through; color:var(--f-dim); }
.oflow-ct { flex:none; padding:0 4px; border-radius:3px; font:10px/15px var(--f-mono); color:var(--k); background:color-mix(in srgb,var(--k) 12%,var(--f-surface)); }
.oflow-cn { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.oflow-more { padding:1px 4px; border:0; border-radius:4px; background:none; font-size:11px; color:var(--k); cursor:pointer; }
.oflow-more:hover { background:color-mix(in srgb,var(--k) 12%,transparent); text-decoration:underline; }
.oflow-steps { --k:var(--f-src); width:280px; }
.oflow-steps ol { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:2px; }
.oflow-steps .oflow-chip { padding:4px 6px; font-size:12px; }
.oflow-steps .oflow-ct { min-width:38px; text-align:center; box-sizing:border-box; }
.oflow-steps .oflow-idx { flex:none; width:18px; text-align:right; font:11px var(--f-mono); color:var(--f-dim); }
.oflow-add { position:absolute; top:6px; right:6px; width:22px; height:22px; padding:0; border-radius:6px; cursor:pointer;
  border:1px solid color-mix(in srgb,var(--k) 40%,var(--f-line)); background:var(--f-surface); color:var(--k); font-size:15px; line-height:1; font-weight:600; }
.oflow-add:hover { background:var(--k); color:var(--f-surface); border-color:var(--k); }
.oflow-ext { width:150px; box-sizing:border-box; display:flex; flex-direction:column; gap:3px; padding:12px 14px; border-radius:10px;
  background:color-mix(in srgb,var(--f-ink) 88%,var(--f-bg)); color:var(--f-bg); }
.oflow-ext .oflow-ic { stroke:currentColor; opacity:.75; width:18px; height:18px; }
.oflow-ext span { font-size:11px; font-family:var(--f-mono); opacity:.75; overflow-wrap:anywhere; }

.oflow-A { display:flex; flex-direction:column; gap:64px; }
.oflow-row { display:flex; gap:56px; align-items:center; }
.oflow-A-mid { display:flex; gap:120px; align-items:center; }
.oflow-A-chains { display:flex; flex-direction:column; gap:52px; padding-left:300px; }
.oflow-A-chain { display:flex; gap:80px; align-items:center; }
.oflow-B { display:flex; flex-direction:column; gap:56px; padding-left:70px; }
.oflow-B-col { display:flex; flex-direction:column; align-items:center; gap:64px; }
.oflow-B-chains { display:flex; justify-content:center; gap:120px; align-items:flex-start; }
.oflow-B-chain { display:flex; flex-direction:column; gap:64px; }
.oflow-C { display:flex; flex-direction:column; gap:44px; }
.oflow-band { --k:var(--f-src); position:relative; display:flex; flex-direction:column; gap:34px; padding:40px 56px 44px 36px; border-radius:18px;
  background:color-mix(in srgb,var(--k) 7%,var(--f-bg)); border:1px solid color-mix(in srgb,var(--k) 18%,transparent); }
.oflow-band.is-dst { --k:var(--f-dst); } .oflow-band.is-chan { --k:var(--f-chan); }
.oflow-band-title { position:absolute; top:12px; right:20px; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--k); }
.oflow-C-chain { display:flex; flex-direction:column; gap:44px; padding-left:206px; }
.oflow-C-label { margin-bottom:-32px; font-size:11px; font-weight:600; color:var(--f-dim); }
.oflow-C-end { padding-left:206px; display:flex; }
.oflow-none { padding:14px 18px; border:1px dashed var(--f-line); border-radius:10px; color:var(--f-dim); }

.oflow-menu { position:fixed; z-index:1000; min-width:200px; max-height:60vh; overflow:auto; padding:5px; background:var(--f-surface); border:1px solid var(--f-line); border-radius:9px;
  box-shadow:0 12px 30px -10px color-mix(in srgb,var(--f-ink) 45%,transparent); }
.oflow-menu h4 { margin:4px 8px 6px; font-size:11px; font-weight:600; color:var(--f-dim); text-transform:uppercase; letter-spacing:.06em; }
.oflow-menu button { display:block; width:100%; padding:6px 8px; border:0; border-radius:6px; background:none; text-align:left; cursor:pointer; }
.oflow-menu button:hover, .oflow-menu button:focus-visible { background:color-mix(in srgb,var(--f-src) 12%,transparent); outline:none; }
@media (prefers-reduced-motion: no-preference) { .oflow-stage.animate { transition:transform .25s ease; } }
`;

const Icon = ({ name }) => h("svg", { className: "oflow-ic", viewBox: "0 0 24 24", "aria-hidden": true }, h("path", { d: ICONS[name] || ICONS.script }));

const VISIBLE_STEPS = 5;
const StepChip = ({ item, tile, act }) => h("button", { type: "button", className: `oflow-chip${item.disabled ? " is-off" : ""}`,
  title: item.disabled ? `${item.name} (disabled)` : item.name, onClick: () => act.open({ ...tile.target, index: item.index }) },
  h("span", { className: "oflow-ct" }, item.type), h("span", { className: "oflow-cn" }, item.name));

function Tile({ tile, act }) {
  const steps = ["filter", "transformer", "response"].includes(tile.kind);
  const icon = { conn: "conn", att: "att", script: "script", reply: "reply" }[tile.kind] || tile.kind;
  let body;
  if (steps) body = tile.empty ? h("span", { className: "oflow-empty" }, EMPTY[tile.kind]) : null;
  else if (tile.kind === "script") body = tile.empty ? h("span", { className: "oflow-empty" }, "No script") : h("span", { className: "oflow-ok" }, "Script set");
  else if (tile.kind === "att") body = h("span", { className: "oflow-empty" }, tile.title);
  else body = [h("span", { key: "t", className: "oflow-strong" }, tile.title), tile.detail && h("span", { key: "d", className: "oflow-mono" }, tile.detail)];
  const conn = tile.kind === "conn" || tile.kind === "reply" && !tile.empty;
  return h("div", { className: `oflow-tile${tile.empty ? " is-empty" : ""}${conn ? " is-conn" : ""}`, "data-node": tile.id },
    h("button", { type: "button", className: "oflow-main", onClick: () => act.open(tile.target), "aria-label": `Open ${tile.label} · ${tile.ctx}` },
      h("span", { className: "oflow-th" }, h(Icon, { name: icon }), h("span", { className: "oflow-tl" }, tile.label),
        steps && !tile.empty && h("span", { className: "oflow-count" }, tile.items.length)),
      body),
    steps && !tile.empty && h("ul", { className: "oflow-chips" },
      tile.items.slice(0, VISIBLE_STEPS).map(item => h("li", { key: item.index }, h(StepChip, { item, tile, act }))),
      tile.items.length > VISIBLE_STEPS && h("li", null, h("button", { type: "button", className: "oflow-more",
        "aria-haspopup": "dialog", onClick: event => act.steps(tile, event.currentTarget) }, `+${tile.items.length - VISIBLE_STEPS} more`))),
    tile.add && (steps || tile.empty) && h("button", { type: "button", className: "oflow-add", title: steps ? `Add to ${tile.label}` : `Write the ${tile.label} script`,
      "aria-label": steps ? `Add to ${tile.label} · ${tile.ctx}` : `Write the ${tile.label} script`,
      onClick: event => steps ? act.menu(tile, event.currentTarget) : act.open(tile.target) }, "+"));
}

function Block({ block, layout, act }) {
  const fixed = layout === "v" ? " w-v" : block.kind !== "chan" ? " w-h" : "";
  const title = h("span", { className: "oflow-title" }, h("span", { className: "oflow-kind" }, block.kindLabel),
    h("span", { className: "oflow-name", title: block.name }, block.name), block.off && h("span", { className: "oflow-tag" }, "Disabled"));
  const types = block.kind !== "chan" && h("span", { className: "oflow-types", title: block.types }, block.types || " ");
  return h("section", { className: `oflow-block is-${block.kind}${block.off ? " is-off" : ""}${fixed}`, "data-node": block.id,
    "aria-label": `${block.kindLabel} ${block.name}` },
    block.target ? h("button", { type: "button", className: "oflow-head", onClick: () => act.open(block.target) }, title, types)
      : h("header", { className: "oflow-head" }, title),
    h("div", { className: `oflow-body lay-${layout}` }, block.tiles.map(tile => h(Tile, { key: tile.id, tile, act }))));
}

const Emitter = ({ sender }) => h("div", { className: "oflow-ext", "data-node": "emitter" },
  h(Icon, { name: "ext" }), h("b", null, sender.label), h("span", { title: sender.detail }, sender.detail));

function Diagram({ layout, model, act }) {
  const block = (b, lay) => h(Block, { key: b.id, block: b, layout: lay, act });
  const none = h("div", { className: "oflow-none" }, "No destinations");
  if (layout === "A") return h("div", { className: "oflow-dz oflow-A" },
    h("div", { className: "oflow-row" }, block(model.lifecycle, "h")),
    h("div", { className: "oflow-row" }, h(Emitter, { sender: model.sender }), block(model.source, "h")),
    h("div", { className: "oflow-A-mid" },
      h("div", { className: "oflow-A-chains" }, model.chains.length ? model.chains.map((chain, i) =>
        h("div", { key: i, className: "oflow-A-chain" }, chain.map(b => block(b, "h")))) : none),
      block(model.end, "h")));
  if (layout === "B") return h("div", { className: "oflow-dz oflow-B" },
    h("div", { className: "oflow-row" }, block(model.lifecycle, "h")),
    h("div", { className: "oflow-B-col" }, h(Emitter, { sender: model.sender }), block(model.source, "v"),
      model.chains.length ? h("div", { className: "oflow-B-chains" }, model.chains.map((chain, i) =>
        h("div", { key: i, className: "oflow-B-chain" }, chain.map(b => block(b, "v"))))) : none,
      block(model.end, "v")));
  return h("div", { className: "oflow-dz oflow-C" },
    h("div", { className: "oflow-row" }, block(model.lifecycle, "h")),
    h("div", { className: "oflow-band", "data-node": "band-src" }, h("div", { className: "oflow-band-title" }, "Source processing"),
      h("div", { className: "oflow-row" }, h(Emitter, { sender: model.sender }), block(model.source, "h"))),
    h("div", { className: "oflow-band is-dst", "data-node": "band-dst" }, h("div", { className: "oflow-band-title" }, "Destination processing"),
      model.chains.length ? model.chains.map((chain, i) => h("div", { key: i, className: "oflow-C-chain" },
        h("div", { className: "oflow-C-label" }, `Chain ${i + 1}${model.chains.length > 1 ? " · in parallel" : ""}`),
        chain.map(b => block(b, "h")))) : none),
    h("div", { className: "oflow-band is-chan", "data-node": "band-end" }, h("div", { className: "oflow-band-title" }, "Postprocessing & response"),
      h("div", { className: "oflow-C-end" }, block(model.end, "h"))));
}

function readPref() {
  try { const value = localStorage.getItem(PREF_KEY); return LAYOUTS.some(([key]) => key === value) ? value : "auto"; } catch { return "auto"; }
}

function ChannelFlow({ channel, platform, onChange, nav }) {
  const [pref, setPref] = R.useState(readPref);
  const [menu, setMenu] = R.useState(null);
  const model = flowModel(channel, platform);
  const layout = pref === "auto" ? pickLayout(model) : pref;
  const vp = R.useRef(null), stage = R.useRef(null), wires = R.useRef(null), labels = R.useRef(null), zoomOut = R.useRef(null);
  const view = R.useRef({ s: 1, x: 0, y: 0 }), fitted = R.useRef("");

  const apply = () => {
    const { s, x, y } = view.current;
    if (stage.current) stage.current.style.transform = `translate(${x}px,${y}px) scale(${s})`;
    if (zoomOut.current) zoomOut.current.textContent = `${Math.round(s * 100)}%`;
  };
  const clamp = s => Math.min(3, Math.max(0.15, s));
  const fit = () => {
    const el = stage.current, box = vp.current;
    if (!el || !box) return;
    const s = clamp(Math.min(box.clientWidth / el.offsetWidth, box.clientHeight / el.offsetHeight, 1.1));
    view.current = { s, x: (box.clientWidth - el.offsetWidth * s) / 2, y: Math.max(0, (box.clientHeight - el.offsetHeight * s) / 2) };
    apply();
  };
  const zoomAt = (factor, cx = vp.current.clientWidth / 2, cy = vp.current.clientHeight / 2) => {
    const v = view.current, s = clamp(v.s * factor);
    view.current = { s, x: cx - (cx - v.x) * s / v.s, y: cy - (cy - v.y) * s / v.s };
    apply();
  };
  const animated = fn => () => { stage.current.classList.add("animate"); fn(); setTimeout(() => stage.current?.classList.remove("animate"), 260); };

  function draw() {
    const root = stage.current;
    if (!root) return;
    const origin = root.getBoundingClientRect(), s = view.current.s;
    const g = id => {
      const node = root.querySelector(`[data-node="${id}"]`);
      if (!node) return { l: 0, t: 0, r: 0, b: 0, cx: 0, cy: 0 };
      const r = node.getBoundingClientRect(), l = (r.left - origin.left) / s, t = (r.top - origin.top) / s;
      return { l, t, r: l + r.width / s, b: t + r.height / s, cx: l + r.width / s / 2, cy: t + r.height / s / 2 };
    };
    const edges = layoutEdges(layout, model, g);
    wires.current.setAttribute("width", root.offsetWidth);
    wires.current.setAttribute("height", root.offsetHeight);
    const NS = "http://www.w3.org/2000/svg";
    wires.current.replaceChildren(...edges.flatMap(edge => {
      const { line, head } = arrowPaths(edge), a = document.createElementNS(NS, "path"), b = document.createElementNS(NS, "path");
      a.setAttribute("d", line); a.setAttribute("class", `w-${edge.k}`);
      b.setAttribute("d", head); b.setAttribute("class", `h-${edge.k}`);
      return [a, b];
    }));
    labels.current.replaceChildren(...edges.filter(edge => edge.label).map(edge => {
      const [x, y] = edge.lp || midpoint(edge.pts), span = document.createElement("span");
      span.className = `oflow-wl k-${edge.k}${edge.at === "r" ? " at-r" : ""}`;
      span.style.left = `${x}px`; span.style.top = `${y}px`; span.textContent = edge.label;
      return span;
    }));
  }

  R.useLayoutEffect(() => {
    draw();
    if (fitted.current !== layout) { fitted.current = layout; fit(); }
  });
  R.useEffect(() => {
    const box = vp.current;
    let pan = null;
    const wheel = event => {
      event.preventDefault();
      const r = box.getBoundingClientRect();
      // A mouse wheel or a pinch (ctrlKey) zooms around the pointer; a two-finger
      // trackpad scroll pans.
      if (event.ctrlKey || event.metaKey || isMouseWheel(event)) {
        const delta = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY;
        zoomAt(Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0015)), event.clientX - r.left, event.clientY - r.top);
      } else {
        view.current = { ...view.current, x: view.current.x - event.deltaX, y: view.current.y - event.deltaY };
        apply();
      }
    };
    const down = event => {
      if (event.button !== 0 || event.target.closest("button")) return;
      pan = { x: event.clientX - view.current.x, y: event.clientY - view.current.y };
      box.setPointerCapture(event.pointerId); box.classList.add("is-panning");
    };
    const move = event => { if (pan) { view.current = { ...view.current, x: event.clientX - pan.x, y: event.clientY - pan.y }; apply(); } };
    const up = () => { pan = null; box.classList.remove("is-panning"); };
    box.addEventListener("wheel", wheel, { passive: false });
    box.addEventListener("pointerdown", down); box.addEventListener("pointermove", move);
    box.addEventListener("pointerup", up); box.addEventListener("pointercancel", up);
    document.fonts?.ready.then(() => { if (stage.current) draw(); });
    return () => { box.removeEventListener("wheel", wheel); box.removeEventListener("pointerdown", down);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerup", up); box.removeEventListener("pointercancel", up); };
  }, []);
  R.useEffect(() => {
    if (!menu) return;
    const close = event => { if (!event.target.closest?.(".oflow-menu")) setMenu(null); };
    const key = event => { if (event.key === "Escape") setMenu(null); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); };
  }, [menu]);

  const choose = value => { setPref(value); try { localStorage.setItem(PREF_KEY, value); } catch { /* storage unavailable */ } };
  const act = {
    open: target => nav.open(channel, target),
    menu: (tile, button) => { const r = button.getBoundingClientRect(); setMenu({ mode: "add", tile, left: r.left, top: r.bottom + 6 }); },
    steps: (tile, button) => { const r = button.getBoundingClientRect(); setMenu({ mode: "steps", tile, left: r.left, top: r.bottom + 6 }); }
  };
  function add(tile, type) {
    setMenu(null);
    try {
      const index = addElement(channel, platform, tile.target, type.type);
      onChange?.();
      platform.ui?.toast?.(`Added ${type.label} to ${tile.label} · ${tile.ctx}`);
      nav.open(channel, { ...tile.target, index });
    } catch (error) {
      platform.ui?.toast?.(`Could not add the step: ${error.message}`, "error");
    }
  }
  const keys = event => {
    if (event.key === "+" || event.key === "=") animated(() => zoomAt(1.25))();
    else if (event.key === "-") animated(() => zoomAt(0.8))();
    else if (event.key === "0") animated(fit)();
  };
  const types = menu?.mode === "add" ? elementTypes(platform, menu.tile.target) : [];
  const rows = menu ? (menu.mode === "add" ? types.length : menu.tile.items.length) : 0;
  const place = menu && { left: Math.max(8, Math.min(window.innerWidth - 300, menu.left)),
    top: Math.max(8, Math.min(menu.top, window.innerHeight - 56 - rows * 30)) };
  const open = target => { setMenu(null); nav.open(channel, target); };

  return h("div", { className: "oflow" }, h("style", null, STYLES),
    h("div", { className: "oflow-bar" },
      h("div", { className: "oflow-seg", role: "group", "aria-label": "Layout" }, LAYOUTS.map(([key, label]) =>
        h("button", { key, type: "button", "aria-pressed": pref === key, onClick: () => choose(key),
          title: key === "auto" ? `Picks the layout from the number of destinations (now ${LAYOUTS.find(([k]) => k === layout)[1]})` : undefined }, label))),
      h("span", { className: "oflow-hint" }, "Wheel to zoom · drag to pan"),
      h("div", { className: "oflow-zoom", role: "group", "aria-label": "Zoom" },
        h("button", { type: "button", "aria-label": "Zoom out", onClick: animated(() => zoomAt(0.8)) }, "−"),
        h("output", { ref: zoomOut }, "100%"),
        h("button", { type: "button", "aria-label": "Zoom in", onClick: animated(() => zoomAt(1.25)) }, "+"),
        h("button", { type: "button", onClick: animated(fit) }, "Fit"),
        h("button", { type: "button", onClick: animated(() => zoomAt(1 / view.current.s)) }, "100%"))),
    h("div", { className: "oflow-vp", ref: vp, tabIndex: 0, onKeyDown: keys, "aria-label": "Channel flow diagram" },
      h("div", { className: "oflow-stage", ref: stage },
        h("svg", { className: "oflow-wires", ref: wires, "aria-hidden": true }),
        h("div", { className: "oflow-labels", ref: labels, "aria-hidden": true }),
        h(Diagram, { layout, model, act }))),
    menu?.mode === "add" && h("div", { className: "oflow-menu", role: "menu", style: place },
      h("h4", null, `Add to ${menu.tile.label}`),
      types.length ? types.map(type => h("button", { key: type.type, type: "button", role: "menuitem", onClick: () => add(menu.tile, type) }, type.label))
        : h("div", { className: "oflow-empty" }, "No step types available")),
    menu?.mode === "steps" && h("div", { className: "oflow-menu oflow-steps", role: "dialog", "aria-label": `${menu.tile.label} · ${menu.tile.ctx}`, style: place },
      h("h4", null, `${menu.tile.label} · ${menu.tile.items.length} ${menu.tile.kind === "filter" ? "rules" : "steps"}`),
      h("ol", null, menu.tile.items.map(item => h("li", { key: item.index },
        h(StepChip, { item, tile: menu.tile, act: { open } }))))));
}

export function register(platform) {
  R = platform.React;
  const nav = createNavigator(platform);
  platform.registerChannelTab({ id: "channel-flow", label: "Flow", order: 0,
    component: ({ channel, onChange }) => h(ChannelFlow, { channel, platform, onChange, nav }) });
  const key = Symbol.for("org.oie.fhir.flow.autoOpen");
  window[key]?.();
  window[key] = nav.autoOpen();
}
