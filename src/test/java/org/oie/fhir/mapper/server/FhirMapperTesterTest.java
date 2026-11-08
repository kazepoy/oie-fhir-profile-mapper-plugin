/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper.server;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.junit.BeforeClass;
import org.junit.Test;

import org.oie.fhir.mapper.util.FhirJson;

/** The script and test runs of the FHIR Profile Mapper editor. */
public class FhirMapperTesterTest {

    private static final FhirMapperTester.Environment ENVIRONMENT = new FhirMapperTester.Environment() {
        @Override
        public List<String> functions() {
            return Collections.singletonList("function sexe(code) { return code == 'F' ? 'female' : 'male'; }");
        }

        @Override
        public Map<String, String> configuration() {
            return Collections.singletonMap("demo.system", "urn:ipp");
        }

        @Override
        public String serialize(String dataType, String message) {
            return message;
        }
    };

    @BeforeClass
    public static void directEngine() {
        System.setProperty("fhir.engine.direct", "true");
    }

    private static String step(String mappings) {
        return "{\"action\":\"resource\",\"name\":\"Patient\",\"resourceType\":\"Patient\",\"profileUrl\":\"Patient\",\"addMetaProfile\":false,\"mappings\":" + FhirJson.write(mappings) + "}";
    }

    private static String value(String key, String type, String expression, String path) {
        return "{\"key\":\"" + key + "\",\"type\":\"" + type + "\",\"expression\":" + FhirJson.write(expression) + ",\"path\":" + path + "}";
    }

    private static Map<?, ?> diagnostic(String mappings) {
        Map<String, Object> config = (Map<String, Object>) FhirJson.parse(step(mappings));
        config.put("validateOutput", false);
        config.put("sequenceNumber", "7");
        config.put("bundleTargets", "[{\"name\":\"preview\"}]");
        Map<?, ?> result = (Map<?, ?>) FhirJson.parse(FhirMapperTester.test(FhirJson.write(Map.of(
                "step", config, "dataType", "JSON", "message", "{}")), ENVIRONMENT));
        List<?> errors = (List<?>) result.get("errors");
        assertEquals(result.toString(), 1, errors.size());
        return (Map<?, ?>) errors.get(0);
    }

    @Test public void aRuntimeDiagnosticPreservesSlicesAndTheOriginalExpression() {
        String expression = "missingFunction()";
        Map<?, ?> error = diagnostic("[" + value("Patient.identifier:ipp.value", "string", expression,
                "[[\"identifier\",\"ipp#0\"],[\"value\"]]") + "]");
        assertEquals("Patient.identifier:ipp.value", error.get("key"));
        assertEquals("value", error.get("phase"));
        assertEquals("0", error.get("ruleIndex").toString());
        assertEquals(expression, error.get("expression"));
        assertEquals("[[identifier, ipp#0], [value]]", error.get("path").toString());
        assertEquals("7", ((Map<?, ?>) error.get("step")).get("sequenceNumber"));
        assertEquals("Patient", ((Map<?, ?>) error.get("step")).get("name"));
    }

    @Test public void conversionAndTranslationHaveTheirOwnPhases() {
        Map<?, ?> conversion = diagnostic("[" + value("Patient.active", "boolean", "'not-a-boolean'", "[[\"active\"]]") + "]");
        assertEquals("conversion", conversion.get("phase"));
        assertEquals("'not-a-boolean'", conversion.get("expression"));
        Map<?, ?> translation = diagnostic("[{\"key\":\"Patient.gender\",\"type\":\"code\",\"expression\":\"'X'\",\"path\":[[\"gender\"]],"
                + "\"translate\":{\"conceptMap\":\"urn:missing-map\",\"unmapped\":\"error\"}}]");
        assertEquals("translation", translation.get("phase"));
        assertEquals("Patient.gender", translation.get("key"));
    }

    @Test public void conditionsAndIterationsSharingAKeyAreDistinguished() {
        String iteration = "{\"key\":\"Patient.name\",\"each\":\"[{}]\",\"variable\":\"n\",\"path\":[[\"name\",\"#0\"]]}";
        String condition = "{\"key\":\"Patient.name\",\"condition\":\"missingCondition()\",\"path\":[[\"name\",\"#0\"]]}";
        String value = value("Patient.name.family", "string", "missingValue()", "[[\"name\",\"#0\"],[\"family\"]]");
        Map<?, ?> error = diagnostic("[" + iteration + "," + condition + "," + value + "]");
        assertEquals("condition", error.get("phase"));
        assertEquals("1", error.get("ruleIndex").toString());
        assertEquals("missingCondition()", error.get("expression"));
        error = diagnostic("[" + iteration + "," + condition.replace("missingCondition()", "true") + "," + value + "]");
        assertEquals("value", error.get("phase"));
        assertEquals("2", error.get("ruleIndex").toString());
        error = diagnostic("[" + iteration.replace("[{}]", "missingList()") + "," + value + "]");
        assertEquals("iteration", error.get("phase"));
        assertEquals("0", error.get("ruleIndex").toString());
    }

    @Test public void syntaxDiagnosticsUseTheExactRuleRatherThanTheLastElementComment() {
        String mappings = "[{\"key\":\"Patient.name\",\"each\":\"[{}]\",\"variable\":\"n\",\"path\":[[\"name\",\"#0\"]]},"
                + "{\"key\":\"Patient.name\",\"condition\":\"broken(\",\"path\":[[\"name\",\"#0\"]]},"
                + value("Patient.name.family", "string", "'Durand'", "[[\"name\",\"#0\"],[\"family\"]]") + "]";
        Map<?, ?> result = (Map<?, ?>) FhirJson.parse(FhirMapperTester.script(step(mappings)));
        Map<?, ?> error = (Map<?, ?>) ((List<?>) result.get("errors")).get(0);
        assertEquals("syntax", error.get("phase"));
        assertEquals("condition", error.get("operation"));
        assertEquals("1", error.get("ruleIndex").toString());
        assertEquals("broken(", error.get("expression"));
    }

    @Test public void rootRulesHaveDiagnosticsAndTypeErrorsKeepTheirExistingBehavior() {
        Map<?, ?> error = diagnostic("[{\"key\":\"Patient\",\"each\":\"missingList()\",\"variable\":\"p\",\"path\":[]}]");
        assertEquals("iteration", error.get("phase"));
        assertEquals("[]", error.get("path").toString());
        error = diagnostic("[{\"key\":\"Patient\",\"condition\":\"missingCondition()\",\"path\":[]}]");
        assertEquals("condition", error.get("phase"));
        Map<String, Object> config = (Map<String, Object>) FhirJson.parse(step("[" + value("Patient.gender", "code", "msg.absent.value", "[[\"gender\"]]") + "]"));
        config.put("validateOutput", false);
        Map<?, ?> result = (Map<?, ?>) FhirJson.parse(FhirMapperTester.test(FhirJson.write(Map.of(
                "step", config, "dataType", "JSON", "message", "{}")), ENVIRONMENT));
        assertEquals("[]", result.get("errors").toString());
    }

    @Test public void errorsOutsideARuleAreNotAttributedToThePreviousOne() {
        Map<String, Object> config = (Map<String, Object>) FhirJson.parse(step("[" + value("Patient.gender", "code", "'female'", "[[\"gender\"]]") + "]"));
        config.put("terminologyAuthorization", "missingAuthorization()");
        Map<?, ?> result = (Map<?, ?>) FhirJson.parse(FhirMapperTester.test(FhirJson.write(Map.of(
                "step", config, "dataType", "JSON", "message", "{}")), ENVIRONMENT));
        Map<?, ?> error = (Map<?, ?>) ((List<?>) result.get("errors")).get(0);
        assertEquals("execution", error.get("phase"));
        assertEquals(FhirJson.NULL, error.get("key"));
        assertEquals(FhirJson.NULL, error.get("ruleIndex"));
    }

    @Test
    public void aSyntaxErrorNamesItsElement() {
        Map<?, ?> out = (Map<?, ?>) FhirJson.parse(FhirMapperTester.script(step("[" + value("Patient.gender", "code", "'male'", "[[\"gender\"]]") + ","
                + value("Patient.birthDate", "date", "msg['PID'][", "[[\"birthDate\"]]") + "]")));
        assertTrue(String.valueOf(out.get("script")), String.valueOf(out.get("script")).contains("__fhir.set(__r, [[\"gender\"]]"));
        List<?> errors = (List<?>) out.get("errors");
        assertEquals(errors.toString(), 1, errors.size());
        assertEquals("Patient.birthDate", ((Map<?, ?>) errors.get(0)).get("key"));
    }

    @Test
    public void aRunMakesTheResourceAndValidatesIt() {
        String request = "{\"dataType\":\"XML\",\"message\":" + FhirJson.write("<HL7Message><PID><PID.3><PID.3.1>42</PID.3.1></PID.3><PID.8><PID.8.1>F</PID.8.1></PID.8></PID></HL7Message>")
                + ",\"step\":" + step("[" + value("Patient.gender", "code", "sexe(msg['PID']['PID.8']['PID.8.1'].toString())", "[[\"gender\"]]") + ","
                        + value("Patient.identifier.system", "uri", "$cfg('demo.system')", "[[\"identifier\",\"#0\"],[\"system\"]]") + ","
                        + value("Patient.identifier.value", "string", "msg['PID']['PID.3']['PID.3.1'].toString()", "[[\"identifier\",\"#0\"],[\"value\"]]") + ","
                        + value("Patient.birthDate", "date", "'1980-13-45'", "[[\"birthDate\"]]") + "]")
                + "}";
        Map<?, ?> out = (Map<?, ?>) FhirJson.parse(FhirMapperTester.test(request, ENVIRONMENT));
        assertEquals(out.toString(), "[]", out.get("errors").toString());
        String output = String.valueOf(out.get("output"));
        assertTrue(output, output.contains("\"gender\":\"female\""));
        assertTrue(output, output.contains("\"system\":\"urn:ipp\",\"value\":\"42\""));
        // the invalid date is reported by the validation
        assertTrue(out.get("issues").toString(), out.get("issues").toString().contains("1980-13-45"));
    }

    @Test
    public void aRuntimeErrorAndAnEndlessLoopAreReported() {
        String error = FhirMapperTester.test("{\"dataType\":\"XML\",\"message\":\"<HL7Message><PID/></HL7Message>\",\"step\":" + step("[" + value("Patient.gender", "code", "nope()", "[[\"gender\"]]") + "]") + "}",
                ENVIRONMENT);
        assertTrue(error, error.contains("\"key\": \"Patient.gender\""));
        assertTrue(error, error.contains("nope"));
        long start = System.nanoTime();
        String loop = FhirMapperTester.test("{\"dataType\":\"XML\",\"message\":\"<HL7Message><PID/></HL7Message>\",\"step\":" + step("[" + value("Patient.gender", "code", "(function () { while (true) {} })()", "[[\"gender\"]]") + "]") + "}",
                ENVIRONMENT);
        assertTrue(loop, loop.contains("was stopped"));
        assertTrue((System.nanoTime() - start) / 1_000_000 < FhirMapperTester.TIME_LIMIT_MILLIS + 5000);
    }

    @Test
    public void validationCanBeDisabledWithoutHidingExpressionErrors() {
        Map<String, Object> config = (Map<String, Object>) FhirJson.parse(step("[" + value("Patient.birthDate", "date", "'1980-13-45'", "[[\"birthDate\"]]") + "]"));
        config.put("validateOutput", false);
        String request = "{\"dataType\":\"XML\",\"message\":\"<row/>\",\"step\":" + FhirJson.write(config) + "}";
        Map<?, ?> out = (Map<?, ?>) FhirJson.parse(FhirMapperTester.test(request, ENVIRONMENT));
        assertEquals(Boolean.FALSE, out.get("validationPerformed"));
        assertEquals("[]", out.get("errors").toString());
        assertEquals("[]", out.get("issues").toString());
        assertTrue(out.get("output").toString().contains("1980-13-45"));
        config.put("mappings", "[" + value("Patient.gender", "code", "nope()", "[[\"gender\"]]") + "]");
        request = "{\"dataType\":\"XML\",\"message\":\"<row/>\",\"step\":" + FhirJson.write(config) + "}";
        out = (Map<?, ?>) FhirJson.parse(FhirMapperTester.test(request, ENVIRONMENT));
        assertTrue(out.get("errors").toString().contains("nope"));
    }

    @Test
    public void anIterationPreviewHasValidCollectionEntries() {
        String mappings = "[{\"key\":\"Patient\",\"each\":\"msg['row']\",\"variable\":\"patient\",\"path\":[]},"
                + value("Patient.active", "boolean", "true", "[[\"active\"]]") + "]";
        Map<String, Object> config = (Map<String, Object>) FhirJson.parse(step(mappings));
        config.put("bundleTargets", "[{\"name\":\"patients\"}]");
        String request = "{\"dataType\":\"XML\",\"message\":\"<rows><row/><row/></rows>\",\"step\":" + FhirJson.write(config) + "}";
        Map<?, ?> result = (Map<?, ?>) FhirJson.parse(FhirMapperTester.test(request, ENVIRONMENT));
        assertEquals("[]", result.get("errors").toString());
        Map<?, ?> bundle = (Map<?, ?>) FhirJson.parse(result.get("output").toString());
        List<?> entries = (List<?>) bundle.get("entry");
        assertEquals(2, entries.size());
        String first = String.valueOf(((Map<?, ?>) entries.get(0)).get("fullUrl"));
        String second = String.valueOf(((Map<?, ?>) entries.get(1)).get("fullUrl"));
        assertTrue(first, first.startsWith("urn:uuid:") && !first.equals(second));
        for (Object issue : (List<?>) result.get("issues")) {
            String severity = String.valueOf(((Map<?, ?>) issue).get("severity"));
            assertTrue(issue.toString(), !"error".equals(severity) && !"fatal".equals(severity));
        }
    }

    @Test
    public void aBundlePreviewUsesTheConfiguredType() {
        Map<String, Object> config = (Map<String, Object>) FhirJson.parse(step("[]"));
        config.put("action", "createBundle");
        config.put("resourceType", "Bundle");
        config.put("profileUrl", "http://hl7.org/fhir/StructureDefinition/Bundle");
        config.put("bundleName", "patients");
        config.put("bundleType", "collection");
        String request = "{\"dataType\":\"XML\",\"message\":\"<delimited/>\",\"step\":" + FhirJson.write(config) + "}";
        Map<?, ?> result = (Map<?, ?>) FhirJson.parse(FhirMapperTester.test(request, ENVIRONMENT));
        assertEquals("[]", result.get("errors").toString());
        Map<?, ?> bundle = (Map<?, ?>) FhirJson.parse(result.get("output").toString());
        assertEquals("collection", bundle.get("type"));
        assertTrue(bundle.toString(), !bundle.containsKey("entry"));
        for (Object issue : (List<?>) result.get("issues")) {
            String severity = String.valueOf(((Map<?, ?>) issue).get("severity"));
            assertTrue(issue.toString(), !"error".equals(severity) && !"fatal".equals(severity));
        }
    }

    @Test
    public void aNamedBundleEntryIsPreviewedWithoutRequiringTheOtherSteps() {
        Map<String, Object> config = (Map<String, Object>) FhirJson.parse(step("[" + value("Patient.active", "boolean", "true", "[[\"active\"]]") + "]"));
        config.put("action", "resource");
        config.put("bundleTargets", "[{\"name\":\"labo\"}]");
        String request = "{\"dataType\":\"XML\",\"message\":\"<HL7Message/>\",\"step\":" + FhirJson.write(config) + "}";
        Map<?, ?> result = (Map<?, ?>) FhirJson.parse(FhirMapperTester.test(request, ENVIRONMENT));
        assertEquals("[]", result.get("errors").toString());
        assertTrue(result.toString(), result.get("output").toString().contains("\"resourceType\":\"Patient\""));
    }
}
