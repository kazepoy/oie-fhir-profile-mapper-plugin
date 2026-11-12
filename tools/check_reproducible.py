#!/usr/bin/env python3
# SPDX-License-Identifier: MPL-2.0
"""Rebuild in a fresh directory with a stale frontend and compare the complete ZIP."""
import hashlib
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile


def main():
    root = Path(__file__).resolve().parents[1]
    archives = list((root / "target").glob("fhir-profile-mapper-*.zip"))
    if len(archives) != 1:
        raise SystemExit("Run mvn clean package first (one ZIP expected).")
    reference = archives[0].read_bytes()
    with tempfile.TemporaryDirectory(prefix="fhir-mapper-repro-") as temporary:
        checkout = Path(temporary) / "project"
        shutil.copytree(root, checkout, ignore=shutil.ignore_patterns(
            ".git", ".vscode", "node_modules", "target", "__pycache__", ".env", ".env.*", "output"))
        (checkout / "webadmin/web/plugin.js").write_text("STALE_FRONTEND_MUST_NOT_BE_PACKAGED")
        subprocess.run(["mvn", "-B", "-ntp", "-q", "-DskipTests", "clean", "package"], cwd=checkout, check=True)
        rebuilt = checkout / "target" / archives[0].name
        with zipfile.ZipFile(rebuilt) as archive:
            frontend = next(name for name in archive.namelist() if name.endswith("/webadmin/web/plugin.js"))
            assert b"STALE_FRONTEND_MUST_NOT_BE_PACKAGED" not in archive.read(frontend)
        if rebuilt.read_bytes() != reference:
            raise SystemExit("The two ZIP archives differ.")
    print("Identical ZIP after clean rebuild in another directory; stale frontend replaced.")
    print("SHA-256:", hashlib.sha256(reference).hexdigest())


if __name__ == "__main__":
    main()
