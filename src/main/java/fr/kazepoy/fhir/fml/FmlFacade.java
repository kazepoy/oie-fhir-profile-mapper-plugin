/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.fml;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import fr.kazepoy.fhir.fml.integration.FmlBridgeAdapter;
import fr.kazepoy.fhir.mapper.fhir.FhirFacade;
import fr.kazepoy.fhir.mapper.fhir.FhirValidation;

/**
 * Entry point of the FHIR FML Transform step, for its generated script and its servlet: runs a map
 * through the FML bridge, and validates the result with FHIR Data Type like the Profile Mapper.
 */
public final class FmlFacade {
    /** Prefix of a map reference that carries the FML text of the step, not a canonical URL. */
    public static final String INLINE = "inline:";

    private FmlFacade() {}

    /** The map a step runs: its own text when it has one, else the canonical URL it names. */
    public static String mapReference(String mapSource, String mapUrl) {
        return mapSource != null && !mapSource.isBlank() ? INLINE + mapSource : (mapUrl == null ? "" : mapUrl.trim());
    }

    private static String mapLabel(String reference) {
        return reference != null && reference.startsWith(INLINE) ? "the map written in the step" : "map " + reference;
    }

    /** Parses a map written in a step: {"url", "name", "groups", "errors": [{line, column, message}]}. */
    public static String check(String mapSource, String version, String profiles) throws Exception {
        return FmlBridgeAdapter.check(mapSource, version, profiles);
    }

    /** The maps of the profile locations: {"maps": [{url, name, title}], "errors": {file: message}}. */
    public static String listMaps(String version, String profiles) throws Exception {
        return FmlBridgeAdapter.listMaps(version, profiles);
    }

    /** The OIE logical model instance a map receives for this message, as JSON. */
    public static String source(String source, String format, Map<String, String> context, Map<String, String> variables,
            String version, String profiles) throws Exception {
        return source(source, format, context, variables, version, profiles, "oie-message", "");
    }

    public static String source(String source, String format, Map<String, String> context, Map<String, String> variables,
            String version, String profiles, String sourceModel, String sourceModelUrl) throws Exception {
        return FmlBridgeAdapter.source(source, format, context, variables, version, profiles, sourceModel, sourceModelUrl);
    }

    /** Runs the map on the message: the target resource as JSON, before validation. */
    public static String transform(String mapUrl, String source, String format, Map<String, String> context, Map<String, String> variables,
            String version, String profiles) throws Exception {
        return transform(mapUrl, source, format, context, variables, version, profiles, "oie-message", "");
    }

    public static String transform(String mapUrl, String source, String format, Map<String, String> context, Map<String, String> variables,
            String version, String profiles, String sourceModel, String sourceModelUrl) throws Exception {
        return FmlBridgeAdapter.transform(mapUrl, source, format, context, variables, version, profiles, sourceModel, sourceModelUrl);
    }

    /**
     * What the deployed step runs: the map, then, if asked, the validation of its result against
     * the profiles it declares (meta.profile) or its base definition. A failure stops the message.
     */
    public static String run(String stepName, String mapUrl, String source, String format, Map<String, String> context,
            Map<String, String> variables, String version, String profiles, boolean validate) throws Exception {
        return run(stepName, mapUrl, source, format, context, variables, version, profiles, validate, "oie-message", "");
    }

    public static String run(String stepName, String mapUrl, String source, String format, Map<String, String> context,
            Map<String, String> variables, String version, String profiles, boolean validate, String sourceModel, String sourceModelUrl) throws Exception {
        String label = "FHIR FML Transform" + (stepName == null || stepName.isBlank() ? "" : " \"" + stepName + "\"");
        String output;
        try {
            output = transform(mapUrl, source, format, context, variables, version, profiles, sourceModel, sourceModelUrl);
        } catch (Exception e) {
            throw new IllegalStateException(label + ", " + mapLabel(mapUrl) + ": " + message(e), e);
        }
        if (validate) {
            FhirValidation result = validate(output, version, profiles);
            if (!result.isValid()) throw new IllegalStateException(label + ", " + mapLabel(mapUrl) + ": " + result.summary());
        }
        return output;
    }

    public static FhirValidation validate(String json, String version, String profiles) throws Exception {
        return FhirFacade.validate(json, "", validationProfiles(profiles), version);
    }

    public static void clearCaches() throws Exception { FmlBridgeAdapter.clearCaches(); }

    /** The datatype validates against profiles and packages: FML files are not its business. */
    static String validationProfiles(String profiles) {
        List<String> kept = new ArrayList<>();
        for (String entry : (profiles == null ? "" : profiles).split(";")) {
            String path = entry.trim();
            String lower = path.toLowerCase();
            if (!path.isEmpty() && !lower.endsWith(".fml") && !lower.endsWith(".map")) kept.add(path);
        }
        return String.join(";", kept);
    }

    static String message(Throwable e) {
        String message = e.getMessage();
        return message == null || message.isBlank() ? e.getClass().getSimpleName() : message;
    }
}
