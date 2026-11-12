// SPDX-License-Identifier: MPL-2.0
// "FHIR mapping trace" on a message of the message browser: shows the traces the
// FHIR Profile Mapper steps left in the connector maps of that message.
import { platform, toast } from "./platform.js";
import { findTraces, traceText } from "../trace/message-trace.js";

export function registerTraceAction() {
  const p = platform();
  if (typeof p.registerMessageAction !== "function") return;
  p.registerMessageAction({
    id: "fhir-mapper-trace",
    label: "FHIR mapping trace",
    order: 50,
    onInvoke: async (message, ctx) => {
      let traces = findTraces(ctx?.connectorMessage || null);
      if (!traces.length) traces = findTraces(message);
      if (!traces.length && ctx?.channelId != null && message?.messageId != null) {
        // The list may hold the message without its maps: read it whole.
        try {
          traces = findTraces(await p.api.get(`/channels/${encodeURIComponent(ctx.channelId)}/messages/${encodeURIComponent(message.messageId)}`));
        } catch { /* reported below */ }
      }
      if (!traces.length) {
        toast("This message has no FHIR mapping trace. Enable “Trace processed messages” on a FHIR Profile Mapper step, redeploy the channel, and check that its message storage keeps the maps.", "info");
        return;
      }
      p.ui.detailModal({
        title: `FHIR mapping trace of message ${message?.messageId ?? ""}`,
        meta: traces.map(t => t.key).join(", "),
        sections: traces.flatMap(({ key, trace }) => [{ label: key, text: traceText(trace) }, { label: `${key} (JSON)`, text: JSON.stringify(trace, null, 2) }])
      });
    }
  });
}
