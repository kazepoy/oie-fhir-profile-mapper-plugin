/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.fml.server;

import java.util.ArrayList;
import java.util.List;

import com.mirth.connect.model.Channel;
import com.mirth.connect.model.Connector;
import com.mirth.connect.model.IteratorStep;
import com.mirth.connect.model.ServerEventContext;
import com.mirth.connect.model.Step;
import com.mirth.connect.model.Transformer;
import com.mirth.connect.plugins.ChannelPlugin;
import org.apache.logging.log4j.LogManager;
import org.oie.fhir.fml.FhirFmlTransformStep;
import org.oie.fhir.fml.FmlFacade;

/**
 * Reads the FML maps again when a channel that runs them is deployed, and on every global deploy:
 * a map file changed on the server is used from the next deployment on.
 */
public final class FmlChannelPlugin implements ChannelPlugin {
    @Override public String getPluginPointName() { return "FHIR FML Transform Lifecycle"; }
    @Override public void start() {}
    @Override public void stop() {}
    @Override public void save(Channel channel, ServerEventContext context) {}
    @Override public void remove(Channel channel, ServerEventContext context) {}
    @Override public void deploy(Channel channel, ServerEventContext context) { if (usesFml(channel)) clearCaches(); }
    @Override public void undeploy(String id, ServerEventContext context) {}
    @Override public void deploy(ServerEventContext context) { clearCaches(); }
    @Override public void undeploy(ServerEventContext context) { clearCaches(); }

    static boolean usesFml(Channel channel) {
        List<Connector> connectors = new ArrayList<>(channel.getDestinationConnectors());
        if (channel.getSourceConnector() != null) connectors.add(channel.getSourceConnector());
        for (Connector connector : connectors) {
            for (Transformer transformer : new Transformer[] { connector.getTransformer(), connector.getResponseTransformer() }) {
                if (transformer != null && contains(transformer.getEnabledElements())) return true;
            }
        }
        return false;
    }

    private static boolean contains(List<Step> steps) {
        if (steps == null) return false;
        for (Step step : steps) {
            if (step instanceof FhirFmlTransformStep) return true;
            if (step instanceof IteratorStep && contains(((IteratorStep) step).getProperties().getEnabledElements())) return true;
        }
        return false;
    }

    private static void clearCaches() {
        try {
            FmlFacade.clearCaches();
        } catch (Exception e) {
            LogManager.getLogger(FmlChannelPlugin.class).warn("Cannot reload the FML maps", e);
        }
    }
}
