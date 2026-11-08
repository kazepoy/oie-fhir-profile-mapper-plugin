/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.mirth.connect.model.Channel;
import com.mirth.connect.model.Connector;
import com.mirth.connect.model.Transformer;
import com.mirth.connect.util.ScriptBuilderException;
import org.junit.Test;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Scriptable;
import org.oie.fhir.mapper.util.FhirJson;

/** Execute the JSON examples published with the specification, without rewriting their rules. */
public class MappingSpecificationTest {
    private static final Path EXAMPLES = Path.of("docs", "examples", "mapping");

    private String run(String filename, Map<String, Object> channelMap) throws Exception {
        Object json = FhirJson.parse(Files.readString(EXAMPLES.resolve(filename)));
        List<?> entries = json instanceof List ? (List<?>) json : List.of(json);
        Channel channel = new Channel();
        channel.setId("mapping-specification-test");
        Connector source = new Connector("source");
        source.setMetaDataId(0);
        Transformer transformer = new Transformer();
        for (int i = 0; i < entries.size(); i++) {
            FhirProfileMapperStep step = FhirProfileMapperStep.fromJson(FhirJson.write(entries.get(i)));
            step.setSequenceNumber(String.valueOf(i));
            transformer.getElements().add(step);
        }
        source.setTransformer(transformer);
        channel.setSourceConnector(source);
        FhirMapperLifecycle.deploy(channel);
        Context cx = new ContextFactory().enterContext();
        try {
            cx.setOptimizationLevel(-1);
            Scriptable scope = cx.initStandardObjects();
            scope.put("channelMap", scope, Context.javaToJS(channelMap, scope));
            StringBuilder script = new StringBuilder("var msg = ")
                    .append(Files.readString(EXAMPLES.resolve("source.json"))).append(";\n")
                    .append("var channelId = 'mapping-specification-test';\n")
                    .append("var connectorMessage = {getMetaDataId:function(){return 0;}};\n");
            for (var step : transformer.getElements()) script.append(step.getScript(false));
            script.append("String(msg);");
            return Context.toString(cx.evaluateString(scope, script.toString(), filename, 1, null));
        } finally {
            Context.exit();
            FhirMapperLifecycle.undeploy(channel.getId());
        }
    }

    @Test public void documentedPatientMapsTheSourceAndConvertsItsDate() throws Exception {
        Map<?, ?> patient = (Map<?, ?>) FhirJson.parse(run("patient.step.json", new HashMap<>()));
        assertEquals("Patient", patient.get("resourceType"));
        assertEquals("patient-42", patient.get("id"));
        assertEquals("1985-04-12", patient.get("birthDate"));
        assertEquals("Durand", ((Map<?, ?>) ((List<?>) patient.get("name")).get(0)).get("family"));
    }

    @Test public void documentedBundleContainsThePatientAndTwoObservationsWithExactDecimals() throws Exception {
        String output = run("laboratory.steps.json", new HashMap<>());
        Map<?, ?> bundle = (Map<?, ?>) FhirJson.parse(output);
        assertEquals("transaction", bundle.get("type"));
        List<?> entries = (List<?>) bundle.get("entry");
        assertEquals(3, entries.size());
        Map<?, ?> patientEntry = (Map<?, ?>) entries.get(0);
        assertEquals("Patient", ((Map<?, ?>) patientEntry.get("resource")).get("resourceType"));
        for (int i = 1; i < entries.size(); i++) {
            Map<?, ?> entry = (Map<?, ?>) entries.get(i);
            Map<?, ?> observation = (Map<?, ?>) entry.get("resource");
            assertEquals("Observation", observation.get("resourceType"));
            assertEquals("final", observation.get("status"));
            assertEquals(patientEntry.get("fullUrl"), ((Map<?, ?>) observation.get("subject")).get("reference"));
            assertEquals("POST", ((Map<?, ?>) entry.get("request")).get("method"));
            assertEquals("Observation", ((Map<?, ?>) entry.get("request")).get("url"));
        }
        assertTrue(output, output.contains("\"value\":6.80"));
        assertTrue(output, output.contains("\"value\":4.10"));
    }

    @Test public void documentedInvalidPathIsRejectedByTheCompiler() throws Exception {
        FhirProfileMapperStep step = FhirProfileMapperStep.fromJson(Files.readString(EXAMPLES.resolve("invalid-path.step.json")));
        try {
            step.getScript(false);
            fail("Expected an invalid path segment");
        } catch (ScriptBuilderException error) {
            assertTrue(error.getMessage(), error.getMessage().contains("invalid path segment in Patient.active"));
        }
    }

    @Test public void documentedUnresolvedReferenceFailsEvenWithoutFhirValidation() throws Exception {
        Map<String, Object> channelMap = new HashMap<>();
        try {
            run("unresolved-reference.steps.json", channelMap);
            fail("Expected an unresolved reference");
        } catch (RuntimeException error) {
            assertTrue(error.toString(), error.toString().contains("unresolved reference missing-patient[0]"));
        }
        assertFalse("No partial result may be published", channelMap.containsKey("result"));
    }
}
