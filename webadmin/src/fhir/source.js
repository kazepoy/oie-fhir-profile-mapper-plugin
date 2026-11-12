// SPDX-License-Identifier: MPL-2.0
// The sample message as a tree of nodes with their accessor (the JavaScript
// path a rule uses), their value and their children: the Source pane and the
// path suggestions. JSON and XML are read here; HL7 v2 is serialized to OIE's
// XML by the server first.

const esc = s => String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

/** @typedef {{ name: string, accessor: string, value: string | null, children: SourceNode[], repeated?: boolean, index?: number }} SourceNode */

function xmlNode(element, accessor) {
  const children = [];
  for (const attr of element.attributes) {
    children.push({ name: `@${attr.name}`, accessor: `${accessor}['@${esc(attr.name)}'].toString()`, value: attr.value, children: [] });
  }
  const counts = {};
  for (const child of element.children) counts[child.tagName] = (counts[child.tagName] || 0) + 1;
  const seen = {};
  for (const child of element.children) {
    const index = seen[child.tagName] || 0;
    seen[child.tagName] = index + 1;
    let childAccessor = `${accessor}['${esc(child.tagName)}']`;
    const repeated = counts[child.tagName] > 1;
    if (repeated) childAccessor += `[${index}]`;
    const node = xmlNode(child, childAccessor);
    if (repeated) { node.repeated = true; node.index = index; node.listAccessor = `${accessor}['${esc(child.tagName)}']`; }
    children.push(node);
  }
  const value = element.children.length ? null : (element.textContent ?? "");
  return { name: element.tagName, accessor: `${accessor}.toString()`, pathAccessor: accessor, value, children };
}

function jsonNode(name, value, accessor) {
  if (Array.isArray(value)) {
    return { name, accessor, pathAccessor: accessor, value: null, children: value.map((item, i) => ({ ...jsonNode(`[${i}]`, item, `${accessor}[${i}]`), repeated: true, index: i, listAccessor: accessor })) };
  }
  if (value && typeof value === "object") {
    return { name, accessor, pathAccessor: accessor, value: null, children: Object.entries(value).map(([key, item]) => jsonNode(key, item, `${accessor}['${esc(key)}']`)) };
  }
  return { name, accessor, pathAccessor: accessor, value: value === null ? "null" : String(value), children: [] };
}

/**
 * The tree of a sample. dataType: JSON, XML (also what HL7 v2 and DELIMITED become),
 * RAW (one node). Returns [] for a sample that cannot be read.
 */
export function sourceTree(sample, variable = "msg") {
  const message = sample?.message || "";
  if (!message.trim()) return [];
  try {
    if (sample.dataType === "JSON") return [jsonNode(variable, JSON.parse(message), variable)];
    if (sample.dataType === "RAW") return [{ name: variable, accessor: variable, pathAccessor: variable, value: message.slice(0, 200), children: [] }];
    const doc = new DOMParser().parseFromString(message, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) return [];
    const root = xmlNode(doc.documentElement, variable);
    root.name = `${variable} (${doc.documentElement.tagName})`;
    return [root];
  } catch {
    return [];
  }
}

/** Flat list of the accessors of a tree with their sample values, limited in number. */
export function sourcePaths(tree, limit = 2000) {
  const paths = [];
  const walk = node => {
    if (paths.length >= limit) return;
    paths.push({ path: node.pathAccessor || node.accessor, value: node.value, name: node.name, repeated: !!node.repeated, listAccessor: node.listAccessor });
    for (const child of node.children) walk(child);
  };
  for (const node of tree) walk(node);
  return paths;
}

/** Legacy helper: the accessors as strings (JSON member syntax, as the completion offers them). */
export function mapperSourcePaths(sample, limit = 200) {
  return sourcePaths(sourceTree(sample), limit).map(p => p.path).filter(p => p !== "msg").map(p => p.replace(/\['([^']+)'\]/g, (_, key) => `[${JSON.stringify(key)}]`)).slice(0, limit);
}
