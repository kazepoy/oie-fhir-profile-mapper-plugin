// SPDX-License-Identifier: MPL-2.0
// The Web Admin platform object, kept here so that only src/host/ depends on it.
// Every use of platform.* outside this folder is a bug.

/** @type {any} */
let current = null;

export function bindPlatform(platform) {
  current = platform;
}

/** @returns {any} */
export function platform() {
  if (!current) throw new Error("FHIR Mapper: the platform is not bound yet");
  return current;
}

/** The signed-in user ({ id, username, ... }) or null. */
export function currentUser() {
  return current?.store?.getState("user") ?? null;
}

/** The channel being edited in the channel editor, or null. */
export function editingChannel() {
  return current?.store?.getState("editingChannel") ?? null;
}

/** Web Admin's confirmation dialog; resolves to true when the user confirms. */
export function confirm(title, message, options) {
  const dialog = current?.ui?.confirmDialog;
  return dialog ? dialog(title, message, options) : Promise.resolve(window.confirm(`${title}\n\n${message}`));
}

/** Web Admin's prompt dialog; resolves to the text, or null. */
export function prompt(title, label, initial = "") {
  const dialog = current?.ui?.promptDialog;
  return dialog ? dialog(title, label, initial) : Promise.resolve(window.prompt(`${title}\n${label}`, initial));
}

/** A short notification in the corner of the page. */
export function toast(message, type = "info") {
  current?.ui?.toast?.(message, type);
}

/** Lets the user save a file (Web Admin's file dialog, or a download). */
export function saveFile(name, type, content) {
  const ui = current?.ui;
  if (ui?.saveFile) return ui.saveFile(name, type, () => content);
  if (ui?.downloadFile) return ui.downloadFile(name, content, type);
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return Promise.resolve();
}

/** Lets the user pick a file; resolves to its text, or null. */
export async function pickFile(accept) {
  const ui = current?.ui;
  if (ui?.pickFile) {
    const picked = await ui.pickFile(accept);
    if (!picked) return null;
    return typeof picked === "string" ? picked : picked.text ?? (picked.content ?? null);
  }
  return new Promise(resolve => {
    const input = document.createElement("input");
    input.type = "file";
    if (accept) input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file.text().then(resolve, () => resolve(null));
    };
    input.click();
  });
}

/** Whether the user may perform a task (RBAC); true without an authorization plugin. */
export function checkTask(group, task) {
  const check = current?.checkTask;
  return typeof check === "function" ? check(group, task) !== false : true;
}
