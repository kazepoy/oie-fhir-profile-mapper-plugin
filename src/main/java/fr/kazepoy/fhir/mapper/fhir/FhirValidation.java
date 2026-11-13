/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.mapper.fhir;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Validation result owned by the mapper; no datatype or HAPI object crosses the facade. */
public final class FhirValidation {
    private final List<Map<String, String>> issues;

    public FhirValidation(List<Map<String, String>> issues) {
        this.issues = issues.stream().map(Map::copyOf).collect(Collectors.toUnmodifiableList());
    }

    public List<Map<String, String>> getIssues() { return issues; }

    public boolean isValid() {
        return issues.stream().noneMatch(i -> "error".equals(i.get("severity")) || "fatal".equals(i.get("severity")));
    }

    public String summary() {
        return issues.stream().filter(i -> !"information".equals(i.get("severity")))
                .map(i -> i.get("severity") + " " + i.get("location") + ": " + i.get("message"))
                .collect(Collectors.joining("\n"));
    }
}
