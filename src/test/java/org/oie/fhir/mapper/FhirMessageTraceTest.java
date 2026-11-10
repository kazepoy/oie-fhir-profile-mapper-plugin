/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.BeforeClass;
import org.junit.Test;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Scriptable;
import org.oie.fhir.mapper.util.FhirJson;

import com.mirth.connect.model.Channel;
import com.mirth.connect.model.Connector;
import com.mirth.connect.model.Transformer;

/** The trace of processed messages: shared by the traced steps of a connector, written to its connector map. */
public class FhirMessageTraceTest {
    private static final String CHANNEL = "message-trace-test";

    @BeforeClass public static void engine() { System.setProperty("fhir.engine.direct", "true"); }

    private static String field(String type, String path, String fhirType, String expression, String id) {
        String[] parts = path.split("\\.");
        StringBuilder p = new StringBuilder("[");
        for (String part : parts) { if (p.length() > 1) p.append(','); p.append("[\"").append(part).append("\"]"); }
        return "{" + (id == null ? "" : "\"id\":\"" + id + "\",") + "\"key\":\"" + type + "." + path + "\",\"type\":\"" + fhirType
                + "\",\"expression\":" + FhirJson.write(expression) + ",\"path\":" + p + "]}";
    }

    private static FhirProfileMapperStep step(String type, String target, String... fields) {
        FhirProfileMapperStep s = new FhirProfileMapperStep();
        s.setName(type);
        s.setAction("resource");
        s.setResourceType(type);
        s.setAddMetaProfile(false);
        s.setValidateOutput(false);
        s.setBundleTargets(target.isEmpty() ? "[]" : FhirJson.write(List.of(Map.of("name", target))));
        s.setMappings("[" + String.join(",", fields) + "]");
        return s;
    }

    private static FhirProfileMapperStep bundle(boolean validate) {
        FhirProfileMapperStep s = step("Bundle", "");
        s.setAction("createBundle");
        s.setBundleName("lab");
        s.setBundleType("collection");
        s.setValidateOutput(validate);
        return s;
    }

    private static FhirProfileMapperStep patient() {
        FhirProfileMapperStep s = step("Patient", "lab", field("Patient", "active", "boolean", "msg.active", "patient-active"));
        s.setRefName("'patient'");
        return s;
    }

    private static FhirProfileMapperStep observation(String status) {
        return step("Observation", "lab", field("Observation", "status", "code", status, "obs-status"),
                field("Observation", "code", "CodeableConcept", "({text:'Glucose'})", null),
                field("Observation", "subject", "Reference", "({reference: fhirRef('patient')})", "obs-subject"));
    }

    private static final class Run {
        final String output;
        final Map<String, Object> connectorMap;
        final Exception failure;
        Run(String output, Map<String, Object> connectorMap, Exception failure) { this.output = output; this.connectorMap = connectorMap; this.failure = failure; }
        Map<?, ?> trace() {
            Object json = connectorMap.get("fhirMapperTrace");
            assertNotNull("trace in the connector map", json);
            return (Map<?, ?>) FhirJson.parse(json.toString());
        }
        List<Map<?, ?>> events() {
            List<Map<?, ?>> out = new ArrayList<>();
            for (Object e : (List<?>) trace().get("events")) out.add((Map<?, ?>) e);
            return out;
        }
        List<Map<?, ?>> events(String phase) {
            List<Map<?, ?>> out = new ArrayList<>();
            for (Map<?, ?> e : events()) if (phase.equals(e.get("phase"))) out.add(e);
            return out;
        }
    }

    private static Run run(String message, FhirProfileMapperStep... steps) {
        Channel channel = new Channel();
        channel.setId(CHANNEL);
        channel.setName("Trace test");
        channel.setRevision(7);
        Connector source = new Connector("source"); source.setMetaDataId(0);
        Transformer transformer = new Transformer();
        for (int i = 0; i < steps.length; i++) {
            steps[i].setSequenceNumber(String.valueOf(i));
            transformer.getElements().add(steps[i]);
        }
        source.setTransformer(transformer); channel.setSourceConnector(source);
        FhirMapperLifecycle.deploy(channel);
        Map<String, Object> connectorMap = new HashMap<>();
        Context cx = new ContextFactory().enterContext();
        try {
            Scriptable scope = cx.initStandardObjects();
            scope.put("channelMap", scope, Context.javaToJS(new HashMap<>(), scope));
            scope.put("connectorMap", scope, Context.javaToJS(connectorMap, scope));
            StringBuilder script = new StringBuilder("var msg = " + message + "; var channelId = '" + CHANNEL + "'; var channelName = 'Trace test';\n"
                    + "var connectorMessage = {getMetaDataId:function(){return 0;}, getMessageId:function(){return 42;},"
                    + " getConnectorName:function(){return 'Source';}, getServerId:function(){return 'server-1';}};\n");
            for (FhirProfileMapperStep s : steps) script.append(s.getScript(false));
            script.append("String(msg);");
            return new Run(Context.toString(cx.evaluateString(scope, script.toString(), "transformer", 1, null)), connectorMap, null);
        } catch (Exception e) {
            return new Run(null, connectorMap, e);
        } finally { Context.exit(); FhirMapperLifecycle.undeploy(CHANNEL); }
    }

    private static <T extends FhirProfileMapperStep> T traced(T step, boolean values) {
        step.setTraceMessages(true);
        step.setTraceCaptureValues(values);
        return step;
    }

    @Test public void untracedStepsWriteNoTraceAndTracingDoesNotChangeTheResult() {
        Run plain = run("{active: 'yes'}", bundle(false), patient(), observation("'final'"));
        assertNull(plain.failure);
        assertTrue(plain.connectorMap.isEmpty());
        Run on = run("{active: 'yes'}", traced(bundle(false), false), traced(patient(), false), traced(observation("'final'"), false));
        assertNull(on.failure);
        Map<?, ?> a = (Map<?, ?>) FhirJson.parse(plain.output), b = (Map<?, ?>) FhirJson.parse(on.output);
        assertEquals(((List<?>) a.get("entry")).size(), ((List<?>) b.get("entry")).size());
        assertEquals(FhirJson.write(((Map<?, ?>) ((List<?>) a.get("entry")).get(0)).get("resource")),
                FhirJson.write(((Map<?, ?>) ((List<?>) b.get("entry")).get(0)).get("resource")));
    }

    @Test public void theTraceIsCorrelatedToTheMessageChannelRevisionAndScriptThatRan() {
        Run run = run("{active: 'yes'}", traced(bundle(false), false), traced(patient(), false), traced(observation("'final'"), false));
        assertNull(run.failure);
        Map<?, ?> trace = run.trace();
        assertEquals("channel-message", trace.get("scope"));
        assertEquals("{id=" + CHANNEL + ", name=Trace test, revision=7}", trace.get("channel").toString());
        assertEquals("{metaDataId=0, name=Source, transformer=transformer}", trace.get("connector").toString());
        assertEquals("42", trace.get("messageId").toString());
        assertEquals("server-1", trace.get("serverId"));
        List<?> steps = (List<?>) trace.get("steps");
        assertEquals(3, steps.size());
        Map<?, ?> first = (Map<?, ?>) steps.get(0);
        assertEquals("lab", first.get("bundleName"));
        assertTrue(first.get("scriptHash").toString().matches("[a-f0-9]{64}"));
        // The hash names what ran: another expression gives another hash.
        Run other = run("{active: 'yes'}", traced(bundle(false), false), traced(patient(), false), traced(observation("'preliminary'"), false));
        assertEquals(((Map<?, ?>) steps.get(1)).get("scriptHash"), ((Map<?, ?>) ((List<?>) other.trace().get("steps")).get(1)).get("scriptHash"));
        assertFalse(((Map<?, ?>) steps.get(2)).get("scriptHash").equals(((Map<?, ?>) ((List<?>) other.trace().get("steps")).get(2)).get("scriptHash")));
        for (Map<?, ?> e : run.events("value")) assertNotNull(e.get("step"));
        assertEquals("patient-active", run.events("value").get(0).get("ruleId"));
    }

    @Test public void realReferencesBundleEntriesFinalizationAndPublicationAreTraced() {
        Run run = run("{active: 'yes'}", traced(bundle(false), false), traced(patient(), false), traced(observation("'final'"), false));
        List<Map<?, ?>> entries = run.events("bundle-entry");
        assertEquals(2, entries.size());
        assertEquals("[lab]", entries.get(0).get("bundles").toString());
        assertEquals("patient", entries.get(0).get("refName"));
        Map<?, ?> reference = run.events("reference").get(0);
        assertEquals("resolved", reference.get("status"));
        assertEquals("patient", reference.get("name"));
        assertEquals(entries.get(0).get("fullUrl"), reference.get("fullUrl"));
        assertEquals("obs-subject", reference.get("ruleId")); // the rule that asked for it
        assertFalse(reference.containsKey("operation"));
        assertEquals("2", reference.get("step"));
        Map<?, ?> refs = run.events("references").get(0);
        assertEquals("passed", refs.get("status"));
        assertEquals("2", refs.get("entries").toString());
        assertEquals("skipped", run.events("validation").get(0).get("status"));
        Map<?, ?> published = run.events("publication").get(0);
        assertEquals("lab", published.get("bundle"));
        assertEquals("outbound-message", published.get("target"));
        assertEquals(3, run.events("step").size());
        for (Map<?, ?> e : run.events("step")) assertEquals("success", e.get("status"));
    }

    @Test public void aReferenceInsideAnIterationKeepsItsIndices() {
        FhirProfileMapperStep observation = observation("'final'");
        observation.setMappings(observation.getMappings().replaceFirst("\\[", "[{\"key\":\"Observation\",\"each\":\"msg.results\",\"variable\":\"r\",\"path\":[]},"));
        Run run = run("{active: 'yes', results: [1, 2]}", traced(bundle(false), false), traced(patient(), false), traced(observation, false));
        assertNull(run.failure);
        List<Map<?, ?>> references = run.events("reference");
        assertEquals(2, references.size());
        assertEquals("[{ruleIndex=0, index=1}]", references.get(1).get("iterations").toString());
    }

    @Test public void onlyTracedStepsRecordAndValuesNeedTheirStepsConsent() {
        FhirProfileMapperStep patient = patient();
        patient.setMappings("[" + field("Patient", "active", "boolean", "msg.active", "patient-active")
                + "," + field("Patient", "gender", "code", "msg.secret", null) + "]");
        Run run = run("{active: 'yes', secret: 'SECRET-unknown'}", traced(bundle(false), false), patient, traced(observation("'final'"), true));
        assertNull(run.failure);
        for (Map<?, ?> e : run.events()) assertFalse("untraced step 1: " + e, "1".equals(e.get("step")));
        assertFalse(FhirJson.write(run.trace()).contains("SECRET"));
        Map<?, ?> status = null;
        for (Map<?, ?> e : run.events("value")) if ("obs-status".equals(e.get("ruleId"))) status = e;
        assertEquals("{type=string, text=final, truncated=false}", status.get("value").toString());
        assertEquals(2, ((List<?>) run.trace().get("steps")).size());
    }

    @Test public void aFailingStepKeepsThePartialTraceAndPublishesNothing() {
        Run run = run("{active: 'maybe'}", traced(bundle(false), false), traced(patient(), false), traced(observation("'final'"), false));
        assertNotNull(run.failure);
        Map<?, ?> conversion = null;
        for (Map<?, ?> e : run.events("conversion")) if ("error".equals(e.get("status"))) conversion = e;
        assertEquals("patient-active", conversion.get("ruleId"));
        List<Map<?, ?>> steps = run.events("step");
        assertEquals("error", steps.get(steps.size() - 1).get("status"));
        assertTrue(run.events("publication").isEmpty());
        assertFalse(FhirJson.write(run.trace()).contains("maybe"));
    }

    @Test public void anUnresolvedReferenceFailsTheFinalizationInTheTrace() {
        FhirProfileMapperStep observation = observation("'final'");
        observation.setMappings(observation.getMappings().replace("fhirRef('patient')", "fhirRef('patient', 0, true)"));
        Run run = run("{active: 'yes'}", traced(bundle(false), false), traced(observation, false));
        assertNotNull(run.failure);
        assertEquals("reserved", run.events("reference").get(0).get("status"));
        Map<?, ?> refs = run.events("references").get(0);
        assertEquals("error", refs.get("status"));
        assertEquals("lab", refs.get("bundle"));
        assertTrue(run.events("publication").isEmpty());
    }

    @Test public void aLimitTruncatesTheTraceWithoutChangingTheResult() {
        StringBuilder many = new StringBuilder("[");
        many.append("{\"key\":\"Patient.name\",\"each\":\"msg.names\",\"variable\":\"n\",\"path\":[[\"name\",\"#0\"]]},");
        many.append(field("Patient", "name.family", "string", "n", null).replace("[[\"name\"],[\"family\"]]", "[[\"name\",\"#0\"],[\"family\"]]"));
        many.append("]");
        FhirProfileMapperStep s = step("Patient", "");
        s.setMappings(many.toString());
        StringBuilder names = new StringBuilder("{names: [");
        for (int i = 0; i < 800; i++) names.append(i == 0 ? "" : ",").append("'N").append(i).append("'");
        names.append("]}");
        Run run = run(names.toString(), traced(s, false));
        if (run.failure != null) fail(run.failure.toString());
        assertEquals(Boolean.TRUE, run.trace().get("truncated"));
        assertEquals(800, ((List<?>) ((Map<?, ?>) FhirJson.parse(run.output)).get("name")).size());
    }
}
