/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.mapper.server;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import java.util.List;
import java.util.Map;
import org.junit.Test;
import fr.kazepoy.fhir.mapper.util.FhirJson;

public class FhirMapperTraceTest {
    private static final FhirMapperTester.Environment ENVIRONMENT = new FhirMapperTester.Environment() {
        public List<String> functions() { return List.of(); }
        public Map<String, String> configuration() { return Map.of(); }
        public String serialize(String type, String message) { return message; }
    };

    private static final String MAPPINGS = """
            [
              {"key":"Patient.name","each":"msg.names","variable":"n","path":[["name","#0"]]},
              {"key":"Patient.name","condition":"n.use === 'official'","path":[["name","#0"]]},
              {"key":"Patient.name.family","type":"string","expression":"n.family","path":[["name","#0"],["family"]]},
              {"key":"Patient.name.use","fixed":"official","when":1,"path":[["name","#0"],["use"]]},
              {"key":"Patient.gender","type":"code","expression":"msg.gender","path":[["gender"]]},
              {"key":"Patient.birthDate","type":"date","expression":"'19850412'","path":[["birthDate"]]}
            ]
            """;
    private static final String MESSAGE = """
            {"names":[{"use":"official","family":"SECRET-SOURCE-VALUE"},{"use":"usual","family":"Other"},{"use":"official"}]}
            """;

    private Map<?, ?> run(String mappings, String message, boolean validation, Object trace) {
        Map<String, Object> step = Map.of("action", "resource", "resourceType", "Patient", "name", "Patient",
                "addMetaProfile", false, "validateOutput", validation, "mappings", mappings);
        return (Map<?, ?>) FhirJson.parse(FhirMapperTester.test(FhirJson.write(Map.of(
                "step", step, "dataType", "JSON", "message", message, "trace", trace)), ENVIRONMENT));
    }

    private static Map<?, ?> trace(Map<?, ?> result) { return (Map<?, ?>) result.get("trace"); }
    private static List<Map<?, ?>> events(Map<?, ?> result) { return (List<Map<?, ?>>) trace(result).get("events"); }
    private static boolean hasEvent(Map<?, ?> result, String phase, String status) {
        return events(result).stream().anyMatch(e -> phase.equals(e.get("phase")) && status.equals(e.get("status")));
    }
    private static void sameResult(Map<?, ?> a, Map<?, ?> b) {
        for (String field : List.of("output", "errors", "issues", "validationPerformed")) {
            assertEquals(field, FhirJson.write(a.get(field)), FhirJson.write(b.get(field)));
        }
    }

    @Test public void traceIsOptInAndExplainsConditionsOmissionsAndIterationIndicesWithoutValues() {
        Map<?, ?> off = run(MAPPINGS, MESSAGE, false, FhirJson.NULL);
        assertFalse(off.containsKey("trace"));
        Map<?, ?> on = run(MAPPINGS, MESSAGE, false, Map.of("enabled", true));
        sameResult(off, on);
        assertEquals("[]", on.get("errors").toString());
        assertEquals(Boolean.FALSE, trace(on).get("truncated"));
        assertEquals("step-preview", trace(on).get("scope"));
        assertTrue(trace(on).get("mappingHash").toString().matches("[a-f0-9]{64}"));
        assertFalse(FhirJson.write(trace(on)).contains("SECRET-SOURCE-VALUE"));
        assertTrue(hasEvent(on, "condition", "skipped"));
        assertTrue(hasEvent(on, "conversion", "absent"));
        assertTrue(hasEvent(on, "fixed", "applied"));
        assertTrue(hasEvent(on, "fixed", "skipped"));
        assertTrue(hasEvent(on, "validation", "skipped"));
        Map<?, ?> family = events(on).stream().filter(e -> "Patient.name.family".equals(e.get("key"))).findFirst().orElseThrow();
        assertEquals("[{ruleIndex=0, index=0}]", family.get("iterations").toString());
        for (Map<?, ?> event : events(on)) {
            assertFalse(event.containsKey("value"));
            assertTrue(Long.parseLong(event.get("durationNanos").toString()) >= 0);
        }
        Map<?, ?> again = run(MAPPINGS, MESSAGE, false, Map.of("enabled", true));
        assertEquals(trace(on).get("mappingHash"), trace(again).get("mappingHash"));
        assertNotEquals(trace(on).get("id"), trace(again).get("id"));
        assertEquals(events(on).size(), events(again).size());
    }

    @Test public void capturedScalarsAreBoundedAndDoNotTruncateTheOutput() {
        String family = "S".repeat(1000);
        Map<?, ?> result = run(MAPPINGS, FhirJson.write(Map.of("names", List.of(Map.of("use", "official", "family", family)))),
                false, Map.of("enabled", true, "captureValues", true));
        Map<?, ?> event = events(result).stream().filter(e -> "Patient.name.family".equals(e.get("key"))).findFirst().orElseThrow();
        Map<?, ?> value = (Map<?, ?>) event.get("value");
        assertEquals(256, value.get("text").toString().length());
        assertEquals(Boolean.TRUE, value.get("truncated"));
        assertTrue(result.get("output").toString().contains(family));
    }

    @Test public void captureDoesNotInspectGettersOfComplexValues() {
        String mappings = """
                [{"key":"Patient.name","type":"HumanName","expression":"(function(){var o={};Object.defineProperty(o,'family',{enumerable:true,get:function(){channelMap.put('reads',Number(channelMap.get('reads')||0)+1);return 'Durand';}});return o;})()","path":[["name","#0"]]},
                 {"key":"Patient.multipleBirthInteger","type":"integer","expression":"Number(channelMap.get('reads')||0)","path":[["multipleBirthInteger"]]}]
                """;
        sameResult(run(mappings, "{}", false, FhirJson.NULL),
                run(mappings, "{}", false, Map.of("enabled", true, "captureValues", true)));
    }

    @Test public void capturedDecimalsRetainTheirExactText() {
        String mappings = """
                [{"key":"Patient.extension.valueDecimal","type":"decimal","expression":"'6.80'","path":[["extension","#0"],["valueDecimal"]]}]
                """;
        Map<?, ?> result = run(mappings, "{}", false, Map.of("enabled", true, "captureValues", true));
        Map<?, ?> conversion = events(result).stream().filter(e -> "conversion".equals(e.get("phase"))).findFirst().orElseThrow();
        Map<?, ?> value = (Map<?, ?>) conversion.get("value");
        assertEquals("decimal", value.get("type"));
        assertEquals("6.80", value.get("text"));
        assertTrue(result.get("output").toString().contains("\"valueDecimal\":6.80"));
    }

    @Test public void nestedIterationsKeepBothRuleIndices() {
        String mappings = """
                [{"key":"Patient.name","each":"msg.groups","variable":"n","path":[["name","#0"]]},
                 {"key":"Patient.name.given","each":"n","variable":"g","path":[["name","#0"],["given","#0"]]},
                 {"key":"Patient.name.given","type":"string","expression":"g","path":[["name","#0"],["given","#0"]]}]
                """;
        Map<?, ?> result = run(mappings, "{\"groups\":[[\"A\",\"B\"],[\"C\"]]}", false, Map.of("enabled", true));
        List<Map<?, ?>> values = events(result).stream().filter(e -> "value".equals(e.get("phase"))).toList();
        assertEquals(3, values.size());
        assertEquals("[{ruleIndex=0, index=1}, {ruleIndex=1, index=0}]", values.get(2).get("iterations").toString());
    }

    @Test public void errorsRetainTheirDiagnosticsAndPartialTraceWithoutCapturingTheMessage() {
        String mappings = """
                [{"key":"Patient.gender","type":"code","expression":"msg.absent.value","path":[["gender"]]}]
                """;
        Map<?, ?> off = run(mappings, "{}", false, FhirJson.NULL);
        Map<?, ?> on = run(mappings, "{}", false, Map.of("enabled", true));
        sameResult(off, on);
        assertTrue(hasEvent(on, "value", "error"));
        Map<?, ?> error = events(on).stream().filter(e -> "value".equals(e.get("phase"))).findFirst().orElseThrow();
        assertEquals("TypeError", error.get("errorType"));
        assertFalse(error.containsKey("message"));
        assertTrue(hasEvent(on, "execution", "error"));
    }

    @Test public void traceReusesTheErrorTypeWithoutReadingItsGetterAgain() {
        String mappings = """
                [{"key":"Patient.gender","type":"code","expression":"(function(){var n=0;throw Object.defineProperty({message:'failure'},'name',{get:function(){return 'Custom'+(++n);}});})()","path":[["gender"]]}]
                """;
        Map<?, ?> off = run(mappings, "{}", false, FhirJson.NULL);
        Map<?, ?> on = run(mappings, "{}", false, Map.of("enabled", true));
        sameResult(off, on);
        assertEquals("Custom2", ((Map<?, ?>) ((List<?>) on.get("errors")).get(0)).get("errorType"));
        assertEquals("Custom2", events(on).stream().filter(e -> "value".equals(e.get("phase"))).findFirst().orElseThrow().get("errorType"));
    }

    @Test public void validationAndTranslationPhasesAreObservable() {
        Map<?, ?> valid = run("[]", "{}", true, Map.of("enabled", true));
        assertTrue(hasEvent(valid, "validation", "passed"));
        String invalidDate = """
                [{"key":"Patient.birthDate","type":"date","expression":"'1980-13-45'","path":[["birthDate"]]}]
                """;
        Map<?, ?> invalid = run(invalidDate, "{}", true, Map.of("enabled", true));
        sameResult(run(invalidDate, "{}", true, FhirJson.NULL), invalid);
        assertTrue(hasEvent(invalid, "validation", "failed"));
        String translation = """
                [{"key":"Patient.gender","type":"code","expression":"'X'","path":[["gender"]],"translate":{"conceptMap":"urn:missing-map","unmapped":"error"}}]
                """;
        assertTrue(hasEvent(run(translation, "{}", false, Map.of("enabled", true)), "translation", "error"));
    }

    @Test public void eventAndCharacterLimitsDoNotStopTheMapping() {
        Map<?, ?> bounded = run(MAPPINGS, MESSAGE, false, Map.of("enabled", true, "maxEvents", 3));
        sameResult(run(MAPPINGS, MESSAGE, false, FhirJson.NULL), bounded);
        assertEquals(3, events(bounded).size());
        assertEquals(Boolean.TRUE, trace(bounded).get("truncated"));
        FhirMapperTrace collector = FhirMapperTrace.from(Map.of("enabled", true), Map.of());
        collector.record(FhirJson.write(Map.of("expression", "x".repeat(262_145))));
        assertEquals(Boolean.TRUE, collector.result().get("truncated"));
        assertEquals("[]", collector.result().get("events").toString());
    }

    @Test public void malformedTraceOptionsAreExplicitConfigurationErrors() {
        for (Object options : List.of(true, Map.of("enabled", "true"),
                Map.of("enabled", true, "maxEvents", 0), Map.of("enabled", true, "maxEvents", 1001),
                Map.of("enabled", true, "maxEvents", "5"), Map.of("enabled", true, "captureValues", "true"))) {
            Map<?, ?> result = run("[]", "{}", false, options);
            Map<?, ?> error = (Map<?, ?>) ((List<?>) result.get("errors")).get(0);
            assertEquals("configuration", error.get("phase"));
        }
        assertFalse(run("[]", "{}", false, Map.of("enabled", false)).containsKey("trace"));
    }
}
