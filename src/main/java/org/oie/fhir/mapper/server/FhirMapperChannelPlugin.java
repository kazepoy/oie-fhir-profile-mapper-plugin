/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper.server;

import com.mirth.connect.model.Channel;
import com.mirth.connect.model.ServerEventContext;
import com.mirth.connect.plugins.ChannelPlugin;
import org.apache.logging.log4j.LogManager;
import org.oie.fhir.mapper.FhirMapperLifecycle;
import org.oie.fhir.mapper.fhir.FhirFacade;

/** Deployment metadata belongs to the mapper; validator ownership remains in the datatype. */
public final class FhirMapperChannelPlugin implements ChannelPlugin {
    @Override public String getPluginPointName() { return "FHIR Profile Mapper Lifecycle"; }
    @Override public void start() {}
    @Override public void stop() {}
    @Override public void save(Channel channel, ServerEventContext context) {}
    @Override public void remove(Channel channel, ServerEventContext context) {}
    @Override public void deploy(Channel channel, ServerEventContext context) { FhirMapperLifecycle.deploy(channel); }
    @Override public void undeploy(String id, ServerEventContext context) { FhirMapperLifecycle.undeploy(id); }
    @Override public void deploy(ServerEventContext context) { clearCaches(); }
    @Override public void undeploy(ServerEventContext context) { clearCaches(); }

    private static void clearCaches() {
        try {
            FhirFacade.clearCaches();
        } catch (Exception e) {
            LogManager.getLogger(FhirMapperChannelPlugin.class).warn("Cannot refresh FHIR mapper catalogue", e);
        }
    }
}
