/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.fml.server;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.SecurityContext;

import com.mirth.connect.client.core.ClientException;
import com.mirth.connect.server.api.MirthServlet;
import com.mirth.connect.server.userutil.SerializerFactory;
import fr.kazepoy.fhir.fml.FmlFacade;
import fr.kazepoy.fhir.fml.FmlServletInterface;

/** The lookups and test of the FHIR FML Transform editor. */
public class FmlServlet extends MirthServlet implements FmlServletInterface {

    public FmlServlet(@Context HttpServletRequest request, @Context SecurityContext sc) {
        super(request, sc, PLUGIN_NAME);
    }

    @Override
    public String getMaps(String fhirVersion, String profiles) throws ClientException {
        try {
            return FmlFacade.listMaps(fhirVersion, profiles);
        } catch (Exception e) {
            throw new ClientException(e.getMessage(), e);
        }
    }

    @Override
    public String getSource(String request) throws ClientException {
        try {
            return FmlTester.source(request, SERIALIZER);
        } catch (Exception e) {
            throw new ClientException(e.getMessage(), e);
        }
    }

    @Override
    public String check(String request) throws ClientException {
        try {
            return FmlTester.check(request);
        } catch (Exception e) {
            throw new ClientException(e.getMessage(), e);
        }
    }

    @Override
    public String reload() throws ClientException {
        try {
            FmlFacade.clearCaches();
            return "{\"reloaded\":true}";
        } catch (Exception e) {
            throw new ClientException(e.getMessage(), e);
        }
    }

    @Override
    public String test(String request) throws ClientException {
        return FmlTester.test(request, SERIALIZER);
    }

    /** A sample message as a transformer sees it: OIE's internal XML, or JSON and raw text as they are. */
    private static final FmlTester.Serializer SERIALIZER = (dataType, message) -> {
        switch (dataType) {
            case "JSON":
            case "RAW":
            case "XML":
                return message;
            default:
                String raw = "HL7V2".equals(dataType) ? message.replace("\r\n", "\r").replace('\n', '\r') : message;
                return SerializerFactory.getSerializer(dataType).toXML(raw);
        }
    };
}
