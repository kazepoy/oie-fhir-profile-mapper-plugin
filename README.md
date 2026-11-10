# OIE FHIR Profile Mapper

A plugin for [Open Integration Engine](https://github.com/OpenIntegrationEngine/engine)
(OIE 4.7, Web Admin 1.3). It builds FHIR resources and Bundles from business
messages, and shows how messages move through each channel.
It requires the **FHIR Data Type** plugin.

## FHIR Profile Mapper

A transformer step that maps a message onto a FHIR profile: profile tree, slices,
expressions, conditions, iterations, translations, references between resources,
FHIR validation and per-rule diagnostics.

![FHIR Profile Mapper in a transformer](docs/images/fhir-mapper.png)

## Flow

The **Flow** tab of the channel editor draws the path of a message: source,
destination chains, postprocessing and response. Every component opens its editor,
and `+` adds a filter rule or a step. Three layouts: Line, Columns, Bands.

![Flow tab of a channel](docs/images/channel-flow.png)

## Flows

The **Flows** view (Monitor section) shows deployed channels by group, one channel
per row, with message counters for each connector. A counter opens Messages on the
right connector and status.

![Flows view with counters](docs/images/flows.png)

## Try it

```sh
cd demo
docker compose up -d --build
python3 examples/check.py   # sends messages through the demo channels
```

Administration: <https://localhost:8443/oie-webadmin/> (`admin` /
`demo-fhir-mapper-admin`). See the [demo guide](docs/Demo.md) (in French).

## Documentation

Detailed documentation is in French:

- [Development and installation](docs/Developpement.md)
- [Graphical mapper](docs/Mappeur-graphique.md)
- [Flow and Flows](docs/Channel-Flow.md)
- [Code assistants and AI workflow](docs/Assistants-et-IA.md)
- [Test traces](docs/Trace.md)
- [Project plan](docs/Plan.md)

License: [Mozilla Public License 2.0](LICENSE).
