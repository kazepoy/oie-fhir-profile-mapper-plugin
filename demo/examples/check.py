#!/usr/bin/env python3
"""Rejoue les exemples dans la démo démarrée ; crée des messages OIE."""
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.

import base64
import csv
import json
import os
from pathlib import Path
import ssl
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


EXAMPLES = Path(__file__).resolve().parent
HOST = os.environ.get("DEMO_HOST", "localhost")
API = os.environ.get("OIE_API", f"https://{HOST}:{os.environ.get('OIE_HTTPS_PORT', '8443')}/api")
AUTH = base64.b64encode(
    f"{os.environ.get('OIE_USER', 'admin')}:{os.environ.get('OIE_PASSWORD', 'demo-fhir-mapper-admin')}".encode()
).decode()
# La démo locale utilise un certificat autosigné et ne passe pas par un proxy.
HTTP = urllib.request.build_opener(
    urllib.request.ProxyHandler({}),
    urllib.request.HTTPSHandler(context=ssl._create_unverified_context()),
)
CHANNELS = {
    "oru": "5d0f6c2a-8b3e-4f1a-9c7d-2e6b1a0f3c48",
    "labo": "aa431dca-b805-4ac6-8dbd-e272b6fc4c18",
    "csv": "bfd48a62-4376-4c9a-91b3-ff294b5e2570",
}


def api(path, accept="application/xml", data=None):
    request = urllib.request.Request(API + path, data=data, headers={
        "Authorization": "Basic " + AUTH,
        "X-Requested-With": "OpenAPI",
        "Accept": accept,
    })
    if data is not None:
        request.add_header("Content-Type", "text/plain; charset=UTF-8")
    return HTTP.open(request, timeout=120).read()


def messages(channel, limit=1):
    return ET.fromstring(api(f"/channels/{CHANNELS[channel]}/messages?limit={limit}&includeContent=true")).findall("message")


def last_id(channel):
    items = messages(channel)
    return int(items[0].findtext("messageId")) if items else 0


def post(port_variable, default_port, route, filename, content_type):
    port = os.environ.get(port_variable, str(default_port))
    request = urllib.request.Request(
        f"http://{HOST}:{port}/{route}/", data=(EXAMPLES / filename).read_bytes(),
        headers={"Content-Type": content_type + "; charset=UTF-8"},
    )
    return HTTP.open(request, timeout=120).read()


def connector(message, metadata_id):
    return next(c for c in message.findall(".//connectorMessage") if c.findtext("metaDataId") == str(metadata_id))


def encoded(message, metadata_id):
    c = connector(message, metadata_id)
    assert c.findtext("status") == "SENT", ET.tostring(c, encoding="unicode")
    return json.loads(c.findtext("encoded/content"))


def bundle(value, kind, count):
    assert value["resourceType"] == "Bundle" and value["type"] == kind
    assert len(value["entry"]) == count
    urls = {entry["fullUrl"] for entry in value["entry"]}
    assert len(urls) == count

    def references(node):
        if isinstance(node, dict):
            for key, child in node.items():
                if key == "reference" and isinstance(child, str) and child.startswith("urn:uuid:"):
                    assert child in urls, child
                references(child)
        elif isinstance(node, list):
            for child in node:
                references(child)

    references(value)
    assert all(("request" in entry) == (kind == "transaction") for entry in value["entry"])


def check_patient(patient, row):
    assert patient["resourceType"] == "Patient"
    assert patient["id"] == "metier-" + row["id_patient"].strip()
    assert patient["identifier"][0]["value"] == row["ipp"].strip()
    assert patient["name"][0]["family"] == row["nom_naissance"].strip()
    assert patient["name"][0]["given"] == [row["prenom"].strip()]
    date = row["date_naissance"].strip()
    assert patient["birthDate"] == f"{date[:4]}-{date[4:6]}-{date[6:]}"
    assert patient["gender"] == {"F": "female", "M": "male", "I": "unknown"}[row["sexe"].strip().upper()]
    assert patient["active"] == (row["actif"].strip() == "1")


def main():
    for filename, count in [("oru-r01-labo.er7", 12), ("oru-r01-minimal.er7", 4)]:
        value = json.loads(post("ORU_PORT", 8081, "oru", filename, "text/plain"))
        bundle(value, "transaction", count)
    print("OK ORU → transactions de 12 et 4 ressources, références résolues")

    patient = json.loads(post("PATIENT_PORT", 8082, "patient", "oru-r01-minimal.er7", "text/plain"))
    assert patient["resourceType"] == "Patient" and patient["birthDate"] == "1980-02-15"
    print("OK ORU → Patient")

    transaction = json.loads(post("LAB_BUNDLES_PORT", 8083, "labo", "oru-r01-labo.er7", "text/plain"))
    message = messages("labo")[0]
    assert encoded(message, 1) == transaction
    document = encoded(message, 2)
    bundle(transaction, "transaction", 12)
    bundle(document, "document", 14)
    assert document["entry"][0]["resource"]["resourceType"] == "Composition"
    shared = {e["fullUrl"]: e["resource"] for e in document["entry"]}
    assert all(shared[e["fullUrl"]] == e["resource"] for e in transaction["entry"])
    print("OK deux Bundles : transaction 12, document 14, mêmes ressources et identités")

    patient = json.loads(post("SQL_PATIENT_PORT", 8084, "sql-patient", "patient-result-sql.xml", "application/xml"))
    assert patient["id"] == "metier-1042" and patient["identifier"][0]["value"] == "000123456"
    assert patient["name"][0]["given"] == ["Élodie"] and patient["birthDate"] == "1985-04-12"
    print("OK XML SQL → Patient, accents et zéros initiaux conservés")

    with (EXAMPLES / "patients-metier-10.csv").open(encoding="utf-8", newline="") as source:
        rows = list(csv.DictReader(source, delimiter=";"))
    before = last_id("csv")
    patient = json.loads(post("CSV_PATIENTS_PORT", 8085, "csv-patients", "patients-metier-10.csv", "text/csv"))
    check_patient(patient, rows[-1])
    batch = [m for m in messages("csv", 10) if int(m.findtext("messageId")) > before]
    assert len(batch) == 10
    patients = {p["id"]: p for p in (encoded(m, 1) for m in batch)}
    for row in rows:
        check_patient(patients["metier-" + row["id_patient"]], row)
    print("OK CSV → dix messages Patient, nettoyage et conversion de chaque ligne")

    collection = json.loads(post("CSV_COLLECTION_PORT", 8086, "csv-patients-collection", "patients-metier-10.csv", "text/csv"))
    bundle(collection, "collection", 10)
    for entry, row in zip(collection["entry"], rows):
        check_patient(entry["resource"], row)
    print("OK CSV → une collection de dix Patients")

    before = last_id("oru")
    assert not post("ORU_PORT", 8081, "oru", "oru-r01-sans-date-de-naissance.er7", "text/plain")
    message = messages("oru")[0]
    assert int(message.findtext("messageId")) > before
    errors = [c for c in message.findall(".//connectorMessage") if c.findtext("status") == "ERROR"]
    assert errors and any("birthDate" in ET.tostring(c, encoding="unicode") for c in errors)
    print("OK profil : naissance obligatoire absente → message ERROR mentionnant birthDate")

    query = urllib.parse.urlencode({
        "server": "n/a", "profiles": "/fhir-ig", "fhirVersion": "R4", "code": "GLU",
        "conceptMap": "http://example.org/fhir/oru2fhir/ConceptMap/lab-codes-to-loinc",
        "system": "http://example.org/fhir/oru2fhir/CodeSystem/lab-codes",
    })
    translated = json.loads(api("/extensions/fhir-profile-mapper/translate?" + query, "application/json"))
    assert translated["system"] == "http://loinc.org" and translated["code"] == "14749-6"
    print("OK façade : traduction ConceptMap locale GLU → LOINC 14749-6")

    result = json.loads(api("/extensions/fhir-profile-mapper/test", "application/json",
                            (EXAMPLES / "diagnostic-error.json").read_bytes()))
    assert result["output"] is None and result["validationPerformed"] is False
    assert len(result["errors"]) == 1
    error = result["errors"][0]
    assert error["step"]["name"] == "Patient diagnostic" and error["phase"] == "conversion"
    assert error["key"] == "Patient.active" and error["ruleIndex"] == 0
    assert error["path"] == [["active"]] and error["expression"] == "'invalide'"
    print("OK diagnostic : Patient.active, règle 0, conversion, expression 'invalide'")

    request = json.loads((EXAMPLES / "typeerror-error.json").read_text(encoding="utf-8"))
    for validation in (False, True):
        request["step"]["validateOutput"] = validation
        result = json.loads(api("/extensions/fhir-profile-mapper/test", "application/json",
                                json.dumps(request).encode("utf-8")))
        assert result["output"] is None and result["validationPerformed"] is False
        assert len(result["errors"]) == 1
        error = result["errors"][0]
        assert error["errorType"] == "TypeError" and error["phase"] == "value"
        assert error["key"] == "Patient.gender" and error["expression"] == "msg.optional.gender"
    request["step"]["validateOutput"] = False
    mappings = json.loads(request["step"]["mappings"])
    mappings[0]["expression"] = "msg.optional && msg.optional.gender"
    request["step"]["mappings"] = json.dumps(mappings)
    for message in ({}, {"optional": {"gender": "female"}}):
        request["message"] = json.dumps(message)
        result = json.loads(api("/extensions/fhir-profile-mapper/test", "application/json",
                                json.dumps(request).encode("utf-8")))
        assert not result["errors"]
        assert json.loads(result["output"]).get("gender") == message.get("optional", {}).get("gender")
    print("OK TypeError signalée ; garde explicite vérifiée avec et sans donnée facultative")


if __name__ == "__main__":
    main()
