#!/usr/bin/env python3
"""Reject broken local Markdown links and orphan documents under doc/."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
IGNORED_PARTS = {".git", "node_modules", "target"}
LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")


def markdown_files() -> set[Path]:
    return {
        path.resolve()
        for path in ROOT.rglob("*.md")
        if not IGNORED_PARTS.intersection(path.relative_to(ROOT).parts)
    }


def local_target(source: Path, raw: str) -> Path | None:
    value = raw.strip()
    if value.startswith("<") and ">" in value:
        value = value[1:value.index(">")]
    else:
        value = value.split(maxsplit=1)[0]
    if not value or value.startswith("#") or re.match(r"^[a-z][a-z0-9+.-]*:", value, re.I):
        return None
    value = unquote(value.split("#", 1)[0])
    if not value:
        return source
    return (ROOT / value.lstrip("/")) if value.startswith("/") else (source.parent / value)


def main() -> int:
    files = markdown_files()
    graph: dict[Path, set[Path]] = {path: set() for path in files}
    broken: list[tuple[Path, str]] = []

    for source in sorted(files):
        for raw in LINK.findall(source.read_text(encoding="utf-8")):
            target = local_target(source, raw)
            if target is None:
                continue
            resolved = target.resolve()
            if not resolved.exists():
                broken.append((source, raw))
            elif resolved in files:
                graph[source].add(resolved)

    entry = (ROOT / "doc/README.md").resolve()
    reachable: set[Path] = set()
    pending = [entry]
    while pending:
        current = pending.pop()
        if current in reachable:
            continue
        reachable.add(current)
        pending.extend(graph.get(current, ()))

    doc_root = (ROOT / "doc").resolve()
    orphans = sorted(path for path in files if path.is_relative_to(doc_root) and path not in reachable)
    for source, raw in broken:
        print(f"Lien local cassé : {source.relative_to(ROOT)} -> {raw}", file=sys.stderr)
    for path in orphans:
        print(f"Document orphelin : {path.relative_to(ROOT)}", file=sys.stderr)
    if broken or orphans:
        return 1
    print(f"Documentation : {len(files)} fichiers Markdown, liens locaux valides, aucun document orphelin.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
