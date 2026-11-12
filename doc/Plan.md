# Plan du projet OIE FHIR Profile Mapper

## Objectif

Un plugin OIE qui construit des ressources et des Bundles FHIR à partir des
messages traités par OIE : un format de mapping JSON, son runtime, des fonctions
utilitaires et un éditeur graphique. Le format JSON est le contrat central ;
l'éditeur, le runtime et les outils des agents IA le partagent.

Le code est repris du POC [fhir-datatype-Eclipse-OIE](https://github.com/kazepoy/fhir-datatype-Eclipse-OIE),
branche `feature/fhir-profile-mapper`, commit `1df2c4054f5fc93b5dc348a1e43f572dd1cd5f16`,
sous MPL 2.0. L'historique détaillé des jalons est dans l'historique git.

## Décisions

- Plugin distinct, avec **FHIR Data Type 1.5.1** officiel comme prérequis.
- Tous les appels au datatype passent par une **façade interne** et un adaptateur
  ([intégration](Integration-FHIR-Data-Type.md)).
- La **validation FHIR est optionnelle** ; les contrôles du mapping, les conversions
  et les références restent toujours actifs.
- Runtime et éditeur **faciles à déboguer** : diagnostics reliés aux règles, trace
  activable sur un test ou sur les messages traités.
- Un **agent IA** peut construire, lire, modifier et expliquer un mapping à partir
  de formats et d'API documentés, sans état propre à l'interface.
- Démo dans `demo/`, administration sur le port **8443** : OIE 4.7.0, Web Support
  1.3.0, FHIR Data Type 1.5.1, RBAC 1.3.0 et les six canaux de référence.

## Livré

| Sujet | Référence |
|---|---|
| Reprise du compilateur, du runtime, de l'éditeur et des six canaux du POC | [Démo](Demo.md) |
| Façade FHIR Data Type et pont de catalogue | [Intégration](Integration-FHIR-Data-Type.md) |
| Spécification du format, schéma JSON, exemples exécutables | [Format et exécution](Specification-mapping.md) |
| Diagnostics par règle, erreurs d'expression explicites (`TypeError`) | [Format §8](Specification-mapping.md#8-diagnostics-tests-dapi-et-traces) |
| Trace du test et des messages traités (références réelles, finalisation, publication, `scriptHash`) | [Trace](Trace.md) |
| Éditeur en onglets Properties / Mapper / Test, édition en JSON | [Éditeur](Mappeur-graphique.md) |
| Assistants de code (`Ctrl`/`Alt+Espace`), outils et parcours des agents IA | [Assistants et IA](Assistants-et-IA.md) |
| Build et release GitHub sur tag `vX.Y.Z` | [Développement](Developpement.md) |
| Étape FHIR FML Transform : maps FML sur le modèle logique générique `OieMessage`, moteur du core HL7 de FHIR Data Type | [Transformation FML](Transformation-FML.md) |

Les vérifications visuelles (édition, diagnostics, trace, export, parcours IA)
ont été faites dans un navigateur (Playwright, Chromium headless).

## Points ouverts du format

- Pas de champ de version du format : à définir avant une évolution incompatible.
- Document complet au-delà des fragments par étape, si un besoin apparaît.
- L'aperçu isolé ne simule pas les dépendances entre étapes.
- Extensions primitives, `contained`, sous-slices, discriminants `type`, `profile`
  et `exists` non pris en charge.

## Phases ultérieures

La revue complète du 11 novembre 2026 et le plan de refonte en sept phases
(studio de mapping, assistance à la saisie, contextes serveur, format v2,
transformeur FML) sont dans [plan-refonte.md](plan-refonte.md). Les points
ci-dessous y sont repris.

- **Stabilisation et livraison** : compatibilité approfondie de l'adaptateur FHIR
  Data Type, migration du namespace vers `fr.kazepoy` avec compatibilité des
  exports, vérification des releases installables à chaque version.
- **Performances et charge** : mesurer séparément l'édition des profils, le mapping
  avec et sans validation, et le surcoût de la trace ; tests de charge (débit,
  latence, mémoire, exécution prolongée) avec des seuils définis à l'avance.
- **Transformation FML, suites** : canonique définitive du modèle OIE, mesures de
  charge et concurrence, diagnostics par règle FML ([limites](Transformation-FML.md#8-limites-et-suites)).

## Retours d'usage à traiter

Aucun en attente.
