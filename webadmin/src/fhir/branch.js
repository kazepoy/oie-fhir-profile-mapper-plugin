// SPDX-License-Identifier: MPL-2.0
export const inBranch = (key, root) => key === root || key.startsWith(root + ".");

// Expressions are opaque: only target keys are rewritten, including nested instance counts.
export function duplicateBranch(state, source, target) {
  const replace = key => target + key.slice(source.length);
  for (const name of ["values", "iterations", "conditions", "translations", "instances"]) {
    for (const key of state[name].keys()) if (inBranch(key, target)) state[name].delete(key);
    for (const [key, value] of [...state[name]]) {
      if (name === "instances" && key === source) continue; // This count belongs to the parent collection.
      if (inBranch(key, source)) state[name].set(replace(key), value && typeof value === "object" ? { ...value } : value);
    }
  }
  const metadataKey = key => {
    const colon = key.indexOf(":");
    const path = key.slice(colon + 1);
    return inBranch(path, source) ? key.slice(0, colon + 1) + replace(path) : null;
  };
  for (const name of ["notes", "disabled", "ruleIds"]) {
    for (const key of state[name]?.keys() || []) if (inBranch(key.slice(key.indexOf(":") + 1), target)) state[name].delete(key);
  }
  for (const [key, note] of [...state.notes]) {
    const next = metadataKey(key);
    if (next) state.notes.set(next, note);
  }
  for (const key of [...state.disabled]) {
    const next = metadataKey(key);
    if (next) state.disabled.add(next);
  }
}
