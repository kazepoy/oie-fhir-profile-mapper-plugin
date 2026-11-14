/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.fml;

import static org.junit.Assert.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.junit.Test;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import fr.kazepoy.fhir.fml.server.FmlServicePlugin;
import fr.kazepoy.fhir.fml.server.FmlTester;
import fr.kazepoy.fhir.mapper.util.FhirJson;

import com.mirth.connect.model.Channel;
import com.mirth.connect.model.InvalidChannel;
import com.mirth.connect.model.converters.ObjectXMLSerializer;
import com.mirth.connect.util.ScriptBuilderException;

/** The step as OIE runs it: its script in Rhino with E4X, its test and its serialization. */
public class FhirFmlTransformStepTest {
    private static final String PATIENT_MAP = "http://example.org/fhir/StructureMap/OruPatient";

    private static String fixture(String name) { return Path.of("src/test/resources", name).toAbsolutePath().toString(); }

    private static String profiles() { return fixture("fml/maps") + ";" + fixture("conceptmaps/v2-sex-r4.json"); }

    private static FhirFmlTransformStep step() {
        FhirFmlTransformStep step = new FhirFmlTransformStep();
        step.setName("Patient");
        step.setProfiles(profiles());
        step.setMapUrl(PATIENT_MAP);
        return step;
    }

    /** Runs a script as a transformer would: msg is the E4X message, tmp absent. */
    private static Map<String, Object> run(String script, Map<String, Object> channelMap) throws Exception {
        String oru = Files.readString(Path.of(fixture("fml/messages/oru-r01-minimal.xml"))).replaceFirst("^<\\?xml[^>]*>", "");
        Context cx = Context.enter();
        try {
            cx.setLanguageVersion(Context.VERSION_DEFAULT);
            Scriptable scope = cx.initStandardObjects();
            scope.put("channelMap", scope, Context.javaToJS(channelMap, scope));
            scope.put("__oru", scope, oru);
            Object out = cx.evaluateString(scope, "var msg = new XML(__oru);\nfunction doTransform() {\n" + script
                    + "\n}\ndoTransform();\ntypeof msg === 'xml' ? null : String(msg);", "step", 1, null);
            Map<String, Object> result = new HashMap<>();
            result.put("msg", out == null ? null : Context.toString(out));
            return result;
        } finally {
            Context.exit();
        }
    }

    @Test
    public void runsTheMapOnTheE4xMessageAndPublishesTheResource() throws Exception {
        Map<String, Object> result = run(step().getScript(false), new HashMap<>());
        Map<?, ?> patient = (Map<?, ?>) FhirJson.parse((String) result.get("msg"));
        assertEquals("Patient", patient.get("resourceType"));
        assertEquals("female", patient.get("gender"));
    }

    @Test
    public void publishesToAChannelMapVariable() throws Exception {
        FhirFmlTransformStep step = step();
        step.setVariable("patient");
        Map<String, Object> channelMap = new HashMap<>();
        Map<String, Object> result = run(step.getScript(false), channelMap);
        assertNull(result.get("msg")); // msg stays the inbound E4X message
        assertTrue(channelMap.get("patient").toString().contains("\"family\":\"MARTIN\""));
    }

    @Test
    public void stopsTheMessageWhenTheMapIsUnknown() throws Exception {
        FhirFmlTransformStep step = step();
        step.setMapUrl("http://example.org/unknown");
        try {
            run(step.getScript(false), new HashMap<>());
            fail("Expected the step to fail");
        } catch (Exception e) {
            assertTrue(e.getMessage(), e.getMessage().contains("http://example.org/unknown"));
        }
    }

    @Test(expected = ScriptBuilderException.class)
    public void needsAMap() throws Exception {
        new FhirFmlTransformStep().getScript(false);
    }

    @Test
    public void testsAStepOnASampleMessage() throws Exception {
        String oru = Files.readString(Path.of(fixture("fml/messages/oru-r01-minimal.xml")));
        String request = FhirJson.write(Map.of("step", Map.of("mapUrl", PATIENT_MAP, "profiles", profiles(), "validateOutput", true),
                "message", oru, "dataType", "XML"));
        Map<?, ?> answer = (Map<?, ?>) FhirJson.parse(FmlTester.test(request, (type, message) -> message));
        assertEquals(List.of(), answer.get("errors"));
        assertEquals(true, answer.get("validationPerformed"));
        assertTrue(answer.get("output").toString().contains("\"birthDate\":\"1980-02-15\""));
        Map<?, ?> context = (Map<?, ?>) ((Map<?, ?>) answer.get("model")).get("context");
        assertEquals("HL7V2", context.get("dataType"));
    }

    @Test
    public void theDemoMapMakesAValidExampleLabPatient() throws Exception {
        String oru = Files.readString(Path.of(fixture("fml/messages/oru-r01-minimal.xml")));
        String demo = Path.of("demo", "fhir-volume").toAbsolutePath().toString();
        String request = FhirJson.write(Map.of("step", Map.of("mapUrl", "http://example.org/fhir/oru2fhir/StructureMap/OruR01ToPatient",
                "profiles", demo + "/ig;" + demo + "/fml", "validateOutput", true), "message", oru, "dataType", "XML"));
        Map<?, ?> answer = (Map<?, ?>) FhirJson.parse(FmlTester.test(request, (type, message) -> message));
        assertEquals(List.of(), answer.get("errors"));
        List<?> errors = ((List<?>) answer.get("issues")).stream().filter(i -> List.of("error", "fatal").contains(((Map<?, ?>) i).get("severity"))).toList();
        assertEquals(List.of(), errors);
        Map<?, ?> patient = (Map<?, ?>) FhirJson.parse(answer.get("output").toString());
        Map<?, ?> name = (Map<?, ?>) ((List<?>) patient.get("name")).get(0);
        assertEquals("official", name.get("use"));
        assertEquals(List.of("CLAIRE", "ANNE"), name.get("given"));
        assertEquals("female", patient.get("gender"));
        assertEquals("http://example.org/fhir/oru2fhir/sid/ipp", ((Map<?, ?>) ((List<?>) patient.get("identifier")).get(0)).get("system"));
    }

    @Test
    public void reportsTheFailingPhaseOfATest() {
        String request = FhirJson.write(Map.of("step", Map.of("mapUrl", "http://example.org/unknown", "profiles", profiles()),
                "message", "<HL7Message/>", "dataType", "XML"));
        Map<?, ?> answer = (Map<?, ?>) FhirJson.parse(FmlTester.test(request, (type, message) -> message));
        Map<?, ?> error = (Map<?, ?>) ((List<?>) answer.get("errors")).get(0);
        assertEquals("transform", error.get("phase"));
    }

    @Test
    public void theDemoSummaryProjectsAFhirPatientAndKeepsFalseValues() throws Exception {
        Path examples = Path.of("examples/json");
        String demo = Path.of("demo", "fhir-volume").toAbsolutePath().toString();
        Map<String, Object> step = Map.of("name", "Résumé Patient", "mapUrl",
                "http://example.org/fhir/oru2fhir/StructureMap/PatientSummary", "profiles", demo + "/ig;" + demo + "/fml",
                "sourceModel", "fhir", "fhirVersion", "R4", "validateOutput", true);
        String request = FhirJson.write(Map.of("step", step, "dataType", "JSON",
                "message", Files.readString(examples.resolve("patient-fhir-source.json"))));
        Map<?, ?> answer = (Map<?, ?>) FhirJson.parse(FmlTester.test(request, (type, message) -> message));
        assertEquals(List.of(), answer.get("errors"));
        assertEquals(true, answer.get("validationPerformed"));
        assertEquals(FhirJson.parse(Files.readString(examples.resolve("patient-fhir-source-expected.json"))),
                FhirJson.parse(answer.get("output").toString()));
        assertFalse(((List<?>) answer.get("issues")).stream()
                .anyMatch(i -> List.of("error", "fatal").contains(((Map<?, ?>) i).get("severity"))));
    }

    @Test
    public void pluginInitializationAllowsTheStepInAnOieChannel() throws Exception {
        ObjectXMLSerializer serializer = ObjectXMLSerializer.getInstance();
        if (serializer.getNormalizedVersion() == null) serializer.init("4.7.0");
        serializer.allowTypes(List.of(), List.of("com.mirth.connect.**"), List.of());
        new FmlServicePlugin().init(new Properties());
        String type = FhirFmlTransformStep.class.getName();
        String xml = "<channel version=\"4.7.0\"><id>fml</id><name>FML</name><revision>1</revision>"
                + "<sourceConnector version=\"4.7.0\"><metaDataId>0</metaDataId><transformer version=\"4.7.0\"><elements><" + type
                + " version=\"4.7.0\"><name>Patient</name><mapUrl>" + PATIENT_MAP + "</mapUrl>"
                + "<sourceModel>hl7v2-logical</sourceModel><sourceModelUrl>http://example.org/ORU</sourceModelUrl>"
                + "<validateOutput>false</validateOutput></" + type
                + "></elements></transformer></sourceConnector></channel>";
        Channel channel = serializer.deserialize(xml, Channel.class);
        assertFalse(channel instanceof InvalidChannel ? ((InvalidChannel) channel).getCause().toString() : "", channel instanceof InvalidChannel);
        Channel roundTrip = serializer.deserialize(serializer.serialize(channel), Channel.class);
        FhirFmlTransformStep step = (FhirFmlTransformStep) roundTrip.getSourceConnector().getTransformer().getElements().get(0);
        assertEquals(PATIENT_MAP, step.getMapUrl());
        assertEquals("hl7v2-logical", step.getSourceModel());
        assertEquals("http://example.org/ORU", step.getSourceModelUrl());
        assertFalse(step.isValidateOutput());
        String retiredType = "org." + "oie.fhir.fml.FhirFmlTransformStep";
        Channel oldNamespace = serializer.deserialize(xml.replace(type, retiredType), Channel.class);
        assertTrue(oldNamespace instanceof InvalidChannel);
        Channel legacy = serializer.deserialize(xml.replace("<validateOutput>false</validateOutput>", ""), Channel.class);
        assertTrue(((FhirFmlTransformStep) legacy.getSourceConnector().getTransformer().getElements().get(0)).isValidateOutput());
    }

    @Test
    public void legacyStepsKeepTheGenericSourceModelAndUnknownModesAreRejected() {
        assertEquals("oie-message", new FhirFmlTransformStep().getSourceModel());
        try {
            new FhirFmlTransformStep().setSourceModel("unknown");
            fail("Expected an unsupported source model error");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("unknown"));
        }
    }
}
