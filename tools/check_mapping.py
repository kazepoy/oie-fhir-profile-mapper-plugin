#!/usr/bin/env python3
"""Contrôle structurel hors ligne des étapes JSON du mapper."""
# SPDX-License-Identifier: MPL-2.0

import argparse
import json
from pathlib import Path
import sys

from jsonschema import Draft202012Validator


SCHEMA = json.loads((Path(__file__).resolve().parents[1] / "docs/schemas/mapping-step.schema.json").read_text(encoding="utf-8"))
VALIDATOR = Draft202012Validator(SCHEMA)


def errors(step):
    """Les contentSchema sont des annotations : vérifier aussi le JSON imbriqué."""
    for error in VALIDATOR.iter_errors(step):
        yield f"{error.json_path}: {error.message}"
    if not isinstance(step, dict):
        return
    for field in ("mappings", "bundleTargets"):
        value = step.get(field, "[]")
        if not isinstance(value, str):
            continue  # Le schéma de l'étape signale déjà le mauvais type.
        try:
            content = json.loads(value) if value.strip() else []
        except ValueError as error:
            yield f"$.{field}: JSON invalide : {error}"
            continue
        validator = VALIDATOR.evolve(schema={
            **SCHEMA["properties"][field]["contentSchema"], "$defs": SCHEMA["$defs"]
        })
        for error in validator.iter_errors(content):
            yield f"$.{field} (décodé){error.json_path[1:]}: {error.message}"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", type=Path, nargs="+", help="Une étape ou une liste ordonnée d'étapes JSON")
    args = parser.parse_args()
    Draft202012Validator.check_schema(SCHEMA)
    failed = False
    for path in args.files:
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
            steps = value if isinstance(value, list) else [value]
            problems = [f"{path}, étape {i}: {error}" for i, step in enumerate(steps) for error in errors(step)]
        except (OSError, ValueError) as error:
            problems = [f"{path}: {error}"]
        if problems:
            failed = True
            print("\n".join(problems), file=sys.stderr)
        else:
            print(f"OK {path} ({len(steps)} étape(s), structure seulement)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
