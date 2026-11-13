/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.fml;

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
 * REST API of the FHIR FML Transform step, under /api/extensions/fhir-fml: the maps of a set of
 * profile locations, the OIE logical model instance of a sample message, and the test of a step.
 */
@Path("/extensions/fhir-fml")
public interface FmlServletInterface extends BaseServletInterface {

    /** The extension's name: operations reach authorization as "FHIR FML Transform#operation". */
    String PLUGIN_NAME = "FHIR FML Transform";
    /** List maps and read the OIE model of a sample message, in the editor. */
    String PERMISSION_EDIT = "Edit FHIR FML transforms";
    /** Run a step on a sample message. */
    String PERMISSION_TEST = "Test FHIR FML transforms";

    /** {"maps": [{url, name, title}], "errors": {file: message}}. */
    @GET
    @Path("/maps")
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "getFhirFmlMaps", display = "Get FML maps", permission = PERMISSION_EDIT)
    String getMaps(@QueryParam("fhirVersion") String fhirVersion, @QueryParam("profiles") String profiles) throws ClientException;

    /**
     * The OIE logical model instance (OieMessage) of a sample message: body {"message", "dataType",
     * "fhirVersion", "profiles"}.
     */
    @POST
    @Path("/source")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "getFhirFmlSource", display = "Read the OIE model of a sample message", permission = PERMISSION_EDIT)
    String getSource(String request) throws ClientException;

    /**
     * Parses a map written in a step: body {"mapSource", "fhirVersion", "profiles"}, answer {"url",
     * "name", "groups", "errors": [{"line", "column", "message"}]}.
     */
    @POST
    @Path("/check")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "checkFhirFmlMap", display = "Check an FML map", permission = PERMISSION_EDIT)
    String check(String request) throws ClientException;

    /** Forgets the loaded maps and profiles: the next call reads the files again. */
    @POST
    @Path("/reload")
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "reloadFhirFml", display = "Reload FML maps", permission = PERMISSION_EDIT)
    String reload() throws ClientException;

    /**
     * Runs a step on a sample message and validates the result: body {"step", "message",
     * "dataType"}, answer {"model", "output", "validationPerformed", "issues", "errors"}.
     */
    @POST
    @Path("/test")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    @MirthOperation(name = "testFhirFml", display = "Test a FHIR FML Transform step", permission = PERMISSION_TEST)
    String test(String request) throws ClientException;
}
