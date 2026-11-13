// SPDX-License-Identifier: MPL-2.0
import { MAPPER_TYPE } from "../fhir/step.js";
import { asBool } from "../fhir/expressions.js";
/** Locate this step in the channel being edited, including destination/response transformers. */
export function mapperContext(platform, element) {
  const channel = platform.store?.getState("editingChannel");
  if (!channel) return null;
  const connectors = [channel.sourceConnector, ...(platform.oie.destinationsOf(channel) || [])].filter(Boolean);
  const matches = [];
  for (const connector of connectors) {
    for (const transformer of [connector.transformer, connector.responseTransformer]) {
      const steps = platform.oie.elementsToArray(transformer?.elements);
      const index = steps.findIndex((s) => s.__type === MAPPER_TYPE && String(s.sequenceNumber) === String(element.sequenceNumber)
        && s.name === element.name && s.profileUrl === element.profileUrl);
      if (index >= 0) matches.push({ channel, connector, transformer, steps, index, response: transformer === connector.responseTransformer });
    }
  }
  return matches.length === 1 ? matches[0] : null;
}

/** Only Bundles declared before this step, in the same connector's transformer. */
export function mapperBundleDeclarations(platform, element) {
  const ctx = mapperContext(platform, element);
  return ctx ? ctx.steps.slice(0, ctx.index).filter((s) => s.__type === MAPPER_TYPE && s.action === "createBundle" && asBool(s.enabled, true)) : [];
}

/** A destination tests its own inbound template, which may already contain cleaned source data. */
export function mapperSample(platform, element) {
  const ctx = mapperContext(platform, element);
  const message = ctx?.transformer.inboundTemplate || "";
  const inbound = ctx?.transformer.inboundDataType || "HL7V2";
  const dataType = inbound === "FHIR" ? (message.trim().startsWith("{") ? "JSON" : "XML")
    : ["HL7V2", "XML", "JSON", "RAW"].includes(inbound) ? inbound : "RAW";
  const key = ctx ? `fhir-profile-mapper-sample:${ctx.channel.id}:${ctx.connector.metaDataId}:${ctx.response ? "response" : "transformer"}` : "fhir-profile-mapper-sample:unknown";
  return { key, sample: { message, dataType } };
}

/** Snapshot only enabled Profile Mapper steps; the open editor's draft wins. */
export function mapperPreviewSteps(platform, element) {
  const ctx = mapperContext(platform, element);
  if (!ctx) return null;
  return ctx.steps.map((step, index) => index === ctx.index ? element : step)
    .filter(step => step.__type === MAPPER_TYPE && asBool(step.enabled, true))
    .map(step => ({ ...step, samples: "[]" }));
}
