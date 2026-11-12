// SPDX-License-Identifier: MPL-2.0
// Line icons (24 × 24 grid, stroked). Names describe what they show.
const PATHS = {
  expand: "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7",
  collapse: "M4 10h6V4M20 14h-6v6M14 4l-4 4M10 20l4-4",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3",
  redo: "M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  repeat: "M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3",
  question: "M9 9a3 3 0 115 2.5c-1 .6-2 1.5-2 2.5M12 17h.01M12 2a10 10 0 100 20 10 10 0 000-20z",
  translate: "M4 5h7M7 3v2c0 5-2 8-5 10M5 9c1 3 3 5 6 6M13 21l4-10 4 10M14.5 17h5",
  play: "M6 4l14 8-14 8z",
  check: "M4 12l5 5L20 7",
  x: "M6 6l12 12M18 6L6 18",
  more: "M6 12h.01M12 12h.01M18 12h.01",
  chevronRight: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
  book: "M4 4h6a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-6a3 3 0 00-3 3v13a2 2 0 012-2h7z",
  copy: "M8 8h12v12H8zM4 16V4h12",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  warning: "M12 3l10 18H2zM12 10v4M12 18h.01",
  error: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v5M12 16h.01",
  note: "M4 4h16v12H8l-4 4z",
  settings: "M12 8a4 4 0 100 8 4 4 0 000-8zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"
};

/** @param {{ name: keyof typeof PATHS, size?: number, className?: string }} props */
export function Icon({ name, size = 14, className = "" }) {
  return (
    <svg className={`fm-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] || ""} />
    </svg>
  );
}

export const iconPath = name => PATHS[name];
