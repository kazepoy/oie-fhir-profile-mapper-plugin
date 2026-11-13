/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.fml.bridge;

import java.io.StringReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;

import org.hl7.fhir.r5.context.IWorkerContext;
import org.hl7.fhir.r5.elementmodel.Element;
import org.hl7.fhir.r5.elementmodel.Property;
import org.hl7.fhir.r5.elementmodel.Manager;
import org.hl7.fhir.r5.model.StructureDefinition;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

/**
 * Adapts the flat XML made by OIE's Strict Parser to a typed HL7 v2 logical model. The AP-HM
 * convention is mechanical: dots become underscores, existing underscores are doubled, and the
 * value of a leaf is stored in its {@code value} child.
 */
final class Hl7v2LogicalModelBuilder {
    private static final Pattern POSITION = Pattern.compile(".*\\.(\\d+)$");
    private static final Pattern LOGICAL_POSITION = Pattern.compile(".*_(\\d+)$");
    private final IWorkerContext worker;
    private final String modelUrl;
    private final Map<String, Element> containers = new HashMap<>();

    Hl7v2LogicalModelBuilder(IWorkerContext worker, String modelUrl) {
        this.worker = worker;
        this.modelUrl = modelUrl;
    }

    Element build(String xml) throws Exception {
        StructureDefinition model = worker.fetchResource(StructureDefinition.class, modelUrl,
                IWorkerContext.VersionResolutionRules.defaultRule());
        if (model == null) throw new IllegalArgumentException("The HL7 v2 logical model " + modelUrl + " is not in the profile locations of the step.");
        Element root = Manager.build(worker, model);
        containers.put("", root);
        org.w3c.dom.Element input = parse(xml).getDocumentElement();
        if (logical(localName(input)).equals(root.getName()) || logical(localName(input)).equals(model.getName())) {
            copyChildren(root, input);
            return root;
        }
        // Compatibility with the non-strict serializer, whose HL7Message root contains flat segments.
        NodeList children = input.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            if (children.item(i).getNodeType() != Node.ELEMENT_NODE) continue;
            org.w3c.dom.Element segment = (org.w3c.dom.Element) children.item(i);
            String name = localName(segment);
            List<String> path = findPath(root, logical(name), 0, new HashSet<>());
            if (path == null) continue; // the logical model may intentionally omit a segment
            Element target = materialize(root, path);
            copyChildren(target, segment);
        }
        return root;
    }

    private Element materialize(Element root, List<String> path) {
        Element parent = root;
        StringBuilder key = new StringBuilder();
        for (int i = 0; i < path.size(); i++) {
            String name = path.get(i);
            if (key.length() > 0) key.append('.');
            key.append(name);
            boolean segment = i == path.size() - 1;
            if (segment) parent = parent.addElement(name);
            else {
                Element existing = containers.get(key.toString());
                if (existing == null) {
                    existing = parent.addElement(name);
                    containers.put(key.toString(), existing);
                }
                parent = existing;
            }
        }
        return parent;
    }

    private void copyChildren(Element target, org.w3c.dom.Element source) {
        NodeList children = source.getChildNodes();
        boolean hasElements = false;
        for (int i = 0; i < children.getLength(); i++) {
            if (children.item(i).getNodeType() != Node.ELEMENT_NODE) continue;
            hasElements = true;
            org.w3c.dom.Element child = (org.w3c.dom.Element) children.item(i);
            String name = childName(target, localName(child));
            if (name == null) continue;
            Element logical = target.addElement(name);
            copyChildren(logical, child);
        }
        if (!hasElements) setLeaf(target, source.getTextContent());
    }

    private static void setLeaf(Element target, String value) {
        if (value == null || value.isEmpty()) return;
        for (Property property : properties(target)) {
            if ("value".equals(property.getName())) {
                target.setChildValue("value", value);
                return;
            }
        }
        target.setValue(value);
    }

    private static String childName(Element parent, String xmlName) {
        List<Property> properties = properties(parent);
        String exact = logical(xmlName);
        for (Property property : properties) if (property.getName().equals(exact)) return exact;
        Matcher position = POSITION.matcher(xmlName);
        if (position.matches()) {
            String suffix = "_" + position.group(1);
            for (Property property : properties) if (property.getName().endsWith(suffix)) return property.getName();
        }
        return null;
    }

    private static List<String> findPath(Element parent, String target, int depth, Set<String> visited) {
        if (depth > 8) return null;
        List<Property> properties = properties(parent);
        for (Property property : properties) if (property.getName().equals(target)) return List.of(target);
        for (Property property : properties) {
            String name = property.getName();
            if ("value".equals(name) || LOGICAL_POSITION.matcher(name).matches()) continue;
            String visit = parent.getType() + "/" + name;
            if (!visited.add(visit)) continue;
            Element child = new Element(name, property);
            List<String> nested = findPath(child, target, depth + 1, visited);
            if (nested != null) {
                List<String> result = new ArrayList<>();
                result.add(name);
                result.addAll(nested);
                return result;
            }
        }
        return null;
    }

    private static List<Property> properties(Element element) {
        return element.getProperty().getChildProperties(element.getName(), element.getType());
    }

    private static String logical(String xmlName) { return xmlName.replace("_", "__").replace('.', '_'); }

    private static org.w3c.dom.Document parse(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        factory.setExpandEntityReferences(false);
        return factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml == null ? "" : xml)));
    }

    private static String localName(org.w3c.dom.Element element) {
        return element.getLocalName() == null ? element.getNodeName() : element.getLocalName();
    }
}
