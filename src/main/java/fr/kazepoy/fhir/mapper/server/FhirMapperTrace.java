/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.mapper.server;

import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import fr.kazepoy.fhir.mapper.util.FhirJson;

/**
 * A bounded trace collector: one step preview (injected into its Rhino scope when requested), or
 * one processed message of a connector transformer, shared by its traced steps.
 */
public final class FhirMapperTrace {
    private static final int MAX_CHARACTERS = 262_144;
    /** Events kept per connector message: the steps of a transformer share them. */
    static final int MESSAGE_MAX_EVENTS = 1000;
    private final int maxEvents;
    private final boolean captureValues;
    private final Map<String, Object> result = new LinkedHashMap<>();
    private final List<Object> events = new ArrayList<>();
    private final List<Object> steps = new ArrayList<>();
    private int characters;
    private boolean truncated;
    private Object previewSequence;

    private FhirMapperTrace(Map<?, ?> options, Object step) {
        Object limit = options.get("maxEvents");
        try { maxEvents = limit == null ? 200 : new BigDecimal(FhirJson.write(limit)).intValueExact(); }
        catch (ArithmeticException | NumberFormatException e) { throw new IllegalArgumentException("trace.maxEvents must be an integer from 1 to 1000."); }
        if (maxEvents < 1 || maxEvents > 1000) throw new IllegalArgumentException("trace.maxEvents must be an integer from 1 to 1000.");
        Object capture = options.get("captureValues");
        if (capture != null && !(capture instanceof Boolean)) throw new IllegalArgumentException("trace.captureValues must be a boolean.");
        captureValues = Boolean.TRUE.equals(capture);
        result.put("formatVersion", 1);
        result.put("id", UUID.randomUUID().toString());
        result.put("scope", "step-preview");
        Map<String, Object> stepInfo = new LinkedHashMap<>();
        if (step instanceof Map) {
            Map<?, ?> fields = (Map<?, ?>) step;
            for (String key : List.of("name", "sequenceNumber", "resourceType", "action")) {
                Object value = fields.get(key);
                stepInfo.put(key, value == null ? FhirJson.NULL : value);
            }
        }
        result.put("step", stepInfo);
        try {
            result.put("mappingHash", HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(FhirJson.write(step).getBytes(StandardCharsets.UTF_8))));
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
        result.put("captureValues", captureValues);
        result.put("maxEvents", maxEvents);
        result.put("maxCharacters", MAX_CHARACTERS);
        result.put("events", events);
    }

    /** A processed message's trace: context is {channel, connector, messageId, serverId} as JSON. */
    private FhirMapperTrace(Map<?, ?> context) {
        maxEvents = MESSAGE_MAX_EVENTS;
        captureValues = false; // decided per traced step by the runtime
        result.put("formatVersion", 1);
        result.put("id", UUID.randomUUID().toString());
        result.put("scope", "channel-message");
        for (String key : List.of("channel", "connector", "messageId", "serverId")) {
            Object value = context.get(key);
            result.put(key, value == null ? FhirJson.NULL : value);
        }
        result.put("steps", steps);
        result.put("maxEvents", maxEvents);
        result.put("maxCharacters", MAX_CHARACTERS);
        result.put("events", events);
    }

    /** Called by the runtime of the first traced step of a connector message. */
    public static FhirMapperTrace forMessage(String contextJson) {
        Object context = FhirJson.parse(contextJson);
        if (!(context instanceof Map)) throw new IllegalArgumentException("The trace context is not a JSON object.");
        return new FhirMapperTrace((Map<?, ?>) context);
    }

    /** Registers a traced step: {sequenceNumber, name, action, resourceType, bundleName, scriptHash, captureValues}. */
    public void step(String json) {
        steps.add(FhirJson.parse(json));
    }

    /** The trace as written to the connector map. */
    public String json() {
        return FhirJson.write(result());
    }

    static FhirMapperTrace from(Object options, Object step) {
        if (options == null || options == FhirJson.NULL) return null;
        if (!(options instanceof Map)) throw new IllegalArgumentException("trace must be an object.");
        Map<?, ?> map = (Map<?, ?>) options;
        Object enabled = map.get("enabled");
        if (enabled != null && !(enabled instanceof Boolean)) throw new IllegalArgumentException("trace.enabled must be a boolean.");
        return Boolean.TRUE.equals(enabled) ? new FhirMapperTrace(map, step) : null;
    }

    public boolean captureValues() { return captureValues; }

    void transformerPreview() {
        result.put("scope", "transformer-preview");
        result.remove("step");
        result.put("steps", steps);
    }

    void previewStep(String json) {
        Map<?, ?> info = (Map<?, ?>) FhirJson.parse(json);
        steps.add(info);
        previewSequence = info.get("sequenceNumber");
    }

    public boolean isRecording() {
        if (events.size() >= maxEvents) truncated = true;
        return !truncated;
    }

    /** Called by the runtime with JSON containing only metadata and bounded scalar summaries. */
    public void record(String json) {
        if (!isRecording()) return;
        if (characters + json.length() > MAX_CHARACTERS) { truncated = true; return; }
        Map<String, Object> event = (Map<String, Object>) FhirJson.parse(json);
        if (previewSequence != null) event.put("step", previewSequence);
        events.add(event);
        characters += json.length();
    }

    void phase(String phase, String status, long started, String reason) {
        record(FhirJson.write(Map.of("phase", phase, "status", status,
                "durationNanos", Math.max(0, System.nanoTime() - started), "reason", reason)));
    }

    Map<String, Object> result() {
        result.put("truncated", truncated);
        return result;
    }
}
