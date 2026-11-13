/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.fml.bridge;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.hl7.fhir.r5.context.IWorkerContext;
import org.hl7.fhir.r5.elementmodel.Element;
import org.hl7.fhir.r5.elementmodel.Manager;
import org.hl7.fhir.r5.elementmodel.Manager.FhirFormat;

/** Builds the source instance selected by an FML step. */
final class FmlSourceBuilder {
    static final String SOURCE_MODEL = "sourceModel";
    static final String SOURCE_MODEL_URL = "sourceModelUrl";

    private FmlSourceBuilder() {}

    static Element build(IWorkerContext worker, String source, String format, Map<String, String> messageContext,
            Map<String, String> variables, Map<String, String> options) throws Exception {
        String model = text(options.get(SOURCE_MODEL));
        if (model.isEmpty() || "oie-message".equals(model))
            return new OieModelBuilder(worker).build(source, format, messageContext, variables);
        if ("hl7v2-logical".equals(model)) {
            if (!"xml".equalsIgnoreCase(text(format)))
                throw new IllegalArgumentException("The hl7v2-logical source model requires the XML produced by OIE's Strict Parser.");
            String url = text(options.get(SOURCE_MODEL_URL));
            if (url.isEmpty()) throw new IllegalArgumentException("The hl7v2-logical source model requires sourceModelUrl.");
            return new Hl7v2LogicalModelBuilder(worker, url).build(source);
        }
        if ("fhir".equals(model)) {
            FhirFormat input = "xml".equalsIgnoreCase(text(format)) ? FhirFormat.XML : FhirFormat.JSON;
            return Manager.parseSingle(worker, new ByteArrayInputStream(text(source).getBytes(StandardCharsets.UTF_8)), input);
        }
        throw new IllegalArgumentException("Unsupported FML source model " + model + ".");
    }

    private static String text(String value) { return value == null ? "" : value.trim(); }
}
