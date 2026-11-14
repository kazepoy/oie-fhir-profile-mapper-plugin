/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.fml.bridge;

import static org.junit.Assert.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mirth.connect.plugins.datatypes.fhir.FhirEngineLoader;
import com.mirth.connect.plugins.datatypes.fhir.FhirSerializationProperties;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

/** The FML engine of the HL7 core, through HAPI's worker context, on the generic OIE model. */
public class FmlBridgeTest {
    private static final String PATIENT_MAP = "http://example.org/fhir/StructureMap/OruPatient";
    private static final String BUNDLE_MAP = "http://example.org/fhir/StructureMap/OruBundle";
    private static final String TYPED_MODEL = "http://example.org/hl7v2/StructureDefinition/ORU__R01";
    private static final String TYPED_BUNDLE_MAP = "http://example.org/typed/StructureMap/ORUR01toBundle";
    private static final ObjectMapper JSON = new ObjectMapper();
    private static FmlBridge bridge;
    private static String oru;
    private static String strictOru;

    private static String fixture(String name) { return Path.of("src/test/resources", name).toAbsolutePath().toString(); }

    private static Map<String, String> options() {
        FhirSerializationProperties properties = new FhirSerializationProperties();
        properties.setProfiles(fixture("fml/maps") + ";" + fixture("conceptmaps/v2-sex-r4.json"));
        return properties.engineOptions();
    }

    private static Map<String, String> typedOptions() {
        FhirSerializationProperties properties = new FhirSerializationProperties();
        properties.setProfiles(fixture("fml/typed"));
        Map<String, String> options = properties.engineOptions();
        options.put("sourceModel", "hl7v2-logical");
        options.put("sourceModelUrl", TYPED_MODEL);
        return options;
    }

    @BeforeClass
    public static void load() throws Exception {
        bridge = new FmlBridge(FhirEngineLoader.engine());
        oru = Files.readString(Path.of(fixture("fml/messages/oru-r01-minimal.xml")));
        strictOru = Files.readString(Path.of(fixture("fml/messages/oru-r01-strict.xml")));
    }

    @AfterClass
    public static void close() { bridge.clearCaches(); }

    @Test
    public void listsTheMapsOfTheProfileLocations() throws Exception {
        JsonNode list = JSON.readTree(bridge.listMaps(options()));
        assertEquals(2, list.path("maps").size());
        assertEquals(BUNDLE_MAP, list.path("maps").get(0).path("url").asText());
        assertEquals(0, list.path("errors").size());
    }

    @Test
    public void buildsTheGenericModelWithNamesPositionsAndOccurrences() throws Exception {
        Map<String, String> context = new LinkedHashMap<>();
        context.put("channelName", "ORU");
        context.put("dataType", "HL7V2");
        JsonNode model = JSON.readTree(bridge.source(oru, "xml", context, Map.of("site", "Marseille"), options()));
        assertEquals("HL7Message", model.path("name").asText());
        assertEquals("ORU", model.path("context").path("channelName").asText());
        assertEquals("Marseille", model.path("context").path("variable").get(0).path("value").asText());
        JsonNode pid = null;
        for (JsonNode node : model.path("node")) if ("PID".equals(node.path("name").asText())) pid = node;
        assertNotNull(pid);
        assertEquals(2, pid.path("position").asInt()); // second segment
        JsonNode name = pid.path("node").get(4);
        assertEquals("PID.5", name.path("name").asText());
        assertEquals(5, name.path("position").asInt());
        assertEquals("MARTIN", name.path("node").get(0).path("value").asText());
        assertTrue(pid.path("node").get(1).path("value").isMissingNode()); // empty PID.2
    }

    @Test
    public void transformsAMessageToAPatientWithTranslation() throws Exception {
        JsonNode patient = JSON.readTree(bridge.transform(PATIENT_MAP, oru, "xml", Map.of(), Map.of(), options()));
        assertEquals("Patient", patient.path("resourceType").asText());
        assertEquals("100001", patient.path("identifier").get(0).path("value").asText());
        assertEquals("MARTIN", patient.path("name").get(0).path("family").asText());
        assertEquals("CLAIRE", patient.path("name").get(0).path("given").get(0).asText());
        assertEquals("1980-02-15", patient.path("birthDate").asText());
        assertEquals("female", patient.path("gender").asText());
    }

    @Test
    public void transformsToABundleWithImportsAndChoiceTypes() throws Exception {
        JsonNode bundle = JSON.readTree(bridge.transform(BUNDLE_MAP, oru, "xml", Map.of(), Map.of(), options()));
        assertEquals("transaction", bundle.path("type").asText());
        assertEquals("Patient", bundle.path("entry").get(0).path("resource").path("resourceType").asText());
        assertEquals("MARTIN", bundle.path("entry").get(0).path("resource").path("name").get(0).path("family").asText());
        JsonNode observation = bundle.path("entry").get(1).path("resource");
        assertEquals("Observation", observation.path("resourceType").asText());
        assertEquals("GLU", observation.path("code").path("coding").get(0).path("code").asText());
        assertEquals("mmol/L", observation.path("valueQuantity").path("unit").asText());
        assertEquals(5.1, observation.path("valueQuantity").path("value").asDouble(), 0.0001);
    }

    @Test
    public void adaptsStrictParserXmlToATypedLogicalModelAndRunsImportedMaps() throws Exception {
        JsonNode maps = JSON.readTree(bridge.listMaps(typedOptions()));
        assertEquals(maps.toPrettyString(), 2, maps.path("maps").size());
        JsonNode model = JSON.readTree(bridge.source(strictOru, "xml", Map.of(), Map.of(), typedOptions()));
        JsonNode result = model.path("ORU__R01_PATIENT__RESULT");
        assertEquals("100001", result.path("ORU__R01_PATIENT").path("PID").path("PID_3").get(0).path("CX_1").path("value").asText());
        assertEquals("PI", result.path("ORU__R01_PATIENT").path("PID").path("PID_3").get(0).path("CX_5").path("value").asText());

        JsonNode bundle = JSON.readTree(bridge.transform(TYPED_BUNDLE_MAP, strictOru, "xml", Map.of(), Map.of(), typedOptions()));
        assertEquals("transaction", bundle.path("type").asText());
        assertEquals("POST", bundle.path("entry").get(0).path("request").path("method").asText());
        assertEquals("Patient", bundle.path("entry").get(0).path("request").path("url").asText());
        JsonNode patient = bundle.path("entry").get(0).path("resource");
        assertEquals("100001", patient.path("identifier").get(0).path("value").asText());
        assertEquals("MARTIN", patient.path("name").get(0).path("family").asText());
        JsonNode observation = bundle.path("entry").get(1).path("resource");
        assertEquals("Observation", observation.path("resourceType").asText());
        assertEquals("GLU", observation.path("code").path("text").asText());
        assertEquals("5.10", observation.path("valueString").asText());
    }

    @Test
    public void concurrentGenericAndTypedTransformsDoNotContaminateEachOther() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(8);
        try {
            List<Callable<String>> work = new ArrayList<>();
            for (int i = 0; i < 24; i++) {
                final boolean typed = i % 2 == 0;
                work.add(() -> bridge.transform(typed ? TYPED_BUNDLE_MAP : PATIENT_MAP, typed ? strictOru : oru, "xml", Map.of(), Map.of(),
                        typed ? typedOptions() : options()));
            }
            List<Future<String>> results = pool.invokeAll(work);
            for (int i = 0; i < results.size(); i++) {
                JsonNode output = JSON.readTree(results.get(i).get());
                if (i % 2 == 0) {
                    assertEquals("Bundle", output.path("resourceType").asText());
                    assertEquals("GLU", output.path("entry").get(1).path("resource").path("code").path("text").asText());
                } else {
                    assertEquals("Patient", output.path("resourceType").asText());
                    assertEquals("female", output.path("gender").asText());
                }
            }
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    public void mapsAnInboundFhirResourceWithoutWrappingItInOieMessage() throws Exception {
        String map = "map \"http://example.org/CopyPatient\" = \"CopyPatient\"\n"
                + "uses \"http://hl7.org/fhir/StructureDefinition/Patient\" alias Patient as source\n"
                + "uses \"http://hl7.org/fhir/StructureDefinition/Patient\" alias Target as target\n"
                + "group CopyPatient(source src : Patient, target tgt : Target) { src.active as active -> tgt.active = active \"active\"; }\n";
        Map<String, String> fhir = options();
        fhir.put("sourceModel", "fhir");
        JsonNode output = JSON.readTree(bridge.transform(FmlBridge.INLINE + map,
                "{\"resourceType\":\"Patient\",\"active\":true}", "json", Map.of(), Map.of(), fhir));
        assertTrue(output.path("active").asBoolean());
    }

    @Test
    public void namesAnUnknownMap() throws Exception {
        try {
            bridge.transform("http://example.org/unknown", oru, "xml", Map.of(), Map.of(), options());
            fail("Expected an unknown map error");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("http://example.org/unknown"));
        }
    }

    @Test
    public void runsAMapWrittenInTheStepAndChecksIt() throws Exception {
        String text = Files.readString(Path.of(fixture("fml/maps/OruPatient.fml")));
        JsonNode patient = JSON.readTree(bridge.transform(FmlBridge.INLINE + text, oru, "xml", Map.of(), Map.of(), options()));
        assertEquals("Patient", patient.path("resourceType").asText());
        assertEquals(JSON.readTree(bridge.transform(PATIENT_MAP, oru, "xml", Map.of(), Map.of(), options())), patient);

        JsonNode ok = JSON.readTree(bridge.check(text, options()));
        assertEquals(PATIENT_MAP, ok.path("url").asText());
        assertEquals(ok.toPrettyString(), 0, ok.path("errors").size());

        JsonNode broken = JSON.readTree(bridge.check(text.replaceFirst("group ", "groupe "), options()));
        assertEquals(1, broken.path("errors").size());
        assertTrue(broken.path("errors").get(0).path("line").asInt() >= 1);
        assertFalse(broken.path("errors").get(0).path("message").asText().isEmpty());

        JsonNode unknown = JSON.readTree(bridge.check(text.replace("StructureDefinition/OieMessage", "StructureDefinition/Missing"), options()));
        assertTrue(unknown.path("errors").get(0).path("message").asText().contains("Missing"));
    }

    @Test
    public void runsDemoPermissionR5MapAndIgPackagedStructureMap() throws Exception {
        FhirSerializationProperties r5Props = new FhirSerializationProperties();
        r5Props.setFhirVersion(FhirSerializationProperties.FhirVersion.R5);
        r5Props.setProfiles(Path.of("demo/fhir-volume/fml/PermissionR5.fml").toAbsolutePath().toString());
        Map<String, String> r5Opts = r5Props.engineOptions();
        String delimitedXml = "<delimited>"
                + "<row><column1>permission_id</column1><column2>status</column2><column3>combining</column3>"
                + "<column4>org_id</column4><column5>org_name</column5><column6>rule_type</column6><column7>action_code</column7></row>"
                + "<row><column1>perm-r5-001</column1><column2>active</column2><column3>deny-overrides</column3>"
                + "<column4>org-r5-demo</column4><column5>Centre Hospitalier Demo</column5><column6>permit</column6><column7>access</column7></row>"
                + "</delimited>";
        JsonNode r5Bundle = JSON.readTree(bridge.transform(
                "http://example.org/fhir/r5/StructureMap/CsvToPermissionR5", delimitedXml, "xml", Map.of(), Map.of(), r5Opts));
        JsonNode expectedBundle = JSON.readTree(Files.readString(Path.of("demo/examples/expected/permission-r5-bundle.json")));
        assertEquals(expectedBundle, r5Bundle);
        assertTrue(fr.kazepoy.fhir.mapper.integration.FhirDataTypeAdapter.validate(
                r5Bundle.toString(), "", "", "R5").isValid());

        FhirSerializationProperties igProps = new FhirSerializationProperties();
        igProps.setFhirVersion(FhirSerializationProperties.FhirVersion.R4);
        igProps.setProfiles(Path.of("demo/fhir-volume/ig").toAbsolutePath().toString());
        JsonNode igPatient = JSON.readTree(bridge.transform(
                "http://example.org/fhir/oru2fhir/StructureMap/OruR01ToPatientIG",
                oru, "xml", Map.of(), Map.of(), igProps.engineOptions()));
        JsonNode expectedPatient = JSON.readTree(Files.readString(Path.of("demo/examples/expected/fml-inline-patient.json")));
        assertEquals(expectedPatient, igPatient);
    }
}
