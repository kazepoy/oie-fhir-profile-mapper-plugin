// SPDX-License-Identifier: MPL-2.0
import { sdKey, sdLoaded, sdPromises, indexSd } from "../fhir/model.js";
const MAPPER_API = "/extensions/fhir-profile-mapper";
export function fetchSd(platform, version, profiles, url) {
  const key = sdKey(version, profiles, url);
  if (!sdPromises.has(key)) {
    const promise = platform.api
      .get(`${MAPPER_API}/structure`, { url, fhirVersion: version, profiles }, { raw: true })
      .then((text) => {
        const index = indexSd(JSON.parse(text));
        sdLoaded.set(key, index);
        return index;
      })
      .catch((e) => {
        sdPromises.delete(key);
        throw e;
      });
    sdPromises.set(key, promise);
  }
  return sdPromises.get(key);
}

/**
 * A profile with every data type and extension profile it uses, in one request
 * (GET /catalog/elements): the tree then opens without loading types one by one.
 * Falls back to the profile alone on a server without that route.
 */
export function fetchElements(platform, version, profiles, url) {
  const key = sdKey(version, profiles, url);
  if (sdPromises.has(key)) return sdPromises.get(key);
  const promise = platform.api.get(`${MAPPER_API}/catalog/elements`, { url, fhirVersion: version, profiles }, { raw: true }).then((text) => {
    const answer = JSON.parse(text);
    const index = indexSd(answer.root);
    sdLoaded.set(key, index);
    for (const [typeUrl, sd] of Object.entries(answer.types || {})) {
      const typeKey = sdKey(version, profiles, typeUrl);
      if (sdLoaded.has(typeKey)) continue;
      const typeIndex = indexSd(sd);
      sdLoaded.set(typeKey, typeIndex);
      sdPromises.set(typeKey, Promise.resolve(typeIndex));
    }
    return index;
  }).catch(() => {
    sdPromises.delete(key);
    return fetchSd(platform, version, profiles, url);
  });
  sdPromises.set(key, promise);
  return promise;
}
