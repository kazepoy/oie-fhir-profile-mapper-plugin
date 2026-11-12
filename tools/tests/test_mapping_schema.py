"""Le schéma doit accepter les exports réels et refuser les fautes de structure."""
# SPDX-License-Identifier: MPL-2.0

import copy
import json
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

from jsonschema import Draft202012Validator
from tools.check_mapping import SCHEMA, errors


ROOT = Path(__file__).resolve().parents[2]
EXAMPLES = ROOT / "doc/examples/mapping"


class MappingSchemaTest(unittest.TestCase):
    def test_schema_is_valid(self):
        Draft202012Validator.check_schema(SCHEMA)

    def test_documented_examples(self):
        for name in ("patient.step.json", "laboratory.steps.json", "unresolved-reference.steps.json"):
            value = json.loads((EXAMPLES / name).read_text())
            for step in value if isinstance(value, list) else [value]:
                with self.subTest(file=name, resource=step["resourceType"]):
                    self.assertEqual([], list(errors(step)))
        invalid = json.loads((EXAMPLES / "invalid-path.step.json").read_text())
        self.assertTrue(any("$.mappings (décodé)" in e for e in errors(invalid)))

    def test_all_demo_channels(self):
        channels = list((ROOT / "demo/oie-init/channels").glob("*.xml"))
        self.assertEqual(8, len(channels))  # sept canaux Profile Mapper, un canal FML
        count = 0
        for path in channels:
            # OIE stocke le nom dans CHANNEL.NAME, varchar(40) : un nom plus long fait échouer l'import.
            name = ET.parse(path).getroot().findtext("name")
            self.assertLessEqual(len(name), 40, path.name)
            for node in ET.parse(path).iter("org.oie.fhir.mapper.FhirProfileMapperStep"):
                step = {child.tag: child.text or "" for child in node}
                with self.subTest(channel=path.name, step=step.get("name")):
                    self.assertEqual([], list(errors(step)))
                count += 1
        self.assertGreater(count, 6)

    def test_embedded_json_is_checked_explicitly(self):
        for field in ("mappings", "bundleTargets"):
            for value in ("{", "{}", "[null]", "null"):
                with self.subTest(field=field, value=value):
                    self.assertTrue(list(errors({"action": "resource", "resourceType": "Patient", field: value})))

    def test_rule_forms_and_translation(self):
        step = json.loads((EXAMPLES / "patient.step.json").read_text())
        rule = {"key": "Patient.gender", "expression": "msg.gender", "path": [["gender"]],
                "translate": {"conceptMap": "urn:sex", "unmapped": "fixed", "value": "unknown"}}
        step["mappings"] = json.dumps([rule])
        self.assertEqual([], list(errors(step)))
        for change in ({"path": []}, {"path": [["gender", "#0", "extra"]]},
                       {"each": "msg.rows", "variable": "row"},
                       {"translate": {"conceptMap": "urn:sex", "unmapped": "fixed"}}):
            with self.subTest(change=change):
                step["mappings"] = json.dumps([{**rule, **change}])
                self.assertTrue(list(errors(step)))
        # Les anciens mappings peuvent employer element sans key.
        legacy = copy.deepcopy(rule)
        legacy["element"] = legacy.pop("key")
        step["mappings"] = json.dumps([legacy])
        self.assertEqual([], list(errors(step)))

    def test_step_actions_and_wire_representation(self):
        for step in (
            {"resourceType": "Patient"},
            {"action": "unknown", "resourceType": "Patient"},
            {"action": "createBundle", "resourceType": "Patient", "bundleName": "lab"},
            {"action": "createBundle", "resourceType": "Bundle", "bundleName": " "},
            {"action": "resource", "resourceType": "Patient", "mappings": []},
            {"action": "resource", "resourceType": "Patient", "requestMethod": "POST"},
        ):
            with self.subTest(step=step):
                self.assertTrue(list(errors(step)))
        step = {"action": "resource", "resourceType": "Patient", "validateOutput": "false", "mappings": ""}
        self.assertEqual([], list(errors(step)))


if __name__ == "__main__":
    unittest.main()
