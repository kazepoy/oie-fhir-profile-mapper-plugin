/*
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * https://mozilla.org/MPL/2.0/.
 */

package fr.kazepoy.fhir.mapper;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import com.mirth.connect.client.core.ClientException;
import com.mirth.connect.client.core.api.BaseServletInterface;
import com.mirth.connect.client.core.api.MirthOperation;

/**
 * REST API of the FHIR Profile Mapper step: the profiles in a set of packages, the
 * StructureDefinition (with snapshot) the web administrator builds the tree of a profile from, and
 * the ConceptMaps and $translate of a terminology server, which the browser cannot reach itself.
 * Under /api/extensions/fhir-profile-mapper. Answers are FHIR JSON or plain JSON, never XStream.
 */
@Path("/extensions/fhir-profile-mapper")
public interface FhirProfileServletInterface extends BaseServletInterface {

    /** The extension's name: operations reach authorization as "FHIR Profile Mapper#operation". */
    String PLUGIN_NAME = "FHIR Profile Mapper";
    /** Browse profiles and terminology, and compile steps, in the editor. */
    String PERMISSION_EDIT = "Edit FHIR mappings";
    /** Run a step on a sample message: its code runs on the server. */
    String PERMISSION_TEST = "Test FHIR mapper steps";
    /** Change the FHIR contexts of the server. */
    String PERMISSION_MANAGE = "Manage FHIR mapper settings";

    /** The FHIR contexts of the server: {"contexts": [{name, fhirVersion, packages, terminologyServer, …, validation}]}. */
    @GET
    @Path("/settings")
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "getFhirMapperSettings", display = "Get the FHIR contexts", permission = PERMISSION_EDIT)
    String getSettings() throws ClientException;

    /** Replaces the FHIR contexts; answers the saved settings. Deployed channels keep theirs until redeployed. */
    @POST
    @Path("/settings")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "setFhirMapperSettings", display = "Change the FHIR contexts", permission = PERMISSION_MANAGE)
    String setSettings(String settings) throws ClientException;

    /**
     * The conformance resources of the profile locations, as a JSON array of {resourceType, url, name,
     * title, version, …}. kind: a resource type, or profile, extension, logical; empty for all.
     */
    @GET
    @Path("/catalog")
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "getFhirCatalog", display = "Get the FHIR catalogue of profile locations", permission = PERMISSION_EDIT)
    String getCatalog(@QueryParam("kind") String kind, @QueryParam("fhirVersion") String fhirVersion, @QueryParam("profiles") String profiles) throws ClientException;

    /** A profile and every data type it uses, reduced to what a tree needs: {"root", "types", "errors"}. */
    @GET
    @Path("/catalog/elements")
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "getFhirElements", display = "Get the elements of a FHIR profile and its types", permission = PERMISSION_EDIT)
    String getElements(@QueryParam("url") String url, @QueryParam("fhirVersion") String fhirVersion, @QueryParam("profiles") String profiles) throws ClientException;

    /** The codes of a ValueSet: {"valueSet", "total", "codes": [{system, code, display}]}, 200 at most. */
    @GET
    @Path("/catalog/expand")
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "expandFhirValueSet", display = "Get the codes of a FHIR ValueSet", permission = PERMISSION_EDIT)
    String expandValueSet(@QueryParam("valueSet") String valueSet, @QueryParam("filter") String filter, @QueryParam("fhirVersion") String fhirVersion,
            @QueryParam("profiles") String profiles) throws ClientException;

    @GET
    @Path("/functions")
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "getFhirMapperFunctions", display = "Get mapper functions", permission = PERMISSION_EDIT)
    String getFunctions() throws ClientException;

    @POST
    @Path("/source")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "getFhirMapperSource", display = "Read mapper sample", permission = PERMISSION_EDIT)
    String getSource(String request) throws ClientException;

    /**
     * The resource profiles in the packages, as a JSON array of objects with url, name, title and type.
     *
     * @param fhirVersion R4, R4B or R5
     * @param profiles files and folders with profiles and packages on the server, separated by ';'
     */
    @GET
    @Path("/profiles")
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "getFhirProfiles", display = "Get FHIR profiles", permission = PERMISSION_EDIT)
    String getProfiles(@QueryParam("fhirVersion") String fhirVersion, @QueryParam("profiles") String profiles) throws ClientException;

    /**
     * A StructureDefinition as FHIR JSON, with its snapshot.
     *
     * @param url canonical URL of a profile, or the name of a resource or data type (Patient, HumanName)
     */
    @GET
    @Path("/structure")
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "getFhirStructure", display = "Get FHIR StructureDefinition", permission = PERMISSION_EDIT)
    String getStructure(@QueryParam("url") String url, @QueryParam("fhirVersion") String fhirVersion, @QueryParam("profiles") String profiles) throws ClientException;

    /**
     * The ConceptMaps of a terminology server, or without one (empty or "n/a") of the profile
     * packages, as a JSON array of objects with url, name, title, source and target.
     *
     * @param server base URL of the terminology server, as the OIE server reaches it, or "n/a"
     */
    @GET
    @Path("/conceptMaps")
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "getFhirConceptMaps", display = "Get FHIR ConceptMaps", permission = PERMISSION_EDIT)
    String getConceptMaps(@QueryParam("server") String server, @QueryParam("profiles") String profiles, @QueryParam("fhirVersion") String fhirVersion) throws ClientException;

    /**
     * ConceptMap/$translate of one code, as the step does it: the match as JSON with system, code
     * and display, or null.
     */
    @GET
    @Path("/translate")
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "translateFhirCode", display = "Translate a code with a FHIR ConceptMap", permission = PERMISSION_EDIT)
    String translate(@QueryParam("server") String server, @QueryParam("profiles") String profiles, @QueryParam("conceptMap") String conceptMap,
            @QueryParam("system") String system, @QueryParam("code") String code, @QueryParam("targetSystem") String targetSystem,
            @QueryParam("fhirVersion") String fhirVersion) throws ClientException;

    /**
     * The script a step generates, and its syntax errors: {"script", "errors": [{"key", "line",
     * "message"}]}. The body is the step as the web administrator has it (JSON).
     */
    @POST
    @Path("/script")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "getFhirMapperScript", display = "Get the script of a FHIR Profile Mapper step", permission = PERMISSION_EDIT)
    String getScript(String step) throws ClientException;

    /**
     * Runs a step on a sample message and validates what it makes: body {"step", "message",
     * "dataType"}, answer {"output", "issues", "errors"}. Runs the step's JavaScript on the server, as
     * deploying the channel would, with access to Java, the configuration map and the code templates:
     * it has its own permission, to grant only to users who may deploy channels.
     */
    @POST
    @Path("/test")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "testFhirMapper", display = "Test a FHIR Profile Mapper step", permission = PERMISSION_TEST)
    String test(String request) throws ClientException;
}
