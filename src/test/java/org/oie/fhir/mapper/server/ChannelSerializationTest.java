/* SPDX-License-Identifier: MPL-2.0 */
package org.oie.fhir.mapper.server;

import static org.junit.Assert.*;
import java.util.List;
import java.util.Properties;
import org.junit.Test;
import org.oie.fhir.mapper.FhirProfileMapperStep;
import com.mirth.connect.model.Channel;
import com.mirth.connect.model.InvalidChannel;
import com.mirth.connect.model.converters.ObjectXMLSerializer;

public class ChannelSerializationTest {
    @Test
    public void pluginInitializationAllowsItsStepToRoundTripInAnOieChannel() throws Exception {
        ObjectXMLSerializer serializer = ObjectXMLSerializer.getInstance();
        if (serializer.getNormalizedVersion() == null) serializer.init("4.7.0");
        String type = FhirProfileMapperStep.class.getName();
        serializer.allowTypes(List.of(), List.of("com.mirth.connect.**"), List.of());
        ObjectXMLSerializer blocked = new ObjectXMLSerializer(getClass().getClassLoader());
        blocked.init("4.7.0");
        blocked.allowTypes(List.of(), List.of("com.mirth.connect.**"), List.of());
        String xml = "<channel version=\"4.7.0\"><id>round-trip</id><name>Round trip</name><revision>1</revision>"
                + "<sourceConnector version=\"4.7.0\"><metaDataId>0</metaDataId><transformer version=\"4.7.0\"><elements><" + type
                + " version=\"4.7.0\"><name>Patient</name><action>resource</action><resourceType>Patient</resourceType>"
                + "<validateOutput>false</validateOutput><mappings>[]</mappings></" + type
                + "></elements></transformer></sourceConnector></channel>";
        Channel rejected = blocked.deserialize(xml, Channel.class);
        assertTrue(rejected instanceof InvalidChannel);
        assertTrue(((InvalidChannel) rejected).getCause().toString().contains(type));
        new FhirProfileMapperPlugin().init(new Properties());
        Channel accepted = serializer.deserialize(xml, Channel.class);
        assertFalse(accepted instanceof InvalidChannel ? ((InvalidChannel) accepted).getCause().toString() : "", accepted instanceof InvalidChannel);
        FhirProfileMapperStep step = (FhirProfileMapperStep) accepted.getSourceConnector().getTransformer().getElements().get(0);
        assertFalse(step.isValidateOutput());
        Channel roundTrip = serializer.deserialize(serializer.serialize(accepted), Channel.class);
        assertFalse(roundTrip instanceof InvalidChannel);
        assertEquals("[]", ((FhirProfileMapperStep) roundTrip.getSourceConnector().getTransformer().getElements().get(0)).getMappings());
        Channel legacy = serializer.deserialize(xml.replace("<validateOutput>false</validateOutput>", ""), Channel.class);
        assertTrue(((FhirProfileMapperStep) legacy.getSourceConnector().getTransformer().getElements().get(0)).isValidateOutput());
    }
}
