/*
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * https://mozilla.org/MPL/2.0/.
 */

package fr.kazepoy.fhir.mapper;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import fr.kazepoy.fhir.mapper.util.FhirJson;
import fr.kazepoy.fhir.mapper.fhir.FhirFacade;

import com.mirth.connect.model.Step;
import com.mirth.connect.util.ScriptBuilderException;

/**
 * Transformer step that builds FHIR resources conforming to a profile: the web administrator shows
 * the element tree of the profile, and each element gets a JavaScript expression, usually a path in
 * the inbound message (msg['PID']['PID.5']['PID.5.1']). Fixed and pattern values of the profile
 * (slice discriminators, extension URLs) are added to every entry that got a mapped value.
 *
 * A repeating element can iterate: one entry per item of a list (msg['PID']['PID.3']), with the item
 * and its index as variables for the expressions below it. Any element can have a condition: what is
 * below it is only mapped when it holds (per item of an iteration). The resource itself can iterate
 * (one resource per OBX) and have a condition. A value can be translated with ConceptMap/$translate
 * on the {@link #getTerminologyServer() terminology server}, or without one (empty or "n/a") locally
 * on the ConceptMaps of the {@link #getProfiles() profiles}. Without a match the element stays
 * empty, keeps the source code, gets a fixed value or the result of an expression (a function
 * call), or the message gets an error.
 *
 * Explicit actions create named Bundles or build resources. Resources optionally target Bundles;
 * standalone resources and completed Bundles are validated and published after the last mapper.
 * Each Bundle owns its type, target output and reference names. The graphical editor serializes
 * mappings; this class compiles those mappings and embeds the shared JavaScript runtime.
 *
 * {@link #getMappings() mappings} is JSON, written by the web administrator: an array of
 * <pre>
 * {"key": "Patient.identifier:ipp.value", "type": "string", "expression": "msg[...]",
 *  "path": [["identifier", "ipp#0"], ["value"]]}
 * {"key": "Patient.gender", "type": "code", "expression": "msg[...]", "path": [["gender"]],
 *  "translate": {"conceptMap": "http://...", "source": "http://...", "target": "", "unmapped": "none", "keepSource": false}}
 *  (unmapped: none, source, fixed or function with "value": "system|code" or an expression of code and system, error)
 * {"key": "Patient.identifier", "each": "msg['PID']['PID.3']", "variable": "item", "path": [["identifier", "#0"]]}
 * {"key": "Patient.identifier", "condition": "item['PID.3.5'].toString() == 'PI'", "path": [["identifier", "#0"]]}
 * {"key": "Observation", "each": "msg['OBX']", "variable": "obx", "path": []}   (the resource)
 * {"key": "Patient.identifier:ipp.system", "fixed": "urn:oid:...", "when": 1, "path": [...]}
 * </pre>
 * A path segment is [name] or [name, item]: an item of a repeating element. A fixed value is only
 * set when the first {@code when} segments of its path exist. An entry belongs to the innermost
 * iteration or condition whose key is its key or a prefix of it (followed by '.').
 */
public class FhirProfileMapperStep extends Step {

    public static final String PLUGIN_POINT = "FHIR Profile Mapper";

    public static String functionCatalog() {
        try (InputStream in = FhirProfileMapperStep.class.getResourceAsStream("mapper-functions.json")) {
            if (in == null) throw new IllegalStateException("mapper-functions.json is missing.");
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) { throw new UncheckedIOException(e); }
    }

    private static final String RUNTIME_RESOURCE = "profile-mapper-runtime.js";
    /** Before the code of each element in the script, so that an error line leads to the element. */
    private static final String KEY_COMMENT = "//@ ";
    private static final String DIAGNOSTIC_COMMENT = "//~fhir ";
    private static String runtime;

    private static final Pattern IDENTIFIER = Pattern.compile("[A-Za-z_$][A-Za-z0-9_$]*");
    /** Not usable as the variable of an iteration: the transformer's own variables and JavaScript words. */
    private static final Set<String> RESERVED = new HashSet<>(Arrays.asList("msg", "tmp", "await", "break", "case", "catch", "class", "const",
            "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "function", "if",
            "import", "in", "instanceof", "let", "new", "null", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof",
            "var", "void", "while", "with", "yield"));
    private static final Set<String> UNMAPPED = new HashSet<>(Arrays.asList("none", "source", "fixed", "function", "error"));
    private static final Set<String> BUNDLE_TYPES = new HashSet<>(Arrays.asList("transaction", "batch", "collection", "document", "message"));
    private static final Set<String> METHODS = new HashSet<>(Arrays.asList("POST", "PUT", "PATCH", "DELETE", "GET", "HEAD"));

    private String fhirVersion = "R4";
    private String profiles = "";
    private String profileUrl = "";
    private String profileVersion = "";
    private String resourceType = "";
    private boolean addMetaProfile = true;
    private Boolean validateOutput = true;
    private boolean setLastUpdated = false;
    private String variable = "";
    private String action = "resource";
    private String bundleName = "";
    private String bundleTargets = "[]";
    private String bundleType = "transaction";
    private String refName = "";
    private String terminologyServer = "";
    private String terminologyAuthorization = "";
    private int terminologyCacheSeconds = 300;
    private int terminologyTimeoutSeconds = 10;
    private String mappings = "[]";
    private boolean traceMessages = false;
    private boolean traceCaptureValues = false;
    /** Sample messages of the step with their expected results, as a JSON array text; used by the editor and the tools only. */
    private String samples = "[]";
    /** Version of the step format: absent (1) in older exports, 2 since contexts and the validation policy. */
    private Integer formatVersion;
    /** Name of a FHIR context of the server; blank: this step's own packages and terminology settings. */
    private String context = "";
    /** inherit (the context decides), always or off; blank in format 1: validateOutput decides. */
    private String validation = "";

    public FhirProfileMapperStep() {}

    public FhirProfileMapperStep(FhirProfileMapperStep props) {
        super(props);
        fhirVersion = props.getFhirVersion();
        profiles = props.getProfiles();
        profileUrl = props.getProfileUrl();
        profileVersion = props.getProfileVersion();
        resourceType = props.getResourceType();
        addMetaProfile = props.isAddMetaProfile();
        validateOutput = props.isValidateOutput();
        setLastUpdated = props.isSetLastUpdated();
        variable = props.getVariable();
        action = props.getAction();
        bundleName = props.getBundleName();
        bundleTargets = props.getBundleTargets();
        bundleType = props.getBundleType();
        refName = props.getRefName();
        terminologyServer = props.getTerminologyServer();
        terminologyAuthorization = props.getTerminologyAuthorization();
        terminologyCacheSeconds = props.getTerminologyCacheSeconds();
        terminologyTimeoutSeconds = props.getTerminologyTimeoutSeconds();
        mappings = props.getMappings();
        traceMessages = props.isTraceMessages();
        traceCaptureValues = props.isTraceCaptureValues();
        samples = props.getSamples();
        formatVersion = props.formatVersion;
        context = props.getContext();
        validation = props.getValidation();
    }

    /** The resource, or an iteration or condition: what its entries are and in which order. */
    private static final class Scope {
        final String key;
        /** The iteration of the element, or null. */
        final Map<?, ?> iteration;
        /** The condition on the element (per item when it iterates), or null. */
        final String condition;
        /** The path length of the element; with an iteration its last segment gets the index. */
        final int depth;
        /** Internal counter, independent of the user variable so nested names can repeat. */
        final String indexVariable;
        Scope parent;
        /** Value entries (Map) and iterations or conditions (Scope), in tree order. */
        final List<Object> items = new ArrayList<>();
        final List<Map<?, ?>> fixed = new ArrayList<>();

        Scope(String key, Map<?, ?> iteration, String condition, int depth, String indexVariable) {
            this.key = key;
            this.iteration = iteration;
            this.condition = condition;
            this.depth = depth;
            this.indexVariable = indexVariable;
        }

        boolean contains(String other) {
            return key == null || other.equals(key) || other.startsWith(key + ".");
        }
    }

    @Override
    public String getScript(boolean loadFiles) throws ScriptBuilderException {
        return compileScript(false, false, false);
    }

    /** Builds this step's resource alone, for the editor preview and rule-level tests. */
    public String getPreviewScript() throws ScriptBuilderException {
        return compileScript(true, false, false);
    }

    /** Uses deployed assembly semantics without registering a fictitious deployed channel. */
    public String getTransformerPreviewScript(boolean last) throws ScriptBuilderException {
        return compileScript(false, true, last);
    }

    private String compileScript(boolean preview, boolean transformerPreview, boolean last) throws ScriptBuilderException {
        if (resourceType == null || resourceType.trim().isEmpty()) {
            throw new ScriptBuilderException("FHIR Profile Mapper \"" + getName() + "\": no profile has been loaded (the resource type is empty).");
        }
        List<?> entries;
        try {
            Object parsed = FhirJson.parse(mappings == null || mappings.trim().isEmpty() ? "[]" : mappings);
            if (!(parsed instanceof List)) {
                throw new IllegalArgumentException("not a JSON array");
            }
            entries = (List<?>) parsed;
        } catch (IllegalArgumentException e) {
            throw new ScriptBuilderException("FHIR Profile Mapper \"" + getName() + "\": the mappings are invalid: " + e.getMessage(), e);
        }
        boolean create = "createBundle".equals(text(action));
        if (!create && !"resource".equals(text(action))) {
            throw error("unknown action \"" + action + "\"");
        }
        if (create && !"Bundle".equals(resourceType.trim())) {
            throw error("Create a Bundle needs a Bundle target profile.");
        }
        if (create && text(bundleName).isEmpty()) {
            throw error("give the Bundle a name.");
        }
        List<BundleTarget> targets;
        try { targets = getTargets(); }
        catch (IllegalArgumentException e) { throw error(e.getMessage()); }
        if (create && !targets.isEmpty()) throw error("a Bundle creation cannot target other Bundles.");
        if (!create && !text(bundleName).isEmpty()) throw error("bundleName names a creation; use bundleTargets to add a resource.");
        boolean bundle = create || !targets.isEmpty();
        if (create && !BUNDLE_TYPES.contains(text(bundleType))) {
            throw error("unknown Bundle type \"" + bundleType + "\"");
        }

        // The iterations and conditions per element; those on the resource itself (empty path) apart.
        Map<?, ?> resourceIteration = null;
        String resourceCondition = null;
        Map<?, ?> resourceConditionRule = null;
        Map<String, Map<?, ?>> iterations = new HashMap<>();
        Map<String, String> conditions = new HashMap<>();
        Map<String, Integer> depths = new HashMap<>();
        Set<String> ruleIds = new HashSet<>();
        for (Object entry : entries) {
            Map<?, ?> m = entry(entry);
            if (disabled(m)) continue;
            if (m.containsKey("id") && (!(m.get("id") instanceof String)
                    || !text(m.get("id")).matches("[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}") || !ruleIds.add(text(m.get("id"))))) {
                throw error("rule ids must be valid and unique: " + text(m.get("id")));
            }
            String key = key(m);
            boolean root = ((List<?>) m.get("path")).isEmpty();
            if (m.containsKey("each") && !text(m.get("each")).trim().isEmpty()) {
                String var = text(m.get("variable")).trim();
                if (!IDENTIFIER.matcher(var).matches() || RESERVED.contains(var) || var.startsWith("__")) {
                    throw error("the variable of the iteration on " + key + " must be a JavaScript name (not msg or tmp): \"" + var + "\"");
                }
                if (root) {
                    if (!bundle) {
                        throw error("one resource per item needs a named Bundle target");
                    }
                    resourceIteration = m;
                    continue;
                }
                List<?> path = (List<?>) m.get("path");
                if (!(path.get(path.size() - 1) instanceof List) || ((List<?>) path.get(path.size() - 1)).size() != 2) {
                    throw error(key + " does not repeat: it cannot iterate");
                }
                if (iterations.put(key, m) != null) {
                    throw error("two iterations on " + key);
                }
                depths.put(key, path.size());
            } else if (m.containsKey("condition") && !text(m.get("condition")).trim().isEmpty()) {
                if (root) {
                    resourceCondition = text(m.get("condition")).trim();
                    resourceConditionRule = m;
                    continue;
                }
                conditions.put(key, text(m.get("condition")).trim());
                depths.put(key, ((List<?>) m.get("path")).size());
            }
        }
        Scope resource = new Scope(null, null, null, 0, null);
        Map<String, Scope> scopes = new LinkedHashMap<>();
        List<String> scoped = new ArrayList<>(depths.keySet());
        scoped.sort((a, b) -> a.length() - b.length()); // outer ones first, so that each finds the one it is in
        for (String key : scoped) {
            Map<?, ?> it = iterations.get(key);
            Scope scope = new Scope(key, it, conditions.get(key), depths.get(key), it == null ? null : "__index" + scopes.size());
            scope.parent = innermost(scopes.values(), resource, key, true);
            scopes.put(key, scope);
        }
        Set<String> placed = new HashSet<>();
        for (Object entry : entries) {
            Map<?, ?> m = entry(entry);
            if (disabled(m)) continue;
            String key = key(m);
            if (((List<?>) m.get("path")).isEmpty()) {
                continue;
            }
            if (m.containsKey("each") || m.containsKey("condition")) {
                Scope scope = scopes.get(key);
                if (scope != null && placed.add(key)) {
                    scope.parent.items.add(scope);
                }
            } else if (m.containsKey("fixed")) {
                innermost(scopes.values(), resource, key, false).fixed.add(m);
            } else if (!text(m.get("expression")).trim().isEmpty()) {
                innermost(scopes.values(), resource, key, false).items.add(m);
            }
        }

        String var = resourceIteration == null ? "" : text(resourceIteration.get("variable")).trim();
        String params = resourceIteration == null ? "" : var + ", " + var + "Index";
        StringBuilder sb = new StringBuilder();
        sb.append("// FHIR Profile Mapper: ").append(oneLine(profileUrl.isEmpty() ? resourceType : profileUrl)).append('\n');
        sb.append("(function () {\n");
        sb.append("var __fhir = ").append(runtime()).append(";\n");
        FhirMapperSettings.Context shared;
        try { shared = FhirMapperSettings.context(context); }
        catch (IllegalArgumentException e) { throw error(e.getMessage()); }
        String terminologyAuthorization = shared == null ? this.terminologyAuthorization : shared.terminologyAuthorization;
        int terminologyCacheSeconds = shared == null ? this.terminologyCacheSeconds : shared.cacheSeconds;
        int terminologyTimeoutSeconds = shared == null ? this.terminologyTimeoutSeconds : shared.timeoutSeconds;
        sb.append("__fhir.options = {terminologyServer: ").append(FhirJson.write(effectiveTerminologyServer()))
                .append(", profiles: ").append(FhirJson.write(effectiveProfiles()))
                .append(", fhirVersion: ").append(FhirJson.write(effectiveFhirVersion()))
                .append(", requiredProfile: ").append(FhirJson.write(text(profileUrl)))
                .append(", validateOutput: ").append(isValidateOutput())
                .append(", cacheSeconds: ").append(Math.max(0, terminologyCacheSeconds))
                .append(", timeoutSeconds: ").append(terminologyTimeoutSeconds > 0 ? terminologyTimeoutSeconds : 10)
                .append(", authorization: ").append(text(terminologyAuthorization).isEmpty() ? "''" : "String((function () {\nreturn (" + text(terminologyAuthorization) + ");\n})())")
                .append("};\n");
        int traceAt = sb.length();
        if (!preview) {
            List<String> names = new ArrayList<>();
            for (BundleTarget target : targets) names.add(target.name());
            sb.append("__fhir.selectBundles(").append(FhirJson.write(names)).append(");\n");
        }
        // The mapping runs with msg as the inbound message, which a step before may have replaced.
        sb.append("var __out = (function (msg) {\n");
        sb.append("var __build = function (").append(params).append(") {\n");
        sb.append("var __r = {resourceType: ").append(FhirJson.write(resourceType.trim())).append("};\n");
        if (addMetaProfile && !profileUrl.trim().isEmpty()) {
            sb.append("__fhir.set(__r, [[\"meta\"], [\"profile\", \"#profile\"]], \"canonical\", function () { return ")
                    .append(FhirJson.write(profileUrl.trim())).append("; }, \"meta.profile\", null);\n");
        }
        if (setLastUpdated) {
            sb.append("__fhir.set(__r, [[\"meta\"], [\"lastUpdated\"]], \"instant\", function () { return String(java.time.OffsetDateTime.now()); }, \"meta.lastUpdated\", null);\n");
        }
        write(sb, resource, entries);
        sb.append("return __fhir.finish(__r);\n};\n");

        sb.append("var __out;\n");
        if (preview && resourceIteration != null) {
            sb.append("var __preview = {resourceType:'Bundle', type:'collection', entry:[]};\n");
        }
        sb.append("var __emit = function (").append(params).append(") {\n");
        if (resourceCondition != null) {
            String diagnostic = mark(sb, resourceConditionRule, entries, "condition");
            sb.append("if (!__fhir.when(function () {\nreturn (").append(resourceCondition).append(");\n}, ").append(FhirJson.write(resourceType.trim())).append(", ").append(diagnostic).append(")) {\nreturn;\n}\n");
            clearMark(sb);
        }
        sb.append("var __res = __build(").append(params).append(");\n");
        if (create) {
            sb.append("__fhir.createBundle(").append(FhirJson.write(text(bundleName))).append(", ")
                    .append(FhirJson.write(text(bundleType))).append(", __res, ").append(FhirJson.write(text(variable))).append(");\n");
            if (preview) sb.append("__out = __fhir.finish(__res);\n");
        } else if (preview) {
            sb.append(resourceIteration == null ? "__out = __res;\n" : "__preview.entry.push({fullUrl:'urn:uuid:' + fhirUuid(), resource:__res});\n");
        } else if (bundle) {
            sb.append("__fhir.addToBundles(")
                    .append(text(refName).isEmpty() ? "null" : "String((function () {\nreturn (" + text(refName) + ");\n})())")
                    .append(", __res, [");
            for (int i = 0; i < targets.size(); i++) {
                BundleTarget target = targets.get(i);
                if (i > 0) sb.append(", ");
                sb.append("function () { return __fhir.request(").append(FhirJson.write(target.requestMethod()))
                        .append(", __res, function () { return (").append(orEmpty(target.requestUrl()))
                        .append("); }, function () { return (").append(orEmpty(target.ifNoneExist())).append("); }); }");
            }
            sb.append("]);\n");
        } else {
            sb.append("__fhir.stageResource(__res, ").append(FhirJson.write(text(variable))).append(");\n");
        }
        if (transformerPreview) sb.append("__fhirMapperStepResults.add(__fhir.json(__res));\n");
        sb.append("};\n");
        if (resourceIteration != null) {
            if (create) {
                throw error("a named Bundle is created once; iterate over its resources instead.");
            }
            String diagnostic = mark(sb, resourceIteration, entries, "iteration");
            sb.append("__fhir.each(function () {\nreturn (").append(text(resourceIteration.get("each")).trim()).append(");\n}, __emit, ")
                    .append(FhirJson.write(resourceType.trim())).append(", ").append(diagnostic).append(");\n");
            clearMark(sb);
        } else {
            sb.append("__emit();\n");
        }
        if (preview && resourceIteration != null) sb.append("__out = __preview;\n");
        sb.append("return __out;\n})(__fhir.source(msg));\n");
        if (!preview) {
            if (transformerPreview) sb.append("if (").append(last).append(") {\n__fhirMapperFinalizing = true;\n");
            else sb.append("if (typeof connectorMessage !== 'undefined' && typeof channelId !== 'undefined' && ")
                    .append("Packages.fr.kazepoy.fhir.mapper.FhirMapperLifecycle.isLast(channelId, connectorMessage.getMetaDataId(), ")
                    .append(FhirJson.write(text(getSequenceNumber()))).append(", typeof response !== 'undefined')) {\n");
            sb.append("var __published = __fhir.completeBundles();\nif (__published !== undefined) __out = __published;\n}\n");
        }
        sb.append("if (__out === undefined || __out === null) {\nreturn;\n}\n");
        String target = preview ? text(variable) : "";
        if (target.isEmpty()) {
            sb.append("if ('xml' === typeof tmp) {\n");
            sb.append("    tmp = new XML(String(Packages.fr.kazepoy.fhir.mapper.fhir.FhirFacade.jsonToXml(__fhir.json(__out), tmp.namespace().uri == ")
                    .append(FhirJson.write(FhirFacade.FHIR_NS)).append(")));\n");
            sb.append("} else if ('string' === typeof tmp) {\n");
            sb.append("    tmp = __fhir.json(__out);\n");
            sb.append("} else if ('undefined' !== typeof tmp && tmp !== null) {\n");
            sb.append("    tmp = __fhir.plain(__out);\n");
            // Without an outbound template the engine takes msg as the outbound message, not tmp.
            sb.append("} else {\n");
            sb.append("    msg = __fhir.json(__out);\n");
            sb.append("}\n");
        } else {
            sb.append("channelMap.put(").append(FhirJson.write(target)).append(", __fhir.json(__out));\n");
        }
        if (!preview && !transformerPreview) traceDeployed(sb, traceAt);
        sb.append("})();\n");
        return sb.toString();
    }

    /**
     * Wraps a deployed step's body so that it joins its message's trace, or leaves it. The hash of
     * the script before this wrapping names the version of the mappings that ran.
     */
    private void traceDeployed(StringBuilder sb, int at) {
        if (!traceMessages) {
            sb.insert(at, "__fhir.traceStep(null);\n");
            return;
        }
        String hash;
        try {
            hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest((sb + "})();\n").getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("sequenceNumber", text(getSequenceNumber()));
        info.put("name", text(getName()));
        info.put("action", text(action));
        info.put("resourceType", text(resourceType).trim());
        if ("createBundle".equals(text(action))) info.put("bundleName", text(bundleName));
        info.put("scriptHash", hash);
        info.put("captureValues", traceCaptureValues);
        sb.insert(at, "__fhir.traceStep(" + FhirJson.write(info) + ");\nvar __failure = null;\ntry {\n");
        sb.append("} catch (__e) {\n__failure = __e;\nthrow __e;\n} finally {\n__fhir.traceEnd(__failure);\n}\n");
    }

    /** The element whose code is at a line (1-based) of the script, or null. */
    public static String keyAt(String script, int line) {
        String[] lines = script.split("\n", -1);
        for (int i = Math.min(line, lines.length) - 1; i >= 0; i--) {
            if (lines[i].startsWith(KEY_COMMENT)) {
                return lines[i].substring(KEY_COMMENT.length());
            }
        }
        return null;
    }

    /** Metadata only within a generated rule's marked region; never guess from a previous rule. */
    public static Map<?, ?> diagnosticAt(String script, int line) {
        String[] lines = script.split("\n", -1);
        for (int i = Math.min(line, lines.length) - 1; i >= 0; i--) {
            if (lines[i].startsWith(DIAGNOSTIC_COMMENT)) {
                Object value = FhirJson.parse(lines[i].substring(DIAGNOSTIC_COMMENT.length()));
                return value instanceof Map ? (Map<?, ?>) value : null;
            }
        }
        return null;
    }

    private static Map<?, ?> rule(List<?> entries, String key, String field) {
        Map<?, ?> found = null;
        for (Object entry : entries) {
            if (entry instanceof Map && disabled((Map<?, ?>) entry)) continue;
            Map<?, ?> m = (Map<?, ?>) entry;
            if (key(m).equals(key) && m.containsKey(field)) found = m;
        }
        return found;
    }

    private static String mark(StringBuilder sb, Map<?, ?> rule, List<?> entries, String phase) {
        Map<String, Object> diagnostic = new LinkedHashMap<>();
        if (rule != null) {
            for (int i = 0; i < entries.size(); i++) {
                if (entries.get(i) == rule) { diagnostic.put("ruleIndex", i); break; }
            }
            diagnostic.put("key", key(rule));
            diagnostic.put("ruleId", rule.get("id") == null ? FhirJson.NULL : rule.get("id"));
            diagnostic.put("path", rule.get("path"));
            String field = "iteration".equals(phase) ? "each" : "condition".equals(phase) ? "condition" : "expression";
            diagnostic.put("expression", rule.containsKey(field) ? rule.get(field) : FhirJson.NULL);
        }
        diagnostic.put("phase", phase);
        diagnostic.put("operation", phase);
        String json = FhirJson.write(diagnostic);
        sb.append(DIAGNOSTIC_COMMENT).append(oneLine(json)).append('\n');
        return json;
    }

    private static void clearMark(StringBuilder sb) {
        sb.append(DIAGNOSTIC_COMMENT).append("null\n");
    }

    /** A step from the JSON of the web administrator's element (strings, booleans and numbers, also as text). */
    public static FhirProfileMapperStep fromJson(String json) {
        Object parsed = FhirJson.parse(json);
        if (!(parsed instanceof Map)) {
            throw new IllegalArgumentException("The step is not a JSON object.");
        }
        Map<?, ?> m = (Map<?, ?>) parsed;
        if (m.containsKey("output") || m.containsKey("bundleProfile") || m.containsKey("requestMethod") || m.containsKey("requestUrl") || m.containsKey("ifNoneExist")) {
            throw new IllegalArgumentException("Use action, bundleName and bundleTargets; requests belong to individual Bundle targets.");
        }
        FhirProfileMapperStep step = new FhirProfileMapperStep();
        step.setName(string(m, "name", ""));
        step.setSequenceNumber(string(m, "sequenceNumber", ""));
        step.setFhirVersion(string(m, "fhirVersion", "R4"));
        step.setProfiles(string(m, "profiles", ""));
        step.setProfileUrl(string(m, "profileUrl", ""));
        step.setProfileVersion(string(m, "profileVersion", ""));
        step.setResourceType(string(m, "resourceType", ""));
        step.setAddMetaProfile(!"false".equals(string(m, "addMetaProfile", "true")));
        step.setValidateOutput(!"false".equals(string(m, "validateOutput", "true")));
        step.setSetLastUpdated("true".equals(string(m, "setLastUpdated", "false")));
        step.setVariable(string(m, "variable", ""));
        step.setAction(string(m, "action", ""));
        step.setBundleName(string(m, "bundleName", ""));
        step.setBundleTargets(string(m, "bundleTargets", "[]"));
        step.setBundleType(string(m, "bundleType", "transaction"));
        step.setRefName(string(m, "refName", ""));
        step.setTerminologyServer(string(m, "terminologyServer", ""));
        step.setTerminologyAuthorization(string(m, "terminologyAuthorization", ""));
        step.setTerminologyCacheSeconds(integer(m, "terminologyCacheSeconds", 300));
        step.setTerminologyTimeoutSeconds(integer(m, "terminologyTimeoutSeconds", 10));
        step.setMappings(string(m, "mappings", "[]"));
        step.setTraceMessages("true".equals(string(m, "traceMessages", "false")));
        step.setTraceCaptureValues("true".equals(string(m, "traceCaptureValues", "false")));
        step.setSamples(string(m, "samples", "[]"));
        step.setContext(string(m, "context", ""));
        step.setValidation(string(m, "validation", ""));
        int version = integer(m, "formatVersion", 1);
        step.setFormatVersion(version <= 1 ? null : version);
        return step;
    }

    private static String string(Map<?, ?> m, String key, String fallback) {
        Object value = m.get(key);
        return value == null || value == FhirJson.NULL ? fallback : value.toString();
    }

    private static int integer(Map<?, ?> m, String key, int fallback) {
        try {
            return Integer.parseInt(string(m, key, String.valueOf(fallback)).trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private static String orEmpty(String expression) {
        return text(expression).isEmpty() ? "''" : text(expression);
    }

    /** The values, iterations and conditions of a scope in order, then its fixed values: they need to know which entries exist. */
    private void write(StringBuilder sb, Scope scope, List<?> entries) throws ScriptBuilderException {
        for (Object item : scope.items) {
            if (item instanceof Scope) {
                Scope it = (Scope) item;
                sb.append(KEY_COMMENT).append(oneLine(it.key)).append('\n');
                if (it.iteration != null) {
                    String diagnostic = mark(sb, it.iteration, entries, "iteration");
                    String var = text(it.iteration.get("variable")).trim();
                    sb.append("__fhir.each(function () {\nreturn (").append(text(it.iteration.get("each")).trim()).append(");\n}, function (")
                            .append(var).append(", ").append(it.indexVariable).append(") {\n");
                    sb.append("var ").append(var).append("Index = ").append(it.indexVariable).append(";\n");
                    writeConditional(sb, it, entries);
                    sb.append("}, ").append(FhirJson.write(it.key)).append(", ").append(diagnostic).append(");\n");
                    clearMark(sb);
                } else {
                    writeConditional(sb, it, entries);
                }
            } else {
                Map<?, ?> m = (Map<?, ?>) item;
                sb.append(KEY_COMMENT).append(oneLine(key(m))).append('\n');
                String diagnostic = mark(sb, m, entries, "value");
                sb.append("__fhir.set(__r, ").append(path(m, scope)).append(", ").append(FhirJson.write(text(m.get("type"))))
                        .append(", function () {\nreturn (").append(text(m.get("expression")).trim()).append(");\n}, ")
                        .append(FhirJson.write(key(m))).append(", ").append(translation(m)).append(", ").append(diagnostic).append(");\n");
                clearMark(sb);
            }
        }
        for (Map<?, ?> m : scope.fixed) {
            int when;
            try {
                when = m.get("when") == null ? 0 : Integer.parseInt(m.get("when").toString());
            } catch (NumberFormatException e) {
                throw error("invalid \"when\" in " + key(m), e);
            }
            String diagnostic = mark(sb, m, entries, "fixed");
            sb.append("__fhir.fixed(__r, ").append(path(m, scope)).append(", ").append(when).append(", ").append(FhirJson.write(m.get("fixed"))).append(", ").append(diagnostic).append(");\n");
            clearMark(sb);
        }
    }

    private void writeConditional(StringBuilder sb, Scope scope, List<?> entries) throws ScriptBuilderException {
        if (scope.condition == null) {
            write(sb, scope, entries);
            return;
        }
        String diagnostic = mark(sb, rule(entries, scope.key, "condition"), entries, "condition");
        sb.append("if (__fhir.when(function () {\nreturn (").append(scope.condition).append(");\n}, ").append(FhirJson.write(scope.key)).append(", ").append(diagnostic).append(")) {\n");
        clearMark(sb);
        write(sb, scope, entries);
        sb.append("}\n");
    }

    /** The innermost iteration an entry is in; for an iteration (self), the one around it. */
    private static Scope innermost(Collection<Scope> scopes, Scope resource, String key, boolean self) {
        Scope found = resource;
        for (Scope s : scopes) {
            if ((self ? key.startsWith(s.key + ".") : s.contains(key)) && (found.key == null || s.key.length() > found.key.length())) {
                found = s;
            }
        }
        return found;
    }

    private String translation(Map<?, ?> m) throws ScriptBuilderException {
        if (!(m.get("translate") instanceof Map)) {
            return "null";
        }
        Map<?, ?> t = (Map<?, ?>) m.get("translate");
        if (text(t.get("conceptMap")).trim().isEmpty()) {
            throw error("the translation of " + key(m) + " has no ConceptMap");
        }
        String unmapped = text(t.get("unmapped")).trim().isEmpty() ? "none" : text(t.get("unmapped")).trim();
        if (!UNMAPPED.contains(unmapped)) {
            throw error("the translation of " + key(m) + " has an unknown \"unmapped\": " + unmapped);
        }
        String value = text(t.get("value")).trim();
        if (("fixed".equals(unmapped) || "function".equals(unmapped)) && value.isEmpty()) {
            throw error("the translation of " + key(m) + " has no " + ("fixed".equals(unmapped) ? "fixed value" : "expression") + " for codes without a match");
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("conceptMap", text(t.get("conceptMap")).trim());
        out.put("source", text(t.get("source")).trim());
        out.put("target", text(t.get("target")).trim());
        out.put("unmapped", unmapped);
        if ("fixed".equals(unmapped)) {
            out.put("value", value);
        }
        out.put("keepSource", Boolean.TRUE.equals(t.get("keepSource")));
        String json = FhirJson.write(out);
        if (!"function".equals(unmapped)) {
            return json;
        }
        // The expression runs where the code has no match, with the code and its system.
        return json.substring(0, json.lastIndexOf('}')).replaceAll("\\s+$", "") + ",\n  \"fallback\": function (code, system) {\nreturn (" + value + ");\n}\n}";
    }

    private Map<?, ?> entry(Object entry) throws ScriptBuilderException {
        if (!(entry instanceof Map) || !(((Map<?, ?>) entry).get("path") instanceof List)) {
            throw error("a mapping has no path");
        }
        Map<?, ?> m = (Map<?, ?>) entry;
        if (((List<?>) m.get("path")).isEmpty() && !m.containsKey("each") && !m.containsKey("condition")) {
            throw error("a mapping has no path");
        }
        return m;
    }

    /** A rule kept in the step but left out of the script. */
    private static boolean disabled(Map<?, ?> m) { return Boolean.TRUE.equals(m.get("disabled")) || "true".equals(String.valueOf(m.get("disabled"))); }

    /** The key of an entry; older entries only have the element. */
    private static String key(Map<?, ?> m) {
        return text(m.get("key")).isEmpty() ? text(m.get("element")) : text(m.get("key"));
    }

    /**
     * The path as a JavaScript array of segments, on one line. In an iteration, the item of the
     * iterated element gets the index: "#0" + "*" + itemIndex.
     */
    private String path(Map<?, ?> m, Scope scope) throws ScriptBuilderException {
        Map<Integer, String> indexes = new HashMap<>();
        for (Scope s = scope; s != null && s.key != null; s = s.parent) {
            if (s.iteration != null) {
                indexes.put(s.depth - 1, s.indexVariable);
            }
        }
        StringBuilder sb = new StringBuilder("[");
        List<?> path = (List<?>) m.get("path");
        for (int i = 0; i < path.size(); i++) {
            Object seg = path.get(i);
            if (!(seg instanceof List) || ((List<?>) seg).isEmpty() || ((List<?>) seg).size() > 2) {
                throw error("invalid path segment in " + key(m));
            }
            List<?> parts = (List<?>) seg;
            sb.append(i == 0 ? "" : ", ").append('[').append(FhirJson.write(text(parts.get(0))));
            if (parts.size() == 2) {
                sb.append(", ").append(FhirJson.write(text(parts.get(1))));
                if (indexes.containsKey(i)) {
                    sb.append(" + \"*\" + ").append(indexes.get(i));
                }
            }
            sb.append(']');
        }
        return sb.append(']').toString();
    }

    private ScriptBuilderException error(String message) {
        return new ScriptBuilderException("FHIR Profile Mapper \"" + getName() + "\": " + message + ".");
    }

    private ScriptBuilderException error(String message, Throwable cause) {
        return new ScriptBuilderException("FHIR Profile Mapper \"" + getName() + "\": " + message + ".", cause);
    }

    private static String text(Object value) {
        return value == null || value == FhirJson.NULL ? "" : value.toString();
    }

    private static String oneLine(String s) {
        return s.replaceAll("[\\r\\n]+", " ");
    }

    private static synchronized String runtime() {
        if (runtime == null) {
            try (InputStream in = FhirProfileMapperStep.class.getResourceAsStream(RUNTIME_RESOURCE)) {
                if (in == null) {
                    throw new IllegalStateException(RUNTIME_RESOURCE + " is missing from the FHIR data type.");
                }
                runtime = new String(in.readAllBytes(), StandardCharsets.UTF_8).trim();
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        }
        return runtime;
    }

    @Override
    public String getType() {
        return PLUGIN_POINT;
    }

    @Override
    public Step clone() {
        return new FhirProfileMapperStep(this);
    }

    @Override
    public Map<String, Object> getPurgedProperties() {
        Map<String, Object> purged = super.getPurgedProperties();
        purged.put("fhirVersion", fhirVersion);
        purged.put("addMetaProfile", addMetaProfile);
        purged.put("validateOutput", isValidateOutput());
        return purged;
    }

    public boolean isValidateOutput() {
        switch (text(validation)) {
            case "always":
                return true;
            case "off":
                return false;
            case "inherit":
                FhirMapperSettings.Context c = sharedOrNull();
                return c == null || !"off".equals(c.validation);
            default:
                return !Boolean.FALSE.equals(validateOutput);
        }
    }

    /** Whether the messages processed by this step add its events to their connector's trace. */
    public boolean isTraceMessages() { return traceMessages; }

    public void setTraceMessages(boolean traceMessages) { this.traceMessages = traceMessages; }

    /** Whether this step's events of processed messages include scalar values. */
    public String getContext() { return context == null ? "" : context; }

    public void setContext(String context) { this.context = context; }

    public String getValidation() { return validation == null ? "" : validation; }

    public void setValidation(String validation) { this.validation = validation; }

    public Integer getFormatVersion() { return formatVersion; }

    public void setFormatVersion(Integer formatVersion) { this.formatVersion = formatVersion; }

    /** The context this step names, or null; an unknown name is not an error here (compilation reports it). */
    private FhirMapperSettings.Context sharedOrNull() {
        try { return FhirMapperSettings.context(context); }
        catch (IllegalArgumentException e) { return null; }
    }

    /** Packages, FHIR version and terminology server in force: those of the context when the step names one. */
    public String effectiveProfiles() { FhirMapperSettings.Context c = sharedOrNull(); return c == null ? text(profiles) : c.packages; }

    public String effectiveFhirVersion() {
        FhirMapperSettings.Context c = sharedOrNull();
        return c != null ? c.fhirVersion : text(fhirVersion).isEmpty() ? "R4" : text(fhirVersion);
    }

    public String effectiveTerminologyServer() { FhirMapperSettings.Context c = sharedOrNull(); return c == null ? text(terminologyServer) : c.terminologyServer; }

    public String getSamples() { return samples == null || samples.isBlank() ? "[]" : samples; }

    public void setSamples(String samples) { this.samples = samples; }

    public boolean isTraceCaptureValues() { return traceCaptureValues; }

    public void setTraceCaptureValues(boolean traceCaptureValues) { this.traceCaptureValues = traceCaptureValues; }

    public void setValidateOutput(boolean validateOutput) { this.validateOutput = validateOutput; }

    public String getFhirVersion() {
        return fhirVersion;
    }

    public void setFhirVersion(String fhirVersion) {
        this.fhirVersion = fhirVersion;
    }

    public String getProfiles() {
        return profiles;
    }

    public void setProfiles(String profiles) {
        this.profiles = profiles;
    }

    public String getProfileUrl() {
        return profileUrl;
    }

    public void setProfileUrl(String profileUrl) {
        this.profileUrl = profileUrl;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public boolean isAddMetaProfile() {
        return addMetaProfile;
    }

    public void setAddMetaProfile(boolean addMetaProfile) {
        this.addMetaProfile = addMetaProfile;
    }

    public String getVariable() {
        return variable;
    }

    public void setVariable(String variable) {
        this.variable = variable;
    }

    /** The version of the profile when the mappings were made, to notice a changed profile. */
    public String getProfileVersion() {
        return profileVersion;
    }

    public void setProfileVersion(String profileVersion) {
        this.profileVersion = profileVersion;
    }

    public boolean isSetLastUpdated() {
        return setLastUpdated;
    }

    public void setSetLastUpdated(boolean setLastUpdated) {
        this.setLastUpdated = setLastUpdated;
    }

    /** createBundle or resource. */
    public String getAction() { return action; }

    public void setAction(String action) { this.action = action; }

    /** Literal name of the Bundle created by this step. */
    public String getBundleName() { return bundleName; }

    public void setBundleName(String bundleName) { this.bundleName = bundleName; }

    /** JSON array of {name, requestMethod, requestUrl, ifNoneExist}. */
    public String getBundleTargets() { return bundleTargets; }

    public void setBundleTargets(String bundleTargets) { this.bundleTargets = bundleTargets; }

    public static final class BundleTarget {
        private final String name;
        private final String requestMethod;
        private final String requestUrl;
        private final String ifNoneExist;

        BundleTarget(String name, String requestMethod, String requestUrl, String ifNoneExist) {
            this.name = name;
            this.requestMethod = requestMethod;
            this.requestUrl = requestUrl;
            this.ifNoneExist = ifNoneExist;
        }

        public String name() { return name; }
        public String requestMethod() { return requestMethod; }
        public String requestUrl() { return requestUrl; }
        public String ifNoneExist() { return ifNoneExist; }
    }

    public List<BundleTarget> getTargets() {
        Object parsed = FhirJson.parse(text(bundleTargets).isEmpty() ? "[]" : bundleTargets);
        if (!(parsed instanceof List)) throw new IllegalArgumentException("bundleTargets must be a JSON array.");
        List<BundleTarget> targets = new ArrayList<>();
        Set<String> names = new HashSet<>();
        for (Object value : (List<?>) parsed) {
            if (!(value instanceof Map)) throw new IllegalArgumentException("each Bundle target must be an object.");
            Map<?, ?> m = (Map<?, ?>) value;
            String name = string(m, "name", "").trim();
            String method = string(m, "requestMethod", "POST");
            if (name.isEmpty() || !names.add(name)) throw new IllegalArgumentException("Bundle target names must be nonempty and unique.");
            if (!METHODS.contains(method)) throw new IllegalArgumentException("unknown request method \"" + method + "\".");
            targets.add(new BundleTarget(name, method, string(m, "requestUrl", ""), string(m, "ifNoneExist", "")));
        }
        return targets;
    }

    public String getBundleType() {
        return bundleType;
    }

    public void setBundleType(String bundleType) {
        this.bundleType = bundleType;
    }

    /** JavaScript expression of the name later steps give fhirRef() for this resource, e.g. 'patient'; empty for none. */
    public String getRefName() {
        return refName;
    }

    public void setRefName(String refName) {
        this.refName = refName;
    }

    /** JavaScript expression of the Authorization header for the terminology server, e.g. 'Bearer ' + $cfg('txToken'); empty for none. */
    public String getTerminologyAuthorization() {
        return terminologyAuthorization;
    }

    public void setTerminologyAuthorization(String terminologyAuthorization) {
        this.terminologyAuthorization = terminologyAuthorization;
    }

    /** How long answers of the terminology server are reused; 0 for not at all. */
    public int getTerminologyCacheSeconds() {
        return terminologyCacheSeconds;
    }

    public void setTerminologyCacheSeconds(int terminologyCacheSeconds) {
        this.terminologyCacheSeconds = terminologyCacheSeconds;
    }

    public int getTerminologyTimeoutSeconds() {
        return terminologyTimeoutSeconds;
    }

    public void setTerminologyTimeoutSeconds(int terminologyTimeoutSeconds) {
        this.terminologyTimeoutSeconds = terminologyTimeoutSeconds;
    }

    /** Base URL of the FHIR terminology server for ConceptMap/$translate, as the OIE server reaches it. */
    public String getTerminologyServer() {
        return terminologyServer;
    }

    public void setTerminologyServer(String terminologyServer) {
        this.terminologyServer = terminologyServer;
    }

    public String getMappings() {
        return mappings;
    }

    public void setMappings(String mappings) {
        this.mappings = mappings;
    }
}
