// SPDX-License-Identifier: MPL-2.0
// From the editor's state to the rules of the step, and the completeness check.
// The state: values, iterations, translations, conditions as Maps by element key,
// notes and disabled flags as Maps too.

/**
 * The mappings saved with the step: the values and iterations in tree order (that is
 * the order of the entries of repeating elements), then the fixed and pattern values of
 * the entries they create: of the slices and elements on the way, and of required
 * elements and slice discriminators below them.
 * iterations: key -> {expression, variable}; translations: key -> {conceptMap, source, target, unmapped}.
 */
export function compile(tree, values, iterations, translations, conditions, extras = {}) {
  const notes = extras.notes || new Map();
  const disabled = extras.disabled || new Set();
  const entries = [];
  const fixed = new Map();
  const decorate = (entry, form) => {
    const note = notes.get(`${form}:${entry.key}`);
    if (note) entry.note = note;
    if (disabled.has(`${form}:${entry.key}`)) entry.disabled = true;
    return entry;
  };
  for (const [key, it] of iterations) {
    const nodes = it.expression.trim() ? tree.chain(key) : null;
    if (!nodes) continue;
    const node = nodes[nodes.length - 1];
    // the resource itself: one resource per item (Bundle output)
    if (node !== tree.root && !node.repeats) continue;
    entries.push(decorate({ key, each: it.expression.trim(), variable: (it.variable || "item").trim(), path: node.path, order: node === tree.root ? [] : nodes.map(n => n.index) }, "each"));
  }
  for (const [key, condition] of conditions) {
    const nodes = condition.trim() ? tree.chain(key) : null;
    if (!nodes) continue;
    const node = nodes[nodes.length - 1];
    entries.push(decorate({ key, condition: condition.trim(), path: node.path, order: node === tree.root ? [] : nodes.map(n => n.index) }, "condition"));
  }
  const mapped = new Set([...values.keys()].filter(k => values.get(k).trim() !== ""));
  for (const key of mapped) {
    const nodes = tree.chain(key);
    if (!nodes) continue;
    const leaf = nodes[nodes.length - 1];
    if (leaf.choice) continue;
    const entry = {
      key,
      element: key,
      type: leaf.contained ? "Resource" : shortTypeOf(leaf.code),
      expression: values.get(key).trim(),
      path: leaf.path,
      order: nodes.map(n => n.index)
    };
    const t = translations.get(key);
    if (t && t.conceptMap && t.conceptMap.trim()) {
      entry.translate = { conceptMap: t.conceptMap.trim(), source: (t.source || "").trim(), target: (t.target || "").trim(), unmapped: t.unmapped || "none", keepSource: !!t.keepSource };
      if (entry.translate.unmapped === "fixed" || entry.translate.unmapped === "function") entry.translate.value = (t.value || "").trim();
    }
    entries.push(decorate(entry, "value"));
    const onChain = new Set(nodes.map(n => n.key));
    for (const container of nodes.slice(0, -1)) {
      const when = container.path.length;
      if (container !== tree.root && container.fixed && container.jsonName != null && !fixed.has(container.key)) {
        fixed.set(container.key, { key: container.key, element: container.key, fixed: container.fixed.value, when, path: container.path });
      }
      const discriminators = tree.discriminators(container);
      const walk = (node, rel, required) => {
        for (const d of tree.children(node) || []) {
          if (d.instance || onChain.has(d.key) || mapped.has(d.key) || d.jsonName == null) continue;
          const path = rel ? `${rel}.${d.jsonName}` : d.jsonName;
          const req = required && Number(d.min) >= 1;
          if (d.fixed && (req || discriminators.includes(path))) {
            if (!fixed.has(d.key)) fixed.set(d.key, { key: d.key, element: d.key, fixed: d.fixed.value, when, path: d.path });
          } else if (req || discriminators.some(p => p.startsWith(path + "."))) {
            walk(d, path, req);
          }
        }
      };
      walk(container, "", true);
    }
  }
  const cmp = (a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
    return a.length - b.length;
  };
  entries.sort((a, b) => cmp(a.order, b.order));
  return [...entries.map(({ order, ...e }) => e), ...fixed.values()];
}

const shortTypeOf = code => (code || "").replace("http://hl7.org/fhirpath/System.", "").replace(/^http:\/\/hl7\.org\/fhirpath\//, "");

/**
 * Required (min 1) and Must Support elements that nothing maps, below the resource and
 * below every element that gets something: not mapped, not iterated, no fixed value.
 * Only the loaded tree.
 */
export function completeness(tree, saved) {
  const entries = saved.filter(e => e.key || e.element).map(e => ({ ...e, key: e.key || e.element }));
  const covered = node =>
    entries.some(e => e.key === node.key || e.key.startsWith(node.key + ".") || e.key.startsWith(node.key + ":") || (e.key.startsWith(node.key + "[") && /^\[\d+\]/.test(e.key.slice(node.key.length))));
  const required = [];
  const mustSupport = [];
  const walk = node => {
    for (const child of tree.children(node) || []) {
      if (child.instance || child.choiceType) continue;
      if (covered(child) || child.fixed) {
        if (!child.primitive) walk(child);
      } else if (Number(child.min) >= 1) {
        required.push(child.key);
      } else if (child.mustSupport) {
        mustSupport.push(child.key);
      }
    }
  };
  walk(tree.root);
  return { required, mustSupport };
}

/** The editor's state from the saved rules of a step. */
export function stateFromRules(saved) {
  const values = new Map();
  const iterations = new Map();
  const translations = new Map();
  const conditions = new Map();
  const notes = new Map();
  const disabled = new Set();
  for (const e of saved) {
    const key = e.key || e.element;
    if (!key) continue;
    let form = null;
    if (typeof e.each === "string") { iterations.set(key, { expression: e.each, variable: e.variable || "item" }); form = "each"; }
    else if (typeof e.condition === "string") { conditions.set(key, e.condition); form = "condition"; }
    else if (typeof e.expression === "string") { values.set(key, e.expression); form = "value"; }
    if (e.translate && typeof e.translate === "object") translations.set(key, { ...e.translate });
    if (form && typeof e.note === "string" && e.note) notes.set(`${form}:${key}`, e.note);
    if (form && e.disabled === true) disabled.add(`${form}:${key}`);
  }
  return { values, iterations, translations, conditions, notes, disabled };
}
