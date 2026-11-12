/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.fml.server;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.oie.fhir.fml.FhirFmlTransformStep;
import org.oie.fhir.fml.FmlFacade;
import org.oie.fhir.mapper.fhir.FhirValidation;
import org.oie.fhir.mapper.util.FhirJson;

/** The test of a FHIR FML Transform step on a sample message, as the editor runs it. */
public final class FmlTester {
    /** How the server turns a sample message into what a transformer sees (OIE's internal XML). */
    public interface Serializer {
        String serialize(String dataType, String message) throws Exception;
    }

    private FmlTester() {}

    /** The OIE model of a sample message: request {"message", "dataType", "fhirVersion", "profiles"}. */
    public static String source(String requestJson, Serializer serializer) throws Exception {
        Map<?, ?> request = object(requestJson, "The source request");
        String dataType = dataType(request.get("dataType"));
        String message = serializer.serialize(dataType, text(request.get("message")));
        return FmlFacade.source(message, format(dataType, message), Map.of(), Map.of(), text(request.get("fhirVersion")), text(request.get("profiles")));
    }

    /**
     * Runs a step on a sample message: request {"step", "message", "dataType"}, answer {"model",
     * "output", "validationPerformed", "issues", "errors": [{"phase", "message"}]}.
     */
    public static String test(String requestJson, Serializer serializer) {
        Map<String, Object> out = new LinkedHashMap<>();
        List<Object> errors = new ArrayList<>();
        List<Object> issues = new ArrayList<>();
        out.put("model", null);
        out.put("output", null);
        out.put("validationPerformed", false);
        String phase = "configuration";
        try {
            Map<?, ?> request = object(requestJson, "The test request");
            FhirFmlTransformStep step = FhirFmlTransformStep.fromJson(FhirJson.write(request.get("step")));
            if (step.mapReference().isBlank()) throw new IllegalArgumentException("Write the map or choose the map to run.");
            Map<String, String> variables = new LinkedHashMap<>();
            for (String name : step.contextVariableNames()) variables.put(name, "");
            phase = "input";
            String dataType = dataType(request.get("dataType"));
            if (text(request.get("message")).isBlank()) throw new IllegalArgumentException("Paste a sample message to test the step.");
            String message = serializer.serialize(dataType, text(request.get("message")));
            String format = format(dataType, message);
            Map<String, String> context = Map.of("channelName", "test", "connectorName", "test");
            out.put("model", FhirJson.parse(FmlFacade.source(message, format, context, variables, step.getFhirVersion(), step.getProfiles())));
            phase = "transform";
            String output = FmlFacade.transform(step.mapReference(), message, format, context, variables, step.getFhirVersion(), step.getProfiles());
            out.put("output", output);
            if (step.isValidateOutput()) {
                phase = "validation";
                FhirValidation result = FmlFacade.validate(output, step.getFhirVersion(), step.getProfiles());
                out.put("validationPerformed", true);
                issues.addAll(result.getIssues());
            }
        } catch (Exception e) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("phase", phase);
            error.put("message", e.getMessage() == null ? e.toString() : e.getMessage());
            errors.add(error);
        }
        out.put("issues", issues);
        out.put("errors", errors);
        return FhirJson.write(out);
    }

    /** Checks a map written in a step: request {"mapSource", "fhirVersion", "profiles"}. */
    public static String check(String requestJson) throws Exception {
        Map<?, ?> request = object(requestJson, "The check request");
        return FmlFacade.check(text(request.get("mapSource")), text(request.get("fhirVersion")), text(request.get("profiles")));
    }

    private static Map<?, ?> object(String json, String what) {
        Object parsed = FhirJson.parse(json);
        if (!(parsed instanceof Map)) throw new IllegalArgumentException(what + " is not a JSON object.");
        return (Map<?, ?>) parsed;
    }

    private static String dataType(Object value) {
        String type = text(value).isEmpty() ? "HL7V2" : text(value).toUpperCase();
        if (!List.of("HL7V2", "XML", "JSON", "RAW", "DELIMITED").contains(type)) throw new IllegalArgumentException("Unsupported data type " + type + ".");
        return type;
    }

    /** What the bridge reads: JSON, raw text, or the XML of every other data type. */
    static String format(String dataType, String message) {
        switch (dataType) {
            case "JSON":
                return "json";
            case "RAW":
                return "raw";
            default:
                return message.trim().startsWith("<") ? "xml" : "raw";
        }
    }

    private static String text(Object value) { return value == null ? "" : value.toString(); }
}
