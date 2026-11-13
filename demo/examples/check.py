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
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


EXAMPLES = Path(__file__).resolve().parent
HOST = os.environ.get("DEMO_HOST", "localhost")
API = os.environ.get("OIE_API", f"https://{HOST}:{os.environ.get('OIE_HTTPS_PORT', '8443')}/api")
AUTH = base64.b64encode(
    f"{os.environ.get('OIE_USER', 'admin')}:{os.environ.get('OIE_PASSWORD', 'demo-oie-password')}".encode()
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


def connector_trace(message, meta_data_id=0, key="fhirMapperTrace"):
    """La trace d'un message traité, dans le connectorMap de son connecteur."""
    for entry in message.find("connectorMessages"):
        connector = entry.find("connectorMessage")
        if connector.findtext("metaDataId") != str(meta_data_id):
            continue
        for item in connector.findall("connectorMapContent/content/entry"):
            values = [child.text for child in item]
            if values and values[0] == key:
                return json.loads(values[1])
    return None


def check_message_trace():
    """Le canal ORU trace ses étapes Patient et Observation (traceMessages)."""
    message = messages("oru")[0]
    trace = connector_trace(message)
    assert trace, "trace absente du connectorMap du message ORU"
    assert trace["scope"] == "channel-message" and trace["channel"]["id"] == CHANNELS["oru"]
    assert trace["messageId"] == int(message.findtext("messageId")) and trace["connector"]["metaDataId"] == 0
    assert trace["truncated"] is False
    assert [s["name"] for s in trace["steps"]] == ["Patient", "Observation"]
    assert all(len(s["scriptHash"]) == 64 for s in trace["steps"])
    events = trace["events"]
    assert {e.get("step") for e in events} == {s["sequenceNumber"] for s in trace["steps"]} | {None}
    assert all("value" not in e for e in events)
    references = [e for e in events if e["phase"] == "reference"]
    entries = [e for e in events if e["phase"] == "bundle-entry"]
    patient = next(e["fullUrl"] for e in entries if e["refName"] == "patient")
    # Le dernier message est le minimal : sans PV1 ni SPM, ces références manquent et
    # expliquent l'absence d'Observation.encounter et d'Observation.specimen.
    status = {e["name"]: e["status"] for e in references}
    assert status == {"patient": "resolved", "sr-0": "resolved", "encounter": "missing", "spm-0": "missing"}, status
    assert any(e["name"] == "patient" and e["fullUrl"] == patient for e in references)
    finals = [(e["phase"], e["status"]) for e in events if e.get("step") is None]
    assert finals == [("references", "passed"), ("validation", "passed"), ("publication", "published")], finals
    print(f"OK trace du message {trace['messageId']} : {len(events)} événements, "
          f"{len(references)} références réelles, finalisation et publication")


def check_transformer_preview(export_name, filename, expected, expected_document=None):
    # Use the same exported mapper steps as the deployed source transformer.
    sys.path.insert(0, str(EXAMPLES.parents[1]))
    from tools.run_tests import groups, normalize
    path = EXAMPLES.parents[1] / "demo/oie-init/channels" / export_name
    steps = groups(path)["0/transformer"]
    request = {"steps": steps, "dataType": "HL7V2", "message": (EXAMPLES / filename).read_text()}
    result = json.loads(api("/extensions/fhir-profile-mapper/test", "application/json", json.dumps(request).encode()))
    assert not result["errors"], result["errors"]
    assert normalize(result["output"]) == normalize(json.dumps(expected)), "Preview and deployed output differ"
    if expected_document is not None:
        assert any(normalize(value) == normalize(json.dumps(expected_document)) for value in result["variables"].values())
    print(f"OK aperçu multi-étapes : {export_name}, mêmes sorties que le canal déployé")


def check_fml_previews():
    """Rejoue les maps exportées avec la représentation source adaptée au test."""
    from tools.run_tests import normalize
    manifest = json.loads((EXAMPLES / "channels.json").read_text())
    for case in manifest["channels"]:
        if "preview" not in case:
            continue
        preview = case["preview"]
        export = EXAMPLES.parents[1] / "demo/oie-init/channels" / case["channel"]
        node = ET.parse(export).getroot().find(
            "sourceConnector/transformer/elements/fr.kazepoy.fhir.fml.FhirFmlTransformStep")
        step = {child.tag: child.text or "" for child in node}
        request = {"step": step, "dataType": preview["dataType"],
                   "message": (EXAMPLES / preview["input"]).read_text()}
        result = json.loads(api("/extensions/fhir-fml/test", "application/json", json.dumps(request).encode()))
        assert not result["errors"], (case["channel"], result["errors"])
        assert result["validationPerformed"] is True
        assert not [i for i in result["issues"] if i.get("severity") in ("error", "fatal")], result["issues"]
        expected = (EXAMPLES / preview["expected"]).read_text()
        assert normalize(result["output"]) == normalize(expected), case["channel"]
        print(f"OK aperçu FML : {case['channel']}, résultat attendu et validation")


def check_additional_channels():
    """Cas JSON/R5, FR Core, EU Lab, CSV FML R5, IG FML, terminologie externe et source FHIR : nominal et refus diagnostiqué."""
    from tools.run_tests import normalize
    manifest = json.loads((EXAMPLES / "channels.json").read_text())
    for case in manifest["channels"]:
        if "deployed" not in case:
            continue
        deployed = case["deployed"]
        content_type = deployed.get("contentType", "application/json")
        output = post(deployed["portEnv"], deployed["port"], deployed["route"], case["input"], content_type)
        expected = (EXAMPLES / deployed["expected"]).read_text()
        assert normalize(output.decode()) == normalize(expected), case["channel"]
        export = ET.parse(EXAMPLES.parents[1] / "demo/oie-init/channels" / case["channel"]).getroot()
        channel_id = export.findtext("id")
        history = f"/channels/{channel_id}/messages?limit=1&includeContent=true"
        nominal = ET.fromstring(api(history)).find("message")
        assert encoded(nominal, 1) == json.loads(expected), case["channel"]
        before = int(nominal.findtext("messageId"))

        node = export.find("sourceConnector/transformer/elements/fr.kazepoy.fhir.fml.FhirFmlTransformStep")
        if node is None:
            node = export.find("sourceConnector/transformer/elements/fr.kazepoy.fhir.mapper.FhirProfileMapperStep")
        assert node is not None, case["channel"]
        step = {child.tag: child.text or "" for child in node}
        endpoint = "fhir-fml" if "fml" in node.tag else "fhir-profile-mapper"
        invalid = case["invalid"]
        preview_type = invalid.get("dataType", deployed.get("previewType", "JSON"))
        request = {"step": step, "dataType": preview_type, "message": (EXAMPLES / invalid["input"]).read_text()}
        result = json.loads(api(f"/extensions/{endpoint}/test", "application/json", json.dumps(request).encode()))
        diagnostics = result["errors"] + [i for i in result["issues"] if i.get("severity") in ("error", "fatal")]
        assert diagnostics and invalid["diagnostic"] in json.dumps(diagnostics), (case["channel"], result)

        invalid_ct = invalid.get("contentType", content_type)
        assert not post(deployed["portEnv"], deployed["port"], deployed["route"], invalid["input"], invalid_ct)
        rejected = ET.fromstring(api(history)).find("message")
        assert int(rejected.findtext("messageId")) > before
        errors = [c for c in rejected.findall(".//connectorMessage") if c.findtext("status") == "ERROR"]
        assert errors and invalid["diagnostic"] in "".join(ET.tostring(c, encoding="unicode") for c in errors), case["channel"]
        print(f"OK {case['channel']} : sortie attendue, exemple invalide refusé en aperçu et sur le canal")

    # Terminologie externe : cas non mappé sur le mock HTTP 8099 (repli fixed)
    unmatched = json.loads(post("EXTERNAL_TX_OBS_PORT", 8096, "obs-external-tx", "observation-tx-unmatched.json", "application/json"))
    expected_unmatched = json.loads((EXAMPLES / "expected/observation-tx-unmatched.json").read_text())
    assert unmatched == expected_unmatched, unmatched
    print("OK terminologie externe : code inconnu -> repli fixed sur data-absent-reason#unknown")


def check_channel_organization():
    manifest = json.loads((EXAMPLES / "channels.json").read_text())
    groups = {g.findtext("id"): g for g in ET.fromstring(api("/channelgroups"))}
    tags = list(ET.fromstring(api("/server/channelTags")))
    for definition in manifest["groups"]:
        group = groups[definition["id"]]
        assert group.findtext("name") == definition["name"]
        members = {c.findtext("id") for c in group.findall("channels/channel")}
        for case in manifest["channels"]:
            if case["group"] != definition["key"]:
                continue
            export = ET.parse(EXAMPLES.parents[1] / "demo/oie-init/channels" / case["channel"]).getroot()
            channel_id = export.findtext("id")
            assert channel_id in members, case["channel"]
            assigned = {t.findtext("name") for t in tags if channel_id in {s.text for s in t.findall("channelIds/string")}}
            assert set(case["tags"]) <= assigned, (case["channel"], assigned)
    print(f"OK classement natif OIE : {len(manifest['groups'])} groupes, tags vérifiés sur {len(manifest['channels'])} canaux")


def main():
    check_channel_organization()
    for filename, count in [("oru-r01-labo.er7", 12), ("oru-r01-minimal.er7", 4)]:
        value = json.loads(post("ORU_PORT", 8081, "oru", filename, "text/plain"))
        bundle(value, "transaction", count)
    print("OK ORU → transactions de 12 et 4 ressources, références résolues")
    check_transformer_preview("oru-r01-to-fhir-bundle.xml", "oru-r01-minimal.er7", value)
    check_message_trace()

    patient = json.loads(post("PATIENT_PORT", 8082, "patient", "oru-r01-minimal.er7", "text/plain"))
    assert patient["resourceType"] == "Patient" and patient["birthDate"] == "1980-02-15"
    print("OK ORU → Patient")

    # Le même message lu avec le Strict Parser HL7 v2 : même Patient, chemins HAPI dans le mapping.
    strict = json.loads(post("STRICT_PATIENT_PORT", 8088, "patient", "oru-r01-minimal.er7", "text/plain"))
    assert strict == patient, strict
    print("OK ORU → Patient par le Strict Parser, identique au parser par défaut")
    # Strict Parser → modèle logique typé → maps ORUR01toBundle et PIDtoPatient importée.
    fml = json.loads(post("FML_TYPED_PORT", 8087, "bundle", "oru-r01-minimal.er7", "text/plain"))
    assert fml["resourceType"] == "Bundle" and fml["type"] == "transaction", fml
    assert [entry["resource"]["resourceType"] for entry in fml["entry"]] == ["Patient", "Observation"], fml
    assert fml["entry"][0]["resource"]["identifier"][0]["value"] == "100001", fml
    assert fml["entry"][1]["resource"]["code"]["text"] == "GLU", fml
    assert fml["entry"][1]["resource"]["valueString"] == "5.10", fml
    print("OK ORU Strict Parser → Bundle par FML typé (PIDtoPatient importée)")
    # La même map écrite dans l'étape (mapSource), sans fichier de map sur le serveur.
    inline = json.loads(post("FML_INLINE_PORT", 8089, "patient", "oru-r01-minimal.er7", "text/plain"))
    assert inline == patient, inline
    print("OK ORU → Patient par la map FML écrite dans l'étape, identique")
    check_fml_previews()

    transaction = json.loads(post("LAB_BUNDLES_PORT", 8083, "labo", "oru-r01-labo.er7", "text/plain"))
    message = messages("labo")[0]
    assert encoded(message, 1) == transaction
    document = encoded(message, 2)
    bundle(transaction, "transaction", 12)
    bundle(document, "document", 14)
    assert document["entry"][0]["resource"]["resourceType"] == "Composition"
    shared = {e["fullUrl"]: e["resource"] for e in document["entry"]}
    assert all(shared[e["fullUrl"]] == e["resource"] for e in transaction["entry"])
    # L'archive PCA/PRA suit l'entrepôt documentaire dans sa chaîne et reçoit le même document.
    archive = connector(message, 3)
    assert encoded(message, 3) == document
    assert "archive-pca/labo-document-" in archive.findtext("response/content")
    print("OK deux Bundles : transaction 12, document 14, mêmes ressources et identités ; document archivé")
    check_transformer_preview("oru-r01-to-two-lab-bundles.xml", "oru-r01-labo.er7", transaction, document)

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

    request = json.loads((EXAMPLES / "trace-preview.json").read_text(encoding="utf-8"))
    result = json.loads(api("/extensions/fhir-profile-mapper/test", "application/json",
                            json.dumps(request).encode("utf-8")))
    assert not result["errors"]
    trace = result["trace"]
    assert trace["scope"] == "step-preview" and trace["truncated"] is False
    assert len(trace["mappingHash"]) == 64 and trace["events"]
    assert all("value" not in event for event in trace["events"])
    assert "Durand" not in json.dumps(trace)
    assert any(e["phase"] == "condition" and e["status"] == "skipped" for e in trace["events"])
    assert any(e["phase"] == "conversion" and e["status"] == "absent" for e in trace["events"])
    request["trace"]["enabled"] = False
    off = json.loads(api("/extensions/fhir-profile-mapper/test", "application/json", json.dumps(request).encode("utf-8")))
    assert "trace" not in off
    assert all(off[field] == result[field] for field in ("output", "errors", "issues", "validationPerformed"))
    request["trace"] = {"enabled": True, "captureValues": True, "maxEvents": 200}
    captured = json.loads(api("/extensions/fhir-profile-mapper/test", "application/json", json.dumps(request).encode("utf-8")))
    assert any(e.get("value", {}).get("text") == "Durand" for e in captured["trace"]["events"])
    request["trace"]["maxEvents"] = 3
    bounded = json.loads(api("/extensions/fhir-profile-mapper/test", "application/json", json.dumps(request).encode("utf-8")))
    assert len(bounded["trace"]["events"]) == 3 and bounded["trace"]["truncated"] is True
    assert bounded["output"] == result["output"]
    print(f"OK trace : {len(trace['events'])} événements, valeurs sur demande, limite vérifiée, même résultat")
    from tools.run_tests import replay
    total = sum(replay(path, lambda request: json.loads(api("/extensions/fhir-profile-mapper/test", "application/json", json.dumps(request).encode())))
                for path in sorted((EXAMPLES.parents[1] / "demo/oie-init/channels").glob("*.xml")))
    assert total > 0
    print(f"OK outil de rejeu : {total} samples des exports de démonstration")
    check_additional_channels()


if __name__ == "__main__":
    main()
