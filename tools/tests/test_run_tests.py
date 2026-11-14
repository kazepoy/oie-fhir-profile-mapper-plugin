# SPDX-License-Identifier: MPL-2.0
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from tools.run_tests import normalize
from tools.run_tests import groups, replay, main

ROOT = Path(__file__).resolve().parents[2]

class ReplayTest(unittest.TestCase):
    def sample_file(self, directory, scope="step"):
        path = Path(directory) / "fixture.step.json"
        step = {"name": "Patient", "action": "resource", "resourceType": "Patient", "samples": json.dumps([
            {"id": "one", "name": "One", "message": "{}", "dataType": "JSON", "scope": scope, "expected": '{"resourceType":"Patient","id":"expected"}'}])}
        path.write_text(json.dumps([step, {"action": "createBundle", "resourceType": "Bundle", "bundleName": "disabled", "enabled": False}]))
        return path

    def test_ordered_transformer_selection_and_result_mismatch(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            path = self.sample_file(directory, "transformer")
            requests = []
            def post(request):
                requests.append(request)
                return {"errors": [], "issues": [], "output": '{"id":"expected","resourceType":"Patient"}'}
            self.assertEqual(1, replay(path, post))
            self.assertEqual(1, len(requests[0]["steps"]))
            self.assertEqual("[]", requests[0]["steps"][0]["samples"])
            with self.assertRaisesRegex(ValueError, "différent"):
                replay(path, lambda _: {"output": '{"resourceType":"Patient","id":"wrong"}'})
            with self.assertRaisesRegex(ValueError, "forbidden"):
                replay(path, lambda _: {"errors": [{"message": "forbidden"}]})

    def test_offline_checks_samples_and_exit_status_is_nonzero_for_invalid_exports(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            path = self.sample_file(directory)
            self.assertEqual(0, main([str(path), "--offline"]))
            value = json.loads(path.read_text()); value[0]["samples"] = '[{"id":"bad"}]'
            path.write_text(json.dumps(value))
            self.assertEqual(1, main([str(path), "--offline"]))

    def test_demo_exports_keep_connector_and_response_groups_separate(self):
        count = 0
        for path in (ROOT / "demo/oie-init/data/channels").glob("*.xml"):
            for group, steps in groups(path).items():
                self.assertRegex(group, r"^\d+/(transformer|responseTransformer)$")
                count += len(steps)
        self.assertGreater(count, 20)

    def test_online_cli_exits_with_failure_when_the_expected_output_differs(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            path = self.sample_file(directory)
            with patch.dict("os.environ", {"OIE_PASSWORD": "test"}), patch("tools.run_tests.client", return_value=lambda _: {"output": "{}"}):
                self.assertEqual(1, main([str(path)]))

    def test_comparison_preserves_uuid_reference_relationships(self):
        a = "urn:uuid:11111111-1111-1111-1111-111111111111"
        b = "urn:uuid:22222222-2222-2222-2222-222222222222"
        value = json.dumps({"entry": [{"fullUrl": a}, {"fullUrl": b, "reference": a}]})
        self.assertEqual(normalize(value), normalize(value.replace(a, "urn:uuid:33333333-3333-3333-3333-333333333333")))
        self.assertNotEqual(normalize(value), normalize(json.dumps({"entry": [{"fullUrl": a}, {"fullUrl": b, "reference": b}]})))
