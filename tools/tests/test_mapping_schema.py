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
EXAMPLES = ROOT / "doc/demo/examples/mapping"


class MappingSchemaTest(unittest.TestCase):
    def test_schema_is_valid(self):
        Draft202012Validator.check_schema(SCHEMA)

    def test_documented_examples(self):
        for name in ("patient.step.json", "patient-samples.step.json", "laboratory.steps.json", "unresolved-reference.steps.json"):
            value = json.loads((EXAMPLES / name).read_text())
            for step in value if isinstance(value, list) else [value]:
                with self.subTest(file=name, resource=step["resourceType"]):
                    self.assertEqual([], list(errors(step)))
        invalid = json.loads((EXAMPLES / "invalid-path.step.json").read_text())
        self.assertTrue(any("$.mappings (décodé)" in e for e in errors(invalid)))

    def test_all_demo_channels(self):
        channels = list((ROOT / "demo/oie-init/channels").glob("*.xml"))
        self.assertEqual(18, len(channels))  # 11 Profile Mapper, 5 FML, 1 FML+Mapper, 1 HTTP mock
        count = 0
        for path in channels:
            # OIE stocke le nom dans CHANNEL.NAME, varchar(40) : un nom plus long fait échouer l'import.
            name = ET.parse(path).getroot().findtext("name")
            self.assertLessEqual(len(name), 40, path.name)
            for node in ET.parse(path).iter("fr.kazepoy.fhir.mapper.FhirProfileMapperStep"):
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

    def test_demo_matrix_covers_exports_and_their_test_material(self):
        examples = ROOT / "demo/examples"
        channels = ROOT / "demo/oie-init/channels"
        cases = json.loads((examples / "channels.json").read_text())["channels"]
        names = [case["channel"] for case in cases]
        self.assertEqual(len(names), len(set(names)))
        self.assertEqual({p.name for p in channels.glob("*.xml")}, set(names))
        for case in cases:
            with self.subTest(channel=case["channel"]):
                self.assertTrue(case["group"])
                self.assertTrue(case["tags"])
                self.assertTrue((examples / case["input"]).is_file())
                root = ET.parse(channels / case["channel"]).getroot()
                self.assertTrue(root.findtext("sourceConnector/transformer/inboundTemplate"))
                mappers = list(root.iter("fr.kazepoy.fhir.mapper.FhirProfileMapperStep"))
                if mappers:
                    samples = [sample for step in mappers for sample in json.loads(step.findtext("samples") or "[]")]
                    self.assertTrue(samples)
                    self.assertTrue(all(sample.get("message") and sample.get("expected") for sample in samples))
                elif case.get("mock"):
                    self.assertEqual(0, len(list(root.iter("fr.kazepoy.fhir.fml.FhirFmlTransformStep"))))
                else:
                    preview = case["preview"]
                    self.assertTrue((examples / preview["input"]).is_file())
                    self.assertIn("resourceType", json.loads((examples / preview["expected"]).read_text()))
                if "deployed" in case:
                    self.assertEqual(case["deployed"]["port"], int(root.findtext("sourceConnector/properties/listenerConnectorProperties/port")))
                    self.assertTrue((examples / case["invalid"]["input"]).is_file())
                    self.assertTrue(case["invalid"]["diagnostic"])
                    self.assertIn("resourceType", json.loads((examples / case["deployed"]["expected"]).read_text()))

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

    def test_native_groups_and_tags_match_the_demo_manifest(self):
        manifest = json.loads((ROOT / "demo/examples/channels.json").read_text())
        exports = {case["channel"]: ET.parse(ROOT / "demo/oie-init/channels" / case["channel"]).getroot()
                   for case in manifest["channels"]}
        ports = [root.findtext("sourceConnector/properties/listenerConnectorProperties/port") for root in exports.values()]
        self.assertEqual(len(ports), len(set(ports)))
        members = set()
        for definition in manifest["groups"]:
            group = ET.parse(ROOT / "demo/oie-init/groups" / (definition["key"] + ".xml")).getroot().find("channelGroup")
            self.assertEqual(definition["id"], group.findtext("id"))
            self.assertEqual(definition["name"], group.findtext("name"))
            expected = {exports[c["channel"]].findtext("id") for c in manifest["channels"] if c["group"] == definition["key"]}
            actual = {c.findtext("id") for c in group.findall("channels/channel")}
            self.assertEqual(expected, actual)
            self.assertFalse(members & actual)
            members.update(actual)
        self.assertEqual({root.findtext("id") for root in exports.values()}, members)
        seen_tags = {}
        forbidden_tags = {"IG", "FR-Core-2-2-0", "EU-Lab-2-0-0", "profil-local", "local-profile"}
        releases = {"R4", "R5"}
        sources = {"CSV", "FHIR", "HL7v2", "HTTP", "JSON", "XML"}
        transfos = {"FML", "Mapper", "Mock"}
        for case in manifest["channels"]:
            root = exports[case["channel"]]
            tags = root.findall("exportData/channelTags/channelTag")
            xml_tag_names = [tag.findtext("name") for tag in tags]
            self.assertEqual(case["tags"], xml_tag_names, f"Tag order mismatch in {case['channel']}")
            canonical = (
                sorted([t for t in xml_tag_names if t in releases])
                + sorted([t for t in xml_tag_names if t in sources])
                + sorted([t for t in xml_tag_names if t in transfos])
                + sorted([t for t in xml_tag_names if t not in releases and t not in sources and t not in transfos])
            )
            self.assertEqual(canonical, xml_tag_names, f"Non-canonical tag order in {case['channel']}: {xml_tag_names}")
            for tag in tags:
                name = tag.findtext("name")
                if name in releases or name in sources or name in transfos:
                    self.assertRegex(name, r"^[A-Za-z0-9-]+$")
                else:
                    self.assertRegex(name, r"^[a-z0-9-]+$", f"Feature tag {name} must be lowercase kebab-case")
                self.assertNotIn(name, forbidden_tags)
                self.assertEqual([root.findtext("id")], [s.text for s in tag.findall("channelIds/string")])
                color = (
                    int(tag.findtext("backgroundColor/red")),
                    int(tag.findtext("backgroundColor/green")),
                    int(tag.findtext("backgroundColor/blue")),
                )
                self.assertNotEqual((192, 192, 192), color, f"Tag {name} uses default gray color")
                tag_spec = (tag.findtext("id"), color)
                if name in seen_tags:
                    self.assertEqual(seen_tags[name], tag_spec, f"Inconsistent tag spec for {name}")
                else:
                    seen_tags[name] = tag_spec

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
