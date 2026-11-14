# Demo FHIR Resources (`/fhir-volume`)

Mounted read-only at `/fhir-volume` inside `oie-app`:

- `ig/`: local demo profiles, `ConceptMap`, and `StructureMap` resources
- `fml/`: `.fml` mapping files
- `fml-typed/`: `.fml` maps with typed logical models (`StructureDefinition`)

## IG `.tgz` Packages

Public FHIR IG `.tgz` archives (FR Core, EU Laboratory, and dependencies) are not committed in the repository to avoid bloating it.

They are downloaded and verified during the Docker build ([Dockerfile](../Dockerfile)) into `/fhir-packages/` inside the container, and used alongside `/fhir-volume` by the demo FHIR contexts ([configuration.xml](../oie-init/data/configuration.xml)) and example channels ([data/channels](../oie-init/data/channels)).
