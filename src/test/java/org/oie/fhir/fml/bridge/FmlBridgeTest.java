/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.fml.bridge;

import static org.junit.Assert.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

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
    private static final ObjectMapper JSON = new ObjectMapper();
    private static FmlBridge bridge;
    private static String oru;

    private static String fixture(String name) { return Path.of("src/test/resources", name).toAbsolutePath().toString(); }

    private static Map<String, String> options() {
        FhirSerializationProperties properties = new FhirSerializationProperties();
        properties.setProfiles(fixture("fml/maps") + ";" + fixture("conceptmaps/v2-sex-r4.json"));
        return properties.engineOptions();
    }

    @BeforeClass
    public static void load() throws Exception {
        bridge = new FmlBridge(FhirEngineLoader.engine());
        oru = Files.readString(Path.of(fixture("fml/messages/oru-r01-minimal.xml")));
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
    public void namesAnUnknownMap() throws Exception {
        try {
            bridge.transform("http://example.org/unknown", oru, "xml", Map.of(), Map.of(), options());
            fail("Expected an unknown map error");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("http://example.org/unknown"));
        }
    }
}
