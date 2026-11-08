/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper.server;

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

import org.oie.fhir.mapper.util.FhirJson;

/** One preview's bounded collector. Injected into its Rhino scope only when requested. */
public final class FhirMapperTrace {
    private static final int MAX_CHARACTERS = 262_144;
    private final int maxEvents;
    private final boolean captureValues;
    private final Map<String, Object> result = new LinkedHashMap<>();
    private final List<Object> events = new ArrayList<>();
    private int characters;
    private boolean truncated;

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

    static FhirMapperTrace from(Object options, Object step) {
        if (options == null || options == FhirJson.NULL) return null;
        if (!(options instanceof Map)) throw new IllegalArgumentException("trace must be an object.");
        Map<?, ?> map = (Map<?, ?>) options;
        Object enabled = map.get("enabled");
        if (enabled != null && !(enabled instanceof Boolean)) throw new IllegalArgumentException("trace.enabled must be a boolean.");
        return Boolean.TRUE.equals(enabled) ? new FhirMapperTrace(map, step) : null;
    }

    public boolean captureValues() { return captureValues; }

    public boolean isRecording() {
        if (events.size() >= maxEvents) truncated = true;
        return !truncated;
    }

    /** Called by the runtime with JSON containing only metadata and bounded scalar summaries. */
    public void record(String json) {
        if (!isRecording()) return;
        if (characters + json.length() > MAX_CHARACTERS) { truncated = true; return; }
        events.add(FhirJson.parse(json));
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
