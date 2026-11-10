# OIE FHIR Profile Mapper

Plugin pour [Open Integration Engine](https://github.com/OpenIntegrationEngine/engine)
(OIE 4.7, Web Admin 1.3) : il construit des ressources et des Bundles FHIR à partir
de messages métier, et montre le parcours des messages dans chaque canal.
Il nécessite le plugin **FHIR Data Type**.

## FHIR Profile Mapper

Une étape de transformer qui mappe un message vers un profil FHIR : arbre du profil,
expressions, conditions, répétitions, traductions, références entre ressources,
validation FHIR et diagnostics par règle.

![FHIR Profile Mapper dans un transformer](docs/images/fhir-mapper.png)

## Flow

L’onglet **Flow** de l’éditeur de canal dessine le trajet d’un message : source,
chaînes de destinations, postprocessing et réponse. Chaque composant ouvre son
éditeur, et `+` ajoute un filtre ou une étape. Trois vues : Line, Columns, Bands.

![Onglet Flow d’un canal](docs/images/channel-flow.png)

## Flows

La vue **Flows** (section Monitor) présente les canaux déployés par groupe, chacun sur
une ligne, avec ses compteurs par connecteur. Un compteur ouvre Messages sur le bon
connecteur et le bon statut.

![Vue Flows avec les compteurs](docs/images/flows.png)

## Essayer

```sh
cd demo
docker compose up -d --build
python3 examples/check.py   # envoie des messages dans les canaux de démo
```

Administration : <https://localhost:8443/oie-webadmin/> (`admin` /
`demo-fhir-mapper-admin`). Détails dans [Démonstration](docs/Demo.md).

## Documentation

- [Développement et installation](docs/Developpement.md)
- [Mapper graphique](docs/Mappeur-graphique.md)
- [Flow et Flows](docs/Channel-Flow.md)
- [Assistants et parcours IA](docs/Assistants-et-IA.md)
- [Trace des tests](docs/Trace.md)
- [Plan du projet](docs/Plan.md)

Licence : [Mozilla Public License 2.0](LICENSE).
