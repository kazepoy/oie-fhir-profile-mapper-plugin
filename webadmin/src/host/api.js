// SPDX-License-Identifier: MPL-2.0
// The plugin's own REST routes (/api/extensions/fhir-profile-mapper), called with
// the user's session through Web Admin's API client. Bodies are text/plain JSON
// and answers plain JSON, never XStream.
import { platform } from "./platform.js";

export const MAPPER_API = "/extensions/fhir-profile-mapper";

/** The message of a failed request: the engine answers a ClientException as XStream XML. */
export function errorText(e) {
  const body = (e && e.body) || "";
  const m = /<detailMessage>([\s\S]*?)<\/detailMessage>/.exec(body);
  if (m) return m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  return (e && e.message) || String(e);
}

async function getJson(base, path, params) {
  const text = await platform().api.get(`${base}${path}`, params, { raw: true });
  return text === "" || text == null ? null : JSON.parse(text);
}

async function postJson(base, path, body, { timeoutMs } = {}) {
  const text = await platform().api.post(`${base}${path}`, typeof body === "string" ? body : JSON.stringify(body),
    { contentType: "text/plain", raw: true, ...(timeoutMs ? { timeoutMs } : {}) });
  return text === "" || text == null ? null : JSON.parse(text);
}

/** The mapper function catalogue (mapper-functions.json), loaded once. */
let functionsPromise = null;
export function mapperFunctions() {
  if (!functionsPromise) {
    functionsPromise = getJson(MAPPER_API, "/functions").catch(error => {
      functionsPromise = null;
      throw error;
    });
  }
  return functionsPromise;
}

/** The sample as the server sees it: HL7 v2 is serialized to OIE's XML. */
export const serializeSample = sample => postJson(MAPPER_API, "/source", sample);

export const listProfiles = params => getJson(MAPPER_API, "/profiles", params);
export const getStructure = params => getJson(MAPPER_API, "/structure", params);
/** The flattened tree of a profile and of every data type it uses. */
export const getElements = params => getJson(MAPPER_API, "/catalog/elements", params);
export const getCatalog = params => getJson(MAPPER_API, "/catalog", params);
export const expandValueSet = params => getJson(MAPPER_API, "/catalog/expand", params);
export const listConceptMaps = params => getJson(MAPPER_API, "/conceptMaps", params);
export const translateCode = params => getJson(MAPPER_API, "/translate", params);

export const compileStep = step => postJson(MAPPER_API, "/script", step);
export const testStep = (request, timeoutMs = 60000) => postJson(MAPPER_API, "/test", request, { timeoutMs });

/** Server settings: the FHIR contexts. */
export const getSettings = () => getJson(MAPPER_API, "/settings");
export const putSettings = settings => postJson(MAPPER_API, "/settings", settings);
export const reloadContext = name => postJson(MAPPER_API, `/contexts/${encodeURIComponent(name)}/reload`, "");

/** FML routes. */
export const FML_API = "/extensions/fhir-fml";
export const fmlMaps = params => getJson(FML_API, "/maps", params);
export const fmlReload = () => postJson(FML_API, "/reload", "");
export const fmlCheck = request => postJson(FML_API, "/check", request);
export const fmlScaffold = request => postJson(FML_API, "/scaffold", request);
export const fmlSource = request => postJson(FML_API, "/source", request);
export const fmlTest = request => postJson(FML_API, "/test", request, { timeoutMs: 120000 });
