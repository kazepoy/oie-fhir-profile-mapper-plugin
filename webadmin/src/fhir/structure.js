// SPDX-License-Identifier: MPL-2.0
// The element tree of a profile, built from StructureDefinition snapshots: the
// profile's own, and the ones of the data types and extensions it uses. Pure
// functions; the loading of StructureDefinitions is the caller's (host) job.

export const FHIR_BASE = "http://hl7.org/fhir/StructureDefinition/";

export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const lastSegment = id => id.slice(id.lastIndexOf(".") + 1);
export const shortType = code => (code || "").replace("http://hl7.org/fhirpath/System.", "").replace(/^http:\/\/hl7\.org\/fhirpath\//, "");
export const isPrimitive = code => /^[a-z]/.test(code) || code.startsWith("http://hl7.org/fhirpath/");
const NOT_EXPANDED = new Set(["Resource", "BackboneElement", "Element"]);

/** Indexes a StructureDefinition by element id and by parent id. */
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

export function fixedOf(el) {
  for (const k of Object.keys(el)) {
    if (/^(fixed|pattern)[A-Z]/.test(k)) return { kind: k.startsWith("fixed") ? "fixed" : "pattern", value: el[k] };
  }
  return null;
}

/** Elements the tree hides: forbidden ones, unsliced extensions and ids (unless asked), nested resources. */
export function hiddenElement(el, parent, showAll) {
  if (el.max === "0") return true;
  const name = lastSegment(el.id).split(":")[0];
  const nested = (el.type || []).some(t => t.code === "Resource");
  // contained resources are mapped as whole objects; other nested resources are not editable
  if (nested) return name !== "contained";
  if (showAll) return false;
  if ((name === "extension" || name === "modifierExtension") && !el.sliceName) return true;
  if (name === "id" && !parent.resourceRoot) return true;
  return false;
}

/**
 * The tree of a step. Nodes are built on demand from the loaded StructureDefinitions;
 * repeated instances of an element (instances: keyBase -> count) are separate nodes,
 * keys "x.given[1]". ctx.types(url) gives the index of a data type, or null while it loads.
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
    max: "1",
    short: rootIndex.root?.short || "",
    definition: rootIndex.root?.definition || ""
  };
  const cache = new Map();
  const types = ctx.types || (() => null);

  function makeNode(parent, el, sdx, choiceType, instance, index) {
    const name = lastSegment(el.id).split(":")[0];
    let elTypes = el.type || [];
    let sliceName = el.sliceName || (el.id.includes(":") ? lastSegment(el.id).split(":").slice(1).join(":") : null) || null;
    let jsonName;
    let label;
    let choice = false;
    if (choiceType) {
      elTypes = [choiceType];
      jsonName = name.replace("[x]", "") + cap(choiceType.code);
      label = jsonName;
      sliceName = null;
    } else if (name.endsWith("[x]")) {
      const base = name.slice(0, -3);
      // A type slice (value[x]:valueQuantity) may keep all the types of its base in the snapshot.
      const sliced = sliceName ? elTypes.filter(t => base + cap(t.code) === sliceName) : [];
      if (sliced.length === 1) elTypes = sliced;
      if (elTypes.length === 1) {
        jsonName = sliceName && sliceName.startsWith(base) ? sliceName : base + cap(elTypes[0].code);
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
    // Sub-elements of a primitive (its extensions, its id) live under "_name" in JSON.
    const parentJsonName = parent.primitive && parent.jsonName ? `_${parent.jsonName}` : null;
    const segment = repeats ? [jsonName, `${sliceName || ""}#${instance}`] : [jsonName];
    const code = elTypes.length === 1 ? elTypes[0].code : null;
    const primitive = !!code && isPrimitive(code);
    let typeUrl = null;
    if (!choice && code && !primitive && !NOT_EXPANDED.has(code)) {
      typeUrl = (elTypes[0].profile && elTypes[0].profile[0]) || FHIR_BASE + code;
    }
    const contained = code === "Resource" && name === "contained";
    if (contained) typeUrl = null;
    let path;
    if (jsonName == null) path = parent.path;
    else if (parentJsonName) {
      // replace the parent's last segment by _name, then add this one
      const parentPath = parent.path.slice(0, -1).concat([[parentJsonName, ...parent.path[parent.path.length - 1].slice(1)]]);
      path = parentPath.concat([segment]);
    } else path = parent.path.concat([segment]);
    const binding = el.binding && el.binding.valueSet ? { strength: el.binding.strength, valueSet: el.binding.valueSet, description: el.binding.description || "" } : null;
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
      path,
      code,
      primitive,
      contained,
      typeUrl,
      types: elTypes,
      min: choiceType ? parent.min : el.min,
      max: choiceType ? parent.max : el.max,
      short: el.short || "",
      definition: el.definition || "",
      comment: el.comment || "",
      binding: choiceType ? parent.binding : binding,
      constraints: (el.constraint || []).map(c => ({ key: c.key, severity: c.severity, human: c.human })),
      mustSupport: !!el.mustSupport || (choiceType ? parent.mustSupport : false),
      fixed: choiceType ? null : fixedOf(el),
      depth: parent.depth + 1,
      parent
    };
  }

  /** The child elements of a node, or null while the StructureDefinition of its type is loading. */
  function childElements(node) {
    if (node.choice) return node.types.map(t => ({ el: node.el, sdx: node.sdx, choiceType: t }));
    if (node.contained) return [];
    const own = node.choiceType ? [] : node.sdx.byParent.get(node.el.id) || [];
    if (own.length) return own.map(el => ({ el, sdx: node.sdx }));
    if (!node.typeUrl) return [];
    const typeIndex = types(node.typeUrl);
    if (!typeIndex) return null;
    return (typeIndex.byParent.get(typeIndex.root.id) || []).map(el => ({ el, sdx: typeIndex }));
  }

  function children(node) {
    if (cache.has(node.key)) return cache.get(node.key);
    const elements = childElements(node);
    if (elements === null) return null;
    const list = [];
    for (const { el, sdx, choiceType } of elements) {
      if (!choiceType && hiddenElement(el, node, ctx.showAll)) continue;
      const first = makeNode(node, el, sdx, choiceType, 0, list.length);
      const count = Math.max(1, (ctx.instances && ctx.instances.get(first.keyBase)) || 1);
      list.push(first);
      for (let i = 1; i < count; i++) list.push(makeNode(node, el, sdx, choiceType, i, list.length));
    }
    cache.set(node.key, list);
    return list;
  }

  const expandable = node => node.choice || !!node.typeUrl || (!node.choiceType && !node.contained && (node.sdx.byParent.get(node.el.id) || []).length > 0);

  /** The nodes from the root to a key, or null when it is not (or not yet) in the loaded tree. */
  function chain(key) {
    if (key === root.key) return [root];
    if (!key.startsWith(root.key + ".")) return null;
    const result = [root];
    let node = root;
    for (const segment of key.slice(root.key.length + 1).split(".")) {
      const list = children(node);
      if (!list) return null;
      node = list.find(n => n.key === `${node.key}.${segment}`);
      if (!node) return null;
      result.push(node);
    }
    return result;
  }

  /** Discriminators of a slice: { type, path } relative to the slice ($this excluded). */
  function discriminatorsOf(node) {
    if (!node.sliceName) return [];
    const base = node.sdx.byId.get(node.el.id.replace(/:[^.:]+$/, ""));
    return ((base && base.slicing && base.slicing.discriminator) || []).filter(d => d.path).map(d => ({ type: d.type, path: d.path }));
  }

  /** Discriminator paths that fix a value ("value" and "pattern" kinds), relative to the slice. */
  const discriminators = node => discriminatorsOf(node).filter(d => d.path !== "$this" && (d.type === "value" || d.type === "pattern")).map(d => d.path);

  /** Every node of the loaded tree, depth first. */
  function* walk(node = root) {
    for (const child of children(node) || []) {
      yield child;
      yield* walk(child);
    }
  }

  return { root, children, expandable, chain, discriminators, discriminatorsOf, walk };
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

/** The URL of the official definition of an element, in the selected release. */
export function helpUrl(version, type, key = type) {
  const release = ["R4", "R4B", "R5"].includes(version) ? version : "R4";
  if (!/^[A-Z][A-Za-z0-9]+$/.test(type || "")) return `https://hl7.org/fhir/${release}/`;
  const field = key.split(".")[1]?.replace(/:[^.]*/, "").replace(/\[\d+\]/g, "");
  return `https://hl7.org/fhir/${release}/${type.toLowerCase()}-definitions.html#${encodeURIComponent(type + (field ? "." + field : ""))}`;
}
