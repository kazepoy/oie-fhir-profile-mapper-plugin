// SPDX-License-Identifier: MPL-2.0
// The Web Admin platform object, kept here so that the host/ modules share it.

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

/** A short notification in the corner of the page. */
export function toast(message, type = "info") {
  current?.ui?.toast?.(message, type);
}
