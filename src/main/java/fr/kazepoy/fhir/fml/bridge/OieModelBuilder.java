/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.fml.bridge;

import java.io.StringReader;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hl7.fhir.r5.context.IWorkerContext;
import org.hl7.fhir.r5.elementmodel.Element;
import org.hl7.fhir.r5.elementmodel.Manager;
import org.hl7.fhir.r5.model.StructureDefinition;
import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

/**
 * Builds the instance of the generic OIE logical model (OieMessage) from a message: OIE's internal
 * XML (HL7 v2, delimited, XML…), JSON, or raw text. Every node gets its name, its position (the
 * number that ends its name, as 5 in PID.5, else its rank among its siblings) and its occurrence
 * (its rank among the siblings of the same name).
 */
final class OieModelBuilder {
    static final String MODEL_URL = "http://oie.org/fhir/StructureDefinition/OieMessage";
    private static final Pattern NUMBERED = Pattern.compile(".*\\.(\\d+)$");

    private final IWorkerContext worker;

    OieModelBuilder(IWorkerContext worker) { this.worker = worker; }

    /**
     * @param format xml, json or raw (any other text)
     * @param context channelId, channelName, messageId, connectorName, receivedDate (dataType is
     *        found from the message: HL7V2, DELIMITED, XML, JSON or RAW)
     * @param variables variables of the OIE maps exposed to the map
     */
    Element build(String source, String format, Map<String, String> context, Map<String, String> variables) throws Exception {
        StructureDefinition sd = worker.fetchResource(StructureDefinition.class, MODEL_URL, IWorkerContext.VersionResolutionRules.defaultRule());
        if (sd == null) throw new IllegalStateException("The OIE logical model " + MODEL_URL + " is not loaded.");
        Element message = Manager.build(worker, sd);
        // The context first: the model's order, which the JSON of the instance follows.
        Element ctx = message.addElement("context");
        String text = source == null ? "" : source;
        String dataType;
        switch (format == null ? "" : format.trim().toLowerCase()) {
            case "xml":
                String root = xml(message, text);
                dataType = "HL7Message".equals(root) ? "HL7V2" : "delimited".equals(root) ? "DELIMITED" : "XML";
                break;
            case "json":
                json(message, text);
                dataType = "JSON";
                break;
            default:
                if (!text.isEmpty()) message.setChildValue("value", text);
                dataType = "RAW";
        }
        context(ctx, context, variables, dataType);
        return message;
    }

    private static void context(Element ctx, Map<String, String> context, Map<String, String> variables, String dataType) {
        if (context != null) {
            for (String name : new String[] { "channelId", "channelName", "messageId", "connectorName", "receivedDate" }) {
                String value = context.get(name);
                if (value != null && !value.isEmpty()) ctx.setChildValue(name, value);
            }
        }
        ctx.setChildValue("dataType", dataType);
        if (variables != null) {
            for (Map.Entry<String, String> e : variables.entrySet()) {
                Element variable = ctx.addElement("variable");
                variable.setChildValue("name", e.getKey());
                if (e.getValue() != null) variable.setChildValue("value", e.getValue());
            }
        }
    }

    // ------------------------------------------------------------------ XML

    /** Fills the message from OIE's internal XML; returns the name of the root element. */
    private static String xml(Element message, String text) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        factory.setExpandEntityReferences(false);
        Document document = factory.newDocumentBuilder().parse(new InputSource(new StringReader(text)));
        org.w3c.dom.Element root = document.getDocumentElement();
        message.setChildValue("name", name(root));
        attributes(message, root);
        children(message, root);
        return name(root);
    }

    private static void children(Element parent, org.w3c.dom.Element xml) {
        NodeList nodes = xml.getChildNodes();
        Map<String, Integer> occurrences = new HashMap<>();
        StringBuilder text = new StringBuilder();
        int rank = 0;
        for (int i = 0; i < nodes.getLength(); i++) {
            Node child = nodes.item(i);
            if (child.getNodeType() == Node.ELEMENT_NODE) {
                org.w3c.dom.Element e = (org.w3c.dom.Element) child;
                String name = name(e);
                Element node = node(parent, name, ++rank, occurrences.merge(name, 1, Integer::sum));
                attributes(node, e);
                children(node, e);
            } else if (child.getNodeType() == Node.TEXT_NODE || child.getNodeType() == Node.CDATA_SECTION_NODE) {
                text.append(child.getNodeValue());
            }
        }
        // The text of a node without child nodes (mixed content keeps only the nodes).
        if (rank == 0 && text.length() > 0) parent.setChildValue("value", text.toString());
    }

    private static void attributes(Element node, org.w3c.dom.Element xml) {
        NamedNodeMap attributes = xml.getAttributes();
        for (int i = 0; i < attributes.getLength(); i++) {
            Attr a = (Attr) attributes.item(i);
            if ("xmlns".equals(a.getPrefix()) || "xmlns".equals(a.getName())) continue;
            Element attribute = node.addElement("attribute");
            attribute.setChildValue("name", a.getLocalName() == null ? a.getName() : a.getLocalName());
            attribute.setChildValue("value", a.getValue());
        }
    }

    private static String name(org.w3c.dom.Element e) { return e.getLocalName() == null ? e.getNodeName() : e.getLocalName(); }

    // ------------------------------------------------------------------ JSON

    private static void json(Element message, String text) throws Exception {
        JsonNode root = new ObjectMapper().readTree(text);
        if (root == null) return;
        if (root.isValueNode()) {
            message.setChildValue("value", root.asText());
            return;
        }
        jsonChildren(message, root);
    }

    // fields() rather than properties(): Jackson 2.14 of OIE has no properties().
    @SuppressWarnings("deprecation")
    private static void jsonChildren(Element parent, JsonNode json) {
        Map<String, Integer> occurrences = new HashMap<>();
        int rank = 0;
        if (json.isArray()) {
            // An array at the root, or nested in an array: its items are nodes named "item".
            for (JsonNode item : json) rank = jsonNode(parent, "item", item, rank, occurrences);
            return;
        }
        Iterator<Map.Entry<String, JsonNode>> fields = json.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            if (field.getValue().isArray()) {
                // A list: one node per item, with the name of the property.
                for (JsonNode item : field.getValue()) rank = jsonNode(parent, field.getKey(), item, rank, occurrences);
            } else {
                rank = jsonNode(parent, field.getKey(), field.getValue(), rank, occurrences);
            }
        }
    }

    private static int jsonNode(Element parent, String name, JsonNode value, int rank, Map<String, Integer> occurrences) {
        Element node = node(parent, name, ++rank, occurrences.merge(name, 1, Integer::sum));
        if (value.isContainerNode()) jsonChildren(node, value);
        else if (!value.isNull()) node.setChildValue("value", value.asText());
        return rank;
    }

    // ------------------------------------------------------------------ nodes

    private static Element node(Element parent, String name, int rank, int occurrence) {
        Element node = parent.addElement("node");
        node.setChildValue("name", name);
        Matcher numbered = NUMBERED.matcher(name);
        node.setChildValue("position", numbered.matches() ? numbered.group(1) : Integer.toString(rank));
        node.setChildValue("occurrence", Integer.toString(occurrence));
        return node;
    }
}
