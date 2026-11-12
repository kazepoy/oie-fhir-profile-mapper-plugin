/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper;

import static org.junit.Assert.*;

import org.junit.After;
import org.junit.Test;

import com.mirth.connect.util.ScriptBuilderException;

public class FhirMapperSettingsTest {
    private static final String SETTINGS = "{\"contexts\":[{\"name\":\"labo\",\"fhirVersion\":\"R4\",\"packages\":[\"/fhir-ig\",\"/pkg/a.tgz\"],"
            + "\"terminologyServer\":\"http://tx/fhir\",\"cacheSeconds\":60,\"validation\":\"off\"}]}";

    @After
    public void reset() { FhirMapperSettings.load(null); }

    private static FhirProfileMapperStep step(String more) {
        return FhirProfileMapperStep.fromJson("{\"action\":\"resource\",\"resourceType\":\"Patient\",\"profiles\":\"/own\",\"terminologyServer\":\"\","
                + "\"mappings\":\"[{\\\"key\\\":\\\"Patient.id\\\",\\\"type\\\":\\\"id\\\",\\\"expression\\\":\\\"'a'\\\",\\\"path\\\":[[\\\"id\\\"]]}"
                + ",{\\\"key\\\":\\\"Patient.active\\\",\\\"type\\\":\\\"boolean\\\",\\\"expression\\\":\\\"'oops'\\\",\\\"path\\\":[[\\\"active\\\"]],\\\"disabled\\\":true,\\\"note\\\":\\\"later\\\"}]\"" + more + "}");
    }

    @Test
    public void aStepThatNamesAContextUsesItsPackagesTerminologyAndValidation() throws Exception {
        FhirMapperSettings.load(SETTINGS);
        FhirProfileMapperStep step = step(",\"formatVersion\":2,\"context\":\"labo\",\"validation\":\"inherit\"");
        assertEquals("/fhir-ig;/pkg/a.tgz", step.effectiveProfiles());
        assertEquals("http://tx/fhir", step.effectiveTerminologyServer());
        assertFalse(step.isValidateOutput());
        String script = step.getScript(false);
        assertTrue(script.contains("profiles: \"/fhir-ig;/pkg/a.tgz\""));
        assertTrue(script.contains("terminologyServer: \"http://tx/fhir\""));
        assertTrue(script.contains("cacheSeconds: 60"));
        assertTrue(script.contains("validateOutput: false"));
        assertEquals(Integer.valueOf(2), step.getFormatVersion());
    }

    @Test
    public void withoutAContextTheStepKeepsItsOwnSettingsAndFormatOneReadsValidateOutput() throws Exception {
        FhirMapperSettings.load(SETTINGS);
        FhirProfileMapperStep own = step(",\"validateOutput\":false");
        assertEquals("/own", own.effectiveProfiles());
        assertFalse(own.isValidateOutput());
        assertNull(own.getFormatVersion());
        assertTrue(step(",\"validation\":\"always\",\"validateOutput\":false").isValidateOutput());
        assertTrue(step(",\"validation\":\"inherit\"").isValidateOutput());
    }

    @Test
    public void anUnknownContextStopsTheCompilationAndADisabledRuleIsLeftOut() throws Exception {
        try {
            step(",\"context\":\"missing\"").getScript(false);
            fail("an unknown context must not compile");
        } catch (ScriptBuilderException e) {
            assertTrue(e.getMessage(), e.getMessage().contains("missing"));
        }
        String script = step("").getScript(false);
        assertTrue(script.contains("Patient.id"));
        assertFalse(script.contains("Patient.active"));
    }

    @Test
    public void settingsAreCheckedAndCanonical() {
        assertEquals("{\"contexts\":[]}", FhirMapperSettings.toJson(FhirMapperSettings.parse("")).replaceAll("\\s", ""));
        assertTrue(FhirMapperSettings.toJson(FhirMapperSettings.parse("{\"contexts\":[{\"name\":\"a\",\"packages\":\"/x;/y\"}]}")).replaceAll("\\s", "").contains("\"packages\":[\"/x\",\"/y\"]"));
        for (String bad : new String[] { "{\"contexts\":[{\"name\":\"a b\"}]}", "{\"contexts\":[{\"name\":\"a\"},{\"name\":\"a\"}]}",
                "{\"contexts\":[{\"name\":\"a\",\"fhirVersion\":\"R3\"}]}", "{\"contexts\":[{\"name\":\"a\",\"validation\":\"maybe\"}]}" }) {
            try { FhirMapperSettings.parse(bad); fail(bad); } catch (IllegalArgumentException expected) { /* refused */ }
        }
    }
}
