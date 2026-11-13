/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper;

import org.oie.fhir.mapper.util.FhirJson;
import org.oie.fhir.mapper.fhir.FhirFacade;
import org.oie.fhir.mapper.integration.FhirTerminology;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Scriptable;

import com.mirth.connect.util.ScriptBuilderException;
import com.sun.net.httpserver.HttpServer;

/** The FHIR Profile Mapper: conditions, Bundles of several steps, and the other step options. */
public class FhirProfileMapperBundleTest {

    /** An ORU as OIE's HL7 v2 data type gives it: the segments of the groups are siblings. */
    private static final String ORU_XML = "<HL7Message>"
            + "<MSH><MSH.10><MSH.10.1>MSG1</MSH.10.1></MSH.10></MSH>"
            + "<PID><PID.3><PID.3.1>IPP1</PID.3.1><PID.3.5>PI</PID.3.5></PID.3><PID.3><PID.3.1>NIR1</PID.3.1><PID.3.5>NH</PID.3.5></PID.3>"
            + "<PID.5><PID.5.1>DUPONT</PID.5.1></PID.5><PID.8><PID.8.1>F</PID.8.1></PID.8></PID>"
            + "<ORC><ORC.2><ORC.2.1>ORD1</ORC.2.1></ORC.2></ORC>"
            + "<OBR><OBR.4><OBR.4.1>PANEL1</OBR.4.1></OBR.4></OBR>"
            + "<OBX><OBX.3><OBX.3.1>GLU</OBX.3.1></OBX.3><OBX.5><OBX.5.1>5.40</OBX.5.1></OBX.5></OBX>"
            + "<OBX><OBX.3><OBX.3.1>NA</OBX.3.1></OBX.3><OBX.5><OBX.5.1>140</OBX.5.1></OBX.5></OBX>"
            + "<ORC><ORC.2><ORC.2.1>ORD2</ORC.2.1></ORC.2></ORC>"
            + "<OBR><OBR.4><OBR.4.1>PANEL2</OBR.4.1></OBR.4></OBR>"
            + "<OBX><OBX.3><OBX.3.1>K</OBX.3.1></OBX.3><OBX.5><OBX.5.1>4.1</OBX.5.1></OBX.5></OBX>"
            + "</HL7Message>";

    private static HttpServer server;
    private static final AtomicReference<String> authorization = new AtomicReference<>();
    private static final AtomicInteger calls = new AtomicInteger();

    @BeforeClass
    public static void setUp() throws IOException {
        System.setProperty("fhir.engine.direct", "true");
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/fhir/ConceptMap/$translate", exchange -> {
            calls.incrementAndGet();
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            byte[] body = ("{\"resourceType\":\"Parameters\",\"parameter\":[{\"name\":\"result\",\"valueBoolean\":true},{\"name\":\"match\",\"part\":["
                    + "{\"name\":\"equivalence\",\"valueCode\":\"equivalent\"},{\"name\":\"concept\",\"valueCoding\":{\"system\":\"http://loinc.org\",\"code\":\"2345-7\"}}]}]}")
                    .getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(body);
            }
        });
        server.start();
    }

    @AfterClass
    public static void tearDown() {
        server.stop(0);
    }

    private static FhirProfileMapperStep step(String type, String mappings) {
        FhirProfileMapperStep step = new FhirProfileMapperStep();
        step.setName(type);
        step.setResourceType(type);
        step.setAddMetaProfile(false);
        step.setMappings(mappings);
        return step;
    }

    private static FhirProfileMapperStep bundled(String type, String refName, String mappings) {
        FhirProfileMapperStep step = step(type, mappings);
        if (type.equals("Bundle")) { step.setAction("createBundle"); step.setBundleName("labo"); }
        else target(step, "POST", "", "");
        step.setRefName(refName);
        return step;
    }

    /** Rule-level execution inspects the constructed objects before final validation. Full
     * publication and validation are exercised by FhirNamedBundleTest. */
    private static String run(FhirProfileMapperStep... steps) throws Exception {
        Context cx = new ContextFactory().enterContext();
        try {
            Scriptable scope = cx.initStandardObjects();
            scope.put("hl7", scope, ORU_XML);
            StringBuilder script = new StringBuilder("var msg = new XML(hl7);\n");
            boolean assembling = java.util.Arrays.stream(steps).anyMatch(s -> "createBundle".equals(s.getAction()));
            for (FhirProfileMapperStep step : steps) {
                script.append(assembling ? step.getScript(false) : step.getPreviewScript()).append('\n');
            }
            if (assembling) {
                String runtime;
                try (var in = FhirProfileMapperStep.class.getResourceAsStream("profile-mapper-runtime.js")) {
                    runtime = new String(in.readAllBytes(), StandardCharsets.UTF_8);
                }
                script.append("var snapshot = ").append(runtime).append("; snapshot.json(__fhirProfileMapper.bundles.labo.resource);");
            } else {
                script.append("typeof msg === 'xml' ? msg.toXMLString() : String(msg);");
            }
            return Context.toString(cx.evaluateString(scope, script.toString(), "transformer", 1, null));
        } finally { Context.exit(); }
    }

    private static void target(FhirProfileMapperStep step, String method, String url, String ifNoneExist) {
        step.setBundleTargets(FhirJson.write(List.of(Map.of("name", "labo", "requestMethod", method, "requestUrl", url, "ifNoneExist", ifNoneExist))));
    }

    private static FhirProfileMapperStep header() {
        return bundled("Bundle", "", "[]");
    }

    private static Map<?, ?> parse(String json) {
        return (Map<?, ?>) FhirJson.parse(json);
    }

    private static String entry(String key, String type, String expression, String path) {
        return "{\"key\":\"" + key + "\",\"type\":\"" + type + "\",\"expression\":\"" + expression + "\",\"path\":" + path + "}";
    }

    // ------------------------------------------------------------------ conditions

    @Test
    public void aConditionFiltersTheItemsOfAnIteration() throws Exception {
        String json = run(step("Patient", "["
                + "{\"key\":\"Patient.identifier\",\"each\":\"msg['PID']['PID.3']\",\"variable\":\"id\",\"path\":[[\"identifier\",\"#0\"]]},"
                + "{\"key\":\"Patient.identifier\",\"condition\":\"id['PID.3.5'].toString() == 'PI'\",\"path\":[[\"identifier\",\"#0\"]]},"
                + entry("Patient.identifier.value", "string", "id['PID.3.1'].toString()", "[[\"identifier\",\"#0\"],[\"value\"]]") + ","
                + "{\"key\":\"Patient.identifier.system\",\"fixed\":\"urn:ipp\",\"when\":1,\"path\":[[\"identifier\",\"#0\"],[\"system\"]]}"
                + "]"));
        assertEquals("[{value=IPP1, system=urn:ipp}]", parse(json).get("identifier").toString());
    }

    @Test
    public void aConditionOnAnElementGatesWhatIsBelowIt() throws Exception {
        String mappings = "["
                + "{\"key\":\"Patient.name\",\"condition\":\"msg['PID']['PID.8']['PID.8.1'].toString() == 'X'\",\"path\":[[\"name\",\"#0\"]]},"
                + entry("Patient.name.family", "string", "msg['PID']['PID.5']['PID.5.1'].toString()", "[[\"name\",\"#0\"],[\"family\"]]") + ","
                + entry("Patient.gender", "code", "'female'", "[[\"gender\"]]") + "]";
        Map<?, ?> r = parse(run(step("Patient", mappings)));
        assertFalse(r.containsKey("name"));
        assertEquals("female", r.get("gender"));
        // An optional repetition is checked explicitly before it is accessed.
        assertFalse(parse(run(step("Patient", mappings.replace("msg['PID']['PID.8']['PID.8.1'].toString() == 'X'", "msg['NK1'].length() > 3 && msg['NK1'][3]['NK1.2'] == 'X'")))).containsKey("name"));
    }

    @Test
    public void aResourceConditionThatFailsLeavesTheMessage() throws Exception {
        String out = run(step("Patient", "[{\"key\":\"Patient\",\"condition\":\"false\",\"path\":[]}," + entry("Patient.gender", "code", "'female'", "[[\"gender\"]]") + "]"));
        assertTrue(out, out.startsWith("<HL7Message>"));
    }

    // ------------------------------------------------------------------ Bundle

    @Test
    public void stepsShareABundleAndReferToEachOther() throws Exception {
        FhirProfileMapperStep patient = bundled("Patient", "'patient'", "[" + entry("Patient.gender", "code", "'female'", "[[\"gender\"]]") + "]");
        FhirProfileMapperStep header = header();
        header.setProfileUrl("http://example.org/StructureDefinition/oru-bundle");
        header.setAddMetaProfile(true);
        target(patient, "POST", "", "'identifier=urn:ipp|' + msg['PID']['PID.3'][0]['PID.3.1']");
        // one Observation per OBX, named by the OBR they belong to
        FhirProfileMapperStep observation = bundled("Observation", "'obs-' + hl7Ordinal(hl7Preceding(obx, 'OBR', []))", "["
                + "{\"key\":\"Observation\",\"each\":\"msg['OBX']\",\"variable\":\"obx\",\"path\":[]},"
                + entry("Observation.status", "code", "'final'", "[[\"status\"]]") + ","
                + entry("Observation.code.text", "string", "obx['OBX.3']['OBX.3.1'].toString()", "[[\"code\"],[\"text\"]]") + ","
                + entry("Observation.subject.reference", "string", "fhirRef('patient')", "[[\"subject\"],[\"reference\"]]") + ","
                + entry("Observation.valueQuantity.value", "decimal", "obx['OBX.5']['OBX.5.1'].toString()", "[[\"valueQuantity\"],[\"value\"]]") + "]");
        // one DiagnosticReport per OBR, with the Observations of that OBR
        FhirProfileMapperStep report = bundled("DiagnosticReport", "", "["
                + "{\"key\":\"DiagnosticReport\",\"each\":\"msg['OBR']\",\"variable\":\"obr\",\"path\":[]},"
                + entry("DiagnosticReport.status", "code", "'final'", "[[\"status\"]]") + ","
                + entry("DiagnosticReport.code.text", "string", "obr['OBR.4']['OBR.4.1'].toString()", "[[\"code\"],[\"text\"]]") + ","
                + entry("DiagnosticReport.identifier.value", "string", "hl7Preceding(obr, 'ORC')['ORC.2']['ORC.2.1'].toString()", "[[\"identifier\",\"#0\"],[\"value\"]]") + ","
                + "{\"key\":\"DiagnosticReport.result\",\"each\":\"fhirRefs('obs-' + obrIndex)\",\"variable\":\"ref\",\"path\":[[\"result\",\"#0\"]]},"
                + entry("DiagnosticReport.result.reference", "string", "ref", "[[\"result\",\"#0\"],[\"reference\"]]") + "]");
        target(report, "PUT", "'DiagnosticReport?identifier=' + hl7Preceding(obr, 'ORC')['ORC.2']['ORC.2.1']", "");

        Map<?, ?> bundle = parse(run(header, patient, observation, report));
        assertEquals("Bundle", bundle.get("resourceType"));
        assertEquals("transaction", bundle.get("type"));
        assertEquals("{profile=[http://example.org/StructureDefinition/oru-bundle]}", bundle.get("meta").toString());
        List<?> entries = (List<?>) bundle.get("entry");
        assertEquals(1 + 3 + 2, entries.size());
        Map<?, ?> patientEntry = (Map<?, ?>) entries.get(0);
        String patientUrl = (String) patientEntry.get("fullUrl");
        assertTrue(patientUrl, patientUrl.matches("urn:uuid:[0-9a-f-]{36}"));
        assertEquals("{method=POST, url=Patient, ifNoneExist=identifier=urn:ipp|IPP1}", patientEntry.get("request").toString());

        Map<?, ?> glucose = (Map<?, ?>) ((Map<?, ?>) entries.get(1)).get("resource");
        assertEquals("{reference=" + patientUrl + "}", glucose.get("subject").toString());
        Map<?, ?> potassium = (Map<?, ?>) ((Map<?, ?>) entries.get(3)).get("resource");
        assertEquals("K", ((Map<?, ?>) potassium.get("code")).get("text"));

        Map<?, ?> panel1 = (Map<?, ?>) entries.get(4);
        Map<?, ?> panel2 = (Map<?, ?>) entries.get(5);
        assertEquals("{method=PUT, url=DiagnosticReport?identifier=ORD1}", panel1.get("request").toString());
        assertEquals("[{value=ORD2}]", ((Map<?, ?>) panel2.get("resource")).get("identifier").toString());
        String obs1 = (String) ((Map<?, ?>) entries.get(1)).get("fullUrl");
        String obs2 = (String) ((Map<?, ?>) entries.get(2)).get("fullUrl");
        String obs3 = (String) ((Map<?, ?>) entries.get(3)).get("fullUrl");
        assertEquals("[{reference=" + obs1 + "}, {reference=" + obs2 + "}]", ((Map<?, ?>) panel1.get("resource")).get("result").toString());
        assertEquals("[{reference=" + obs3 + "}]", ((Map<?, ?>) panel2.get("resource")).get("result").toString());
    }

    @Test
    public void aBundleStepFillsTheBundleItself() throws Exception {
        FhirProfileMapperStep header = bundled("Bundle", "", "["
                + entry("Bundle.identifier.value", "string", "msg['MSH']['MSH.10']['MSH.10.1'].toString()", "[[\"identifier\"],[\"value\"]]") + ","
                + entry("Bundle.type", "code", "'collection'", "[[\"type\"]]") + "]");
        header.setProfileUrl("http://example.org/StructureDefinition/oru-bundle");
        header.setAddMetaProfile(true);
        FhirProfileMapperStep patient = bundled("Patient", "", "[" + entry("Patient.gender", "code", "'female'", "[[\"gender\"]]") + "]");
        header.setBundleType("collection");
        Map<?, ?> bundle = parse(run(header, patient));
        assertEquals("{value=MSG1}", bundle.get("identifier").toString());
        assertEquals("collection", bundle.get("type"));
        assertEquals("{profile=[http://example.org/StructureDefinition/oru-bundle]}", bundle.get("meta").toString());
        assertEquals(1, ((List<?>) bundle.get("entry")).size());
    }

    @Test
    public void decimalsKeepTheirText() throws Exception {
        String json = run(header(), bundled("Observation", "", "[{\"key\":\"Observation\",\"each\":\"msg['OBX']\",\"variable\":\"obx\",\"path\":[]},"
                + entry("Observation.valueQuantity.value", "decimal", "obx['OBX.5']['OBX.5.1'].toString()", "[[\"valueQuantity\"],[\"value\"]]") + "]"));
        assertTrue(json, json.contains("\"value\":5.40}"));
        assertTrue(json, json.contains("\"value\":140}"));
        // and as FHIR XML
        String xml = org.oie.fhir.mapper.fhir.FhirFacade.jsonToXml(json, false);
        assertTrue(xml, xml.contains("<value value=\"5.40\"/>"));
    }

    @Test
    public void decimalsAreNormalizedToJsonNumbersWithoutLosingPrecision() throws Exception {
        for (String[] value : new String[][] {
                { "005.40", "5.40" }, { "+000.40", "0.40" }, { "-000.00", "-0.00" },
                { "000", "0" }, { ".50", "0.50" }, { "-.50", "-0.50" },
                { "001.e+03", "1e+03" }, { "000.12345678901234567890", "0.12345678901234567890" }
        }) {
            String json = run(step("Observation", "[" + entry("Observation.valueQuantity.value", "decimal", "'" + value[0] + "'", "[[\"valueQuantity\"],[\"value\"]]") + "]"));
            assertEquals(value[0], "{\"resourceType\":\"Observation\",\"valueQuantity\":{\"value\":" + value[1] + "}}", json);
        }
    }

    @Test
    public void decimalsOfOneStepKeepTheirTextWhenALaterStepWritesTheBundle() throws Exception {
        FhirProfileMapperStep observation = bundled("Observation", "", "[" + entry("Observation.valueQuantity.value", "decimal", "'5.40'", "[[\"valueQuantity\"],[\"value\"]]") + "]");
        FhirProfileMapperStep patient = bundled("Patient", "", "[" + entry("Patient.gender", "code", "'female'", "[[\"gender\"]]") + "]");
        String json = run(header(), observation, patient);
        assertTrue(json, json.contains("\"valueQuantity\":{\"value\":5.40}"));
    }

    @Test
    public void oneResourcePerItemNeedsABundle() {
        try {
            step("Observation", "[{\"key\":\"Observation\",\"each\":\"msg['OBX']\",\"variable\":\"obx\",\"path\":[]}]").getScript(false);
            fail("expected an error");
        } catch (ScriptBuilderException e) {
            assertTrue(e.getMessage(), e.getMessage().contains("needs a named Bundle target"));
        }
    }

    // ------------------------------------------------------------------ values

    @Test
    public void nativeNumbersAndBooleansAreConvertedToTheTargetType() throws Exception {
        Map<?, ?> r = parse(run(step("Patient", "["
                + entry("Patient.id", "id", "123456", "[[\"id\"]]") + ","
                + entry("Patient.active", "boolean", "0", "[[\"active\"]]") + ","
                + entry("Patient.identifier.value", "string", "true", "[[\"identifier\",\"#0\"],[\"value\"]]") + "]")));
        assertEquals("123456", r.get("id"));
        assertEquals(Boolean.FALSE, r.get("active"));
        assertEquals("true", ((Map<?, ?>) ((List<?>) r.get("identifier")).get(0)).get("value"));
    }

    @Test
    public void javaNumbersAndBooleansAreConvertedToTheTargetType() throws Exception {
        Map<?, ?> r = parse(run(step("Patient", "["
                + entry("Patient.id", "id", "new java.lang.Integer(123456)", "[[\"id\"]]") + ","
                + entry("Patient.active", "boolean", "new java.lang.Integer(0)", "[[\"active\"]]") + ","
                + entry("Patient.identifier.value", "string", "new java.lang.Boolean(true)", "[[\"identifier\",\"#0\"],[\"value\"]]") + "]")));
        assertEquals("123456", r.get("id"));
        assertEquals(Boolean.FALSE, r.get("active"));
        assertEquals("true", ((Map<?, ?>) ((List<?>) r.get("identifier")).get(0)).get("value"));
    }

    @Test
    public void aNativeFractionalNumberCannotBecomeAnInteger() throws Exception {
        try {
            run(step("Patient", "[" + entry("Patient.multipleBirthInteger", "integer", "1.5", "[[\"multipleBirthInteger\"]]") + "]"));
            fail("expected an error");
        } catch (Exception e) {
            assertTrue(e.getMessage(), e.getMessage().contains("is not an integer"));
        }
    }

    @Test
    public void mappedArraysKeepExistingPrimitiveValues() throws Exception {
        Map<?, ?> r = parse(run(step("Patient", "["
                + entry("Patient.name", "HumanName", "({family:'DUPONT', given:['Jean']})", "[[\"name\",\"#0\"]]") + ","
                + entry("Patient.name.given[1]", "string", "'Pierre'", "[[\"name\",\"#0\"],[\"given\",\"#1\"]]") + "]")));
        assertEquals("[{family=DUPONT, given=[Jean, Pierre]}]", r.get("name").toString());
    }

    @Test
    public void primitiveExtensionsUseUnderscorePropertiesAndKeepArrayAlignment() throws Exception {
        Map<?, ?> scalar = parse(run(step("Patient", "["
                + entry("Patient.birthDate", "date", "'1980-01-15'", "[[\"birthDate\"]]") + ","
                + entry("Patient.birthDate.extension:source.valueString", "string", "'registry'", "[[\"_birthDate\"],[\"extension\",\"source#0\"],[\"valueString\"]]") + ","
                + "{\"key\":\"Patient.birthDate.extension:source.url\",\"fixed\":\"http://example.org/source\",\"when\":2,\"path\":[[\"_birthDate\"],[\"extension\",\"source#0\"],[\"url\"]]}]")));
        assertEquals("1980-01-15", scalar.get("birthDate"));
        assertEquals("{extension=[{valueString=registry, url=http://example.org/source}]}", scalar.get("_birthDate").toString());

        Map<?, ?> repeated = parse(run(step("Patient", "["
                + entry("Patient.name.given", "string", "'Jean'", "[[\"name\",\"#0\"],[\"given\",\"#0\"]]") + ","
                + entry("Patient.name.given[1]", "string", "'Pierre'", "[[\"name\",\"#0\"],[\"given\",\"#1\"]]") + ","
                + entry("Patient.name.given[1].extension:source.valueString", "string", "'import'", "[[\"name\",\"#0\"],[\"_given\",\"#1\"],[\"extension\",\"source#0\"],[\"valueString\"]]") + "]")));
        Map<?, ?> name = (Map<?, ?>) ((List<?>) repeated.get("name")).get(0);
        assertEquals("[Jean, Pierre]", name.get("given").toString());
        List<?> metadata = (List<?>) name.get("_given");
        assertSame(FhirJson.NULL, metadata.get(0));
        assertEquals("{extension=[{valueString=import}]}", metadata.get(1).toString());
    }

    @Test
    public void aContainedResourceCanReceiveItsCompiledResourceType() throws Exception {
        Map<?, ?> patient = parse(run(step("Patient", "["
                + entry("Patient.contained:observation.status", "code", "'final'", "[[\"contained\",\"observation#0\"],[\"status\"]]") + ","
                + "{\"key\":\"Patient.contained:observation.resourceType\",\"fixed\":\"Observation\",\"when\":1,\"path\":[[\"contained\",\"observation#0\"],[\"resourceType\"]]}]")));
        assertEquals("{status=final, resourceType=Observation}", ((List<?>) patient.get("contained")).get(0).toString());
    }

    @Test
    public void mappedArraysKeepExistingObjectsWhenMappingTheirChildren() throws Exception {
        Map<?, ?> r = parse(run(step("Patient", "["
                + entry("Patient.contact", "BackboneElement", "({telecom:[{system:'phone', value:'123'}]})", "[[\"contact\",\"#0\"]]") + ","
                + entry("Patient.contact.telecom.use", "code", "'work'", "[[\"contact\",\"#0\"],[\"telecom\",\"#0\"],[\"use\"]]") + "]")));
        assertEquals("[{telecom=[{system=phone, value=123, use=work}]}]", r.get("contact").toString());
    }

    @Test
    public void fixedValuesEnrichExistingMappedArrays() throws Exception {
        String contact = entry("Patient.contact", "BackboneElement", "({telecom:[{value:'123'}]})", "[[\"contact\",\"#0\"]]");
        for (String fixed : new String[] {
                "{\"key\":\"Patient.contact.telecom\",\"fixed\":{\"system\":\"phone\"},\"when\":1,\"path\":[[\"contact\",\"#0\"],[\"telecom\",\"#0\"]]}",
                "{\"key\":\"Patient.contact.telecom.system\",\"fixed\":\"phone\",\"when\":2,\"path\":[[\"contact\",\"#0\"],[\"telecom\",\"#0\"],[\"system\"]]}"
        }) {
            Map<?, ?> r = parse(run(step("Patient", "[" + contact + "," + fixed + "]")));
            assertEquals("[{telecom=[{value=123, system=phone}]}]", r.get("contact").toString());
        }
    }

    @Test
    public void anEmptyObjectCreatesAnEntryForItsFixedValues() throws Exception {
        Map<?, ?> r = parse(run(step("Patient", "["
                + entry("Patient.identifier", "Identifier", "({})", "[[\"identifier\",\"#0\"]]") + ","
                + "{\"key\":\"Patient.identifier.system\",\"fixed\":\"urn:only-fixed\",\"when\":1,\"path\":[[\"identifier\",\"#0\"],[\"system\"]]},"
                + entry("Patient.contact", "BackboneElement", "({})", "[[\"contact\",\"#0\"]]") + "]")));
        assertEquals("[{system=urn:only-fixed}]", r.get("identifier").toString());
        assertFalse("an empty object without fixed values goes", r.containsKey("contact"));
    }

    @Test
    public void aPatternOnARepeatingElementGoesIntoACompatibleItemOrANewOne() throws Exception {
        String pattern = "{\"key\":\"Observation.category\",\"fixed\":{\"coding\":[{\"system\":\"http://terminology.hl7.org/CodeSystem/observation-category\",\"code\":\"laboratory\"}]},"
                + "\"when\":1,\"path\":[[\"category\",\"#0\"]]}";
        Map<?, ?> same = parse(run(step("Observation", "[" + entry("Observation.category.coding.code", "code", "'laboratory'", "[[\"category\",\"#0\"],[\"coding\",\"#0\"],[\"code\"]]")
                + "," + pattern + "]")));
        assertEquals("[{coding=[{code=laboratory, system=http://terminology.hl7.org/CodeSystem/observation-category}]}]", same.get("category").toString());
        Map<?, ?> other = parse(run(step("Observation", "[" + entry("Observation.category.coding.code", "code", "'local'", "[[\"category\",\"#0\"],[\"coding\",\"#0\"],[\"code\"]]")
                + "," + pattern + "]")));
        assertEquals("[{coding=[{code=local}, {system=http://terminology.hl7.org/CodeSystem/observation-category, code=laboratory}]}]", other.get("category").toString());
    }

    @Test
    public void anInstantNeedsATime() {
        try {
            run(step("Observation", "[" + entry("Observation.issued", "instant", "'20260114'", "[[\"issued\"]]") + "]"));
            fail("expected an error");
        } catch (Exception e) {
            assertTrue(e.getMessage(), e.getMessage().contains("has no time, which an instant needs"));
        }
    }

    @Test
    public void metaLastUpdatedAndUuids() throws Exception {
        FhirProfileMapperStep step = step("Patient", "[" + entry("Patient.id", "id", "fhirUuid()", "[[\"id\"]]") + "]");
        step.setSetLastUpdated(true);
        Map<?, ?> r = parse(run(step));
        assertTrue(String.valueOf(r.get("id")), String.valueOf(r.get("id")).matches("[0-9a-f-]{36}"));
        assertTrue(r.get("meta").toString(), r.get("meta").toString().matches("\\{lastUpdated=\\d{4}-\\d{2}-\\d{2}T.*\\}"));
    }

    // ------------------------------------------------------------------ terminology

    @Test
    public void theSourceCodingCanBeKeptWithAnAuthorizationHeader() throws Exception {
        FhirTerminology.clearCache();
        calls.set(0);
        FhirProfileMapperStep step = step("Observation", "[{\"key\":\"Observation.code\",\"type\":\"CodeableConcept\",\"expression\":\"'GLU'\",\"path\":[[\"code\"]],"
                + "\"translate\":{\"conceptMap\":\"http://example.org/cm\",\"source\":\"urn:local\",\"unmapped\":\"none\",\"keepSource\":true}}]");
        step.setTerminologyServer("http://127.0.0.1:" + server.getAddress().getPort() + "/fhir");
        step.setTerminologyAuthorization("'Bearer ' + 'secret'");
        step.setTerminologyCacheSeconds(0);
        assertEquals("{coding=[{system=http://loinc.org, code=2345-7}, {system=urn:local, code=GLU}]}", parse(run(step)).get("code").toString());
        assertEquals("Bearer secret", authorization.get());
        run(step);
        assertEquals("cache 0: asked again", 2, calls.get());
    }

    @Test
    public void lookupAndValidateCodeWithoutAServer() throws Exception {
        assertEquals("Female", FhirFacade.lookup("n/a", "", "http://hl7.org/fhir/administrative-gender", "female"));
        assertNull(FhirFacade.lookup("n/a", "", "http://hl7.org/fhir/administrative-gender", "nope"));
        assertTrue(FhirFacade.validateCode("n/a", "", "http://hl7.org/fhir/ValueSet/administrative-gender", "http://hl7.org/fhir/administrative-gender", "male"));
        assertFalse(FhirFacade.validateCode("n/a", "", "http://hl7.org/fhir/ValueSet/administrative-gender", "http://hl7.org/fhir/administrative-gender", "nope"));
    }

    @Test
    public void aTerminologyServerMustBeHttp() {
        try {
            FhirTerminology.translate("file:///etc/passwd", "", "http://example.org/cm", "", "x", "", "R4");
            fail("expected an error");
        } catch (Exception e) {
            assertTrue(e.getMessage(), e.getMessage().contains("must be an http or https URL"));
        }
    }

    // ------------------------------------------------------------------ HL7 v2 groups

    @Test
    public void hl7GroupFunctions() throws Exception {
        String out = run(step("Basic", "[" + entry("Basic.code.text", "string",
                "hl7Following(msg['OBR'][0], 'OBX', ['OBR', 'ORC']).length + '/' + hl7Following(msg['OBR'][1], 'OBX', ['OBR', 'ORC']).length"
                        + " + '/' + hl7Preceding(msg['OBR'][1], 'ORC')['ORC.2']['ORC.2.1'] + '/' + hl7Ordinal(msg['OBX'][2]) + '/' + (hl7Preceding(msg['PID'], 'OBR') === undefined)",
                "[[\"code\"],[\"text\"]]") + "]"));
        assertEquals("2/1/ORD2/2/true", ((Map<?, ?>) parse(out).get("code")).get("text"));
        String found = run(step("Basic", "[" + entry("Basic.code.text", "string",
                "fhirFind(msg['PID']['PID.3'], function (cx) { return cx['PID.3.5'] == 'NH'; })['PID.3.1'] + '/' + fhirFilter(msg['OBX'], function (o, i) { return i > 0; }).length",
                "[[\"code\"],[\"text\"]]") + "]"));
        assertEquals("NIR1/2", ((Map<?, ?>) parse(found).get("code")).get("text"));
    }
}
