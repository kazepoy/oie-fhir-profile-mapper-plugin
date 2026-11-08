/*
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * https://mozilla.org/MPL/2.0/.
 */

package org.oie.fhir.mapper.integration.bridge;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.hl7.fhir.common.hapi.validation.support.PrePopulatedValidationSupport;
import org.hl7.fhir.common.hapi.validation.support.CommonCodeSystemsTerminologyService;
import org.hl7.fhir.common.hapi.validation.support.InMemoryTerminologyServerValidationSupport;
import org.hl7.fhir.common.hapi.validation.support.SnapshotGeneratingValidationSupport;
import org.hl7.fhir.common.hapi.validation.support.ValidationSupportChain;
import org.hl7.fhir.instance.model.api.IBaseResource;
import org.hl7.fhir.utilities.npm.NpmPackage;
import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.context.FhirVersionEnum;
import ca.uhn.fhir.context.support.ConceptValidationOptions;
import ca.uhn.fhir.context.support.IValidationSupport;
import ca.uhn.fhir.context.support.LookupCodeRequest;
import ca.uhn.fhir.context.support.ValidationSupportContext;
import ca.uhn.fhir.util.FhirTerser;

/** POC catalogue operations, loaded under the official datatype's HAPI class loader. */
public final class FhirCatalogBridge {
    private static final String PROFILES = "profiles";
    private static final String FHIR_VERSION = "fhirVersion";
    private final Object engine;
    private final Map<String, CachedConceptMaps> conceptMaps = new ConcurrentHashMap<>();

    public FhirCatalogBridge(Object engine) { this.engine = engine; }

    private static final class Catalog {
        final FhirContext ctx;
        final ValidationSupportChain chain;
        final PrePopulatedValidationSupport profiles;
        Catalog(FhirContext ctx, ValidationSupportChain chain, PrePopulatedValidationSupport profiles) {
            this.ctx = ctx;
            this.chain = chain;
            this.profiles = profiles;
        }
    }

    // Compatibility boundary for FHIR Data Type 1.5.1. No private HAPI fields are used.
    // Do not retain a catalogue: the datatype owns the lifetime of its specification.
    private Catalog catalog(Map<String, String> options) throws Exception {
        synchronized (engine) {
            invoke("warmUp", new Class<?>[] { Map.class }, options);
            FhirVersionEnum version = version(options.get(FHIR_VERSION));
            FhirContext ctx = (FhirContext) invoke("validationContext", new Class<?>[] { FhirVersionEnum.class }, version);
            IValidationSupport base = (IValidationSupport) invoke("specification", new Class<?>[] { FhirVersionEnum.class, FhirContext.class }, version, ctx);
            PrePopulatedValidationSupport profiles = (PrePopulatedValidationSupport) invoke("loadProfiles", new Class<?>[] { FhirContext.class, String.class }, ctx, options.getOrDefault(PROFILES, ""));
            List<IValidationSupport> supports = new ArrayList<>();
            if (profiles != null) supports.add(profiles);
            supports.add(base);
            supports.add(new CommonCodeSystemsTerminologyService(ctx));
            supports.add(new InMemoryTerminologyServerValidationSupport(ctx));
            supports.add(new SnapshotGeneratingValidationSupport(ctx));
            return new Catalog(ctx, new ValidationSupportChain(supports), profiles);
        }
    }

    private Object invoke(String name, Class<?>[] types, Object... args) throws Exception {
        try {
            Method method = engine.getClass().getDeclaredMethod(name, types);
            method.setAccessible(true);
            return method.invoke(engine, args);
        } catch (NoSuchMethodException e) {
            throw new IllegalStateException("FHIR Data Type 1.5.1 compatibility: missing " + name, e);
        } catch (InvocationTargetException e) {
            if (e.getCause() instanceof Exception) throw (Exception) e.getCause();
            throw e;
        }
    }

    public void clearCaches() { conceptMaps.clear(); }

    @FunctionalInterface
    private interface CatalogWork<T> { T call(Catalog catalog) throws Exception; }

    private <T> T withCatalog(Map<String, String> options, CatalogWork<T> work) throws Exception {
        return withEngineClassLoader(() -> {
            Catalog catalog = catalog(options);
            try { return work.call(catalog); }
            finally { catalog.chain.stop(); }
        });
    }

    public String listProfiles(Map<String, String> options) throws Exception {
        return withCatalog(options, cached -> {
            if (cached.profiles == null) {
                return "[]";
            }
            FhirTerser terser = cached.ctx.newTerser();
            Map<String, String> sorted = new TreeMap<>();
            for (IBaseResource sd : cached.profiles.fetchAllStructureDefinitions()) {
                String url = terser.getSinglePrimitiveValueOrNull(sd, "url");
                if (url == null || !"resource".equals(terser.getSinglePrimitiveValueOrNull(sd, "kind"))
                        || !"constraint".equals(terser.getSinglePrimitiveValueOrNull(sd, "derivation"))) {
                    continue;
                }
                StringBuilder sb = new StringBuilder("{");
                field(sb, "url", url).append(',');
                field(sb, "name", terser.getSinglePrimitiveValueOrNull(sd, "name")).append(',');
                field(sb, "title", terser.getSinglePrimitiveValueOrNull(sd, "title")).append(',');
                field(sb, "type", terser.getSinglePrimitiveValueOrNull(sd, "type")).append('}');
                sorted.put(url, sb.toString());
            }
            return "[" + String.join(",", sorted.values()) + "]";
        });
    }

    public String structureDefinition(String url, Map<String, String> options) throws Exception {
        return withCatalog(options, cached -> {
            String canonical = url.trim().contains("/") ? url.trim() : "http://hl7.org/fhir/StructureDefinition/" + url.trim();
            IBaseResource sd = cached.chain.fetchStructureDefinition(canonical);
            if (sd == null) {
                throw new IllegalArgumentException("StructureDefinition " + canonical + " not found in the specification or the profile packages.");
            }
            FhirTerser terser = cached.ctx.newTerser();
            if (terser.getValues(sd, "snapshot.element").isEmpty()) {
                IBaseResource copy = cached.ctx.newTerser().clone(sd);
                sd = cached.chain.generateSnapshot(new ValidationSupportContext(cached.chain), copy, canonical, null, terser.getSinglePrimitiveValueOrNull(sd, "name"));
                if (sd == null || terser.getValues(sd, "snapshot.element").isEmpty()) {
                    throw new IllegalArgumentException("Cannot generate the snapshot of " + canonical + ": its base is not available.");
                }
            }
            return withOriginalBases(cached, cached.ctx.newJsonParser().encodeResourceToString(sd));
        });
    }

    // ------------------------------------------------------------------ local $translate

    private static final class CachedConceptMaps {
        /** By url, and by url|version. */
        final Map<String, JsonNode> byUrl;
        volatile long lastUsed = System.currentTimeMillis();

        CachedConceptMaps(Map<String, JsonNode> byUrl) {
            this.byUrl = byUrl;
        }
    }

    /** Matches that are no translation: R4 equivalence and R5 relationship. */
    private static final Set<String> NO_MATCH = Set.of("unmatched", "disjoint", "not-related-to");

    public String listConceptMaps(Map<String, String> options) throws Exception {
        return withEngineClassLoader(() -> {
            ObjectMapper mapper = exactMapper();
            Map<String, JsonNode> sorted = new TreeMap<>();
            for (JsonNode map : cachedConceptMaps(options).byUrl.values()) {
                String url = map.path("url").asText("");
                if (url.isEmpty() || sorted.containsKey(url)) {
                    continue;
                }
                ObjectNode item = mapper.createObjectNode();
                item.put("url", url);
                item.put("name", map.path("name").asText(""));
                item.put("title", map.path("title").asText(""));
                item.put("source", firstText(map, "sourceUri", "sourceCanonical", "sourceScopeUri", "sourceScopeCanonical"));
                item.put("target", firstText(map, "targetUri", "targetCanonical", "targetScopeUri", "targetScopeCanonical"));
                sorted.put(url, item);
            }
            return mapper.writeValueAsString(sorted.values());
        });
    }

    public String translate(String conceptMap, String system, String code, String targetSystem, Map<String, String> options) throws Exception {
        return withEngineClassLoader(() -> {
            CachedConceptMaps maps = cachedConceptMaps(options);
            JsonNode map = maps.byUrl.get(conceptMap.trim());
            if (map == null) {
                throw new IllegalArgumentException("ConceptMap " + conceptMap.trim() + " is not in the profile packages (" + options.getOrDefault(PROFILES, "") + ").");
            }
            JsonNode match = translate(maps, map, text(system), text(code), text(targetSystem), 0);
            return match == null ? null : exactMapper().writeValueAsString(match);
        });
    }

    /**
     * $translate on a loaded ConceptMap, as a terminology server does it: the groups of the source
     * system (all without one) and the target system (all without one); the first target of the code
     * that is a match; otherwise the unmapped rule of the first such group (provided or
     * use-source-code, fixed, other-map). Both R4 (equivalence) and R5 (relationship).
     */
    private static JsonNode translate(CachedConceptMaps maps, JsonNode map, String system, String code, String targetSystem, int depth) {
        List<JsonNode> groups = new ArrayList<>();
        for (JsonNode group : map.path("group")) {
            if ((system.isEmpty() || system.equals(unversioned(group.path("source").asText("")))) && (targetSystem.isEmpty() || targetSystem.equals(unversioned(group.path("target").asText(""))))) {
                groups.add(group);
            }
        }
        Set<JsonNode> noMapGroups = new HashSet<>();
        for (JsonNode group : groups) {
            for (JsonNode element : group.path("element")) {
                if (!code.equals(element.path("code").asText(null))) {
                    continue;
                }
                if (element.path("noMap").asBoolean(false)) {
                    noMapGroups.add(group);
                    continue;
                }
                for (JsonNode target : element.path("target")) {
                    String relation = target.has("relationship") ? target.path("relationship").asText("") : target.path("equivalence").asText("");
                    if (!NO_MATCH.contains(relation) && !target.path("code").asText("").isEmpty()) {
                        return coding(unversioned(group.path("target").asText("")), target.path("code").asText(), target.path("display").asText(""));
                    }
                }
            }
        }
        for (JsonNode group : groups) {
            if (noMapGroups.contains(group)) {
                continue;
            }
            JsonNode unmapped = group.path("unmapped");
            String mode = unmapped.path("mode").asText("");
            String targetGroupSystem = unversioned(group.path("target").asText(""));
            if ("provided".equals(mode) || "use-source-code".equals(mode)) {
                return coding(targetGroupSystem, code, "");
            }
            if ("fixed".equals(mode) && !unmapped.path("code").asText("").isEmpty()) {
                return coding(targetGroupSystem, unmapped.path("code").asText(), unmapped.path("display").asText(""));
            }
            if ("other-map".equals(mode) && depth < 5) {
                String other = unmapped.has("otherMap") ? unmapped.path("otherMap").asText("") : unmapped.path("url").asText("");
                JsonNode otherMap = maps.byUrl.get(other);
                if (otherMap != null) {
                    JsonNode match = translate(maps, otherMap, system, code, targetSystem, depth + 1);
                    if (match != null) {
                        return match;
                    }
                }
            }
        }
        return null;
    }

    public String lookup(String system, String code, Map<String, String> options) throws Exception {
        return withCatalog(options, cached -> {
            ValidationSupportChain chain = cached.chain;
            IValidationSupport.LookupCodeResult result = chain.lookupCode(new ValidationSupportContext(chain), new LookupCodeRequest(text(system), text(code)));
            return result != null && result.isFound() ? result.getCodeDisplay() : null;
        });
    }

    public boolean validateCode(String valueSet, String system, String code, Map<String, String> options) throws Exception {
        return withCatalog(options, cached -> {
            ValidationSupportChain chain = cached.chain;
            IValidationSupport.CodeValidationResult result = chain.validateCode(new ValidationSupportContext(chain), new ConceptValidationOptions(),
                    text(system).isEmpty() ? null : text(system), text(code), null, text(valueSet));
            return result != null && result.isOk();
        });
    }

    private static JsonNode coding(String system, String code, String display) {
        ObjectNode coding = JsonNodeFactory.instance.objectNode();
        if (!system.isEmpty()) {
            coding.put("system", system);
        }
        coding.put("code", code);
        if (!display.isEmpty()) {
            coding.put("display", display);
        }
        return coding;
    }

    private CachedConceptMaps cachedConceptMaps(Map<String, String> options) {
        FhirVersionEnum version = version(options.get(FHIR_VERSION));
        String paths = options.getOrDefault(PROFILES, "").trim();
        CachedConceptMaps cached = conceptMaps.computeIfAbsent(version.name() + "|" + paths, k -> new CachedConceptMaps(loadConceptMaps(version, paths)));
        cached.lastUsed = System.currentTimeMillis();
        return cached;
    }

    /** The ConceptMaps of profile files and packages; only they are read, as JSON. */
    private static Map<String, JsonNode> loadConceptMaps(FhirVersionEnum version, String paths) {
        List<File> files = new ArrayList<>();
        for (String path : paths.split(";")) {
            if (!path.trim().isEmpty()) {
                collect(new File(path.trim()), files);
            }
        }
        ObjectMapper mapper = exactMapper();
        Map<String, JsonNode> byUrl = new HashMap<>();
        for (File file : files) {
            String name = file.getName().toLowerCase();
            try {
                if (name.endsWith(".tgz") || name.endsWith(".tar.gz")) {
                    NpmPackage npm;
                    try (InputStream in = new FileInputStream(file)) {
                        npm = NpmPackage.fromPackage(in);
                    }
                    for (String resourceFile : npm.listResources("ConceptMap")) {
                        try (InputStream in = npm.loadResource(resourceFile)) {
                            addConceptMap(byUrl, mapper.readTree(in));
                        }
                    }
                } else if (name.endsWith(".json")) {
                    addConceptMap(byUrl, mapper.readTree(file));
                } else {
                    String text = new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8);
                    if (text.contains("<ConceptMap")) {
                        IBaseResource resource = FhirContext.forCached(version).newXmlParser().parseResource(text);
                        addConceptMap(byUrl, mapper.readTree(FhirContext.forCached(version).newJsonParser().encodeResourceToString(resource)));
                    }
                }
            } catch (Exception e) {
                throw new IllegalArgumentException("Cannot load profile file " + file.getAbsolutePath() + ": " + e.getMessage(), e);
            }
        }
        return byUrl;
    }

    private static void addConceptMap(Map<String, JsonNode> byUrl, JsonNode resource) {
        if (resource == null || !"ConceptMap".equals(resource.path("resourceType").asText()) || !resource.hasNonNull("url")) {
            return;
        }
        String url = resource.get("url").asText();
        byUrl.putIfAbsent(url, resource);
        if (resource.hasNonNull("version")) {
            byUrl.putIfAbsent(url + "|" + resource.get("version").asText(), resource);
        }
    }

    private static String firstText(JsonNode node, String... fields) {
        for (String field : fields) {
            if (node.hasNonNull(field)) {
                return node.get(field).asText();
            }
        }
        return "";
    }

    private static String unversioned(String canonical) {
        int bar = canonical.indexOf('|');
        return bar < 0 ? canonical : canonical.substring(0, bar);
    }

    private static String text(String s) {
        return s == null ? "" : s.trim();
    }

    private static final String FHIR_BASE = "http://hl7.org/fhir/StructureDefinition/";

    private static ObjectMapper exactMapper() {
        return new ObjectMapper().enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS).setNodeFactory(JsonNodeFactory.withExactBigDecimals(true));
    }

    /**
     * Snapshots of profiles can have base.max "*" where the specification has 1 (Observation.status),
     * both generated by HAPI and as published in packages. The profile mapper needs base.max to know
     * which elements are JSON arrays, so base.min and base.max are taken from the element that
     * base.path names, in the StructureDefinition of the specification.
     */
    private static String withOriginalBases(Catalog cached, String json) throws IOException {
        ObjectMapper mapper = exactMapper();
        JsonNode sd = mapper.readTree(json);
        Map<String, Map<String, JsonNode>> definitions = new HashMap<>();
        for (JsonNode element : sd.path("snapshot").path("element")) {
            JsonNode base = element.get("base");
            if (!(base instanceof ObjectNode) || !base.hasNonNull("path")) {
                continue;
            }
            String path = base.get("path").asText();
            String type = path.contains(".") ? path.substring(0, path.indexOf('.')) : path;
            Map<String, JsonNode> byPath = definitions.computeIfAbsent(type, t -> elementsByPath(cached, mapper, t));
            JsonNode original = byPath.get(path);
            if (original == null) {
                continue;
            }
            JsonNode originalBase = original.has("base") ? original.get("base") : original;
            for (String field : new String[] { "min", "max" }) {
                if (originalBase.has(field)) {
                    ((ObjectNode) base).set(field, originalBase.get(field));
                }
            }
        }
        return mapper.writeValueAsString(sd);
    }

    /** The snapshot elements of a type of the specification by path (slices left out), or none. */
    private static Map<String, JsonNode> elementsByPath(Catalog cached, ObjectMapper mapper, String type) {
        Map<String, JsonNode> byPath = new HashMap<>();
        IBaseResource definition = cached.chain.fetchStructureDefinition(FHIR_BASE + type);
        if (definition == null) {
            return byPath;
        }
        try {
            for (JsonNode element : mapper.readTree(cached.ctx.newJsonParser().encodeResourceToString(definition)).path("snapshot").path("element")) {
                if (element.hasNonNull("path") && !element.has("sliceName")) {
                    byPath.putIfAbsent(element.get("path").asText(), element);
                }
            }
        } catch (IOException e) {
            // no bases to take over
        }
        return byPath;
    }

    private static StringBuilder field(StringBuilder sb, String name, String value) {
        sb.append('"').append(name).append("\":");
        if (value == null) {
            return sb.append("null");
        }
        sb.append('"');
        for (char c : value.toCharArray()) {
            if (c == '"' || c == '\\') {
                sb.append('\\').append(c);
            } else if (c < 0x20) {
                sb.append(String.format("\\u%04x", (int) c));
            } else {
                sb.append(c);
            }
        }
        return sb.append('"');
    }

    private static void collect(File file, List<File> files) {
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) {
                Arrays.sort(children);
                for (File child : children) {
                    collect(child, files);
                }
            }
        } else if (file.isFile()) {
            String name = file.getName().toLowerCase();
            if (name.endsWith(".tgz") || name.endsWith(".tar.gz") || name.endsWith(".json") || name.endsWith(".xml")) {
                files.add(file);
            }
        } else {
            throw new IllegalArgumentException("Profile path not found: " + file.getAbsolutePath());
        }
    }

    private static FhirVersionEnum version(String fhirVersion) {
        String version = fhirVersion == null ? "" : fhirVersion.trim().toUpperCase();
        switch (version) {
            case "":
            case "R4":
                return FhirVersionEnum.R4;
            case "R4B":
                return FhirVersionEnum.R4B;
            case "R5":
                return FhirVersionEnum.R5;
            default:
                throw new IllegalArgumentException("FHIR version " + fhirVersion + " is not supported. Use R4, R4B or R5.");
        }
    }

    private <T> T withEngineClassLoader(Callable<T> work) throws Exception {
        Thread thread = Thread.currentThread();
        ClassLoader previous = thread.getContextClassLoader();
        thread.setContextClassLoader(getClass().getClassLoader());
        try {
            return work.call();
        } finally {
            thread.setContextClassLoader(previous);
        }
    }
}
