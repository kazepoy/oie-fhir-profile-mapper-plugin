/*
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at
 * https://mozilla.org/MPL/2.0/.
 */

package fr.kazepoy.fhir.mapper.server;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.SecurityContext;

import com.mirth.connect.client.core.ClientException;
import fr.kazepoy.fhir.mapper.FhirProfileServletInterface;
import fr.kazepoy.fhir.mapper.FhirMapperSettings;
import fr.kazepoy.fhir.mapper.FhirProfileMapperStep;
import fr.kazepoy.fhir.mapper.util.FhirJson;
import fr.kazepoy.fhir.mapper.fhir.FhirFacade;
import com.mirth.connect.model.codetemplates.CodeTemplate;
import com.mirth.connect.model.codetemplates.CodeTemplateProperties.CodeTemplateType;
import com.mirth.connect.server.api.MirthServlet;
import com.mirth.connect.server.controllers.ControllerFactory;
import com.mirth.connect.server.userutil.SerializerFactory;
import com.mirth.connect.util.ConfigurationProperty;

/**
 * The lookups of the FHIR Profile Mapper editor. The profile lookups use the validator of the same
 * options as a channel with these packages and otherwise default properties, so a deployed channel
 * and the editor share the loaded specification and packages. The terminology calls are made from
 * the OIE server, which reaches servers (Docker network names) the browser cannot.
 */
public class FhirProfileServlet extends MirthServlet implements FhirProfileServletInterface {

    public FhirProfileServlet(@Context HttpServletRequest request, @Context SecurityContext sc) {
        // The extension name makes the operations ExtensionOperations, which an authorization
        // plugin matches against the permissions of FhirProfileMapperPlugin.
        super(request, sc, PLUGIN_NAME);
    }

    @Override
    public String getSettings() { return FhirMapperSettings.toJson(); }

    @Override
    public String setSettings(String settings) throws ClientException {
        try {
            // Checked first, then saved in the extension properties, which reloads them (ServicePlugin.update).
            String canonical = FhirMapperSettings.toJson(FhirMapperSettings.parse(settings));
            java.util.Properties properties = new java.util.Properties();
            properties.setProperty(FhirMapperSettings.PROPERTY, canonical);
            ControllerFactory.getFactory().createExtensionController().setPluginProperties(PLUGIN_NAME, properties);
            FhirMapperSettings.load(canonical);
            FhirFacade.clearCaches();
            return canonical;
        } catch (Exception e) {
            throw new ClientException(e.getMessage(), e);
        }
    }

    @Override
    public String getCatalog(String kind, String fhirVersion, String profiles) throws ClientException {
        try { return FhirFacade.catalog(kind, fhirVersion, profiles); }
        catch (Exception e) { throw new ClientException(e.getMessage(), e); }
    }

    @Override
    public String getElements(String url, String fhirVersion, String profiles) throws ClientException {
        if (url == null || url.trim().isEmpty()) throw new ClientException("The url of the StructureDefinition is missing.");
        try { return FhirFacade.elements(url, fhirVersion, profiles); }
        catch (Exception e) { throw new ClientException(e.getMessage(), e); }
    }

    @Override
    public String expandValueSet(String valueSet, String filter, String fhirVersion, String profiles) throws ClientException {
        if (valueSet == null || valueSet.trim().isEmpty()) throw new ClientException("The url of the ValueSet is missing.");
        try { return FhirFacade.expand(valueSet, filter, fhirVersion, profiles); }
        catch (Exception e) { throw new ClientException(e.getMessage(), e); }
    }

    @Override
    public String getFunctions() { return FhirProfileMapperStep.functionCatalog(); }

    @Override
    public String getSource(String request) throws ClientException {
        try {
            Object parsed = FhirJson.parse(request);
            if (!(parsed instanceof Map)) throw new IllegalArgumentException("The source request must be an object.");
            Map<?, ?> fields = (Map<?, ?>) parsed;
            String type = fields.get("dataType") == null ? "HL7V2" : fields.get("dataType").toString().toUpperCase();
            if (!List.of("HL7V2", "XML", "JSON", "RAW").contains(type)) throw new IllegalArgumentException("Unsupported source data type.");
            String message = fields.get("message") == null ? "" : fields.get("message").toString();
            return FhirJson.write(Map.of("dataType", "HL7V2".equals(type) ? "XML" : type, "message", SERVER.serialize(type, message)));
        } catch (Exception e) { throw new ClientException(e.getMessage(), e); }
    }

    @Override
    public String getProfiles(String fhirVersion, String profiles) throws ClientException {
        try {
            return FhirFacade.listProfiles(fhirVersion, profiles);
        } catch (Exception e) {
            throw new ClientException(e.getMessage(), e);
        }
    }

    @Override
    public String getStructure(String url, String fhirVersion, String profiles) throws ClientException {
        if (url == null || url.trim().isEmpty()) {
            throw new ClientException("The url of the StructureDefinition is missing.");
        }
        try {
            return FhirFacade.structureDefinition(url, fhirVersion, profiles);
        } catch (Exception e) {
            throw new ClientException(e.getMessage(), e);
        }
    }

    @Override
    public String getConceptMaps(String server, String profiles, String fhirVersion) throws ClientException {
        try {
            return FhirFacade.listConceptMaps(server, profiles, fhirVersion);
        } catch (Exception e) {
            throw new ClientException(e.getMessage(), e);
        }
    }

    @Override
    public String translate(String server, String profiles, String conceptMap, String system, String code, String targetSystem, String fhirVersion) throws ClientException {
        try {
            String match = FhirFacade.translate(server, profiles, conceptMap, system, code, targetSystem, fhirVersion);
            return match == null ? "null" : match;
        } catch (Exception e) {
            throw new ClientException(e.getMessage(), e);
        }
    }

    @Override
    public String getScript(String step) throws ClientException {
        return FhirMapperTester.script(step);
    }

    @Override
    public String test(String request) throws ClientException {
        return FhirMapperTester.test(request, SERVER);
    }

    /** The code templates (functions) and configuration map of this server, and its serializers. */
    private static final FhirMapperTester.Environment SERVER = new FhirMapperTester.Environment() {
        @Override
        public List<String> functions() {
            List<String> code = new ArrayList<>();
            try {
                for (CodeTemplate template : ControllerFactory.getFactory().createCodeTemplateController().getCodeTemplates(null)) {
                    if (template.getType() == CodeTemplateType.FUNCTION || template.getType() == CodeTemplateType.COMPILED_CODE) {
                        code.add(template.getCode());
                    }
                }
            } catch (Exception e) {
                // without code templates
            }
            return code;
        }

        @Override
        public Map<String, String> configuration() {
            Map<String, String> map = new HashMap<>();
            try {
                for (Map.Entry<String, ConfigurationProperty> e : ControllerFactory.getFactory().createConfigurationController().getConfigurationProperties().entrySet()) {
                    map.put(e.getKey(), e.getValue().getValue());
                }
            } catch (Exception e) {
                // without the configuration map
            }
            return map;
        }

        @Override
        public String serialize(String dataType, String message) throws Exception {
            switch (dataType) {
                case "JSON":
                case "RAW":
                case "XML":
                    return message;
                default:
                    // HL7 v2 (segments separated by CR, also when pasted with LF) and the other data types
                    String raw = "HL7V2".equals(dataType) ? message.replace("\r\n", "\r").replace('\n', '\r') : message;
                    return SerializerFactory.getSerializer(dataType).toXML(raw);
            }
        }
    };

}
