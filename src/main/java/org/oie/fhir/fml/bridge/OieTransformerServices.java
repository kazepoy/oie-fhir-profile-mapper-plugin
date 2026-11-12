/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.fml.bridge;

import java.util.ArrayList;
import java.util.List;

import org.hl7.fhir.exceptions.FHIRException;
import org.hl7.fhir.r5.conformance.profile.ProfileUtilities;
import org.hl7.fhir.r5.context.IWorkerContext;
import org.hl7.fhir.r5.elementmodel.Manager;
import org.hl7.fhir.r5.model.Base;
import org.hl7.fhir.r5.model.Coding;
import org.hl7.fhir.r5.model.StructureDefinition;
import org.hl7.fhir.r5.utils.structuremap.ITransformerServices;

/**
 * What the FML engine asks its host: create the types and resources of the target, and log.
 * Written after Matchbox's TransformSupportServices (ahdis, Apache License 2.0), without its trace
 * to Parameters. translate() is only called for a ConceptMap the engine did not find in the
 * context: the profiles' ConceptMaps are already in it (see FmlResources).
 */
final class OieTransformerServices implements ITransformerServices {
    private final IWorkerContext worker;
    private final List<Base> outputs = new ArrayList<>();
    private final List<String> log = new ArrayList<>();

    OieTransformerServices(IWorkerContext worker) { this.worker = worker; }

    List<Base> outputs() { return outputs; }

    List<String> log() { return log; }

    @Override
    public void log(String message) { log.add(message); }

    @Override
    public Base createType(Object appInfo, String name, ProfileUtilities profileUtilities) throws FHIRException {
        StructureDefinition sd = worker.fetchResource(StructureDefinition.class, name, IWorkerContext.VersionResolutionRules.defaultRule());
        if (sd == null) sd = worker.fetchTypeDefinition(name);
        if (sd == null) throw new FHIRException("FML: unknown type " + name + ".");
        return Manager.build(worker, sd, profileUtilities);
    }

    @Override
    public Base createResource(Object appInfo, Base resource, boolean atRootOfTransform) {
        outputs.add(resource);
        return resource;
    }

    @Override
    public Coding translate(Object appInfo, Coding source, String conceptMapUrl) throws FHIRException {
        throw new FHIRException("FML: ConceptMap " + conceptMapUrl + " is not in the profiles of the step.");
    }

    @Override
    public Base resolveReference(Object appInfo, String url) throws FHIRException {
        throw new FHIRException("FML: references cannot be resolved (" + url + ").");
    }

    @Override
    public List<Base> performSearch(Object appInfo, String url) throws FHIRException {
        throw new FHIRException("FML: searches are not supported (" + url + ").");
    }
}
