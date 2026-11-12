// SPDX-License-Identifier: MPL-2.0
// Plugin entry point. Web Admin calls register(platform) once, after sign-in.
// Two transformer steps: FHIR Profile Mapper (graphical) and FHIR FML Transform.
import { bindPlatform } from "./host/platform.js";
import { bindReact } from "./host/react.js";
import { installStyles } from "./host/styles.js";
import { registerMapperReferences } from "./host/references.js";
import { setLocale } from "./i18n/index.js";
import { STYLE_SHEETS } from "./styles.js";
import { register as registerProfileMapper } from "./profile-mapper/legacy-editor.js";
import { register as registerFml } from "./fml/legacy-editor.js";

export function register(platform) {
  bindPlatform(platform);
  bindReact(platform.React);
  setLocale(navigator.languages ?? [navigator.language]);
  installStyles(STYLE_SHEETS);
  registerProfileMapper(platform);
  registerFml(platform);
  registerMapperReferences().catch(error => console.warn("[fhir-mapper] references unavailable:", error));
}
