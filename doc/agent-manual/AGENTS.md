# Instructions for building FHIR channels in OIE

This file is for an agent using the plugin in OIE. It does not contain
instructions for modifying the plugin's source code.

Before creating or modifying a channel export, read the complete guide:
[Building or modifying a FHIR channel with an agent](../reference/Construire-un-channel.md).

Minimum rules:

- prefer FML when a portable map fits the requirement; use Profile Mapper for
  a graphical transformation specific to the OIE runtime;
- use only `fr.kazepoy.fhir.*` serialized types;
- preserve UUIDs, `sequenceNumber`, rule IDs and unrelated XML sections;
- prefer `tools/channel_mapping.py` to rewriting an entire channel export;
- validate mappings, read back the generated export and run its samples before
  considering the channel complete;
- never import, deploy or modify an external server without an explicit
  request. The repository's local demo may be used for verification.
