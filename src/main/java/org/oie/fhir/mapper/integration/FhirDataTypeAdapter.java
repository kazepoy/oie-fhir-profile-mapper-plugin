/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper.integration;

import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.apache.logging.log4j.LogManager;
import com.mirth.connect.plugins.datatypes.fhir.FhirEngine;
import com.mirth.connect.plugins.datatypes.fhir.FhirEngineLoader;
import com.mirth.connect.plugins.datatypes.fhir.FhirSerializationProperties;
import com.mirth.connect.plugins.datatypes.fhir.FhirTools;
import com.mirth.connect.plugins.datatypes.fhir.FhirValidatorUsage;
import com.mirth.connect.plugins.datatypes.fhir.FhirXml;
import org.oie.fhir.mapper.fhir.FhirValidation;

/** The only entry point into the prerequisite and its isolated class loader. */
public final class FhirDataTypeAdapter {
    public static final String FHIR_NS = FhirXml.FHIR_NS;
    static final String RELEASE_THREAD = "FHIR mapper validator release";
    private static Object bridge;
    private static ScheduledExecutorService release;

    private FhirDataTypeAdapter() {}

    public static String jsonToXml(String json, boolean namespace) { return FhirXml.jsonToXml(json, namespace); }
    public static String toJson(String xml, String version) throws Exception { return FhirTools.toJson(xml, version); }
    public static String toXml(String json, String version) throws Exception { return FhirTools.toXml(json, version); }

    public static FhirValidation validate(String resource, String profile, String profiles, String version) throws Exception {
        return new FhirValidation(FhirTools.validate(resource, profile, profiles, version).getIssues());
    }

    public static Map<String, String> options(String version, String profiles) {
        FhirSerializationProperties properties = new FhirSerializationProperties();
        properties.setFhirVersion(FhirSerializationProperties.FhirVersion.valueOf(version == null || version.isBlank() ? "R4" : version.trim().toUpperCase()));
        properties.setProfiles(profiles == null ? "" : profiles);
        return properties.engineOptions();
    }

    public static String listProfiles(String version, String profiles) throws Exception {
        return (String) call("listProfiles", new Class<?>[] { Map.class }, options(version, profiles));
    }

    public static String structureDefinition(String url, String version, String profiles) throws Exception {
        return (String) call("structureDefinition", new Class<?>[] { String.class, Map.class }, url, options(version, profiles));
    }

    public static String listConceptMaps(String profiles, String version) throws Exception {
        return (String) call("listConceptMaps", new Class<?>[] { Map.class }, options(version, profiles));
    }

    public static String translate(String conceptMap, String system, String code, String target, String profiles, String version) throws Exception {
        return (String) call("translate", new Class<?>[] { String.class, String.class, String.class, String.class, Map.class },
                conceptMap, system, code, target, options(version, profiles));
    }

    public static String lookup(String system, String code, String profiles, String version) throws Exception {
        return (String) call("lookup", new Class<?>[] { String.class, String.class, Map.class }, system, code, options(version, profiles));
    }

    public static boolean validateCode(String valueSet, String system, String code, String profiles, String version) throws Exception {
        return (Boolean) call("validateCode", new Class<?>[] { String.class, String.class, String.class, Map.class },
                valueSet, system, code, options(version, profiles));
    }

    public static synchronized void clearCaches() throws Exception {
        if (bridge != null) call("clearCaches", new Class<?>[0]);
    }

    /**
     * FHIR Data Type releases idle validators only once a FHIR channel has run: its serializer
     * starts the release timer. The mapper builds validators for its own profile sets, so while the
     * plugin is started it runs the same release pass every minute through the public
     * {@link FhirValidatorUsage#releaseNow}. A second pass when both timers run is harmless.
     */
    public static synchronized void startValidatorRelease() {
        if (release != null) return;
        release = Executors.newSingleThreadScheduledExecutor(task -> {
            Thread thread = new Thread(task, RELEASE_THREAD);
            thread.setDaemon(true);
            return thread;
        });
        release.scheduleWithFixedDelay(FhirDataTypeAdapter::releaseIdleValidators, 1, 1, TimeUnit.MINUTES);
    }

    public static synchronized void stopValidatorRelease() {
        if (release == null) return;
        release.shutdownNow();
        release = null;
    }

    /** Does nothing until the engine is loaded: the pass must not load HAPI on an idle server. */
    static void releaseIdleValidators() {
        FhirEngine engine = FhirEngineLoader.loadedEngine();
        if (engine == null) return;
        try {
            FhirValidatorUsage.releaseNow(engine, FhirValidatorUsage.IDLE_MILLIS);
        } catch (RuntimeException e) {
            // An exception would cancel the next passes of the timer.
            LogManager.getLogger(FhirDataTypeAdapter.class).warn("Cannot release idle FHIR validators", e);
        }
    }

    private static synchronized Object bridge() throws Exception {
        if (bridge == null) {
            FhirEngine engine = FhirEngineLoader.engine();
            Class<?> type;
            String name = "org.oie.fhir.mapper.integration.bridge.FhirCatalogBridge";
            if (Boolean.getBoolean("fhir.mapper.bridge.direct")) {
                type = Class.forName(name);
            } else {
                File jar = new File(FhirDataTypeAdapter.class.getProtectionDomain().getCodeSource().getLocation().toURI());
                File bridgeJar = new File(jar.getParentFile(), "lib/fhir-profile-mapper-bridge.jar");
                ClassLoader loader = new URLClassLoader(new URL[] { bridgeJar.toURI().toURL() }, engine.getClass().getClassLoader());
                type = Class.forName(name, true, loader);
            }
            bridge = type.getConstructor(Object.class).newInstance(engine);
        }
        return bridge;
    }

    private static Object call(String name, Class<?>[] types, Object... args) throws Exception {
        Object target = bridge();
        try {
            return target.getClass().getMethod(name, types).invoke(target, args);
        } catch (InvocationTargetException e) {
            if (e.getCause() instanceof Exception) throw (Exception) e.getCause();
            throw e;
        }
    }
}
