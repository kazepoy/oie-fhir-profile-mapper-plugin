/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.fml.bridge;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.hl7.fhir.exceptions.FHIRException;
import org.hl7.fhir.r5.context.IWorkerContext;
import org.hl7.fhir.r5.elementmodel.Element;
import org.hl7.fhir.r5.elementmodel.JsonParser;
import org.hl7.fhir.r5.elementmodel.Manager;
import org.hl7.fhir.r5.formats.IParser.OutputStyle;
import org.hl7.fhir.r5.model.StructureDefinition;
import org.hl7.fhir.r5.model.StructureMap;
import org.hl7.fhir.r5.model.StructureMap.StructureMapGroupComponent;
import org.hl7.fhir.r5.model.StructureMap.StructureMapGroupInputComponent;
import org.hl7.fhir.r5.model.StructureMap.StructureMapInputMode;
import org.hl7.fhir.r5.model.StructureMap.StructureMapStructureComponent;
import org.hl7.fhir.r5.utils.structuremap.StructureMapUtilities;

/**
 * Runs FML maps (StructureMaps) on the OIE logical model, with the FML engine of the HL7 core that
 * FHIR Data Type ships. Loaded under the datatype's HAPI class loader; called by reflection from
 * org.oie.fhir.fml.integration.FmlBridgeAdapter with java.util and String arguments only.
 *
 * Options are those of the datatype (fhirVersion, profiles…). The profile locations also hold the
 * maps: .fml or .map files, StructureMap resources and packages.
 */
public final class FmlBridge {
    private final Object engine;
    private final Map<String, FmlContext> contexts = new ConcurrentHashMap<>();

    public FmlBridge(Object engine) { this.engine = engine; }

    /** The maps of the locations: [{url, name, title}], and the files that could not be read. */
    public String listMaps(Map<String, String> options) throws Exception {
        return withEngineClassLoader(() -> {
            FmlContext context = context(options);
            ObjectMapper mapper = new ObjectMapper();
            Map<String, ObjectNode> sorted = new TreeMap<>();
            for (StructureMap map : context.maps()) {
                ObjectNode item = mapper.createObjectNode();
                item.put("url", map.getUrl());
                item.put("name", map.hasName() ? map.getName() : map.getUrl());
                item.put("title", map.hasTitle() ? map.getTitle() : (map.hasName() ? map.getName() : map.getUrl()));
                sorted.put(map.getUrl(), item);
            }
            ObjectNode result = mapper.createObjectNode();
            ArrayNode maps = result.putArray("maps");
            sorted.values().forEach(maps::add);
            ObjectNode errors = result.putObject("errors");
            context.errors.forEach(errors::put);
            return mapper.writeValueAsString(result);
        });
    }

    /** The instance of the OIE logical model a map receives for this message, as JSON. */
    public String source(String source, String format, Map<String, String> messageContext, Map<String, String> variables,
            Map<String, String> options) throws Exception {
        return withEngineClassLoader(() -> {
            FmlContext context = context(options);
            synchronized (context) {
                return compose(context.worker, new OieModelBuilder(context.worker).build(source, format, messageContext, variables));
            }
        });
    }

    /** Runs a map on a message and returns its target (a resource, often a Bundle) as JSON. */
    public String transform(String mapUrl, String source, String format, Map<String, String> messageContext, Map<String, String> variables,
            Map<String, String> options) throws Exception {
        return withEngineClassLoader(() -> {
            FmlContext context = context(options);
            String url = mapUrl == null ? "" : mapUrl.trim();
            // The engine is not thread-safe: one transformation at a time per context.
            synchronized (context) {
                StructureMap map = context.map(url);
                if (map == null) {
                    throw new IllegalArgumentException("StructureMap " + url + " is not in the profile locations of the step"
                            + (context.errors.isEmpty() ? "." : " (unreadable files: " + String.join(", ", context.errors.keySet()) + ")."));
                }
                IWorkerContext worker = context.worker;
                Element src = new OieModelBuilder(worker).build(source, format, messageContext, variables);
                OieTransformerServices services = new OieTransformerServices(worker);
                StructureMapUtilities utilities = new StructureMapUtilities(worker, services);
                Element target = Manager.build(worker, targetType(worker, map));
                utilities.transform(null, src, map, target);
                return compose(worker, target);
            }
        });
    }

    public void clearCaches() {
        for (FmlContext context : contexts.values()) context.close();
        contexts.clear();
    }

    private FmlContext context(Map<String, String> options) throws Exception {
        String key = FmlContext.version(options.get(FmlContext.FHIR_VERSION)) + "|" + options.getOrDefault(FmlContext.PROFILES, "");
        FmlContext context = contexts.get(key);
        if (context == null) {
            synchronized (contexts) {
                context = contexts.get(key);
                if (context == null) {
                    context = FmlContext.load(engine, options);
                    contexts.put(key, context);
                }
            }
        }
        return context;
    }

    /**
     * The type of the target parameter of the map's first group, resolved through the map's uses:
     * the core's getTargetType refuses a map that uses several targets (a Bundle and its entries).
     */
    private static StructureDefinition targetType(IWorkerContext worker, StructureMap map) {
        if (!map.hasGroup()) throw new FHIRException("StructureMap " + map.getUrl() + " has no group.");
        StructureMapGroupComponent group = map.getGroupFirstRep();
        String type = null;
        for (StructureMapGroupInputComponent input : group.getInput()) {
            if (input.getMode() == StructureMapInputMode.TARGET) type = input.getType();
        }
        if (type == null || type.isEmpty()) {
            throw new FHIRException("The first group of " + map.getUrl() + " (" + group.getName() + ") needs a typed target parameter.");
        }
        String url = type;
        for (StructureMapStructureComponent uses : map.getStructure()) {
            if (type.equals(uses.getAlias()) || type.equals(uses.getUrl())) url = uses.getUrl();
        }
        StructureDefinition sd = worker.fetchResource(StructureDefinition.class, url, IWorkerContext.VersionResolutionRules.defaultRule());
        if (sd == null && !url.contains("/")) sd = worker.fetchTypeDefinition(url);
        if (sd == null) throw new FHIRException("Unable to find the target " + url + " of map " + map.getUrl() + ".");
        return sd;
    }

    private static String compose(IWorkerContext worker, Element element) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        new JsonParser(worker).compose(element, out, OutputStyle.NORMAL, null);
        return out.toString(StandardCharsets.UTF_8);
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
