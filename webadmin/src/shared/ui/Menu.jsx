// SPDX-License-Identifier: MPL-2.0
// A context menu at a point of the page: closes on Escape, a click outside or a choice.
import { useEffect, useRef } from "../../host/react.js";

/** @param {{ x: number, y: number, items: ({ label: string, shortcut?: string, disabled?: boolean, onSelect?: () => void } | "-")[], onClose: () => void, label: string }} props */
export function Menu({ x, y, items, onClose, label }) {
  const panel = useRef(null);
  useEffect(() => {
    const el = panel.current;
    if (!el) return undefined;
    const box = el.getBoundingClientRect();
    el.style.left = `${Math.max(4, Math.min(x, window.innerWidth - box.width - 4))}px`;
    el.style.top = `${Math.max(4, Math.min(y, window.innerHeight - box.height - 4))}px`;
    el.querySelector("[role=menuitem]:not(:disabled)")?.focus();
    const onDown = e => { if (!el.contains(e.target)) onClose(); };
    const onKey = e => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const all = [...el.querySelectorAll("[role=menuitem]:not(:disabled)")];
        const i = all.indexOf(document.activeElement);
        all[(i + (e.key === "ArrowDown" ? 1 : all.length - 1)) % all.length]?.focus();
      }
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => { document.removeEventListener("mousedown", onDown, true); document.removeEventListener("keydown", onKey, true); };
  }, []);
  return (
    <div ref={panel} className="fm-menu" role="menu" aria-label={label} style={{ left: x, top: y }}>
      {items.map((item, i) => item === "-" ? <hr key={i} /> : (
        <button key={i} type="button" role="menuitem" disabled={!!item.disabled} onClick={() => { onClose(); item.onSelect?.(); }}>
          <span>{item.label}</span>
          {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
        </button>
      ))}
    </div>
  );
}
