// SPDX-License-Identifier: MPL-2.0
// Plugin entry point. Web Admin calls register(platform) once, after sign-in.
// Two transformer steps (FHIR Profile Mapper, FHIR FML Transform), the mapper's
// functions in the Reference panel, and the trace action of the message browser.
import { bindPlatform } from "./host/platform.js";
import { installStyles } from "./host/styles.js";
import { CONTEXT_MENU_STYLES } from "./host/context-menu.js";
import { registerMapperReferences } from "./host/references.js";
import { registerTraceAction } from "./host/message-action.js";
import { FhirSettingsPanel } from "./settings/panel.js";
import editorStyles from "./styles/editor.css";
import { register as registerProfileMapper } from "./profile-mapper/editor.js";
import { register as registerFml } from "./fml/editor.js";

export function register(platform) {
  bindPlatform(platform);
  installStyles([editorStyles, CONTEXT_MENU_STYLES]);
  registerProfileMapper(platform);
  registerFml(platform);
  platform.registerSettingsPanel?.({ label: "FHIR Mapper", component: FhirSettingsPanel });
  registerTraceAction();
  registerMapperReferences().catch(error => console.warn("[fhir-mapper] references unavailable:", error));
}
