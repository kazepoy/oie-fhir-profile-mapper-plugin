// SPDX-License-Identifier: MPL-2.0
const canonical = value => String(value || "").split("|")[0];

export function matchingConceptMaps(maps, { source = "", target = "", valueSet = "", systems = [] } = {}) {
  return maps.filter(map => {
    const groups = map.groups || [];
    if (source && !groups.some(group => canonical(group.source) === canonical(source)) && canonical(map.source) !== canonical(source)) return false;
    if (target) return groups.some(group => (!source || canonical(group.source) === canonical(source)) && canonical(group.target) === canonical(target)) || canonical(map.target) === canonical(target);
    if (!valueSet && !systems.length) return true;
    return (valueSet && canonical(map.target) === canonical(valueSet))
      || groups.some(group => (!source || canonical(group.source) === canonical(source)) && systems.some(system => canonical(group.target) === canonical(system)));
  });
}

export function profileExtensions(tree, node) {
  return (tree.children(node) || []).filter(child => ["extension", "modifierExtension"].includes(child.jsonName) && child.sliceName)
    .map(child => ({ key: child.key, label: child.label, url: child.types?.[0]?.profile?.[0] || "" }));
}
