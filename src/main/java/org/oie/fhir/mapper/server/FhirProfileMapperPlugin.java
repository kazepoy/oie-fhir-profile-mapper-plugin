/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package org.oie.fhir.mapper.server;

import java.util.Properties;
import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.mirth.connect.model.ExtensionPermission;
import com.mirth.connect.plugins.ServicePlugin;
import com.mirth.connect.model.converters.ObjectXMLSerializer;
import org.oie.fhir.mapper.FhirProfileMapperStep;

public final class FhirProfileMapperPlugin implements ServicePlugin {

    private static final Logger logger = LogManager.getLogger(FhirProfileMapperPlugin.class);

    @Override
    public String getPluginPointName() {
        return "FHIR Profile Mapper";
    }

    @Override
    public void init(Properties properties) {
        // Allow only our serialized step, without opening an entire package namespace.
        ObjectXMLSerializer.getInstance().allowTypes(List.of(FhirProfileMapperStep.class.getName()), List.of(), List.of());
    }

    @Override
    public void update(Properties properties) {}

    @Override
    public Properties getDefaultProperties() {
        return new Properties();
    }

    @Override
    public ExtensionPermission[] getExtensionPermissions() {
        return new ExtensionPermission[0];
    }

    @Override
    public void start() {
        logger.info("FHIR Profile Mapper started.");
    }

    @Override
    public void stop() {
        logger.info("FHIR Profile Mapper stopped.");
    }
}
