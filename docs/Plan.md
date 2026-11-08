# Plan du projet OIE FHIR Profile Mapper

## Objectif

Créer un plugin OIE permettant de construire des ressources et des Bundles FHIR
à partir des messages traités par OIE. Le plugin comprend un format de mapping
JSON, un runtime, des fonctions utilitaires et un éditeur graphique.

La spécification JSON est le contrat central du projet. L'éditeur et le runtime
doivent respecter ce même contrat.

## Suite des jalons

Le socle, la reprise du POC, les six exemples, la spécification et les diagnostics
par règle sont livrés. Le traitement explicite des erreurs d'expression complète
ce socle. La suite conserve le runtime et l'éditeur existants :

1. **Trace activable** : d'abord dans l'API de test, puis dans les channels et
   l'éditeur ; export JSON, volume borné, capture des valeurs explicite,
   corrélation au message et à la révision du mapping. Définir les identifiants
   stables et le versionnement nécessaires à cette corrélation.
2. **Assistants de code** : catalogue commun au runtime et à l'éditeur,
   complétion contextuelle avec `Ctrl+Espace`, signatures, exemples, variables
   d'itération et liens d'aide vers les références officielles.
3. **Parcours éditeur et agents IA** : créer, lire, modifier, vérifier, tester et
   expliquer un mapping/channel, puis le rouvrir dans l'éditeur sans perte.
   Terminer les vérifications visuelles et les tests des parcours complets.
4. **Stabilisation et livraison** : compatibilité de l'adaptateur FHIR Data Type,
   migration du namespace vers `fr.kazepoy` avec compatibilité des exports,
   GitHub Action de build sur tag et vérification de l'archive installable.
5. **Mesures et charge** : temps et mémoire avec/sans validation et trace,
   puis débit, latence, concurrence et exécution prolongée avec seuils convenus.

Chaque livraison reste limitée, démontrable et committée séparément. Le mapper
FML demeure une phase ultérieure, indépendante de ces jalons.

Le POC de référence est situé dans [fhir-datatype-Eclipse-OIE](https://github.com/kazepoy/fhir-datatype-Eclipse-OIE), sur la branche
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
- Le socle initial ne contenait aucun exemple ; les six canaux du POC ont ensuite
  été repris et ajoutés à l'init de la démo.
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

Le runtime, l'éditeur et l'adaptateur FHIR Data Type ont ensuite été repris du
POC dans le plugin distinct ; leur contrat et leur ergonomie restent à faire
évoluer suivant les étapes ci-dessous.

## Étape 2 — Vérifier et isoler l'intégration avec FHIR Data Type

### Ordre de reprise du POC et commits

La première livraison reprend le POC existant dans notre plugin distinct, avec
ses fonctions et ses exemples. Elle ne repart pas d'un mapper réduit.

1. Centraliser l'intégration avec FHIR Data Type officiel et vérifier les
   services nécessaires aux profils, snapshots, traductions et validations.
2. Extraire le compilateur, le runtime et l'éditeur graphique du POC en conservant
   leur comportement et leurs tests, derrière la façade.
3. Importer et rejouer les six channels de référence dans la démo, puis vérifier
   l'édition et le test d'un mapping dans l'administration web.

Chaque jalon vérifié fait l'objet d'un commit distinct et d'un retour concret.
La formalisation du format existant et les améliorations du débogage et de
l'ergonomie suivent cette reprise fonctionnelle, par changements ciblés.

**Reprise du compilateur, runtime et éditeur :** 75 tests Java et 9 tests de
l'éditeur passent. Dans la démo, l'API charge un snapshot Patient via le chargeur
du datatype officiel, puis exécute et valide un mapping XML vers Patient.
La validation est optionnelle. Les six channels sont importés, déployés et
rejoués : ORU vers Patient et Bundles, XML SQL, CSV par ligne et collection.
Le [contrôle reproductible](../demo/examples/check.py) vérifie aussi les références,
les ressources communes aux deux Bundles, les dix messages du batch et le refus
d'un Patient sans date de naissance. Voir le [guide de la démo](Demo.md).

La vérification visuelle de l'édition dans l'administration web reste à effectuer :
l'outil navigateur de cet environnement échoue avant connexion (`sandboxPolicy`
absent). Les tests de logique de l'éditeur et les appels réels de son API passent.

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

**État : contrat existant documenté et vérifié.** La
[spécification](Specification-mapping.md), son
[schéma JSON](schemas/mapping-step.schema.json) et ses
[exemples exécutables](examples/mapping/) décrivent le format repris du POC,
sans modifier son exécution. Le contrôleur hors ligne valide aussi le contenu
JSON des chaînes `mappings` et `bundleTargets` ; ses tests couvrent les six exports
de démo. Quatre tests Java exécutent les exemples valides et invalides publiés.

Le contrat conserve les fragments par étape OIE, les expressions Rhino et le
réglage de validation par ressource seule ou Bundle. Il ne possède pas encore
de champ de version du format, d'identifiant unique de règle ni de trace
structurée publique. Les évolutions du diagnostic et du traitement des erreurs
sont détaillées à l'étape 4 ; le versionnement et la trace restent à définir.

La spécification couvre :

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

Les points à reprendre avant une évolution du contrat sont :

- l'éventuel besoin d'un document complet au-delà des fragments par étape existants ;
- les évolutions éventuelles du langage et du contexte Rhino conservés ;
- comportement face à un champ source absent et à une expression erronée ;
- les limites de l'aperçu isolé face aux dépendances entre étapes ;
- prise en charge initiale des extensions, du slicing et des autres constructions
  FHIR qui dépassent les capacités du POC.

Le format ne doit pas dépendre des détails d'affichage de l'éditeur ni des noms
de classes Java du plugin de données.

**Vérifier :** décrire sans ambiguïté un Patient simple, une répétition
d'Observations, leurs références et un Bundle ; fournir des exemples valides et
invalides avec le comportement attendu. Définir un schéma JSON pour les contrôles
structurels, complété par les règles sémantiques de la spécification.

## Étape 4 — Faire évoluer les diagnostics et le runtime existant

**Premier jalon : diagnostics par règle.** Les erreurs de l'API de test et du
script généré contiennent l'étape, la phase, l'indice de règle, le chemin cible
et l'expression lorsqu'ils sont connus. Les erreurs de syntaxe utilisent les
marqueurs du code généré ; les erreurs de valeur, condition, itération,
traduction et conversion portent leur contexte directement. L'éditeur affiche
ces détails et propose « Go to rule ». Le cas reproductible
[diagnostic-error.json](../demo/examples/diagnostic-error.json) provoque une
conversion booléenne impossible, indépendamment de la validation FHIR.

**Vérifié :** 85 tests Java dans le build Docker et 10 tests de logique de
l'éditeur. Après redémarrage de la démo, le rejeu des six canaux et le contrôle
du diagnostic structuré via l'API OIE passent.

**Deuxième jalon : erreurs d'expression explicites.** Les `TypeError` arrêtent
désormais le traitement avec un diagnostic sur la valeur, condition ou itération
concernée, avec et sans validation FHIR. Le champ `errorType` restitue le nom de
l'exception JavaScript d'origine. Une valeur explicitement absente reste omise ;
les accès facultatifs doivent être gardés. La migration depuis le comportement
du POC est décrite dans la [spécification](Specification-mapping.md#migration-des-accès-facultatifs).
Les tests couvrent aussi l'absence de publication des ressources déjà construites
lorsqu'une règle suivante échoue. La trace activable et les identifiants stables
restent à réaliser.

**Vérifié :** 89 tests Java dans le build Docker et 10 tests JavaScript. Les six
canaux sont rejoués dans OIE sans modification de leurs exports. L'API vérifie
la `TypeError` avec et sans validation, puis une garde explicite avec source
facultative absente et présente. Trois accès facultatifs des tests hérités du
POC ont été gardés explicitement ; les résultats attendus sont conservés.
La vérification visuelle dans le navigateur reste à effectuer : l'outil échoue
avant connexion dans cet environnement.

Conserver le compilateur et le runtime repris, puis faire évoluer leurs diagnostics
et leur débogage à partir des exemples de la spécification :

- lecture et vérification du contrat JSON ;
- exécution des règles et fonctions utilitaires ;
- construction des ressources et Bundles ;
- résolution des références et publication des résultats ;
- recours aux services de FHIR Data Type à travers la façade interne ;
- diagnostics rattachés à la règle et à l'élément concernés.

La compilation JavaScript du POC est réutilisée. Le compilateur reste un détail
du runtime ; le JSON demeure le contrat de référence.

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

**Exemples repris et rejoués.** Les six canaux de la démo couvrent :

1. Une ligne SQL XML vers un Patient.
2. Un ORU HL7 v2 vers un Patient, puis un Bundle de laboratoire.
3. Un CSV nettoyé à la source puis mappé en destination.
4. Une collection de Patients et plusieurs Bundles partageant des ressources.

Ils sont inclus dans l'init ; le script `demo/examples/check.py` vérifie leurs
résultats et les exemples d'erreur de l'API de test. Les mesures et tests de
charge ci-dessous restent à réaliser.

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
interne OIE E4X (à étudier avec la [documentation du contexte de script OIE](https://docs.openintegrationengine.org/engine/script_scope_and_user_api.html)). Réutiliser les fonctions communes identifiées pendant la première
phase, sans imposer dès maintenant un moteur ou un format unique aux deux usages.
## Compléments à planifier

- Ajouter une GitHub Action de build déclenchée sur un tag.
- Remplacer le package `org.oie.fhir` par `fr.kazepoy`, après vérification des
  accès aux API protégées et de la compatibilité des exports de channels.
- Déclencher la complétion avec `Ctrl+Espace` et proposer les suggestions adaptées
  au contexte dans les assistants de code.
- Ajouter des pastilles d'aide `?` pointant vers les références officielles,
  FHIR par défaut.
