/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper.fhir;

import static org.junit.Assert.*;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.junit.Test;

/** Exercises the real, unmodified FHIR Data Type 1.5.1 engine through our boundary. */
public class FhirFacadeTest {
    private static final String PROFILE = "http://example.org/fhir/StructureDefinition/patient-with-birthdate";
    private static String fixture(String name) { return Path.of("src/test/resources", name).toAbsolutePath().toString(); }

    @Test
    public void preservesDecimalsAndConvertsTransformerXmlThroughThePrerequisite() throws Exception {
        String json = "{\"resourceType\":\"Observation\",\"valueQuantity\":{\"value\":1.50}}";
        assertTrue(FhirFacade.write(FhirFacade.parse(json)).contains("1.50"));
        assertTrue(FhirFacade.jsonToXml(json, false).contains("value=\"1.50\""));
        String xml = FhirFacade.toXml("{\"resourceType\":\"Patient\",\"gender\":\"female\"}", "R4");
        assertTrue(FhirFacade.toJson(xml, "R4").contains("female"));
    }

    @Test
    public void validatesWithTheOfficialEngineAndReturnsMapperOwnedIssues() throws Exception {
        String profiles = fixture("profiles");
        FhirValidation invalid = FhirFacade.validate("{\"resourceType\":\"Patient\"}", PROFILE, profiles, "R4");
        assertFalse(invalid.isValid());
        assertTrue(invalid.summary().contains("birthDate"));
        assertTrue(FhirFacade.validate("{\"resourceType\":\"Patient\",\"birthDate\":\"1980-01-15\"}", PROFILE, profiles, "R4").isValid());
    }

    @Test
    public void listsProfilesAndGeneratesTheirSnapshotsThroughTheCompatibilityBridge() throws Exception {
        String profiles = fixture("profiles");
        assertTrue(FhirFacade.listProfiles("R4", profiles).contains(PROFILE));
        Map<?, ?> sd = (Map<?, ?>) FhirFacade.parse(FhirFacade.structureDefinition(PROFILE, "R4", profiles));
        List<?> elements = (List<?>) ((Map<?, ?>) sd.get("snapshot")).get("element");
        Map<?, ?> birthDate = elements.stream().map(e -> (Map<?, ?>) e)
                .filter(e -> "Patient.birthDate".equals(e.get("path"))).findFirst().orElseThrow();
        assertEquals("1", birthDate.get("min").toString());
        assertEquals("1", ((Map<?, ?>) birthDate.get("base")).get("max"));
    }

    @Test
    public void translatesLocalConceptMapsWithoutReplacingTheDatatypeEngine() throws Exception {
        String maps = fixture("conceptmaps/v2-sex-r4.json");
        assertTrue(FhirFacade.listConceptMaps("n/a", maps, "R4").contains("http://example.org/ConceptMap/v2-sex"));
        String translated = FhirFacade.translate("n/a", maps, "http://example.org/ConceptMap/v2-sex",
                "http://terminology.hl7.org/CodeSystem/v2-0001", "F", "", "R4");
        assertEquals("female", ((Map<?, ?>) FhirFacade.parse(translated)).get("code"));
        assertNull(FhirFacade.translate("n/a", maps, "http://example.org/ConceptMap/v2-sex", "", "U", "", "R4"));
    }

    @Test
    public void reportsUnknownProfilesExplicitly() throws Exception {
        try {
            FhirFacade.structureDefinition("http://example.org/unknown", "R4", "");
            fail("Expected a missing profile error");
        } catch (IllegalArgumentException e) {
            assertTrue(e.getMessage().contains("not found"));
        }
    }
}
