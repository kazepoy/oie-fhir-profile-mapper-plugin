// SPDX-License-Identifier: MPL-2.0
const FHIR_BASE = "http://hl7.org/fhir/StructureDefinition/";
/** Indexed StructureDefinitions per "version|packages|url": a promise, and the value once loaded. */
export const sdPromises = new Map();
export const sdLoaded = new Map();

export const sdKey = (version, profiles, url) => `${version}|${profiles}|${url}`;

export function indexSd(sd) {
  const elements = (sd.snapshot && sd.snapshot.element) || [];
  const byParent = new Map();
  const byId = new Map();
  for (const el of elements) byId.set(el.id, el);
  for (const el of elements.slice(1)) {
    const parent = el.id.slice(0, el.id.lastIndexOf("."));
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(el);
  }
  return { sd, root: elements[0], byParent, byId };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const lastSegment = (id) => id.slice(id.lastIndexOf(".") + 1);
export const shortType = (code) => (code || "").replace("http://hl7.org/fhirpath/System.", "").replace(/^http:\/\/hl7\.org\/fhirpath\//, "");
const isPrimitive = (code) => /^[a-z]/.test(code) || code.startsWith("http://hl7.org/fhirpath/");
const NOT_EXPANDED = new Set(["Resource", "BackboneElement", "Element"]);

function fixedOf(el) {
  for (const k of Object.keys(el)) {
    if (/^(fixed|pattern)[A-Z]/.test(k)) return { kind: k.startsWith("fixed") ? "fixed" : "pattern", value: el[k] };
  }
  return null;
}

function hiddenElement(el, parent, showAll) {
  if (el.max === "0") return true;
  const name = lastSegment(el.id).split(":")[0];
  if (showAll) return (el.type || []).some((t) => t.code === "Resource");
  if ((name === "extension" || name === "modifierExtension") && !el.sliceName) return true;
  if (name === "id" && !parent.resourceRoot) return true;
  return (el.type || []).some((t) => t.code === "Resource");
}

/**
 * The tree of a step. Nodes are built on demand from the loaded StructureDefinitions; repeated
 * instances of an element (instances: keyBase -> count) are separate nodes, keys "x.given[1]".
 */
export function makeTree(rootIndex, ctx) {
  const root = {
    key: rootIndex.sd.type,
    label: rootIndex.sd.type,
    el: rootIndex.root,
    sdx: rootIndex,
    path: [],
    depth: 0,
    resourceRoot: true,
    instance: 0,
    index: 0,
    code: rootIndex.sd.type,
    min: 1,
    max: "1"
  };
  const cache = new Map();

  function makeNode(parent, el, sdx, choiceType, instance, index) {
    const name = lastSegment(el.id).split(":")[0];
    let types = el.type || [];
    let sliceName = el.sliceName || null;
    let jsonName;
    let label;
    let choice = false;
    if (choiceType) {
      types = [choiceType];
      jsonName = name.replace("[x]", "") + cap(choiceType.code);
      label = jsonName;
      sliceName = null;
    } else if (name.endsWith("[x]")) {
      const base = name.slice(0, -3);
      // A type slice (value[x]:valueQuantity) may keep all the types of its base in the snapshot.
      const sliced = sliceName ? types.filter((t) => base + cap(t.code) === sliceName) : [];
      if (sliced.length === 1) types = sliced;
      if (types.length === 1) {
        jsonName = sliceName && sliceName.startsWith(base) ? sliceName : base + cap(types[0].code);
        label = jsonName;
        sliceName = null;
      } else {
        choice = true;
        label = sliceName ? `${name}:${sliceName}` : name;
        jsonName = null;
      }
    } else {
      jsonName = name;
      label = sliceName ? `${name}:${sliceName}` : name;
    }
    const baseMax = (el.base && el.base.max) || el.max || "1";
    const repeats = !choiceType && !choice && baseMax !== "1" && baseMax !== "0";
    const keyBase = `${parent.key}.${label}`;
    const key = keyBase + (instance ? `[${instance}]` : "");
    const segment = repeats ? [jsonName, `${sliceName || ""}#${instance}`] : [jsonName];
    const code = types.length === 1 ? types[0].code : null;
    const primitive = !!code && isPrimitive(code);
    let typeUrl = null;
    if (!choice && code && !primitive && !NOT_EXPANDED.has(code)) {
      typeUrl = (types[0].profile && types[0].profile[0]) || FHIR_BASE + code;
    }
    return {
      key,
      keyBase,
      label,
      jsonName,
      el,
      sdx,
      choiceType,
      choice,
      sliceName,
      repeats,
      instance,
      index,
      path: jsonName == null ? parent.path : parent.path.concat([segment]),
      code,
      primitive,
      typeUrl,
      types,
      min: choiceType ? parent.min : el.min,
      max: choiceType ? parent.max : el.max,
      short: el.short || "",
      mustSupport: !!el.mustSupport || (choiceType ? parent.mustSupport : false),
      binding: el.binding && el.binding.valueSet ? { strength: el.binding.strength || "", valueSet: el.binding.valueSet } : null,
      fixed: choiceType ? null : fixedOf(el),
      depth: parent.depth + 1,
      parent
    };
  }

  /** The child elements of a node, or null while the StructureDefinition of its type is loading. */
  function childElements(node) {
    if (node.choice) return node.types.map((t) => ({ el: node.el, sdx: node.sdx, choiceType: t }));
    const own = node.choiceType ? [] : node.sdx.byParent.get(node.el.id) || [];
    if (own.length) return own.map((el) => ({ el, sdx: node.sdx }));
    if (!node.typeUrl) return [];
    const typeIndex = sdLoaded.get(sdKey(ctx.version, ctx.profiles, node.typeUrl));
    if (!typeIndex) return null;
    return (typeIndex.byParent.get(typeIndex.root.id) || []).map((el) => ({ el, sdx: typeIndex }));
  }

  function children(node) {
    if (cache.has(node.key)) return cache.get(node.key);
    const elements = childElements(node);
    if (elements === null) return null;
    const list = [];
    for (const { el, sdx, choiceType } of elements) {
      if (!choiceType && hiddenElement(el, node, ctx.showAll)) continue;
      const first = makeNode(node, el, sdx, choiceType, 0, list.length);
      const count = Math.max(1, ctx.instances.get(first.keyBase) || 1);
      list.push(first);
      for (let i = 1; i < count; i++) list.push(makeNode(node, el, sdx, choiceType, i, list.length));
    }
    cache.set(node.key, list);
    return list;
  }

  const expandable = (node) => node.choice || !!node.typeUrl || (!node.choiceType && (node.sdx.byParent.get(node.el.id) || []).length > 0);

  /** The nodes from the root to a key, or null when it is not (or not yet) in the loaded tree. */
  function chain(key) {
    if (key === root.key) return [root];
    if (!key.startsWith(root.key + ".")) return null;
    const result = [root];
    let node = root;
    for (const segment of key.slice(root.key.length + 1).split(".")) {
      const list = children(node);
      if (!list) return null;
      node = list.find((n) => n.key === `${node.key}.${segment}`);
      if (!node) return null;
      result.push(node);
    }
    return result;
  }

  /** Discriminator paths of a slice ("system", "url", "type.coding.code"), relative to the slice. */
  function discriminators(node) {
    if (!node.sliceName) return [];
    const base = node.sdx.byId.get(node.el.id.replace(/:[^.:]+$/, ""));
    return ((base && base.slicing && base.slicing.discriminator) || []).map((d) => d.path).filter((p) => p && p !== "$this");
  }

  return { root, children, expandable, chain, discriminators };
}

/** Keys and their count of instances, from the keys of saved mappings. */
export function instancesOf(keys) {
  const instances = new Map();
  for (const key of keys) {
    const parts = key.split(".");
    for (let i = 1; i < parts.length; i++) {
      const m = /^(.*)\[(\d+)\]$/.exec(parts[i]);
      if (m) {
        const keyBase = parts.slice(0, i).join(".") + "." + m[1];
        instances.set(keyBase, Math.max(instances.get(keyBase) || 1, Number(m[2]) + 1));
      }
    }
  }
  return instances;
}

export function parseMappings(text) {
  try {
    const list = JSON.parse(text || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * The mappings saved with the step: the values and iterations in tree order (that is the order of
 * the entries of repeating elements), then the fixed and pattern values of the entries they create:
 * of the slices and elements on the way, and of required elements and slice discriminators below
 * them. iterations: key -> {expression, variable}; translations: key -> {conceptMap, source, target, unmapped}.
 */
export function compile(tree, values, iterations, translations, conditions) {
  const entries = [];
  const fixed = new Map();
  for (const [key, it] of iterations) {
    const nodes = it.expression.trim() ? tree.chain(key) : null;
    if (!nodes) continue;
    const node = nodes[nodes.length - 1];
    // the resource itself: one resource per item (Bundle output)
    if (node !== tree.root && !node.repeats) continue;
    entries.push({ key, each: it.expression.trim(), variable: (it.variable || "item").trim(), path: node.path, order: node === tree.root ? [] : nodes.map((n) => n.index) });
  }
  for (const [key, condition] of conditions) {
    const nodes = condition.trim() ? tree.chain(key) : null;
    if (!nodes) continue;
    const node = nodes[nodes.length - 1];
    entries.push({ key, condition: condition.trim(), path: node.path, order: node === tree.root ? [] : nodes.map((n) => n.index) });
  }
  const mapped = new Set([...values.keys()].filter((k) => values.get(k).trim() !== ""));
  for (const key of mapped) {
    const nodes = tree.chain(key);
    if (!nodes) continue;
    const leaf = nodes[nodes.length - 1];
    if (leaf.choice) continue;
    const entry = {
      key,
      element: key,
      type: shortType(leaf.code),
      expression: values.get(key).trim(),
      path: leaf.path,
      order: nodes.map((n) => n.index)
    };
    const t = translations.get(key);
    if (t && t.conceptMap && t.conceptMap.trim()) {
      entry.translate = { conceptMap: t.conceptMap.trim(), source: (t.source || "").trim(), target: (t.target || "").trim(), unmapped: t.unmapped || "none", keepSource: !!t.keepSource };
      if (entry.translate.unmapped === "fixed" || entry.translate.unmapped === "function") entry.translate.value = (t.value || "").trim();
    }
    entries.push(entry);
    const onChain = new Set(nodes.map((n) => n.key));
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
          } else if (req || discriminators.some((p) => p.startsWith(path + "."))) {
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

/**
 * Required (min 1) and Must Support elements that nothing maps, below the resource and below every
 * element that gets something: not mapped, not iterated, no fixed value. Only the loaded tree.
 */
export function completeness(tree, saved) {
  const entries = saved.filter((e) => e.key || e.element).map((e) => ({ ...e, key: e.key || e.element }));
  const covered = (node) =>
    entries.some((e) => e.key === node.key || e.key.startsWith(node.key + ".") || e.key.startsWith(node.key + ":") || (e.key.startsWith(node.key + "[") && /^\[\d+\]/.test(e.key.slice(node.key.length))));
  const required = [];
  const mustSupport = [];
  const walk = (node) => {
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
