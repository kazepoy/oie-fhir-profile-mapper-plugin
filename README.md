# OIE FHIR Profile Mapper

Plugin pour Open Integration Engine (OIE) permettant de construire des ressources
et des Bundles FHIR à partir de messages métier, avec un éditeur graphique.

Le mapper s'appuie sur les profils FHIR et utilise le plugin **FHIR Data Type**
comme prérequis.

- Arbre compact avec guides de niveaux et branches regroupées visuellement.
- Expressions, conditions, répétitions, traductions et références entre ressources.
- Assistants de code avec `Ctrl+Espace`, suggestions contextuelles et aide FHIR.
- Validation FHIR optionnelle, diagnostics par règle et trace exportable des tests.
- Mappings JSON éditables par des outils ou agents IA, avec identifiants de règles.

La version de développement reprend le runtime du POC et ses six canaux
de démonstration : HL7 v2, XML SQL et CSV. La trace des channels déployés reste
à compléter. Stabilisation et livraison, performances et charge, et mapper FML
sont réservés à des phases ultérieures.

Documentation :

- [Plan du projet](docs/Plan.md)
- [Développement et installation](docs/Developpement.md)
- [Démonstration](docs/Demo.md)
- [Mapper graphique](docs/Mappeur-graphique.md)
- [Assistants et parcours IA](docs/Assistants-et-IA.md)
- [Trace des tests](docs/Trace.md)

Licence : [Mozilla Public License 2.0](LICENSE).
