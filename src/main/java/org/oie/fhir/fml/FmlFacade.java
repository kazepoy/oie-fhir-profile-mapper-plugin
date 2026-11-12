/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.fml;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.oie.fhir.fml.integration.FmlBridgeAdapter;
import org.oie.fhir.mapper.fhir.FhirFacade;
import org.oie.fhir.mapper.fhir.FhirValidation;

/**
 * Entry point of the FHIR FML Transform step, for its generated script and its servlet: runs a map
 * through the FML bridge, and validates the result with FHIR Data Type like the Profile Mapper.
 */
public final class FmlFacade {
    private FmlFacade() {}

    /** The maps of the profile locations: {"maps": [{url, name, title}], "errors": {file: message}}. */
    public static String listMaps(String version, String profiles) throws Exception {
        return FmlBridgeAdapter.listMaps(version, profiles);
    }

    /** The OIE logical model instance a map receives for this message, as JSON. */
    public static String source(String source, String format, Map<String, String> context, Map<String, String> variables,
            String version, String profiles) throws Exception {
        return FmlBridgeAdapter.source(source, format, context, variables, version, profiles);
    }

    /** Runs the map on the message: the target resource as JSON, before validation. */
    public static String transform(String mapUrl, String source, String format, Map<String, String> context, Map<String, String> variables,
            String version, String profiles) throws Exception {
        return FmlBridgeAdapter.transform(mapUrl, source, format, context, variables, version, profiles);
    }

    /**
     * What the deployed step runs: the map, then, if asked, the validation of its result against
     * the profiles it declares (meta.profile) or its base definition. A failure stops the message.
     */
    public static String run(String stepName, String mapUrl, String source, String format, Map<String, String> context,
            Map<String, String> variables, String version, String profiles, boolean validate) throws Exception {
        String label = "FHIR FML Transform" + (stepName == null || stepName.isBlank() ? "" : " \"" + stepName + "\"");
        String output;
        try {
            output = transform(mapUrl, source, format, context, variables, version, profiles);
        } catch (Exception e) {
            throw new IllegalStateException(label + ", map " + mapUrl + ": " + message(e), e);
        }
        if (validate) {
            FhirValidation result = validate(output, version, profiles);
            if (!result.isValid()) throw new IllegalStateException(label + ", map " + mapUrl + ": " + result.summary());
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
