# Plan du projet OIE FHIR Profile Mapper

## Objectif

Créer un plugin OIE permettant de construire des ressources et des Bundles FHIR
à partir des messages traités par OIE. Le plugin comprend un format de mapping
JSON, un runtime, des fonctions utilitaires et un éditeur graphique.

La spécification JSON est le contrat central du projet. L'éditeur et le runtime
doivent respecter ce même contrat.

Le POC de référence est situé dans
`/Users/admin/data/aphm-fhir-ws/fhir-datatype-Eclipse-OIE`, sur la branche
`feature/fhir-profile-mapper`. Il sert de base d'analyse et d'exemples ; ses choix
de format, d'architecture et d'interface restent à examiner.

## Décisions prises

- Le mapper sera un plugin distinct, avec **FHIR Data Type comme prérequis initial**.
- Réutiliser les fonctions existantes du plugin de données. Si une intégration
  devient trop compliquée, implémenter uniquement les fonctions manquantes utiles
  au mapper.
- Centraliser tous les appels à FHIR Data Type derrière une **façade interne**,
  implémentée par un **adaptateur** du plugin tiers. Le reste du mapper dépend
  uniquement de ce contrat interne.
- La **validation FHIR complète sera optionnelle**. Les contrôles du mapping,
  les erreurs d'exécution, les conversions impossibles et la cohérence des
  références restent à contrôler indépendamment de cette option.
- Le runtime et le mapper graphique doivent être **faciles à déboguer**, avec
  une trace d'exécution activable et des diagnostics reliés aux règles.
- Un **agent IA doit pouvoir construire, lire, modifier et expliquer les
  channels et leurs mappings** à partir de formats et d'interfaces documentés,
  sans dépendre d'un état conservé uniquement dans l'interface graphique.
- Le socle de démonstration sera dans `demo/`, avec l'administration sur le
  **port 8443** : OIE 4.7.0, Web Support / Web Admin 1.3.0 et FHIR Data Type 1.5.1.
- Aucun exemple du POC n'est importé dans ce socle. L'init permettra d'ajouter des
  exemples ensuite.
- Le second mapper, orienté modèles logiques et FML, sera traité dans une phase
  ultérieure.

## Étape 1 — Préparer la démonstration

Adapter le socle Docker de `demo-oru2fhir` :

- OIE, PostgreSQL et volumes propres à cette démo ;
- installation des versions officielles de Web Support et FHIR Data Type,
  avec vérification des empreintes des archives ;
- script d'initialisation prêt à importer les futurs canaux ;
- documentation du lancement et des paramètres.

**Vérifier :** Compose valide, image construite, administration accessible,
deux plugins chargés et init réussi sans canal d'exemple. Conserver 8443 dans la
configuration ; les vérifications ne doivent pas interrompre l'instance du POC.

**État :** terminé. Compose et build vérifiés ; une instance isolée sans port
publié est devenue saine. L'API OIE confirme Web Support 1.3.0 et FHIR Data Type
1.5.1 actifs ; l'init s'est terminé avec zéro canal importé. Le port 8443 reste
configuré pour le lancement normal.

### Socle du plugin — terminé

Un module Maven Java 17 produit l'extension
`target/fhir-profile-mapper-0.1.0-SNAPSHOT.zip`. Le plugin de service déclare son
cycle de vie OIE et journalise son démarrage et son arrêt. La démo compile les
sources et installe l'extension avec les deux prérequis.

**Vérifié :** compilation locale et Docker, contenu du ZIP, extension active
dans l'API OIE, message `FHIR Profile Mapper started.` dans les logs, services
sains et init terminé sans canal importé. La démo est lancée sur 8443.

Le runtime, l'éditeur et l'adaptateur FHIR Data Type restent à réaliser dans les
étapes suivantes.

## Étape 2 — Vérifier et isoler l'intégration avec FHIR Data Type

Définir une façade limitée aux services nécessaires au mapper. L'adaptateur
FHIR Data Type sera le seul endroit connaissant les classes, signatures et
éventuelles routes HTTP du plugin tiers. Il traduira ses résultats et erreurs
vers les types et diagnostics du mapper.

Le runtime, les scripts générés et les services de l'éditeur passeront par cette
façade. Le navigateur utilisera les API de notre plugin. Aucun appel direct au
plugin tiers ni type Java propre à celui-ci ne devra sortir de la couche
d'intégration.

Cette séparation doit permettre d'adapter une évolution du prérequis ou de
remplacer une fonction manquante sans modifier les appelants ni le format JSON.
Commencer avec une seule implémentation et les seules opérations nécessaires.

Établir les fonctions accessibles depuis un autre plugin, en distinguant la
version officielle des ajouts du POC.

| Besoin | Constat dans la branche `main` locale examinée |
|---|---|
| Validation FHIR | API Java publique `FhirTools.validate()` |
| Conversion FHIR JSON/XML | API Java publique `FhirTools.toJson()` et `toXml()` |
| Liste des profils et récupération des snapshots | API ajoutée dans le POC |
| Accès aux ConceptMaps et traduction | Fonctions ajoutées dans le POC |
| Routes HTTP pour l'éditeur | Routes ajoutées dans le POC |

Tester les appels entre extensions, le chargement des classes et la gestion des
contextes et caches. L'objectif est de réutiliser le moteur FHIR installé sans
charger une seconde copie de HAPI.

Pour les services absents de l'API officielle, choisir l'intégration la plus
simple et documenter les éventuels ajouts nécessaires. Ne pas supposer que les
routes HTTP du POC sont disponibles dans le plugin officiel.

**Vérifier :** un appel réel depuis une extension séparée, la version minimale
requise du prérequis et une décision explicite pour chaque service manquant.
L'appel de vérification doit passer par la façade ; les dépendances et appels
directs à FHIR Data Type doivent rester confinés à l'adaptateur.

## Étape 3 — Spécifier le format JSON et les règles d'exécution

Rédiger `docs/Specification-mapping.md` avant l'implémentation du nouveau runtime.
La spécification devra définir :

- version du format et version FHIR cible ;
- sources, ressources, Bundles et destinations des résultats ;
- chemins cibles, répétitions, conditions et portées des variables ;
- valeurs constantes, expressions, conversions et traductions ;
- identité des ressources et références entre ressources ;
- valeurs absentes, valeurs vides, erreurs et diagnostics ;
- identifiants stables des règles et format des traces et diagnostics ;
- précision des décimaux et traitement des dates et fuseaux horaires ;
- paramètres de validation FHIR et comportement en cas d'échec ;
- dépendances aux profils et versions des packages nécessaires ;
- ordre d'exécution, finalisation et publication des résultats.

Les choix suivants restent à discuter :

- un document pour une transformation complète ou des fragments par étape OIE ;
- langage et contexte d'évaluation des expressions ;
- comportement face à un champ source absent et à une expression erronée ;
- niveau auquel se règle la validation optionnelle ;
- prise en charge initiale des extensions, du slicing et des autres constructions
  FHIR qui dépassent les capacités du POC.

Le format ne doit pas dépendre des détails d'affichage de l'éditeur ni des noms
de classes Java du plugin de données.

**Vérifier :** décrire sans ambiguïté un Patient simple, une répétition
d'Observations, leurs références et un Bundle ; fournir des exemples valides et
invalides avec le comportement attendu. Définir un schéma JSON pour les contrôles
structurels, complété par les règles sémantiques de la spécification.

## Étape 4 — Implémenter le runtime et l'intégration OIE

Construire le minimum nécessaire pour exécuter les exemples de la spécification :

- lecture et vérification du contrat JSON ;
- exécution des règles et fonctions utilitaires ;
- construction des ressources et Bundles ;
- résolution des références et publication des résultats ;
- recours aux services de FHIR Data Type à travers la façade interne ;
- diagnostics rattachés à la règle et à l'élément concernés.

Examiner la compilation JavaScript du POC avant de choisir entre sa réutilisation
et une autre forme d'exécution. Le compilateur éventuel reste un détail du
runtime ; le JSON demeure le contrat de référence.

Prévoir une **option de trace désactivée par défaut**, utilisable pendant un test
dans l'éditeur comme sur un message traité par un channel. Préciser son point
d'activation, sa portée, ses filtres et le mode de récupération des traces.

Les événements seront structurés et corrélés au channel, au connecteur, au
message, à la version du mapping et à la règle exécutée. Ils devront permettre
de suivre les itérations, conditions, conversions, traductions, références et
phases de validation, avec leur résultat, leur durée et leurs erreurs.
Expliquer aussi pourquoi une règle est ignorée ou un élément absent.

Relier chaque diagnostic à la règle source et, s'il existe, au code généré.
Borner le volume des traces et rendre la capture des valeurs explicite.
La trace doit observer l'exécution sans modifier le résultat du mapping.

**Vérifier :** tests issus de la spécification, exécution réelle dans OIE,
isolation entre messages et connecteurs, précision des valeurs et comportement
avec validation activée ou désactivée. Une erreur d'expression ne doit pas être
assimilée implicitement à une donnée absente.
Sur un échec, retrouver la règle et la cause à partir de la trace ; vérifier
que l'activation de la trace ne change pas le résultat d'un même traitement.

## Étape 5 — Construire l'éditeur graphique

Concevoir l'interface à partir du contrat JSON et des usages observés dans le POC :

- sélection du profil cible et navigation dans ses éléments ;
- association des données sources aux éléments cibles ;
- édition des conditions, répétitions et traductions ;
- gestion des Bundles, références et sorties ;
- test sur un message avec affichage du résultat et des diagnostics.

Concevoir les **assistants de saisie du code** comme une partie à part entière
du mapper graphique :

- complétion des chemins sources, variables et fonctions selon le contexte et
  la portée des itérations ;
- catalogue de fonctions avec recherche, signatures, paramètres, types de retour,
  descriptions et exemples insérables ;
- aide adaptée au champ édité : valeur, condition, répétition, traduction ou
  référence ;
- indication du type cible FHIR et des conversions disponibles ;
- diagnostics de syntaxe et d'usage au plus près de l'expression concernée ;
- interaction au clavier et insertion respectant le code déjà saisi.

Définir les fonctions proposées et leur documentation à partir d'un catalogue
commun au runtime et à l'éditeur, afin que l'aide corresponde aux fonctions
effectivement disponibles. Préciser l'intégration des fonctions et variables OIE
accessibles dans le contexte du channel. Étudier les usages sur des mappings
concrets avant de choisir les composants d'édition.

Les tests déclenchés depuis l'éditeur devront utiliser le même runtime que les
canaux déployés. Définir clairement le périmètre d'un test lorsqu'il dépend de
plusieurs ressources ou étapes.

Afficher la trace du test dans l'éditeur, avec navigation de l'événement vers
la règle concernée. Permettre son export structuré pour une analyse hors de
l'interface, notamment par un agent IA.

**Vérifier :** créer, enregistrer, rouvrir et exécuter les mappings de référence
sans perte d'information ; retrouver les erreurs sur les éléments concernés.
Vérifier aussi les suggestions dans les itérations imbriquées, la cohérence des
signatures avec le runtime et l'insertion sans altérer l'expression existante.

## Usage par les agents IA

Documenter le format de mapping, le catalogue de fonctions et leur intégration
dans les exports XML des channels OIE : étapes, connecteurs, templates, variables,
profils et autres dépendances nécessaires à l'exécution.

Prévoir des interfaces documentées pour lire, exporter, modifier, vérifier et
tester les mappings, en réutilisant les API OIE pour les opérations sur les
channels. Les tests devront accepter un message exemple et un contexte explicites
et restituer le résultat, les diagnostics et, sur demande, la trace.

Conserver un JSON lisible, des identifiants stables et une sérialisation stable
pour faciliter les modifications ciblées et la revue des différences. L'éditeur
doit pouvoir rouvrir un mapping écrit ou modifié hors de l'interface sans perte
d'information. Les erreurs de format ou les dépendances manquantes doivent être
signalées explicitement.

**Vérifier :** un agent peut construire un channel d'exemple et son mapping,
les vérifier et les tester, expliquer un résultat depuis les règles et la trace,
puis modifier une règle et relire le résultat dans l'éditeur. Une modification
ciblée doit préserver les autres étapes et réglages du channel.

## Étape 6 — Ajouter les exemples et mesurer

Adapter progressivement les exemples du POC au nouveau plugin :

1. Une ligne SQL XML vers un Patient.
2. Un ORU HL7 v2 vers un Patient, puis un Bundle de laboratoire.
3. Un CSV nettoyé à la source puis mappé en destination.
4. Une collection de Patients et plusieurs Bundles partageant des ressources.

Les ajouter à l'init de la démo lorsqu'ils sont compatibles avec le nouveau mapper.

Mesurer séparément le temps et la mémoire de l'édition des profils, du mapping
sans validation et du mapping avec validation. Identifier ce qui vient du mapper,
des profils et des caches du plugin de données. Vérifier aussi les configurations
qui pourraient valider deux fois le même résultat.
Mesurer également le surcoût et le volume des traces lorsqu'elles sont activées.

Prévoir ensuite des **tests de charge**, sur des volumes et une concurrence
représentatifs : débit, latences, mémoire, activité du garbage collector et taux
d'erreur. Couvrir les messages volumineux, les répétitions et Bundles importants,
avec et sans validation FHIR et trace. Inclure une exécution prolongée pour
détecter une croissance mémoire ou une dégradation des performances.
Définir les scénarios et seuils d'acceptation avant ces tests.

**Vérifier :** résultats attendus pour les messages valides, diagnostics pour les
cas invalides et mesures reproductibles sur les versions retenues. Sous charge,
vérifier aussi l'isolation des messages, l'intégrité des résultats et le respect
des seuils convenus.

## Phase ultérieure — Mapper FML

Étudier un second mapper permettant d'appliquer des transformations FML à partir
de modèles logiques fournis par une IG, une StructureDefinition ou le format
interne OIE (a reflechir). Réutiliser les fonctions communes identifiées pendant la première
phase, sans imposer dès maintenant un moteur ou un format unique aux deux usages.
