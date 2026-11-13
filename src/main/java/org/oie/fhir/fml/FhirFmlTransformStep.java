/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.fml;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import com.mirth.connect.model.Step;
import com.mirth.connect.util.ScriptBuilderException;
import org.oie.fhir.mapper.fhir.FhirFacade;
import org.oie.fhir.mapper.util.FhirJson;

/**
 * Transformer step that runs an FML map (a StructureMap) on the message, seen through the generic
 * OIE logical model (OieMessage), and publishes the FHIR resource it makes. The maps are files of the
 * profile locations, written elsewhere: the step only names the map to run. An alternative to the
 * FHIR Profile Mapper, which keeps its mappings in the step.
 *
 * The generated script hands the message (OIE's internal XML, or JSON) and its context to
 * {@link FmlFacade#run}, then publishes like the Profile Mapper: the outbound template (tmp) if
 * there is one, else msg, or a Channel Map variable.
 */
public class FhirFmlTransformStep extends Step {
    public static final String PLUGIN_POINT = "FHIR FML Transform";
    private static final Pattern VARIABLE_NAME = Pattern.compile("[A-Za-z_$][A-Za-z0-9_$.\\-]*");

    private String fhirVersion = "R4";
    private String profiles = "";
    private String mapUrl = "";
    /** The FML text of the map, kept in the step; when not blank it runs instead of mapUrl. */
    private String mapSource = "";
    /** How the inbound message is exposed to the map: oie-message, hl7v2-logical or fhir. */
    private String sourceModel = "oie-message";
    /** Canonical of the logical source model when sourceModel is hl7v2-logical. */
    private String sourceModelUrl = "";
    private String variable = "";
    private Boolean validateOutput = true;
    private String contextVariables = "";
    /** Name of a FHIR context of the server; blank: this step's own version and locations. */
    private String context = "";

    public FhirFmlTransformStep() {}

    public FhirFmlTransformStep(FhirFmlTransformStep props) {
        super(props);
        fhirVersion = props.getFhirVersion();
        profiles = props.getProfiles();
        mapUrl = props.getMapUrl();
        mapSource = props.getMapSource();
        sourceModel = props.getSourceModel();
        sourceModelUrl = props.getSourceModelUrl();
        variable = props.getVariable();
        validateOutput = props.isValidateOutput();
        contextVariables = props.getContextVariables();
        context = props.getContext();
    }

    @Override
    public String getScript(boolean loadFiles) throws ScriptBuilderException {
        String map = FmlFacade.mapReference(mapSource, mapUrl);
        if (map.isEmpty()) throw new ScriptBuilderException(PLUGIN_POINT + " \"" + text(getName()) + "\": write the map or choose the map to run.");
        StringBuilder sb = new StringBuilder();
        sb.append("(function () {\n");
        // The message as OIE holds it: its internal XML (HL7 v2, delimited, XML…), JSON, or text.
        sb.append("var __source, __format;\n");
        sb.append("if ('xml' === typeof msg) {\n    __source = msg.toXMLString();\n    __format = 'xml';\n");
        sb.append("} else if (msg !== null && 'object' === typeof msg) {\n    __source = JSON.stringify(msg);\n    __format = 'json';\n");
        sb.append("} else {\n    __source = String(msg);\n    __format = /^\\s*[\\[{]/.test(__source) ? 'json' : 'raw';\n}\n");
        sb.append("var __context = new java.util.HashMap();\n");
        sb.append("if ('undefined' !== typeof channelId) __context.put('channelId', String(channelId));\n");
        sb.append("if ('undefined' !== typeof channelName) __context.put('channelName', String(channelName));\n");
        sb.append("if ('undefined' !== typeof connectorMessage && connectorMessage) {\n");
        sb.append("    __context.put('messageId', String(connectorMessage.getMessageId()));\n");
        sb.append("    __context.put('connectorName', String(connectorMessage.getConnectorName()));\n");
        sb.append("    var __received = connectorMessage.getReceivedDate();\n");
        sb.append("    if (__received) __context.put('receivedDate', String(new java.text.SimpleDateFormat(\"yyyy-MM-dd'T'HH:mm:ss.SSSXXX\").format(__received.getTime())));\n");
        sb.append("}\n");
        sb.append("var __variables = new java.util.LinkedHashMap();\n");
        for (String name : contextVariableNames()) {
            sb.append("(function (n) {\n    var v = 'function' === typeof $ ? $(n) : undefined;\n")
                    .append("    if (v !== undefined && v !== null) __variables.put(n, String(v));\n})(")
                    .append(FhirJson.write(name)).append(");\n");
        }
        sb.append("var __out = String(Packages.org.oie.fhir.fml.FmlFacade.run(")
                .append(FhirJson.write(text(getName()))).append(", ")
                .append(FhirJson.write(map)).append(", __source, __format, __context, __variables, ")
                .append(FhirJson.write(effectiveFhirVersion())).append(", ")
                .append(FhirJson.write(effectiveProfiles())).append(", ")
                .append(isValidateOutput()).append(", ")
                .append(FhirJson.write(getSourceModel())).append(", ")
                .append(FhirJson.write(getSourceModelUrl())).append("));\n");
        String target = text(variable);
        if (target.isEmpty()) {
            sb.append("if ('xml' === typeof tmp) {\n");
            sb.append("    tmp = new XML(String(Packages.org.oie.fhir.mapper.fhir.FhirFacade.jsonToXml(__out, tmp.namespace().uri == ")
                    .append(FhirJson.write(FhirFacade.FHIR_NS)).append(")));\n");
            sb.append("} else if ('string' === typeof tmp) {\n    tmp = __out;\n");
            sb.append("} else if ('undefined' !== typeof tmp && tmp !== null) {\n    tmp = JSON.parse(__out);\n");
            // Without an outbound template the engine takes msg as the outbound message, not tmp.
            sb.append("} else {\n    msg = __out;\n}\n");
        } else {
            sb.append("channelMap.put(").append(FhirJson.write(target)).append(", __out);\n");
        }
        sb.append("})();\n");
        return sb.toString();
    }

    /** The names of contextVariables: separated by commas, semicolons or spaces. */
    public List<String> contextVariableNames() {
        List<String> names = new ArrayList<>();
        for (String name : text(contextVariables).split("[,;\\s]+")) {
            if (name.isEmpty()) continue;
            if (!VARIABLE_NAME.matcher(name).matches()) throw new IllegalArgumentException("Invalid variable name in contextVariables: " + name);
            if (!names.contains(name)) names.add(name);
        }
        return names;
    }

    /** A step from its JSON form (web administrator, test API). */
    public static FhirFmlTransformStep fromJson(String json) {
        Object parsed = FhirJson.parse(json);
        if (!(parsed instanceof Map)) throw new IllegalArgumentException("The step is not a JSON object.");
        Map<?, ?> m = (Map<?, ?>) parsed;
        FhirFmlTransformStep step = new FhirFmlTransformStep();
        step.setName(string(m, "name"));
        step.setSequenceNumber(string(m, "sequenceNumber"));
        step.setFhirVersion(string(m, "fhirVersion").isEmpty() ? "R4" : string(m, "fhirVersion"));
        step.setProfiles(string(m, "profiles"));
        step.setMapUrl(string(m, "mapUrl"));
        step.setMapSource(string(m, "mapSource"));
        step.setSourceModel(string(m, "sourceModel"));
        step.setSourceModelUrl(string(m, "sourceModelUrl"));
        step.setVariable(string(m, "variable"));
        step.setContextVariables(string(m, "contextVariables"));
        step.setContext(string(m, "context"));
        Object validate = m.get("validateOutput");
        step.setValidateOutput(validate == null || !"false".equalsIgnoreCase(validate.toString()));
        return step;
    }

    private static String string(Map<?, ?> m, String key) {
        Object value = m.get(key);
        return value == null ? "" : value.toString();
    }

    private static String text(String value) { return value == null ? "" : value.trim(); }

    @Override
    public String getType() { return PLUGIN_POINT; }

    @Override
    public Step clone() { return new FhirFmlTransformStep(this); }

    @Override
    public Map<String, Object> getPurgedProperties() {
        Map<String, Object> purged = super.getPurgedProperties();
        purged.put("fhirVersion", fhirVersion);
        purged.put("validateOutput", isValidateOutput());
        return purged;
    }

    public String getFhirVersion() { return fhirVersion; }

    public void setFhirVersion(String fhirVersion) { this.fhirVersion = fhirVersion; }

    public String getProfiles() { return profiles; }

    public void setProfiles(String profiles) { this.profiles = profiles; }

    public String getMapUrl() { return mapUrl; }

    public void setMapUrl(String mapUrl) { this.mapUrl = mapUrl; }

    public String getMapSource() { return mapSource == null ? "" : mapSource; }

    public void setMapSource(String mapSource) { this.mapSource = mapSource; }

    public String getSourceModel() {
        String model = text(sourceModel);
        return model.isEmpty() ? "oie-message" : model;
    }

    public void setSourceModel(String sourceModel) {
        String model = text(sourceModel);
        if (model.isEmpty()) model = "oie-message";
        if (!List.of("oie-message", "hl7v2-logical", "fhir").contains(model))
            throw new IllegalArgumentException("Unsupported FML source model " + model + ".");
        this.sourceModel = model;
    }

    public String getSourceModelUrl() { return text(sourceModelUrl); }

    public void setSourceModelUrl(String sourceModelUrl) { this.sourceModelUrl = sourceModelUrl; }

    /** What the engine runs: the step's own map text, else the canonical URL. */
    public String mapReference() { return FmlFacade.mapReference(mapSource, mapUrl); }

    public String getContext() { return context == null ? "" : context; }

    public void setContext(String context) { this.context = context; }

    private org.oie.fhir.mapper.FhirMapperSettings.Context shared() { return org.oie.fhir.mapper.FhirMapperSettings.context(context); }

    /** Version and locations in force: those of the context when the step names one (an unknown name is an error). */
    public String effectiveFhirVersion() {
        org.oie.fhir.mapper.FhirMapperSettings.Context c = shared();
        return c != null ? c.fhirVersion : text(fhirVersion).isEmpty() ? "R4" : text(fhirVersion);
    }

    public String effectiveProfiles() {
        org.oie.fhir.mapper.FhirMapperSettings.Context c = shared();
        return c == null ? text(profiles) : c.packages;
    }

    public String getVariable() { return variable; }

    public void setVariable(String variable) { this.variable = variable; }

    /** True also for an export without the property. */
    public boolean isValidateOutput() { return !Boolean.FALSE.equals(validateOutput); }

    public void setValidateOutput(boolean validateOutput) { this.validateOutput = validateOutput; }

    public String getContextVariables() { return contextVariables; }

    public void setContextVariables(String contextVariables) { this.contextVariables = contextVariables; }
}
