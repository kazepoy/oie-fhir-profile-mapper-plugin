/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper.fhir;

import org.oie.fhir.mapper.integration.FhirDataTypeAdapter;
import org.oie.fhir.mapper.integration.FhirTerminology;
import org.oie.fhir.mapper.util.FhirJson;

/** Mapper-facing contract. Only mapper results, JSON and JDK types are exposed. */
public final class FhirFacade {
    public static final Object NULL = FhirJson.NULL;
    public static final String FHIR_NS = FhirDataTypeAdapter.FHIR_NS;
    private FhirFacade() {}

    public static Object parse(String json) { return FhirJson.parse(json); }
    public static String write(Object value) { return FhirJson.write(value); }
    public static String jsonToXml(String json, boolean namespace) { return FhirDataTypeAdapter.jsonToXml(json, namespace); }
    public static String toJson(String xml, String version) throws Exception { return FhirDataTypeAdapter.toJson(xml, version); }
    public static String toXml(String json, String version) throws Exception { return FhirDataTypeAdapter.toXml(json, version); }
    public static String toXml(String json) throws Exception { return toXml(json, "R4"); }
    public static String lookup(String server, String profiles, String system, String code) throws Exception {
        return FhirTerminology.lookup(server, profiles, system, code, "R4", "");
    }
    public static boolean validateCode(String server, String profiles, String valueSet, String system, String code) throws Exception {
        return FhirTerminology.validateCode(server, profiles, valueSet, system, code, "R4", "");
    }
    public static FhirValidation validate(String json, String profile, String profiles, String version) throws Exception {
        return FhirDataTypeAdapter.validate(json, profile, profiles, version);
    }
    public static String listProfiles(String version, String profiles) throws Exception { return FhirDataTypeAdapter.listProfiles(version, profiles); }
    public static String structureDefinition(String url, String version, String profiles) throws Exception {
        return FhirDataTypeAdapter.structureDefinition(url, version, profiles);
    }
    /** Conformance resources of the locations; kind: a resource type, profile, extension, logical, or empty. */
    public static String catalog(String kind, String version, String profiles) throws Exception { return FhirDataTypeAdapter.catalog(kind, version, profiles); }
    /** A profile and the data types it uses, reduced to what a tree needs: {"root", "types", "errors"}. */
    public static String elements(String url, String version, String profiles) throws Exception { return FhirDataTypeAdapter.elements(url, version, profiles); }
    /** The codes of a ValueSet: {"valueSet", "total", "codes"}. */
    public static String expand(String valueSet, String filter, String version, String profiles) throws Exception {
        return FhirDataTypeAdapter.expand(valueSet, filter, version, profiles);
    }
    public static String listConceptMaps(String server, String profiles, String version) throws Exception {
        return FhirTerminology.listConceptMaps(server, profiles, version);
    }
    public static String translate(String server, String profiles, String conceptMap, String system, String code, String target, String version) throws Exception {
        return FhirTerminology.translate(server, profiles, conceptMap, system, code, target, version);
    }
    public static String translate(String server, String profiles, String conceptMap, String system, String code, String target, String version,
            String authorization, int cacheSeconds, int timeoutSeconds) throws Exception {
        return FhirTerminology.translate(server, profiles, conceptMap, system, code, target, version, authorization, cacheSeconds, timeoutSeconds);
    }
    public static void clearCaches() throws Exception {
        FhirTerminology.clearCache();
        FhirDataTypeAdapter.clearCaches();
    }
    public static void startValidatorRelease() { FhirDataTypeAdapter.startValidatorRelease(); }
    public static void stopValidatorRelease() { FhirDataTypeAdapter.stopValidatorRelease(); }
}
