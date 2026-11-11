/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper.integration;

import static org.junit.Assert.*;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.After;
import org.junit.Test;

/** The release timer of the mapper's validators follows the plugin's start and stop. */
public class FhirValidatorReleaseTest {
    private static List<Thread> releaseThreads() {
        return Thread.getAllStackTraces().keySet().stream()
                .filter(t -> FhirDataTypeAdapter.RELEASE_THREAD.equals(t.getName()) && t.isAlive())
                .collect(Collectors.toList());
    }

    @After
    public void stop() { FhirDataTypeAdapter.stopValidatorRelease(); }

    @Test
    public void startsOneDaemonTimerAndStopsIt() throws Exception {
        FhirDataTypeAdapter.startValidatorRelease();
        FhirDataTypeAdapter.startValidatorRelease();
        // The executor creates its thread with the first scheduled task.
        List<Thread> threads = releaseThreads();
        assertEquals(1, threads.size());
        assertTrue(threads.get(0).isDaemon());

        FhirDataTypeAdapter.stopValidatorRelease();
        threads.get(0).join(5000);
        assertTrue(releaseThreads().isEmpty());
    }

    @Test
    public void releasePassUsesThePublicApiOfTheLoadedEngine() throws Exception {
        String profiles = Path.of("src/test/resources/profiles").toAbsolutePath().toString();
        FhirDataTypeAdapter.validate("{\"resourceType\":\"Patient\"}", "", profiles, "R4");
        FhirDataTypeAdapter.releaseIdleValidators();
    }
}
