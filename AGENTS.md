# Plugin development instructions

This file is for agents modifying this repository's Java sources, frontend,
tools, tests or documentation. Instructions for agents building OIE channels
with the plugin are in the separate [agent manual](doc/agent-manual/README.md).

## Project rules

- Read the [development guide](doc/development/Developpement.md) and the
  [active roadmap](doc/plan-suite.md) before making structural changes.
- Keep the `fr.kazepoy.fhir` namespace. Do not add compatibility with former
  development types.
- Do not edit `webadmin/web/plugin.js` directly; rebuild it from `webadmin/src`.
- Preserve unrelated user changes, including untracked files.
- Run at least `mvn clean package` and the relevant Python tests. When changing
  documentation, also run `python3 tools/check_doc_links.py`.
