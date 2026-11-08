# SPDX-License-Identifier: MPL-2.0
import json
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET
from tools.channel_mapping import TYPE, PATTERN, apply, select, steps

ROOT = Path(__file__).resolve().parents[2]


class ChannelMappingTest(unittest.TestCase):
    def test_all_demo_exports_can_be_read_and_updated_without_touching_other_steps(self):
        for path in (ROOT / "demo/oie-init/channels").glob("*.xml"):
            xml = path.read_bytes().decode("utf-8")
            root, entries = steps(xml)
            for connector, kind, node, step in entries:
                patch = dict(step)
                rules = json.loads(patch["mappings"])
                for index, rule in enumerate(rules):
                    rule["id"] = f"rule-{index}"
                patch["mappings"] = json.dumps(rules, ensure_ascii=False)
                patch["name"] = step["name"] + " modifié"
                patch["sequenceNumber"] = "999"
                patch["enabled"] = False
                ordinal = list(root.iter(TYPE)).index(node)
                span = list(PATTERN.finditer(xml))[ordinal]
                updated = apply(xml, connector, step["sequenceNumber"], patch, kind == "responseTransformer")
                self.assertTrue(updated.startswith(xml[:span.start()]))
                self.assertTrue(updated.endswith(xml[span.end():]))
                _, _, reopened = select(updated, connector, step["sequenceNumber"], kind == "responseTransformer")
                self.assertEqual(step["enabled"], reopened["enabled"])
                self.assertEqual(patch["mappings"], reopened["mappings"])
                self.assertEqual(step["sequenceNumber"], reopened["sequenceNumber"])
                self.assertEqual(root.findtext("id"), ET.fromstring(updated).findtext("id"))

    def test_wrong_selection_and_invalid_rules_are_rejected(self):
        xml = (ROOT / "demo/oie-init/channels/sql-xml-vers-patient-fhir.xml").read_text()
        with self.assertRaises(ValueError):
            select(xml, "999", "999")
        _, entries = steps(xml)
        connector, _, _, step = entries[0]
        with self.assertRaises(ValueError):
            apply(xml, connector, step["sequenceNumber"], {"mappings": "[null]"})
        with self.assertRaises(ValueError):
            apply(xml, connector, step["sequenceNumber"], {"__type": "another.Step"})


if __name__ == "__main__":
    unittest.main()
