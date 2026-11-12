/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.fml.server;

import java.util.List;
import java.util.Properties;

import com.mirth.connect.model.ExtensionPermission;
import com.mirth.connect.model.converters.ObjectXMLSerializer;
import com.mirth.connect.plugins.ServicePlugin;
import org.apache.logging.log4j.LogManager;
import org.oie.fhir.fml.FhirFmlTransformStep;
import org.oie.fhir.fml.FmlServletInterface;

/** Registers the FHIR FML Transform step for serialization and declares its permissions. */
public final class FmlServicePlugin implements ServicePlugin {

    @Override
    public String getPluginPointName() { return FmlServletInterface.PLUGIN_NAME; }

    @Override
    public void init(Properties properties) {
        ObjectXMLSerializer.getInstance().allowTypes(List.of(FhirFmlTransformStep.class.getName()), List.of(), List.of());
    }

    @Override
    public void update(Properties properties) {}

    @Override
    public Properties getDefaultProperties() { return new Properties(); }

    /** Enforced by an authorization plugin such as Role Based Access Control. */
    @Override
    public ExtensionPermission[] getExtensionPermissions() {
        String name = getPluginPointName();
        return new ExtensionPermission[] {
            new ExtensionPermission(name, FmlServletInterface.PERMISSION_EDIT,
                    "Use the FHIR FML Transform editor: maps of the profile locations, OIE model of a sample message, reload of the maps.",
                    new String[] { "getFhirFmlMaps", "getFhirFmlSource", "reloadFhirFml", "checkFhirFmlMap" }, new String[0]),
            new ExtensionPermission(name, FmlServletInterface.PERMISSION_TEST,
                    "Run a FHIR FML Transform step on a sample message.",
                    new String[] { "testFhirFml" }, new String[0])
        };
    }

    @Override
    public void start() { LogManager.getLogger(FmlServicePlugin.class).info("FHIR FML Transform started."); }

    @Override
    public void stop() {}
}
