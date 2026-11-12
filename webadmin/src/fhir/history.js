// SPDX-License-Identifier: MPL-2.0
// Undo and redo of the editor's mapping state: snapshots of the maps, kept while
// the step is open. A snapshot is taken before every change.

export function snapshot(state) {
  return {
    values: [...state.values], iterations: [...state.iterations].map(([k, v]) => [k, { ...v }]),
    translations: [...state.translations].map(([k, v]) => [k, { ...v }]), conditions: [...state.conditions],
    notes: [...(state.notes || [])], disabled: [...(state.disabled || [])], instances: [...(state.instances || [])]
  };
}

export function restore(state, snap) {
  state.values = new Map(snap.values);
  state.iterations = new Map(snap.iterations.map(([k, v]) => [k, { ...v }]));
  state.translations = new Map(snap.translations.map(([k, v]) => [k, { ...v }]));
  state.conditions = new Map(snap.conditions);
  state.notes = new Map(snap.notes);
  state.disabled = new Set(snap.disabled);
  state.instances = new Map(snap.instances);
}

export function createHistory(limit = 100) {
  const past = [];
  const future = [];
  return {
    record(state) { past.push(snapshot(state)); if (past.length > limit) past.shift(); future.length = 0; },
    undo(state) { if (!past.length) return false; future.push(snapshot(state)); restore(state, past.pop()); return true; },
    redo(state) { if (!future.length) return false; past.push(snapshot(state)); restore(state, future.pop()); return true; },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0
  };
}
