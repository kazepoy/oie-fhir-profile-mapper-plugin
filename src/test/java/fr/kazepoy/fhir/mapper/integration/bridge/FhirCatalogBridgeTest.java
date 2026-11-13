/* SPDX-License-Identifier: MPL-2.0 */
package fr.kazepoy.fhir.mapper.integration.bridge;

import static org.junit.Assert.*;
import java.util.Map;
import org.junit.Test;
import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.context.FhirVersionEnum;
import ca.uhn.fhir.context.support.DefaultProfileValidationSupport;

public class FhirCatalogBridgeTest {
    /** Mirrors the datatype boundary without allowing a regression to deadlock the test JVM. */
    private static final class Engine {
        private final FhirContext context = FhirContext.forR4Cached();

        private void warmUp(Map<String, String> options) {
            assertFalse("warmUp must acquire the validator cache before the engine monitor", Thread.holdsLock(this));
        }

        private Object validationContext(FhirVersionEnum version) {
            assertTrue(Thread.holdsLock(this));
            return context;
        }

        private Object specification(FhirVersionEnum version, FhirContext ctx) {
            assertTrue(Thread.holdsLock(this));
            return new DefaultProfileValidationSupport(ctx);
        }

        private Object loadProfiles(FhirContext ctx, String profiles) {
            assertTrue(Thread.holdsLock(this));
            return null;
        }
    }

    @Test
    public void warmsUpWithoutInvertingTheValidationLockOrder() throws Exception {
        assertEquals("[]", new FhirCatalogBridge(new Engine()).listProfiles(Map.of()));
    }
}
