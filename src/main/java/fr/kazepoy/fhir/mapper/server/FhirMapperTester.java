/*
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * https://mozilla.org/MPL/2.0/.
 */

package fr.kazepoy.fhir.mapper.server;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.JavaScriptException;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import fr.kazepoy.fhir.mapper.util.FhirJson;
import fr.kazepoy.fhir.mapper.FhirProfileMapperStep;
import fr.kazepoy.fhir.mapper.fhir.FhirFacade;
import fr.kazepoy.fhir.mapper.fhir.FhirValidation;

/**
 * The checks of the FHIR Profile Mapper editor: the generated script with its syntax errors, and a
 * run of the step on a sample message with the validation of what it makes. The run is a sandbox
 * like a transformer: msg, tmp (no template), the maps and their $ functions, the configuration map
 * and the code templates of the server, and at most {@link #TIME_LIMIT_MILLIS} of work.
 */
public final class FhirMapperTester {

    static final long TIME_LIMIT_MILLIS = 10_000;

    private static final Logger logger = LogManager.getLogger(FhirMapperTester.class);

    /** Provides the code templates and the configuration map; the server's, or none in tests. */
    interface Environment {
        List<String> functions();

        Map<String, String> configuration();

        String serialize(String dataType, String message) throws Exception;
    }

    private FhirMapperTester() {}

    /** {"script": the generated script, "errors": [{"key", "line", "message"}]} for a step as JSON. */
    public static String script(String stepJson) {
        Map<String, Object> out = new LinkedHashMap<>();
        List<Object> errors = new ArrayList<>();
        FhirProfileMapperStep step = null;
        try {
            step = FhirProfileMapperStep.fromJson(stepJson);
            String script = step.getScript(false);
            out.put("script", script);
            Context cx = new LimitedFactory().enterContext();
            try {
                cx.compileString("function doTransform() {\n" + script + "\n}", "step", 0, null);
            } catch (EvaluatorException e) {
                errors.add(error(step, script, e.lineNumber(), e.details(), "syntax", e));
            } finally {
                Context.exit();
            }
        } catch (Exception e) {
            errors.add(error(step, null, 0, e.getMessage(), "configuration", null));
        }
        out.put("errors", errors);
        return FhirJson.write(out);
    }

    /**
     * Runs a step on a message: {"step": {...}, "message": "...", "dataType": "HL7V2" | "XML" | "JSON" | "RAW"}.
     * Answers {"output": the outbound message, "issues": [{"severity", "location", "message"}], "errors": [...]}.
     */
    public static String test(String requestJson, Environment environment) {
        Map<String, Object> out = new LinkedHashMap<>();
        List<Object> errors = new ArrayList<>();
        List<Object> issues = new ArrayList<>();
        out.put("output", null);
        out.put("validationPerformed", false);
        FhirProfileMapperStep step = null;
        String phase = "configuration";
        FhirMapperTrace trace = null;
        long testStarted = System.nanoTime();
        try {
            Object parsed = FhirJson.parse(requestJson);
            if (!(parsed instanceof Map)) {
                throw new IllegalArgumentException("The test request is not a JSON object.");
            }
            Map<?, ?> request = (Map<?, ?>) parsed;
            if (request.containsKey("steps")) return testTransformer(request, environment);
            trace = FhirMapperTrace.from(request.get("trace"), request.get("step"));
            step = FhirProfileMapperStep.fromJson(FhirJson.write(request.get("step")));
            // Preview this step's resource without assembling the other steps or publishing results.
            step.setVariable("");
            String dataType = text(request.get("dataType")).isEmpty() ? "HL7V2" : text(request.get("dataType")).toUpperCase();
            String message = text(request.get("message"));
            String script = step.getPreviewScript();

            Context cx = new LimitedFactory().enterContext();
            String result;
            try {
                Scriptable scope = cx.initStandardObjects();
                if (trace != null) scope.put("__fhirMapperTrace", scope, Context.javaToJS(trace, scope));
                Map<String, Object> channelMap = new HashMap<>();
                phase = "input";
                long inputStarted = System.nanoTime();
                scope.put("__message", scope, environment.serialize(dataType, message));
                scope.put("__dataType", scope, dataType);
                scope.put("channelMap", scope, Context.javaToJS(channelMap, scope));
                scope.put("sourceMap", scope, Context.javaToJS(new HashMap<>(), scope));
                scope.put("connectorMap", scope, Context.javaToJS(new HashMap<>(), scope));
                scope.put("responseMap", scope, Context.javaToJS(new HashMap<>(), scope));
                scope.put("globalMap", scope, Context.javaToJS(new HashMap<>(), scope));
                scope.put("globalChannelMap", scope, Context.javaToJS(new HashMap<>(), scope));
                scope.put("configurationMap", scope, Context.javaToJS(new HashMap<>(environment.configuration()), scope));
                scope.put("logger", scope, Context.javaToJS(logger, scope));
                try {
                    cx.evaluateString(scope, SANDBOX + ISOLATED_REFERENCES, "sandbox", 1, null);
                } catch (RuntimeException e) {
                    throw new IllegalArgumentException("The sample message cannot be read as " + dataType + ": " + e.getMessage(), e);
                }
                if (trace != null) trace.phase("input", "success", inputStarted, "parsed");
                for (String function : environment.functions()) {
                    try {
                        cx.evaluateString(scope, function, "code template", 1, null);
                    } catch (RhinoException e) {
                        // a code template that does not compile here: its functions are missing in the test
                    }
                }
                phase = "execution";
                long executionStarted = System.nanoTime();
                try {
                    Object value = cx.evaluateString(scope, "function doTransform() {\n" + script + "\n}\ndoTransform();\n" + RESULT, "step", 0, null);
                    result = value == null || value instanceof org.mozilla.javascript.Undefined ? null : Context.toString(value);
                } catch (RhinoException e) {
                    errors.add(error(step, script, e.lineNumber(), e.details(), e instanceof EvaluatorException ? "syntax" : "execution", e));
                    result = null;
                } catch (TimeLimit e) {
                    errors.add(error(step, null, 0, e.getMessage(), "timeout", null));
                    result = null;
                }
                if (trace != null) trace.phase("execution", errors.isEmpty() ? "success" : "error", executionStarted, "preview");
                if (!text(step.getVariable()).isEmpty()) {
                    Object variable = channelMap.get(step.getVariable().trim());
                    result = variable == null ? null : variable.toString();
                }
            } finally {
                Context.exit();
            }
            out.put("output", result);
            if (result != null && (result.trim().startsWith("{") || result.trim().startsWith("<"))) {
                if (step.isValidateOutput()) {
                    out.put("validationPerformed", true);
                    long validationStarted = System.nanoTime();
                    try {
                        FhirValidation validation = FhirFacade.validate(result, "", step.effectiveProfiles(), step.effectiveFhirVersion());
                        if (trace != null) trace.phase("validation", validation.isValid() ? "passed" : "failed", validationStarted, "FHIR");
                        for (Map<String, String> issue : validation.getIssues()) {
                            Map<String, Object> i = new LinkedHashMap<>();
                            i.put("severity", issue.get("severity"));
                            i.put("location", issue.get("location"));
                            i.put("message", issue.get("message"));
                            issues.add(i);
                        }
                    } catch (Exception e) {
                        errors.add(error(step, null, 0, "Validation: " + e.getMessage(), "validation", null));
                        if (trace != null) trace.phase("validation", "error", validationStarted, "exception");
                    }
                } else if (trace != null) {
                    trace.phase("validation", "skipped", System.nanoTime(), "disabled");
                }
            } else if (result != null && errors.isEmpty()) {
                errors.add(error(step, null, 0, "The step made no FHIR resource from this message (the inbound message is unchanged).", "execution", null));
            }
        } catch (Exception e) {
            errors.add(error(step, null, 0, e.getMessage(), phase, null));
            if (trace != null) trace.phase(phase, "error", testStarted, "diagnostic");
        }
        out.put("issues", issues);
        out.put("errors", errors);
        if (trace != null) out.put("trace", trace.result());
        return FhirJson.write(out);
    }

    /** Ordered Profile Mapper steps, using their deployed assembly and atomic publication. */
    private static String testTransformer(Map<?, ?> request, Environment environment) {
        Map<String, Object> out = new LinkedHashMap<>();
        List<Object> errors = new ArrayList<>();
        List<Object> results = new ArrayList<>();
        Map<String, Object> variables = new LinkedHashMap<>();
        out.put("output", FhirJson.NULL);
        out.put("validationPerformed", false);
        out.put("issues", List.of());
        out.put("steps", results);
        out.put("variables", variables);
        out.put("errors", errors);
        FhirProfileMapperStep current = null;
        FhirMapperTrace trace = null;
        String script = null;
        String phase = "configuration";
        try {
            if (request.containsKey("step")) throw new IllegalArgumentException("Choose step or steps, not both.");
            if (!(request.get("steps") instanceof List) || ((List<?>) request.get("steps")).isEmpty())
                throw new IllegalArgumentException("steps must be a nonempty ordered array of Profile Mapper steps.");
            trace = FhirMapperTrace.from(request.get("trace"), request.get("steps"));
            if (trace != null) trace.transformerPreview();
            List<FhirProfileMapperStep> steps = new ArrayList<>();
            for (Object raw : (List<?>) request.get("steps")) {
                current = null;
                script = null;
                if (!(raw instanceof Map)) throw new IllegalArgumentException("Each step must be an object.");
                Map<?, ?> fields = (Map<?, ?>) raw;
                if (fields.containsKey("__type") && !"fr.kazepoy.fhir.mapper.FhirProfileMapperStep".equals(text(fields.get("__type"))))
                    throw new IllegalArgumentException("Only Profile Mapper steps are accepted in steps.");
                if ("false".equals(text(fields.get("enabled")))) continue;
                current = FhirProfileMapperStep.fromJson(FhirJson.write(fields));
                if (text(current.getSequenceNumber()).isEmpty()) current.setSequenceNumber(String.valueOf(steps.size()));
                steps.add(current);
            }
            if (steps.isEmpty()) throw new IllegalArgumentException("No enabled Profile Mapper step to test.");
            String dataType = text(request.get("dataType")).isEmpty() ? "HL7V2" : text(request.get("dataType")).toUpperCase();
            Map<String, Object> channelMap = new HashMap<>();
            Context cx = new LimitedFactory().enterContext();
            try {
                Scriptable scope = cx.initStandardObjects();
                if (trace != null) scope.put("__fhirMapperTrace", scope, Context.javaToJS(trace, scope));
                phase = "input";
                scope.put("__message", scope, environment.serialize(dataType, text(request.get("message"))));
                scope.put("__dataType", scope, dataType);
                scope.put("channelMap", scope, Context.javaToJS(channelMap, scope));
                for (String map : List.of("sourceMap", "connectorMap", "responseMap", "globalMap", "globalChannelMap"))
                    scope.put(map, scope, Context.javaToJS(new HashMap<>(), scope));
                scope.put("configurationMap", scope, Context.javaToJS(new HashMap<>(environment.configuration()), scope));
                scope.put("logger", scope, Context.javaToJS(logger, scope));
                cx.evaluateString(scope, SANDBOX, "sandbox", 1, null);
                for (String function : environment.functions()) {
                    try { cx.evaluateString(scope, function, "code template", 1, null); }
                    catch (RhinoException ignored) { /* Same code-template tolerance as isolated previews. */ }
                }
                for (int i = 0; i < steps.size(); i++) {
                    current = steps.get(i);
                    phase = "configuration";
                    script = current.getTransformerPreviewScript(i == steps.size() - 1);
                    List<String> resources = new ArrayList<>();
                    scope.put("__fhirMapperStepResults", scope, Context.javaToJS(resources, scope));
                    scope.put("__fhirMapperFinalizing", scope, false);
                    Map<String, Object> info = Map.of("name", text(current.getName()), "sequenceNumber", text(current.getSequenceNumber()),
                            "resourceType", text(current.getResourceType()), "action", text(current.getAction()));
                    if (trace != null) trace.previewStep(FhirJson.write(info));
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("step", info);
                    result.put("resources", resources);
                    results.add(result);
                    phase = "execution";
                    try {
                        cx.evaluateString(scope, script, "step", 1, null);
                    } catch (RhinoException e) {
                        boolean finalizing = Boolean.TRUE.equals(scope.get("__fhirMapperFinalizing", scope));
                        errors.add(error(current, script, e.lineNumber(), e.details(), e instanceof EvaluatorException ? "syntax" : finalizing ? "finalization" : "execution", e));
                        break;
                    } catch (TimeLimit e) {
                        errors.add(error(current, null, 0, e.getMessage(), "timeout", null));
                        break;
                    }
                }
                if (errors.isEmpty()) {
                    Object value = cx.evaluateString(scope, RESULT, "result", 1, null);
                    // Variable-only transforms do not publish an outbound FHIR message.
                    boolean outbound = false;
                    boolean validated = false;
                    for (int i = 0; i < steps.size(); i++) {
                        FhirProfileMapperStep step = steps.get(i);
                        boolean produced = !((List<?>) ((Map<?, ?>) results.get(i)).get("resources")).isEmpty();
                        boolean publishes = "createBundle".equals(step.getAction()) || step.getTargets().isEmpty();
                        if (produced && publishes) {
                            outbound |= text(step.getVariable()).trim().isEmpty();
                            validated |= step.isValidateOutput();
                        }
                    }
                    if (outbound) out.put("output", Context.toString(value));
                    for (FhirProfileMapperStep step : steps) {
                        String target = text(step.getVariable()).trim();
                        if (!target.isEmpty() && channelMap.containsKey(target)) variables.put(target, channelMap.get(target).toString());
                    }
                    out.put("validationPerformed", validated);
                }
            } finally { Context.exit(); }
        } catch (TimeLimit e) {
            errors.add(error(current, null, 0, e.getMessage(), "timeout", null));
        } catch (Exception e) {
            errors.add(error(current, script, 0, e.getMessage(), phase, null));
        }
        if (trace != null) out.put("trace", trace.result());
        return FhirJson.write(out);
    }

    private static Map<String, Object> error(FhirProfileMapperStep step, String script, int line, String message, String phase, RhinoException cause) {
        Map<String, Object> e = new LinkedHashMap<>();
        Map<?, ?> diagnostic = null;
        if (cause instanceof JavaScriptException && ((JavaScriptException) cause).getValue() instanceof Scriptable) {
            Object value = ScriptableObject.getProperty((Scriptable) ((JavaScriptException) cause).getValue(), "fhirMapperDiagnostic");
            if (value instanceof String) diagnostic = (Map<?, ?>) FhirJson.parse((String) value);
        }
        if (diagnostic == null && script != null && "syntax".equals(phase)) {
            diagnostic = FhirProfileMapperStep.diagnosticAt(script, line);
        }
        for (String field : List.of("key", "ruleId", "ruleIndex", "path", "expression", "operation", "errorType")) {
            Object value = diagnostic == null ? null : diagnostic.get(field);
            e.put(field, value == null ? FhirJson.NULL : value);
        }
        if (diagnostic != null && !"syntax".equals(phase)) phase = String.valueOf(diagnostic.get("phase"));
        e.put("phase", phase);
        e.put("step", step == null ? FhirJson.NULL : Map.of(
                "name", text(step.getName()), "sequenceNumber", text(step.getSequenceNumber()),
                "resourceType", text(step.getResourceType()), "action", text(step.getAction())));
        e.put("line", line <= 0 ? FhirJson.NULL : String.valueOf(line));
        e.put("message", message == null ? "" : message);
        return e;
    }

    private static String text(Object value) {
        return value == null || value == FhirJson.NULL ? "" : value.toString();
    }

    /**
     * msg as a transformer has it for the data type, and the functions of the transformer scope the
     * expressions most use. fhirRef gives a stand-in urn:uuid for a name an earlier step would add:
     * the test runs this step alone.
     */
    private static final String SANDBOX = String.join("\n",
            "var msg = __dataType == 'JSON' ? JSON.parse(__message) : (__dataType == 'RAW' ? String(__message) : new XML(__message));",
            "if (typeof msg === 'xml' && msg.namespace('') != undefined) { default xml namespace = msg.namespace(''); }",
            "function $c(k, v) { if (arguments.length > 1) { channelMap.put(k, v); return v; } return channelMap.get(k); }",
            "function $s(k, v) { if (arguments.length > 1) { sourceMap.put(k, v); return v; } return sourceMap.get(k); }",
            "function $co(k, v) { if (arguments.length > 1) { connectorMap.put(k, v); return v; } return connectorMap.get(k); }",
            "function $r(k, v) { if (arguments.length > 1) { responseMap.put(k, v); return v; } return responseMap.get(k); }",
            "function $g(k, v) { if (arguments.length > 1) { globalMap.put(k, v); return v; } return globalMap.get(k); }",
            "function $gc(k, v) { if (arguments.length > 1) { globalChannelMap.put(k, v); return v; } return globalChannelMap.get(k); }",
            "function $cfg(k) { return configurationMap.get(k); }",
            "function $(k) { var maps = [responseMap, connectorMap, channelMap, sourceMap, globalChannelMap, globalMap, configurationMap];",
            "  for (var i = 0; i < maps.length; i++) { if (maps[i].containsKey(k)) { return maps[i].get(k); } } return ''; }");

    private static final String ISOLATED_REFERENCES = String.join("\n",
            "function fhirRef(name, index) {",
            "  return 'urn:uuid:' + java.util.UUID.nameUUIDFromBytes(new java.lang.String('fhir-profile-mapper-test:' + name + ':' + (index || 0)).getBytes('UTF-8')); }",
            "function fhirRefs(name) { return [fhirRef(name)]; }");

    /** What the engine takes as the outbound message: msg (no template in the test), as text. */
    private static final String RESULT = String.join("\n",
            "var __t = Object.prototype.toString.call(msg);",
            "typeof msg === 'xml' ? msg.toXMLString() : (__t == '[object Object]' || __t == '[object Array]' ? JSON.stringify(msg) : String(msg));");

    /** Interpreted (a large step stays under the size limit of compiled methods), and at most TIME_LIMIT_MILLIS. */
    private static final class LimitedFactory extends ContextFactory {
        private final long start = System.nanoTime();

        @Override
        protected Context makeContext() {
            Context cx = super.makeContext();
            cx.setOptimizationLevel(-1);
            cx.setInstructionObserverThreshold(10_000);
            return cx;
        }

        @Override
        protected void observeInstructionCount(Context cx, int instructionCount) {
            if (System.nanoTime() - start > TIME_LIMIT_MILLIS * 1_000_000L) {
                throw new TimeLimit();
            }
        }
    }

    /** Thrown into the script when the test takes too long: an Error, so that scripts cannot catch it. */
    private static final class TimeLimit extends Error {
        private static final long serialVersionUID = 1L;

        TimeLimit() {
            super("The test took longer than " + TIME_LIMIT_MILLIS / 1000 + " seconds and was stopped.");
        }
    }
}
