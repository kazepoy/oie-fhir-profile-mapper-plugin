// SPDX-License-Identifier: MPL-2.0
import { t as tr } from "../i18n/index.js";
// The mapper's runtime functions in Web Admin's Reference panel and in the
// completion of its script editors, for transformer contexts.
import { platform } from "./platform.js";
import { mapperFunctions } from "./api.js";

const CONTEXTS = ["SOURCE_FILTER_TRANSFORMER", "DESTINATION_FILTER_TRANSFORMER", "DESTINATION_RESPONSE_TRANSFORMER"];

export async function registerMapperReferences() {
  const p = platform();
  if (typeof p.registerReferences !== "function") return;
  const functions = await mapperFunctions();
  p.registerReferences("FHIR Mapper", functions.map(fn => ({
    name: fn.signature,
    description: tr("{p0} Example: {p1}. Available inside FHIR Profile Mapper expressions.", { p0: fn.description, p1: fn.example }),
    code: `function ${fn.name}(${(fn.parameters || []).map(x => x.name).join(", ")}) {}`,
    type: "FUNCTION",
    contexts: CONTEXTS
  })));
}
