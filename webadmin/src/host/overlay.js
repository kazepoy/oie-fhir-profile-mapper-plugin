// SPDX-License-Identifier: MPL-2.0
// Full-screen mode of an editor: its element is moved into an overlay that
// covers the viewport (header with a Back button and the title) and put back
// where it was on close, so its state survives. The same event as the host's
// code view is dispatched, so the transformer editor can bring its side panel.
import { t } from "../i18n/index.js";

/** @returns {{ close: () => void, body: HTMLElement }} */
export function openOverlay(element, title, onClose) {
  const placeholder = document.createComment("fm-overlay");
  const origin = element.parentNode;
  origin.insertBefore(placeholder, element);
  const overlay = document.createElement("div");
  overlay.className = "fm fm-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", title);
  const head = document.createElement("div");
  head.className = "fm-overlay__head";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "btn";
  back.textContent = `← ${t("common.exitFullScreen")}`;
  const heading = document.createElement("div");
  heading.className = "fm-overlay__title";
  heading.textContent = title;
  head.append(back, heading);
  const body = document.createElement("div");
  body.className = "fm-overlay__body";
  body.appendChild(element);
  overlay.append(head, body);
  document.body.appendChild(overlay);
  document.dispatchEvent(new CustomEvent("oie:code-view", { detail: { open: true, overlay, body, editorEl: element, origin } }));
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKey, true);
    document.dispatchEvent(new CustomEvent("oie:code-view", { detail: { open: false, editorEl: element } }));
    if (placeholder.parentNode) placeholder.parentNode.insertBefore(element, placeholder);
    placeholder.remove();
    overlay.remove();
    onClose?.();
  };
  const onKey = e => {
    if (e.key === "Escape" && !e.defaultPrevented && !overlay.querySelector(".suggest-widget.visible")) { e.preventDefault(); e.stopPropagation(); close(); }
  };
  back.addEventListener("click", close);
  document.addEventListener("keydown", onKey, true);
  return { close, body };
}
