#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
"""Variantes du canal « ORU R01 to FHIR Bundle » pour mesurer validation et trace.

    python3 tools/load/oru_variantes.py deploy    importe et déploie les variantes
    python3 tools/load/oru_variantes.py remove    les arrête et les supprime

Chaque variante est une copie du canal de la démo, sur son propre port, qui ne
change que la validation et la trace des sept étapes FHIR Profile Mapper.
"""

import base64
import os
from pathlib import Path
import ssl
import sys
import urllib.error
import urllib.request
import uuid
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "demo/oie-init/channels/oru-r01-to-fhir-bundle.xml"
API = os.environ.get("OIE_API", "https://localhost:8443/api")
AUTH = base64.b64encode(
    f"{os.environ.get('OIE_USER', 'admin')}:{os.environ.get('OIE_PASSWORD', 'demo-oie-password')}".encode()
).decode()
HTTP = urllib.request.build_opener(
    urllib.request.ProxyHandler({}),
    urllib.request.HTTPSHandler(context=ssl._create_unverified_context()),
)
STEP = "fr.kazepoy.fhir.mapper.FhirProfileMapperStep"

# nom, port, validation du mapper, trace du mapper, validation du datatype FHIR en sortie.
VARIANTES = [
    ("validation+trace", 8091, True, True, True),
    ("validation", 8092, True, False, True),
    ("trace", 8093, False, True, True),
    ("sans", 8094, False, False, True),
    ("sans-datatype", 8095, False, False, False),
]


def channel_id(nom):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"oie-fhir-profile-mapper/charge/oru/{nom}"))


def api(method, path, data=None):
    request = urllib.request.Request(API + path, data=data, method=method, headers={
        "Authorization": "Basic " + AUTH, "X-Requested-With": "OpenAPI",
    })
    if data is not None:
        request.add_header("Content-Type", "application/xml")
    try:
        return HTTP.open(request, timeout=300).read().decode()
    except urllib.error.HTTPError as error:
        sys.exit(f"HTTP {error.code} sur {method} {path} : {error.read().decode()[:500]}")


def set_child(parent, tag, value):
    node = parent.find(tag)
    if node is None:
        node = ET.SubElement(parent, tag)
    node.text = value


def variante(nom, port, validation, trace, datatype):
    channel = ET.parse(SOURCE).getroot()
    channel.find("id").text = channel_id(nom)
    channel.find("name").text = f"Charge ORU – {nom}"
    channel.find("description").text = (
        f"Variante de test de charge (tools/load) : validation mapper {'oui' if validation else 'non'}, "
        f"trace {'oui' if trace else 'non'}, validation datatype {'oui' if datatype else 'non'}.")
    source = channel.find("sourceConnector")
    source.find("properties/listenerConnectorProperties/port").text = str(port)
    steps = source.findall(f"transformer/elements/{STEP}")
    assert len(steps) == 7, len(steps)
    for step in steps:
        set_child(step, "validateOutput", str(validation).lower())
        set_child(step, "traceMessages", str(trace).lower())
        set_child(step, "traceCaptureValues", "false")
    serialization = source.find("transformer/outboundProperties/serializationProperties")
    set_child(serialization, "validateOutbound", str(datatype).lower())
    set_child(serialization, "validateInbound", str(datatype).lower())
    return channel


def deploy():
    for nom, port, *flags in VARIANTES:
        channel = variante(nom, port, *flags)
        cid = channel.find("id").text
        api("PUT", f"/channels/{cid}?override=true", ET.tostring(channel, encoding="utf-8"))
        api("POST", f"/channels/{cid}/_deploy?returnErrors=true")
        print(f"déployé  {port}  {nom:16} {cid}")


def remove():
    for nom, port, *_ in VARIANTES:
        cid = channel_id(nom)
        if not api("GET", f"/channels/{cid}").strip():
            continue
        api("POST", f"/channels/{cid}/_undeploy?returnErrors=true")
        api("DELETE", f"/channels/{cid}")
        print(f"supprimé {port}  {nom}")


if __name__ == "__main__":
    {"deploy": deploy, "remove": remove}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: sys.exit(__doc__))()
