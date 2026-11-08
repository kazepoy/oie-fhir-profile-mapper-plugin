/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper;

import org.oie.fhir.mapper.util.FhirJson;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.BeforeClass;
import org.junit.Test;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Scriptable;

import com.mirth.connect.model.Channel;
import com.mirth.connect.model.Connector;
import com.mirth.connect.model.Transformer;

public class FhirNamedBundleTest {
    @BeforeClass public static void engine() { System.setProperty("fhir.engine.direct", "true"); }

    private static FhirProfileMapperStep step(String type, String target, String fields) {
        FhirProfileMapperStep s = new FhirProfileMapperStep();
        s.setName(type);
        s.setAction("resource");
        s.setResourceType(type);
        s.setAddMetaProfile(false);
        s.setBundleTargets(target.isEmpty() ? "[]" : FhirJson.write(List.of(Map.of("name", target))));
        s.setMappings(fields);
        return s;
    }

    private static String field(String path, String type, String expression) {
        String[] parts = path.split("\\.");
        StringBuilder p = new StringBuilder("[");
        for (String part : parts) { if (p.length() > 1) p.append(','); p.append("[\"").append(part).append("\"]"); }
        return "{\"key\":\"X." + path + "\",\"type\":\"" + type + "\",\"expression\":" + FhirJson.write(expression) + ",\"path\":" + p + "]}";
    }

    private static FhirProfileMapperStep bundle(String name, String type, String output) {
        FhirProfileMapperStep s = step("Bundle", "", "[]");
        s.setBundleName(name);
        s.setAction("createBundle");
        s.setBundleType(type);
        s.setVariable(output);
        return s;
    }

    private static FhirProfileMapperStep patient(String target) {
        FhirProfileMapperStep s = step("Patient", target, "[" + field("active", "boolean", "true") + "]");
        s.setRefName("'patient'");
        return s;
    }

    private static String run(Map<String, Object> map, FhirProfileMapperStep... steps) throws Exception {
        Channel channel = new Channel();
        channel.setId("named-bundle-test");
        Connector source = new Connector("source"); source.setMetaDataId(0);
        Transformer transformer = new Transformer();
        for (int i = 0; i < steps.length; i++) {
            steps[i].setSequenceNumber(String.valueOf(i));
            transformer.getElements().add(steps[i]);
        }
        source.setTransformer(transformer); channel.setSourceConnector(source);
        FhirMapperLifecycle.deploy(channel);
        Context cx = new ContextFactory().enterContext();
        try {
            Scriptable scope = cx.initStandardObjects();
            scope.put("channelMap", scope, Context.javaToJS(map, scope));
            StringBuilder script = new StringBuilder("var msg = new XML('<HL7Message/>'); var channelId = 'named-bundle-test'; var connectorMessage = {getMetaDataId:function(){return 0;}};\n");
            for (FhirProfileMapperStep s : steps) script.append(s.getScript(false));
            script.append("typeof msg === 'xml' ? msg.toXMLString() : String(msg);");
            return Context.toString(cx.evaluateString(scope, script.toString(), "transformer", 1, null));
        } finally { Context.exit(); FhirMapperLifecycle.undeploy(channel.getId()); }
    }

    @Test public void twoBundlesAreIsolatedAndInheritTheirEntryRules() throws Exception {
        Map<String, Object> map = new HashMap<>();
        FhirProfileMapperStep a = patient("labo");
        a.setBundleTargets(FhirJson.write(List.of(Map.of("name", "labo", "requestMethod", "PUT", "requestUrl", "'Patient/one'"))));
        FhirProfileMapperStep b = patient("archive");
        b.setBundleTargets(FhirJson.write(List.of(Map.of("name", "archive", "requestUrl", "(function(){throw new Error('must not run for a collection');})()"))));
        String json = run(map, bundle("labo", "transaction", ""), bundle("archive", "collection", "archiveJson"), a, b);
        Map<?, ?> main = (Map<?, ?>) FhirJson.parse(json);
        Map<?, ?> other = (Map<?, ?>) FhirJson.parse(String.valueOf(map.get("archiveJson")));
        assertEquals("transaction", main.get("type"));
        assertEquals("collection", other.get("type"));
        Map<?, ?> entryA = (Map<?, ?>) ((List<?>) main.get("entry")).get(0);
        Map<?, ?> entryB = (Map<?, ?>) ((List<?>) other.get("entry")).get(0);
        assertEquals("{method=PUT, url=Patient/one}", entryA.get("request").toString());
        assertFalse(entryB.containsKey("request"));
        assertNotEquals(entryA.get("fullUrl"), entryB.get("fullUrl"));
    }

    @Test public void aDocumentCanReferenceResourcesAddedAfterItsComposition() throws Exception {
        FhirProfileMapperStep document = bundle("document", "document", "documentJson");
        document.setMappings("[" + field("identifier", "Identifier", "({system:'urn:test',value:'one'})") + ","
                + field("timestamp", "instant", "'2026-11-08T12:00:00+01:00'") + "]");
        FhirProfileMapperStep composition = step("Composition", "document", "["
                + field("status", "code", "'final'") + "," + field("type", "CodeableConcept", "({text:'Lab report'})") + ","
                + field("date", "dateTime", "'2026-11-08T12:00:00+01:00'") + "," + field("title", "string", "'Lab report'") + ","
                + field("subject", "Reference", "({reference:fhirRef('patient', 0, true)})") + ","
                + "{\"key\":\"Composition.author\",\"type\":\"Reference\",\"expression\":\"({reference:fhirRef('lab', 0, true)})\",\"path\":[[\"author\",\"#0\"]]}]");
        FhirProfileMapperStep lab = step("Organization", "document", "[" + field("name", "string", "'Laboratory'") + "]");
        lab.setRefName("'lab'");
        Map<String, Object> map = new HashMap<>();
        FhirProfileMapperStep shared = patient("document");
        shared.setBundleTargets(FhirJson.write(List.of(Map.of("name", "transaction"), Map.of("name", "document"))));
        String transaction = run(map, bundle("transaction", "transaction", ""), document, composition, shared, lab);
        Map<?, ?> out = (Map<?, ?>) FhirJson.parse(String.valueOf(map.get("documentJson")));
        List<?> entries = (List<?>) out.get("entry");
        assertEquals(3, entries.size());
        Map<?, ?> first = (Map<?, ?>) entries.get(0);
        Map<?, ?> res = (Map<?, ?>) first.get("resource");
        assertEquals("Composition", res.get("resourceType"));
        assertEquals(((Map<?, ?>) entries.get(1)).get("fullUrl"), ((Map<?, ?>) res.get("subject")).get("reference"));
        assertFalse(first.containsKey("request"));
        Map<?, ?> tx = (Map<?, ?>) FhirJson.parse(transaction);
        assertEquals(((Map<?, ?>) entries.get(1)).get("fullUrl"), ((Map<?, ?>) ((List<?>) tx.get("entry")).get(0)).get("fullUrl"));
    }

    private static void fails(String expected, FhirProfileMapperStep... steps) throws Exception {
        Map<String, Object> map = new HashMap<>();
        try { run(map, steps); fail("Expected " + expected); }
        catch (RuntimeException e) { assertTrue(e.toString(), e.toString().contains(expected)); }
        assertFalse("No partially validated output", map.containsKey("result"));
    }

    @Test public void anUnknownBundleIsNotCreatedImplicitly() throws Exception { fails("not initialized", patient("missing")); }
    @Test public void duplicateNamesAndOutputsAreRejected() throws Exception {
        fails("duplicate Bundle name", bundle("one", "collection", ""), bundle("one", "collection", "result"));
        fails("output already used", bundle("one", "collection", ""), bundle("two", "collection", ""));
    }
    @Test public void secondaryBundlesAreValidatedBeforeAnyOutputIsPublished() throws Exception {
        fails("Bundle bad", bundle("good", "collection", "result"), patient("good"), bundle("bad", "document", "other"));
    }
    @Test public void bundleValidationCanBeDisabledExplicitly() throws Exception {
        FhirProfileMapperStep document = bundle("document", "document", "");
        document.setValidateOutput(false);
        assertEquals("document", ((Map<?, ?>) FhirJson.parse(run(new HashMap<>(), document))).get("type"));
    }
    @Test public void unresolvedReferencesAreReported() throws Exception {
        FhirProfileMapperStep p = patient("one");
        p.setMappings("[" + field("managingOrganization", "Reference", "({reference:fhirRef('missing', 0, true)})") + "]");
        fails("unresolved reference missing", bundle("one", "collection", "result"), p);
    }
    @Test public void aTypeErrorPreventsPublishingPreviouslyBuiltResources() throws Exception {
        FhirProfileMapperStep broken = patient("one");
        broken.setMappings("[" + field("active", "boolean", "({}).missing.value") + "]");
        fails("FHIR Profile Mapper, X.active", bundle("one", "collection", "result"), patient("one"), broken);
    }
    @Test public void repeatedMessagesDoNotShareResources() throws Exception {
        FhirProfileMapperStep create = bundle("one", "collection", "");
        String a = run(new HashMap<>(), create, patient("one"));
        String b = run(new HashMap<>(), create, patient("one"));
        assertNotEquals(a, b);
    }

    @Test public void aStandaloneVariableAfterABundleDoesNotCaptureTheBundleOutput() throws Exception {
        Map<String, Object> map = new HashMap<>();
        FhirProfileMapperStep standalone = patient("");
        standalone.setVariable("patientJson");
        String out = run(map, bundle("one", "collection", ""), patient("one"), standalone);
        assertEquals("Bundle", ((Map<?, ?>) FhirJson.parse(out)).get("resourceType"));
        assertEquals("Patient", ((Map<?, ?>) FhirJson.parse(String.valueOf(map.get("patientJson")))).get("resourceType"));
    }

    @Test public void variableOnlyResultsLeaveTheInboundMessageAlone() throws Exception {
        Map<String, Object> map = new HashMap<>();
        assertTrue(run(map, bundle("one", "collection", "result"), patient("one")).startsWith("<HL7Message"));
        assertEquals("Bundle", ((Map<?, ?>) FhirJson.parse(String.valueOf(map.get("result")))).get("resourceType"));
    }

    @Test public void aFixedProfileTypeCannotBeOverridden() throws Exception {
        FhirProfileMapperStep s = bundle("one", "document", "result");
        s.setMappings("[" + field("type", "code", "'transaction'") + "]");
        fails("conflicts with", s);
    }

    @Test public void oneConstructionCanAddTheSameResourceToSeveralBundles() throws Exception {
        FhirProfileMapperStep shared = patient("one");
        shared.setBundleTargets(FhirJson.write(List.of(Map.of("name", "one", "requestMethod", "PUT", "requestUrl", "'Patient/shared'"),
                Map.of("name", "two", "requestUrl", "(function(){throw new Error('not a transaction');})()"))));
        shared.setMappings("[" + field("id", "id", "(function(){channelMap.put('builds', Number(channelMap.get('builds') || 0) + 1); return fhirUuid();})()") + "]");
        FhirProfileMapperStep observation = step("Observation", "", "[" + field("status", "code", "'final'") + ","
                + field("code", "CodeableConcept", "({text:'Laboratory observation'})") + ","
                + field("subject", "Reference", "({reference:fhirRef('patient')})") + ","
                + field("valueQuantity.value", "decimal", "'5.40'") + "]");
        observation.setBundleTargets(FhirJson.write(List.of(Map.of("name", "one"), Map.of("name", "two"))));
        Map<String, Object> map = new HashMap<>();
        String main = run(map, bundle("one", "transaction", ""), bundle("two", "collection", "second"), shared, observation);
        assertEquals(1, ((Number) map.get("builds")).intValue());
        Map<?, ?> first = (Map<?, ?>) FhirJson.parse(main);
        Map<?, ?> second = (Map<?, ?>) FhirJson.parse(String.valueOf(map.get("second")));
        List<?> a = (List<?>) first.get("entry"), b = (List<?>) second.get("entry");
        for (int i = 0; i < a.size(); i++) {
            assertEquals(((Map<?, ?>) a.get(i)).get("fullUrl"), ((Map<?, ?>) b.get(i)).get("fullUrl"));
            assertEquals(FhirJson.write(((Map<?, ?>) a.get(i)).get("resource")), FhirJson.write(((Map<?, ?>) b.get(i)).get("resource")));
            assertTrue(((Map<?, ?>) a.get(i)).containsKey("request"));
            assertFalse(((Map<?, ?>) b.get(i)).containsKey("request"));
        }
        assertTrue(main, main.contains("\"value\":5.40"));
        assertTrue(String.valueOf(map.get("second")).contains("\"value\":5.40"));
    }

    @Test public void independentlyBuiltResourcesCannotBeUsedAsOneAmbiguousReference() throws Exception {
        FhirProfileMapperStep shared = step("Observation", "", "[" + field("subject", "Reference", "({reference:fhirRef('patient')})") + "]");
        shared.setBundleTargets(FhirJson.write(List.of(Map.of("name", "one"), Map.of("name", "two"))));
        fails("differs between", bundle("one", "collection", ""), bundle("two", "collection", "result"), patient("one"), patient("two"), shared);
    }

    @Test public void duplicateTargetsAreRejected() throws Exception {
        FhirProfileMapperStep s = patient("one");
        s.setBundleTargets("[{\"name\":\"one\"},{\"name\":\"one\"}]");
        fails("nonempty and unique", bundle("one", "collection", "result"), s);
    }
}
