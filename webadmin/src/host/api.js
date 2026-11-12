// SPDX-License-Identifier: MPL-2.0
// The plugin's own REST routes (/api/extensions/fhir-profile-mapper), called with
// the user's session through Web Admin's API client.
import { platform } from "./platform.js";

export const MAPPER_API = "/extensions/fhir-profile-mapper";

/** The mapper function catalogue (mapper-functions.json), loaded once. */
let functionsPromise = null;
export function mapperFunctions() {
  if (!functionsPromise) {
    functionsPromise = platform().api.get(`${MAPPER_API}/functions`, {}, { raw: true }).then(text => JSON.parse(text)).catch(error => {
      functionsPromise = null;
      throw error;
    });
  }
  return functionsPromise;
}
