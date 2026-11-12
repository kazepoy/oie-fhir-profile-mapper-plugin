// SPDX-License-Identifier: MPL-2.0
// Tabs with the ARIA roles and the arrow keys; only the selected panel is rendered.
import { useId } from "../../host/react.js";
import { Badge } from "./Button.jsx";

/**
 * @param {{ tabs: { id: string, label: string, badge?: { text: string, title?: string, kind?: string } | null, panel: any }[],
 *           current: string, onChange: (id: string) => void, label: string, end?: any }} props
 */
export function Tabs({ tabs, current, onChange, label, end }) {
  const id = useId();
  const selected = tabs.find(t => t.id === current) || tabs[0];
  const keys = e => {
    const index = tabs.indexOf(selected);
    const next = e.key === "ArrowRight" ? (index + 1) % tabs.length : e.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length
      : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].id);
    e.currentTarget.querySelectorAll("[role=tab]")[next]?.focus();
  };
  return (
    <>
      <div className="fm-tabs" role="tablist" aria-label={label} onKeyDown={keys}>
        {tabs.map(tab => (
          <button key={tab.id} id={`${id}-${tab.id}`} type="button" role="tab" aria-selected={tab === selected} aria-controls={`${id}-panel`}
            tabIndex={tab === selected ? 0 : -1} onClick={() => onChange(tab.id)}>
            {tab.label}
            {tab.badge ? <Badge kind={tab.badge.kind} title={tab.badge.title}>{tab.badge.text}</Badge> : null}
          </button>
        ))}
        {end ? <div className="fm-tabs__end">{end}</div> : null}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${selected.id}`} className="fm-tab-panel">{selected.panel}</div>
    </>
  );
}
