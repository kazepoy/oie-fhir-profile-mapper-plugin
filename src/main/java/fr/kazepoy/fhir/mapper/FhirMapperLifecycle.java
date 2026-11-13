/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.mapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.mirth.connect.model.Channel;
import com.mirth.connect.model.Connector;
import com.mirth.connect.model.Step;
import com.mirth.connect.model.Transformer;
import com.mirth.connect.model.IteratorStep;

/** Deployment metadata only: the message's Bundles themselves stay in its JavaScript scope. */
public final class FhirMapperLifecycle {
    private static final Map<String, Map<String, String>> LAST = new ConcurrentHashMap<>();
    private static final Map<String, Integer> REVISIONS = new ConcurrentHashMap<>();

    private FhirMapperLifecycle() {}

    public static void deploy(Channel channel) {
        Map<String, String> last = new HashMap<>();
        List<Connector> connectors = new ArrayList<>(channel.getDestinationConnectors());
        if (channel.getSourceConnector() != null) connectors.add(channel.getSourceConnector());
        for (Connector connector : connectors) {
            for (boolean response : new boolean[] { false, true }) {
                Transformer transformer = response ? connector.getResponseTransformer() : connector.getTransformer();
                if (transformer == null) continue;
                Map<String, String> names = new HashMap<>();
                Map<String, String> outputs = new HashMap<>();
                for (Step step : transformer.getEnabledElements()) {
                    if (step instanceof IteratorStep && containsExplicit(((IteratorStep) step).getProperties().getEnabledElements()))
                        throw new IllegalArgumentException("FHIR Profile Mapper: use the mapper's resource iteration instead of nesting named Bundle actions in an OIE Iterator.");
                    if (!(step instanceof FhirProfileMapperStep)) continue;
                    FhirProfileMapperStep mapper = (FhirProfileMapperStep) step;
                    if (!"createBundle".equals(mapper.getAction()) && !"resource".equals(mapper.getAction()))
                        throw new IllegalArgumentException("FHIR Profile Mapper: choose an explicit action for step " + mapper.getName() + ".");
                    String name = mapper.getBundleName() == null ? "" : mapper.getBundleName().trim();
                    if ("createBundle".equals(mapper.getAction())) {
                        if (names.put(name, mapper.getBundleType()) != null)
                            throw new IllegalArgumentException("FHIR Profile Mapper, Bundle " + name + ": duplicate Bundle name.");
                        String target = mapper.getVariable() == null ? "" : mapper.getVariable().trim();
                        if (outputs.put(target, name) != null)
                            throw new IllegalArgumentException("FHIR Profile Mapper, Bundle " + name + ": output already used by another Bundle.");
                    } else {
                        for (FhirProfileMapperStep.BundleTarget target : mapper.getTargets()) {
                            if (!names.containsKey(target.name()))
                                throw new IllegalArgumentException("FHIR Profile Mapper, Bundle " + target.name() + ": not initialized before step " + mapper.getName() + ".");
                        }
                    }
                    last.put(connector.getMetaDataId() + ":" + response, step.getSequenceNumber());
                }

            }
        }
        LAST.put(channel.getId(), last);
        REVISIONS.put(channel.getId(), channel.getRevision());
    }

    /** The revision of the deployed channel, or -1: traces name the version of the mappings that ran. */
    public static int revision(String channelId) {
        Integer revision = channelId == null ? null : REVISIONS.get(channelId);
        return revision == null ? -1 : revision;
    }

    public static boolean isLast(String channelId, int connectorId, String sequence, boolean response) {
        Map<String, String> last = LAST.get(channelId);
        return last != null && sequence.equals(last.get(connectorId + ":" + response));
    }

    public static void undeploy(String channelId) { LAST.remove(channelId); REVISIONS.remove(channelId); }

    private static boolean containsExplicit(List<Step> steps) {
        for (Step step : steps) {
            if (step instanceof FhirProfileMapperStep && ((FhirProfileMapperStep) step).getAction() != null
                    && !((FhirProfileMapperStep) step).getAction().isEmpty()) return true;
            if (step instanceof IteratorStep && containsExplicit(((IteratorStep) step).getProperties().getEnabledElements())) return true;
        }
        return false;
    }
}
