/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.fml.bridge;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.context.support.IValidationSupport;
import ca.uhn.fhir.util.FhirTerser;
import org.hl7.fhir.instance.model.api.IBaseResource;

/**
 * The resources HAPI's PrePopulatedValidationSupport does not keep: StructureMaps (for the imports
 * of a map) and ConceptMaps (for translate()), plus the OIE logical model. Served to the FML engine
 * through the validation chain, in the chain's FHIR version.
 */
final class FmlResources implements IValidationSupport {
    private final FhirContext ctx;
    private final Map<String, IBaseResource> byUrl = new ConcurrentHashMap<>();
    private final List<IBaseResource> structureDefinitions = new ArrayList<>();

    FmlResources(FhirContext ctx) { this.ctx = ctx; }

    /** Adds a StructureMap, ConceptMap or StructureDefinition; other resource types are ignored. */
    boolean add(IBaseResource resource) {
        String type = ctx.getResourceType(resource);
        if (!"StructureMap".equals(type) && !"ConceptMap".equals(type) && !"StructureDefinition".equals(type)) return false;
        FhirTerser terser = ctx.newTerser();
        String url = terser.getSinglePrimitiveValueOrNull(resource, "url");
        if (url == null || url.isBlank()) return false;
        String version = terser.getSinglePrimitiveValueOrNull(resource, "version");
        byUrl.put(type + "|" + url, resource);
        if (version != null && !version.isBlank()) byUrl.put(type + "|" + url + "|" + version, resource);
        if ("StructureDefinition".equals(type)) structureDefinitions.add(resource);
        return true;
    }

    @Override
    public FhirContext getFhirContext() { return ctx; }

    @Override
    @SuppressWarnings("unchecked")
    public <T extends IBaseResource> T fetchResource(Class<T> type, String uri) {
        if (type != null && uri != null) {
            IBaseResource found = byUrl.get(ctx.getResourceType(type) + "|" + uri);
            if (found != null) return (T) found;
        }
        return IValidationSupport.super.fetchResource(type, uri);
    }

    @Override
    public IBaseResource fetchStructureDefinition(String url) {
        return byUrl.get("StructureDefinition|" + url);
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T extends IBaseResource> List<T> fetchAllStructureDefinitions() {
        return (List<T>) new ArrayList<>(structureDefinitions);
    }
}
