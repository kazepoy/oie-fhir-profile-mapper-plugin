// SPDX-License-Identifier: MPL-2.0
// The public Web Admin menu supplies focus management and keyboard navigation.
// Web Admin 1.3 portals menus at z-index 150, below the studio's overlay (900).
// Keep this workaround beside the host API; see WA-21 in doc/architecture/limites-plateforme.md.
export const CONTEXT_MENU_STYLES = `
body:has(.fhir-profile-mapper.mapper-fullscreen) [data-radix-popper-content-wrapper]:has([role=menu]),
body:has(.fhir-profile-mapper.mapper-fullscreen) .ctx-menu[role=menu] { z-index: 960 !important; }
`;

export function showContextMenu(platform, event, items) {
  if (!platform.ui?.contextMenu) return false;
  event.preventDefault();
  event.stopPropagation();
  const rect = event.currentTarget.getBoundingClientRect();
  const keyboard = event.type === "keydown" || (event.type === "click" && event.detail === 0);
  platform.ui.contextMenu(keyboard ? rect.left : event.clientX, keyboard ? rect.bottom : event.clientY, items);
  return true;
}
