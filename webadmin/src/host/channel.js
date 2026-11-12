// SPDX-License-Identifier: MPL-2.0
// Where a step sits in the channel being edited: its connector and transformer,
// the FHIR steps before it (named Bundles it may target), and the transformer's
// inbound template, which is the default sample message.
import { editingChannel, platform } from "./platform.js";

export const MAPPER_TYPE = "org.oie.fhir.mapper.FhirProfileMapperStep";
export const FML_TYPE = "org.oie.fhir.fml.FhirFmlTransformStep";
export const FHIR_STEP_TYPES = [MAPPER_TYPE, FML_TYPE];

const asBool = (v, def) => (v === undefined || v === null || v === "" ? def : v === true || v === "true");

/** The steps of a transformer as an array (Web Admin keeps them in XStream form). */
export function stepsOf(transformer) {
  const oie = platform().oie;
  return oie.elementsToArray(transformer?.elements);
}

/**
 * Locates this step in the channel being edited, including destination and
 * response transformers; null when it is not found exactly once.
 * @returns {{ channel: any, connector: any, transformer: any, steps: any[], index: number, response: boolean } | null}
 */
export function stepContext(element, type = element?.__type) {
  const channel = editingChannel();
  if (!channel) return null;
  const oie = platform().oie;
  const connectors = [channel.sourceConnector, ...(oie.destinationsOf(channel) || [])].filter(Boolean);
  const matches = [];
  for (const connector of connectors) {
    for (const transformer of [connector.transformer, connector.responseTransformer]) {
      const steps = stepsOf(transformer);
      const index = steps.findIndex(s => s.__type === type && String(s.sequenceNumber) === String(element.sequenceNumber)
        && s.name === element.name && (type !== MAPPER_TYPE || s.profileUrl === element.profileUrl));
      if (index >= 0) matches.push({ channel, connector, transformer, steps, index, response: transformer === connector.responseTransformer });
    }
  }
  return matches.length === 1 ? matches[0] : null;
}

/** Only Bundles declared before this step, in the same connector's transformer. */
export function bundleDeclarations(element) {
  const ctx = stepContext(element, MAPPER_TYPE);
  return ctx ? ctx.steps.slice(0, ctx.index).filter(s => s.__type === MAPPER_TYPE && s.action === "createBundle" && asBool(s.enabled, true)) : [];
}

/** Reference names declared by the other FHIR Profile Mapper steps of the transformer. */
export function referenceNames(element) {
  const ctx = stepContext(element, MAPPER_TYPE);
  if (!ctx) return [];
  return ctx.steps.filter((s, i) => i !== ctx.index && s.__type === MAPPER_TYPE && String(s.refName || "").trim())
    .map(s => ({ step: s.name, expression: String(s.refName).trim(), resourceType: s.resourceType }));
}

/** The enabled FHIR Profile Mapper steps of the transformer, in order (for a multi-step preview). */
export function fhirSteps(element) {
  const ctx = stepContext(element, element?.__type);
  return ctx ? ctx.steps.filter(s => s.__type === MAPPER_TYPE && asBool(s.enabled, true)) : [element];
}

/**
 * A destination tests its own inbound template, which may already contain cleaned
 * source data. The storage key separates channel, connector and response transformer.
 */
export function defaultSample(element, type = element?.__type) {
  const ctx = stepContext(element, type);
  const message = ctx?.transformer.inboundTemplate || "";
  const inbound = ctx?.transformer.inboundDataType || "HL7V2";
  const dataType = inbound === "FHIR" ? (message.trim().startsWith("{") ? "JSON" : "XML")
    : ["HL7V2", "XML", "JSON", "RAW", "DELIMITED"].includes(inbound) ? inbound : "RAW";
  const key = ctx ? `sample:${ctx.channel.id}:${ctx.connector.metaDataId}:${ctx.response ? "response" : "transformer"}` : "sample:unknown";
  return { key, sample: { message, dataType }, channelId: ctx?.channel.id ?? null, context: ctx };
}

/** The completion scope of the host's code editors for this step (code templates of the channel). */
export function completionScope(element) {
  const ctx = stepContext(element, element?.__type);
  if (!ctx) return undefined;
  const source = Number(ctx.connector.metaDataId) === 0;
  return { channelId: ctx.channel.id, context: ctx.response ? "DESTINATION_RESPONSE_TRANSFORMER" : source ? "SOURCE_FILTER_TRANSFORMER" : "DESTINATION_FILTER_TRANSFORMER" };
}

/** Names of channel map variables set by Mapper steps and $c()/channelMap.put in scripts of the transformer. */
export function channelVariables(element) {
  const ctx = stepContext(element, element?.__type);
  if (!ctx) return [];
  const names = new Set();
  const re = /(?:channelMap\.put|\$c|\$co|\$s|\$gc|\$g)\(\s*(['"])([^'"]+)\1/g;
  for (const step of ctx.steps) {
    if (asBool(step.enabled, true) === false) continue;
    if (typeof step.variable === "string" && step.variable.trim() && step.__type !== MAPPER_TYPE) names.add(step.variable.trim());
    if (step.__type === MAPPER_TYPE && String(step.variable || "").trim()) names.add(String(step.variable).trim());
    if (typeof step.script === "string") for (let m; (m = re.exec(step.script));) names.add(m[2]);
  }
  return [...names];
}
