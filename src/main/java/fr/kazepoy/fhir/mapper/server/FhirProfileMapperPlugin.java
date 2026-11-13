/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package fr.kazepoy.fhir.mapper.server;

import java.util.Properties;
import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.mirth.connect.model.ExtensionPermission;
import com.mirth.connect.plugins.ServicePlugin;
import com.mirth.connect.model.converters.ObjectXMLSerializer;
import fr.kazepoy.fhir.mapper.FhirMapperSettings;
import fr.kazepoy.fhir.mapper.FhirProfileMapperStep;
import fr.kazepoy.fhir.mapper.FhirProfileServletInterface;
import fr.kazepoy.fhir.mapper.fhir.FhirFacade;

public final class FhirProfileMapperPlugin implements ServicePlugin {

    private static final Logger logger = LogManager.getLogger(FhirProfileMapperPlugin.class);

    @Override
    public String getPluginPointName() {
        return FhirProfileServletInterface.PLUGIN_NAME;
    }

    @Override
    public void init(Properties properties) {
        // Allow only our serialized step, without opening an entire package namespace.
        ObjectXMLSerializer.getInstance().allowTypes(List.of(FhirProfileMapperStep.class.getName()), List.of(), List.of());
        loadSettings(properties);
    }

    @Override
    public void update(Properties properties) { loadSettings(properties); }

    /** The FHIR contexts of the extension properties; invalid ones are logged and the current ones kept. */
    private static void loadSettings(Properties properties) {
        try {
            FhirMapperSettings.load(properties == null ? null : properties.getProperty(FhirMapperSettings.PROPERTY));
        } catch (RuntimeException e) {
            logger.error("FHIR Profile Mapper: invalid settings in the extension properties, kept the previous ones", e);
        }
    }

    @Override
    public Properties getDefaultProperties() {
        return new Properties();
    }

    /**
     * An authorization plugin such as Role Based Access Control enforces only the permissions a
     * plugin declares here: without them every route of the editor would be open to any user with
     * a role. The engine's own controller allows everything, as for the other extensions.
     */
    @Override
    public ExtensionPermission[] getExtensionPermissions() {
        String name = getPluginPointName();
        return new ExtensionPermission[] {
            new ExtensionPermission(name, FhirProfileServletInterface.PERMISSION_EDIT,
                    "Use the FHIR Profile Mapper editor: profiles, StructureDefinitions, ConceptMaps and translations "
                            + "(called from the OIE server), function catalogue and generated script.",
                    new String[] { "getFhirMapperSettings", "getFhirCatalog", "getFhirElements", "expandFhirValueSet", "getFhirMapperFunctions", "getFhirMapperSource", "getFhirProfiles", "getFhirStructure",
                            "getFhirConceptMaps", "translateFhirCode", "getFhirMapperScript" },
                    new String[0]),
            new ExtensionPermission(name, FhirProfileServletInterface.PERMISSION_TEST,
                    "Run a FHIR Profile Mapper step on a sample message. The step's code runs on the server with access to "
                            + "Java, the configuration map and the code templates: grant it only to users who may deploy channels.",
                    new String[] { "testFhirMapper" },
                    new String[0]),
            new ExtensionPermission(name, FhirProfileServletInterface.PERMISSION_MANAGE,
                    "Change the FHIR contexts of the server: profile packages, terminology server and validation policy shared by the steps that name them.",
                    new String[] { "setFhirMapperSettings" },
                    new String[0])
        };
    }

    @Override
    public void start() {
        FhirFacade.startValidatorRelease();
        logger.info("FHIR Profile Mapper started.");
    }

    @Override
    public void stop() {
        FhirFacade.stopValidatorRelease();
        logger.info("FHIR Profile Mapper stopped.");
    }
}
