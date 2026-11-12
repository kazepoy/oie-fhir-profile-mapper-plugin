# Reprise de la refonte

État vérifié le 12 novembre 2026 sur `feat/refonte`, à partir de `4907d15`.
Le [plan de conception](doc/plan-refonte.md) reste la référence fonctionnelle.
Ce suivi découpe le travail restant en lots vérifiables ; une phase partielle
ne doit pas être présentée comme terminée.

## Diagnostic de reprise

- Le dépôt était propre. Le socle frontend, les deux étapes, les contextes
  serveur, le catalogue et la trace sont présents. CI : tests Node et Python,
  build frontend, puis assemblage Maven.
- Les tests frontend du mappeur chargent encore `editor.js` dans un contexte VM
  avec React simulé. Le découpage en modules testables directement reste à faire,
  ainsi que l'i18n. Il n'existe pas encore de script `npm run check`, pourtant
  cité dans le plan.
- `pom.xml` embarque le bundle frontend existant sans lancer sa construction.
  La CI et le Dockerfile construisent ce bundle ; `mvn package` seul peut donc
  embarquer un frontend périmé. Corriger ce point dans le lot de socle restant.
- Le format 1 reste lu : `fromJson` ne réalise pas la migration automatique
  annoncée dans la cible initiale. L'état d'avancement du plan indique que
  l'outil de migration et l'index persistant sont volontairement différés.
  Conserver cette compatibilité et distinguer ce choix d'une migration livrée.
- `FhirMapperTester` prévisualise une étape seule. Les références et les Bundles
  multi-étapes restent à tester ensemble avant de clore la phase 4.
- FML : map inline, langage et contrôle sont présents. `FmlBridge` synchronise
  encore les opérations sur le contexte. Modèles typés et pool ne sont pas
  livrés ; le choix du moteur pour les maps typées reste à vérifier par S-2.
- La présence d'une politique de validation ne prouve pas l'absence de double
  validation avec le datatype. Le coût réel et la cause des délais sous charge
  restent à établir par mesure (S-3), avant de choisir une optimisation.

## Lots de réalisation

| Lot | Travail | Critère de fin |
|---|---|---|
| 1 — fait | Notes et activation par règle dans le mappeur, y compris la racine ; historique et documentation | Test unitaire : valeur et condition sur le même élément indépendantes, IDs conservés, effacement de note, Undo/Redo. Test Playwright : note, désactivation et restauration. |
| 2 — fait | Inspecteur de l'élément sélectionné : métadonnées FHIR, règles, aide et diagnostics ; extraire uniquement les composants nécessaires | Sélection et édition dans la vue normale et en plein écran ; accès clavier ; diagnostics vers la bonne règle ; aucune perte au rechargement. |
| 3 — suivant | Assistance restante : extensions du profil, ConceptMaps pertinentes, menu contextuel et duplication de branche | Exemples de profil avec extensions et slices ; duplication avec nouveaux IDs ; parcours clavier et sauvegarde/relecture. |
| 4 | Terminer le socle : découpage ciblé des éditeurs, anglais/français, thèmes, contrôle frontend et assemblage reproductible | Tests des modules sans VM pour le code extrait ; interface dans les deux langues ; ZIP construit depuis des sources frontend modifiées ; parcours clair/sombre et rôle restreint. |
| 5 | Aperçu multi-étapes, puis outil de rejeu des samples et import/export de tableaux/documentation | Patient + Observation avec référence réelle ; deux Bundles nommés ; erreur localisée par étape ; mêmes sorties dans l'aperçu et dans la démo ; outil en échec si résultat attendu différent. |
| 6 | FML : S-2 sur les maps typées, adaptateur Strict Parser, complétion et squelette, puis concurrence/pool selon mesure | `PIDtoPatient` et `ORUR01toBundle` rejoués avec modèles typés ; démo et documentation ; tests de transformations concurrentes sans contamination. |
| 7 | Sous-slices, discriminants complémentaires, contained, extensions des primitives, R4B/R5 | Cas de test par capacité et release ; profils FR Core/EU Lab dans la démo ; erreurs explicites pour les limites restantes. |
| 8 | S-3 puis performance, durcissement, namespace et préparation 1.0 | Mesures avant/après versionnées ; seuils convenus tenus ; permissions et compatibilité des exports anciens vérifiées ; documentation et CHANGELOG à jour. |

L'ordre reprend le plan en terminant le studio avant les fonctions multi-étapes
et FML. Les décisions de namespace et de moteur ne sont pas tranchées par cette
reprise. Les performances du plan sont des cibles indicatives, pas des garanties.

## Vérification du lot 1

- `cd webadmin && npm test` : 21 tests passent.
- `cd webadmin && npm run build` : bundle régénéré.
- `python3 -m unittest discover -s tools/tests` : 8 tests passent.
- `mvn test -q` : 131 tests passent, aucun ignoré.
- `cd webadmin && npm run test:e2e` : 9 tests passent sur la démo Docker locale
  sous Chromium, après copie du bundle construit dans l'extension de la démo.
  Le canal n'est pas enregistré par les tests.

Ces contrôles ne clôturent ni les phases complètes, ni les mesures de charge,
ni les parcours WebKit et rôle restreint, non rejoués pendant ce lot.

## Vérification du lot 2

- Inspecteur extrait dans `webadmin/src/profile-mapper/inspector.js` ; les champs
  de condition, itération et traduction réutilisent les contrôles de l'arbre.
- `cd webadmin && npm test` : 23 tests passent. Métadonnées du profil, exemples,
  valeurs fixes fausses, édition synchronisée, diagnostics vers la condition
  ciblée et relecture de l'étape sérialisée sont couverts.
- `cd webadmin && npm run build` : bundle régénéré, aide intégrée comprise.
- `cd webadmin && npm run test:e2e` : 10 tests passent sous Chromium sur la démo,
  avec sélection clavier, édition Monaco dans l'inspecteur, synchronisation avec
  l'arbre, Undo, plein écran et disposition sur une largeur de 700 pixels.
- Capture du plein écran inspectée visuellement. Aucun changement du serveur Java.
  Les tests Java/Python du lot 1 n'ont pas été rejoués pour ce lot frontend.

Le canal de la démo n'est pas enregistré par ces tests. Le bundle de l'extension
locale est remplacé par celui construit depuis les sources. WebKit, rôle restreint
et thème sombre restent à vérifier lors du lot de socle.

Après ajout de l'aide intégrée et régénération du bundle final, un dernier rejeu
n'a pas pu ouvrir la démo : le socket Docker `/Users/admin/.docker/run/docker.sock`
était absent et le port 8443 inaccessible. Les 10 tests avaient passé juste avant
cette modification de texte. La copie de ce dernier bundle dans la démo n'a donc
pas abouti ; `webadmin/web/plugin.js` contient bien l'aide finale.
