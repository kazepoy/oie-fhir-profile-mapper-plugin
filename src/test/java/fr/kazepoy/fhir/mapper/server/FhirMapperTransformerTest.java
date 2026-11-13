/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.mapper.server;

import static org.junit.Assert.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.BeforeClass;
import org.junit.Test;
import fr.kazepoy.fhir.mapper.util.FhirJson;

public class FhirMapperTransformerTest {
    private static final FhirMapperTester.Environment ENV = new FhirMapperTester.Environment() {
        public List<String> functions() { return List.of(); }
        public Map<String, String> configuration() { return Map.of(); }
        public String serialize(String type, String message) { return message; }
    };
    @BeforeClass public static void setup() { System.setProperty("fhir.engine.direct", "true"); }

    private static List<Map<String, Object>> laboratory() throws Exception {
        List<Map<String, Object>> steps = (List<Map<String, Object>>) FhirJson.parse(Files.readString(Path.of("doc/examples/mapping/laboratory.steps.json")));
        for (int i = 0; i < steps.size(); i++) {
            steps.get(i).put("sequenceNumber", String.valueOf(i + 3));
            steps.get(i).put("name", "step-" + i);
        }
        return steps;
    }
    private static Map<?, ?> run(List<?> steps) {
        return (Map<?, ?>) FhirJson.parse(FhirMapperTester.test(FhirJson.write(Map.of("steps", steps, "dataType", "JSON",
                "message", "{\"patient\":{\"id\":\"p1\"},\"observations\":[{\"code\":\"GLU\",\"value\":5.4}]}",
                "trace", Map.of("enabled", true, "captureValues", false))), ENV));
    }
    private static Map<?, ?> resource(Object encoded) { return (Map<?, ?>) FhirJson.parse(encoded.toString()); }

    @Test public void referencesResolveAndEveryStepReturnsItsProducedResources() throws Exception {
        Map<?, ?> result = run(laboratory());
        assertEquals(result.toString(), "[]", result.get("errors").toString());
        Map<?, ?> bundle = resource(result.get("output"));
        List<?> entries = (List<?>) bundle.get("entry");
        assertEquals(2, entries.size());
        String patientUrl = ((Map<?, ?>) entries.get(0)).get("fullUrl").toString();
        Map<?, ?> observation = (Map<?, ?>) ((Map<?, ?>) entries.get(1)).get("resource");
        assertEquals(patientUrl, ((Map<?, ?>) observation.get("subject")).get("reference"));
        List<?> produced = (List<?>) result.get("steps");
        assertEquals(3, produced.size());
        assertEquals("Observation", resource(((List<?>) ((Map<?, ?>) produced.get(2)).get("resources")).get(0)).get("resourceType"));
        Map<?, ?> trace = (Map<?, ?>) result.get("trace");
        assertEquals("transformer-preview", trace.get("scope"));
        assertTrue(((List<Map<?, ?>>) trace.get("events")).stream().anyMatch(e -> "5".equals(e.get("step")) && "value".equals(e.get("phase"))));
    }

    @Test public void twoNamedBundlesShareActualIdentitiesAndPublishVariables() throws Exception {
        List<Map<String, Object>> steps = laboratory();
        Map<String, Object> second = new LinkedHashMap<>(steps.get(0));
        second.put("bundleName", "archive"); second.put("variable", "archiveJson"); second.put("sequenceNumber", "4");
        steps.add(1, second);
        for (int i = 2; i < steps.size(); i++) steps.get(i).put("bundleTargets", "[{\"name\":\"laboratory\"},{\"name\":\"archive\"}]");
        Map<?, ?> result = run(steps);
        assertEquals(result.toString(), "[]", result.get("errors").toString());
        assertEquals(FhirJson.write(resource(result.get("output")).get("entry")), FhirJson.write(resource(((Map<?, ?>) result.get("variables")).get("archiveJson")).get("entry")));
    }

    @Test public void aRuleFailureKeepsTheCorrectStepAndPublishesNothing() throws Exception {
        List<Map<String, Object>> steps = laboratory();
        steps.get(2).put("mappings", steps.get(2).get("mappings").toString().replace("ob.value", "ob.missing.value"));
        Map<?, ?> result = run(steps);
        Map<?, ?> error = (Map<?, ?>) ((List<?>) result.get("errors")).get(0);
        assertEquals("5", ((Map<?, ?>) error.get("step")).get("sequenceNumber"));
        assertEquals("Observation.valueQuantity.value", error.get("key"));
        assertEquals(FhirJson.NULL, result.get("output"));
        assertTrue(((Map<?, ?>) result.get("variables")).isEmpty());
    }

    @Test public void unresolvedReferencesFailAtFinalizationInsteadOfReceivingStandIns() throws Exception {
        List<Map<String, Object>> steps = laboratory();
        steps.get(1).put("enabled", false);
        steps.get(2).put("mappings", steps.get(2).get("mappings").toString().replace("fhirRef('patient')", "fhirRef('patient', 0, true)"));
        Map<?, ?> result = run(steps);
        assertTrue(result.toString(), result.get("errors").toString().contains("unresolved reference"));
        assertTrue(result.toString(), result.get("errors").toString().contains("finalization"));
        assertEquals(FhirJson.NULL, result.get("output"));
    }

    @Test public void variableOnlyOutputDoesNotReturnTheInboundMessage() throws Exception {
        List<Map<String, Object>> steps = laboratory();
        steps.get(0).put("variable", "bundleJson");
        Map<?, ?> result = run(steps);
        assertEquals(result.toString(), "[]", result.get("errors").toString());
        assertEquals(FhirJson.NULL, result.get("output"));
        assertTrue(((Map<?, ?>) result.get("variables")).containsKey("bundleJson"));
    }

    @Test public void emptyAndUnsupportedStepListsAreExplicitErrors() {
        assertTrue(run(List.of()).get("errors").toString().contains("nonempty"));
        assertTrue(run(List.of(Map.of("__type", "JavaScript"))).get("errors").toString().contains("Only Profile Mapper"));
    }
    @Test public void finalValidationFailureDoesNotPublishEitherBundle() throws Exception {
        List<Map<String, Object>> steps = laboratory();
        Map<String, Object> archive = new LinkedHashMap<>(steps.get(0));
        archive.put("bundleName", "archive"); archive.put("variable", "archiveJson");
        steps.add(1, archive);
        for (int i = 2; i < steps.size(); i++) steps.get(i).put("bundleTargets", "[{\"name\":\"laboratory\"},{\"name\":\"archive\"}]");
        steps.get(3).put("mappings", steps.get(3).get("mappings").toString().replace("'final'", "'invalid-status'"));
        Map<?, ?> result = run(steps);
        assertTrue(result.toString(), result.get("errors").toString().contains("finalization"));
        assertEquals(FhirJson.NULL, result.get("output"));
        assertTrue(((Map<?, ?>) result.get("variables")).isEmpty());
    }

    @Test public void anOmittedResourceDoesNotClaimAnOutputOrValidation() {
        Map<?, ?> result = run(List.of(Map.of("action", "resource", "resourceType", "Patient", "validateOutput", true,
                "mappings", "[{\"key\":\"Patient\",\"path\":[],\"condition\":\"false\"}]")));
        assertEquals(result.toString(), "[]", result.get("errors").toString());
        assertEquals(FhirJson.NULL, result.get("output"));
        assertEquals(Boolean.FALSE, result.get("validationPerformed"));
    }

}
