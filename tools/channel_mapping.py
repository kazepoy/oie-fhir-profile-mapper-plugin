#!/usr/bin/env python3
"""Lister, extraire et modifier une étape mapper dans un export XML OIE."""
# SPDX-License-Identifier: MPL-2.0
import argparse
import json
from pathlib import Path
import re
import sys
import uuid
import xml.etree.ElementTree as ET

try:
    from tools.check_mapping import errors, SCHEMA
except ModuleNotFoundError:
    from check_mapping import errors, SCHEMA

TYPE = "fr.kazepoy.fhir.mapper.FhirProfileMapperStep"
PATTERN = re.compile(r"<" + re.escape(TYPE) + r"(?:\s[^>]*)?>.*?</" + re.escape(TYPE) + r">", re.S)


def steps(xml):
    root = ET.fromstring(xml)
    if root.tag != "channel":
        raise ValueError("Un export XML d'un seul channel est requis.")
    result = []
    connectors = [root.find("sourceConnector"), *root.findall("destinationConnectors/connector")]
    for connector in connectors:
        if connector is None:
            continue
        for transformer in ("transformer", "responseTransformer"):
            for node in connector.findall(f"{transformer}/elements/{TYPE}"):
                step = {child.tag: child.text or "" for child in node}
                step["__type"] = TYPE
                result.append((connector.findtext("metaDataId"), transformer, node, step))
    return root, result


def select(xml, connector, sequence, response=False):
    root, entries = steps(xml)
    matches = [(node, step) for cid, transformer, node, step in entries
               if cid == str(connector) and step.get("sequenceNumber") == str(sequence)
               and transformer == ("responseTransformer" if response else "transformer")]
    if len(matches) != 1:
        raise ValueError("La sélection doit désigner exactement une étape mapper (connecteur/séquence/réponse).")
    return root, *matches[0]


def apply(xml, connector, sequence, patch, response=False):
    if not isinstance(patch, dict):
        raise ValueError("Une étape JSON objet est requise.")
    root, node, current = select(xml, connector, sequence, response)
    if patch.get("__type", TYPE) != TYPE:
        raise ValueError("Type d'étape incompatible.")
    merged = {**current, **patch, "sequenceNumber": current["sequenceNumber"], "enabled": current.get("enabled", "true")}
    problems = list(errors(merged))
    if problems:
        raise ValueError("\n".join(problems))
    ordinal = list(root.iter(TYPE)).index(node)
    spans = list(PATTERN.finditer(xml))
    if len(spans) != len(list(root.iter(TYPE))):
        raise ValueError("Représentation XML non prise en charge pour une modification ciblée.")
    for key, value in patch.items():
        if key in ("__type", "sequenceNumber", "enabled"):
            continue
        child = next((child for child in node if child.tag == key), None)
        if key not in SCHEMA["properties"] and child is None:
            raise ValueError(f"Propriété inconnue : {key}")
        if child is None:
            child = ET.SubElement(node, key)
        child.text = str(value).lower() if isinstance(value, bool) else str(value)
    node.tail = None
    replacement = ET.tostring(node, encoding="unicode")
    span = spans[ordinal]
    return xml[:span.start()] + replacement + xml[span.end():]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["list", "extract", "apply", "explain"])
    parser.add_argument("channel", type=Path)
    parser.add_argument("--connector", default="0")
    parser.add_argument("--sequence")
    parser.add_argument("--response", action="store_true")
    parser.add_argument("--step", type=Path, help="Étape JSON modifiée, pour apply")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--assign-ids", action="store_true", help="Attribuer les ids manquants à l'extraction JSON")
    args = parser.parse_args()
    try:
        xml = args.channel.read_bytes().decode("utf-8")
        if args.command == "list":
            _, entries = steps(xml)
            result = [{"connector": cid, "response": kind == "responseTransformer", **step} for cid, kind, _, step in entries]
        else:
            if args.sequence is None:
                raise ValueError("--sequence est requis ; list permet de trouver la sélection.")
            _, _, step = select(xml, args.connector, args.sequence, args.response)
            if args.command == "apply":
                if not args.step or not args.output:
                    raise ValueError("apply exige --step et --output.")
                patched = apply(xml, args.connector, args.sequence, json.loads(args.step.read_text(encoding="utf-8")), args.response)
                args.output.write_bytes(patched.encode("utf-8"))
                return 0
            rules = json.loads(step.get("mappings") or "[]")
            if args.assign_ids:
                for rule in rules:
                    rule.setdefault("id", str(uuid.uuid4()))
                step["mappings"] = json.dumps(rules, ensure_ascii=False)
            result = step
            if args.command == "explain":
                result = {"name": step.get("name"), "action": step.get("action"), "resourceType": step.get("resourceType"),
                          "targets": json.loads(step.get("bundleTargets") or "[]"), "validateOutput": step.get("validateOutput", "true"),
                          "rules": [{"id": r.get("id"), "key": r.get("key", r.get("element")), "path": r.get("path"),
                                     "operation": "iteration" if "each" in r else "condition" if "condition" in r else "fixed" if "fixed" in r else "value",
                                     "expression": r.get("expression", r.get("condition", r.get("each", r.get("fixed"))))} for r in rules]}
        text = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
        if args.output:
            args.output.write_text(text, encoding="utf-8")
        else:
            print(text, end="")
        return 0
    except (OSError, ValueError, ET.ParseError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
