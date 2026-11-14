# OIE FHIR Profile Mapper

A plugin for [Open Integration Engine](https://github.com/OpenIntegrationEngine/engine)
(OIE 4.7, Web Admin 1.3). It builds FHIR resources and Bundles from business
messages.
It requires the [**FHIR Data Type**](https://github.com/matthydehoog/fhir-datatype-Eclipse-OIE)
plugin, version 1.5.1 ([release](https://github.com/matthydehoog/fhir-datatype-Eclipse-OIE/releases/tag/v1.5.1)).
FHIR Profile Mapper is a separate project, not part of FHIR Data Type: please report
its issues [here](https://github.com/kazepoy/oie-fhir-profile-mapper-plugin/issues).

TODO ajouter aussi discussions de github

## FHIR Profile Mapper

A transformer step that maps a message onto a FHIR profile: profile tree, slices,
expressions, conditions, iterations, translations, references between resources,
FHIR validation and per-rule diagnostics. Expressions are edited in Web Admin's code
editor with completion (mapper functions, iteration variables, sample paths,
references of other steps); sample messages and their expected results are saved
with the step.

![FHIR Profile Mapper in a transformer](doc/user-manual/fr/images/fhir-mapper.png)

## FHIR FML Transform

A second transformer step, next to the Profile Mapper: it runs an FML map
(StructureMap) on a generic OIE model, a typed HL7 v2 logical model fed by the
Strict Parser, or an inbound FHIR resource, then validates and publishes the
result. The map is a file of the profile locations, or is written in the step
itself, in an editor with highlighting, completion, syntax check and skeleton
generation. It uses the FML engine of the HL7 core
that FHIR Data Type ships, with no extra library.

## Try it

```sh
cd demo
docker compose up -d --build
cd ../webadmin && npm run test:e2e   # runs API, channel and Web Admin Playwright tests
```

Administration: <https://localhost:8443/oie-webadmin/> (`admin` /
`demo-oie-password`). See the [demo guide](doc/demo/Demo.md) (in French).

## Documentation

Detailed documentation is in French:

- [Documentation hub](doc/README.md): user, reference, architecture, development, demo and history
- [Illustrated user manual](doc/user-manual/README.md): Profile Mapper, FML and Settings, with feature-by-feature procedures and screenshots
- [Development, installation and releases](doc/development/Developpement.md)
- [Mapping format and execution](doc/reference/Specification-mapping.md)
- [Demo](doc/demo/Demo.md)
- [Active roadmap](doc/plan-suite.md): decisions, classified backlog and next lots
- [Changelog](CHANGELOG.md)

License: [Mozilla Public License 2.0](LICENSE).
