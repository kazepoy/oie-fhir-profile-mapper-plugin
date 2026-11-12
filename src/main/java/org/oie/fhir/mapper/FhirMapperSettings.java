/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.oie.fhir.mapper.util.FhirJson;

/**
 * The FHIR contexts of the server: named sets of profile packages, terminology server and
 * validation policy, kept in the properties of the extension and shared by the steps that name
 * them. A step without a context keeps its own packages and terminology settings.
 *
 * JSON form: {"contexts": [{"name", "fhirVersion", "packages": [...] or "a;b", "terminologyServer",
 * "terminologyAuthorization", "cacheSeconds", "timeoutSeconds", "validation": "always" | "off"}]}.
 */
public final class FhirMapperSettings {
    /** The extension property that holds the settings as JSON. */
    public static final String PROPERTY = "settings";
    private static final String EMPTY = "{\"contexts\":[]}";

    public static final class Context {
        public final String name;
        public final String fhirVersion;
        /** Locations separated by ';', as the steps and FHIR Data Type take them. */
        public final String packages;
        public final String terminologyServer;
        public final String terminologyAuthorization;
        public final int cacheSeconds;
        public final int timeoutSeconds;
        /** always or off. */
        public final String validation;

        Context(String name, String fhirVersion, String packages, String terminologyServer, String terminologyAuthorization,
                int cacheSeconds, int timeoutSeconds, String validation) {
            this.name = name;
            this.fhirVersion = fhirVersion;
            this.packages = packages;
            this.terminologyServer = terminologyServer;
            this.terminologyAuthorization = terminologyAuthorization;
            this.cacheSeconds = cacheSeconds;
            this.timeoutSeconds = timeoutSeconds;
            this.validation = validation;
        }

        Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("name", name);
            map.put("fhirVersion", fhirVersion);
            List<Object> list = new ArrayList<>();
            for (String path : packages.split(";")) if (!path.isBlank()) list.add(path.trim());
            map.put("packages", list);
            map.put("terminologyServer", terminologyServer);
            map.put("terminologyAuthorization", terminologyAuthorization);
            map.put("cacheSeconds", cacheSeconds);
            map.put("timeoutSeconds", timeoutSeconds);
            map.put("validation", validation);
            return map;
        }
    }

    private static volatile Map<String, Context> contexts = Map.of();

    private FhirMapperSettings() {}

    /** Reads and checks settings without installing them; throws IllegalArgumentException on an invalid form. */
    public static Map<String, Context> parse(String json) {
        Object parsed = FhirJson.parse(json == null || json.isBlank() ? EMPTY : json);
        if (!(parsed instanceof Map)) throw new IllegalArgumentException("The settings must be a JSON object.");
        Object list = ((Map<?, ?>) parsed).get("contexts");
        if (list == null) list = List.of();
        if (!(list instanceof List)) throw new IllegalArgumentException("contexts must be an array.");
        Map<String, Context> result = new LinkedHashMap<>();
        for (Object item : (List<?>) list) {
            if (!(item instanceof Map)) throw new IllegalArgumentException("A context must be an object.");
            Map<?, ?> m = (Map<?, ?>) item;
            String name = text(m.get("name"));
            if (!name.matches("[A-Za-z0-9][A-Za-z0-9_.-]{0,63}")) throw new IllegalArgumentException("Invalid context name \"" + name + "\": letters, digits, '_', '.', '-' (64 at most).");
            String version = text(m.get("fhirVersion")).isEmpty() ? "R4" : text(m.get("fhirVersion")).toUpperCase();
            if (!List.of("R4", "R4B", "R5").contains(version)) throw new IllegalArgumentException("Context " + name + ": FHIR version " + version + " is not supported.");
            String validation = text(m.get("validation")).isEmpty() ? "always" : text(m.get("validation"));
            if (!List.of("always", "off").contains(validation)) throw new IllegalArgumentException("Context " + name + ": validation must be always or off.");
            Object packages = m.get("packages");
            List<String> paths = new ArrayList<>();
            if (packages instanceof List) for (Object path : (List<?>) packages) { if (!text(path).isEmpty()) paths.add(text(path)); }
            else for (String path : text(packages).split("[;\\n]")) { if (!path.isBlank()) paths.add(path.trim()); }
            if (result.put(name, new Context(name, version, String.join(";", paths), text(m.get("terminologyServer")), text(m.get("terminologyAuthorization")),
                    Math.max(0, integer(m.get("cacheSeconds"), 300)), positive(integer(m.get("timeoutSeconds"), 10)), validation)) != null) {
                throw new IllegalArgumentException("Two contexts are named " + name + ".");
            }
        }
        return result;
    }

    /** Installs the settings of the extension properties; invalid settings leave the current ones. */
    public static void load(String json) {
        contexts = parse(json);
    }

    /** The settings as JSON, canonical. */
    public static String toJson() {
        return toJson(contexts);
    }

    public static String toJson(Map<String, Context> all) {
        List<Object> list = new ArrayList<>();
        for (Context context : all.values()) list.add(context.toMap());
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("contexts", list);
        return FhirJson.write(root);
    }

    /** The context a step names: null for a blank name; an unknown name is an error. */
    public static Context context(String name) {
        String key = name == null ? "" : name.trim();
        if (key.isEmpty()) return null;
        Context context = contexts.get(key);
        if (context == null) throw new IllegalArgumentException("FHIR context \"" + key + "\" is not defined on this server (Settings › FHIR Mapper).");
        return context;
    }

    private static String text(Object value) { return value == null || value == FhirJson.NULL ? "" : value.toString().trim(); }

    private static int integer(Object value, int fallback) {
        try { return text(value).isEmpty() ? fallback : (int) Double.parseDouble(text(value)); }
        catch (NumberFormatException e) { return fallback; }
    }

    private static int positive(int seconds) { return seconds > 0 ? seconds : 10; }
}
