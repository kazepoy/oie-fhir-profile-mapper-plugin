#!/usr/bin/env python3
"""Valider hors ligne ou rejouer les samples d'exports JSON/XML, sans déployer de canal."""
# SPDX-License-Identifier: MPL-2.0
import argparse
import base64
import json
import os
from pathlib import Path
import re
import ssl
import sys
import urllib.error
import urllib.request

try:
    from tools.check_mapping import errors
    from tools.channel_mapping import steps as channel_steps
except ModuleNotFoundError:
    from check_mapping import errors
    from channel_mapping import steps as channel_steps


def groups(path):
    """Each connector/transformer owns its own ordered mapper steps and references."""
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".xml":
        _, entries = channel_steps(text)
        grouped = {}
        for connector, kind, _, step in entries:
            grouped.setdefault(f"{connector}/{kind}", []).append(step)
        return grouped
    value = json.loads(text)
    steps = value if isinstance(value, list) else [value]
    if not all(isinstance(step, dict) for step in steps):
        raise ValueError("Une étape objet ou une liste d'étapes objets est requise.")
    return {"steps": steps}


def normalize(text):
    if text is None:
        return None
    try:
        text = json.dumps(json.loads(text), sort_keys=True, ensure_ascii=False)
    except ValueError:
        pass
    identities = {}
    def identity(match):
        return identities.setdefault(match[0].lower(), f"urn:uuid:<uuid-{len(identities)}>")
    text = re.sub(r"urn:uuid:[0-9a-f-]{36}", identity, text, flags=re.I)
    return re.sub(r'"lastUpdated"\s*:\s*"[^"]*"', '"lastUpdated": "<time>"', text)


def replay(path, post=None):
    count = 0
    for group, steps in groups(path).items():
        for index, step in enumerate(steps):
            problems = list(errors(step))
            if problems:
                raise ValueError(f"{group}, étape {index}: " + "; ".join(problems))
        enabled = [step for step in steps if str(step.get("enabled", True)).lower() != "false"]
        for step in enabled:
            samples = json.loads(step.get("samples") or "[]")
            for sample in samples:
                label = f"{path} [{group}] {step.get('name', step['resourceType'])} / {sample['name']}"
                if post is not None:
                    selection = {"steps": [{**s, "samples": "[]"} for s in enabled]} if sample.get("scope") == "transformer" else {"step": {**step, "samples": "[]"}}
                    result = post({**selection, "message": sample["message"], "dataType": sample.get("dataType", "HL7V2")})
                    invalid = [issue for issue in result.get("issues", []) if issue.get("severity") in ("error", "fatal")]
                    if result.get("errors") or invalid:
                        raise ValueError(f"{label}: " + json.dumps(result.get("errors") or invalid, ensure_ascii=False))
                    expected = sample.get("expected")
                    if expected not in (None, "") and normalize(expected) != normalize(result.get("output")):
                        raise ValueError(f"{label}: résultat différent de l’attendu")
                count += 1
                print(f"OK {label}" + (" (structure seulement)" if post is None else ""))
    return count


def client(url, user, password, insecure):
    context = ssl._create_unverified_context() if insecure else ssl.create_default_context()
    opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=context))
    authorization = "Basic " + base64.b64encode(f"{user}:{password}".encode()).decode()
    def post(body):
        request = urllib.request.Request(url.rstrip("/") + "/extensions/fhir-profile-mapper/test", data=json.dumps(body).encode(), headers={
            "Authorization": authorization, "X-Requested-With": "OpenAPI", "Content-Type": "text/plain; charset=UTF-8", "Accept": "application/json"})
        try:
            with opener.open(request, timeout=120) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            raise ValueError(f"HTTP {error.code} lors de l’aperçu") from error
    return post


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path, help="Exports JSON/XML ou dossiers d'exports")
    parser.add_argument("--offline", action="store_true", help="Schéma seulement ; aucune transformation")
    parser.add_argument("--url", default=os.environ.get("OIE_API", "https://localhost:8443/api"))
    parser.add_argument("--user", default=os.environ.get("OIE_USER", "admin"))
    parser.add_argument("--insecure", action="store_true", help="Accepter le certificat autosigné de la démo")
    args = parser.parse_args(argv)
    password = os.environ.get("OIE_PASSWORD")
    if not args.offline and not password:
        parser.error("Définir OIE_PASSWORD pour le rejeu serveur (ou utiliser --offline).")
    if any(not path.exists() for path in args.paths):
        parser.error("Un chemin demandé n’existe pas.")
    files = sorted({file for path in args.paths for file in (path.rglob("*") if path.is_dir() else [path])
                    if file.is_file() and (not path.is_dir() or file.suffix.lower() == ".xml" or file.name.endswith((".step.json", ".steps.json")))})
    if not files:
        parser.error("Aucun export trouvé.")
    failed, count = False, 0
    post = None if args.offline else client(args.url, args.user, password, args.insecure)
    for path in files:
        try:
            count += replay(path, post)
        except (OSError, ValueError, TypeError, KeyError) as error:
            print(f"ERREUR {path}: {error}", file=sys.stderr)
            failed = True
    if not args.offline and count == 0:
        print("ERREUR aucun sample exécuté.", file=sys.stderr)
        failed = True
    print(f"{len(files)} export(s), {count} sample(s) {'contrôlé(s) hors ligne' if args.offline else 'exécuté(s)'}. Compte rendu : {'ÉCHEC' if failed else 'OK'}.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
