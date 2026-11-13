# Plan de suite du projet

État de référence : branche `feat/refonte`, après le lot 7 et le commit
`3249013`, au 13 novembre 2026.

Ce document est la **référence active pour les travaux à venir**. Le
[plan de refonte initial](history/plan-refonte.md) explique les décisions et phases qui
ont conduit à l'état actuel ; il est conservé comme historique. Le fichier
[`TODO.md`](../TODO.md) reste une boîte d'entrée et un journal des lots livrés :
une idée qui y est ajoutée n'entre dans la feuille de route qu'après classement
dans le présent document.

## 1. Décisions acquises

### 1.1 Namespace

Le namespace Java définitif sera `fr.kazepoy.fhir` :

- `org.oie.fhir.mapper.*` devient `fr.kazepoy.fhir.mapper.*` ;
- `org.oie.fhir.fml.*` devient `fr.kazepoy.fhir.fml.*` ;
- le `groupId` Maven devient `fr.kazepoy.fhir` ;
- le nom de l'extension, son chemin `fhir-profile-mapper` et ses routes HTTP
  restent stables.

`org.oie` ne donne aucun accès particulier aux classes OIE. Les accès au moteur
et au datatype utilisent leurs API publiques, un chargeur de classes dédié ou
la réflexion explicite ; aucun accès package-private externe ne dépend du
namespace actuel. Le renommage doit donc intervenir avant la création de
nouveaux exports et canaux.

Le projet est encore en développement : cette migration assume une rupture
franche. Tous les canaux, exemples et fixtures du dépôt seront réécrits avec les
types `fr.kazepoy.fhir.*`. Les exports de développement contenant
`org.oie.fhir.*` ne seront plus lisibles. Aucun alias XStream, classe adaptatrice
ou double enregistrement de type ne sera conservé.

### 1.2 Positionnement des deux transformeurs

- **FHIR FML Transform** est à privilégier quand une map FML et des IG peuvent
  porter une transformation portable, indépendante d'OIE.
- **FHIR Profile Mapper** fournit une édition graphique adaptée à OIE. Son
  tableau `mappings`, ses expressions et son runtime sont un contrat spécifique
  au plugin et à la représentation des messages par OIE.
- Les deux étapes restent dans un seul plugin et partagent les contextes FHIR,
  le catalogue, la validation et les modèles de source utiles.

### 1.3 Travaux explicitement reportés

Jusqu'à nouvelle décision, ne pas engager :

- S-3 et une nouvelle campagne de charge ;
- les optimisations déduites de S-3 ;
- le durcissement général et les tests d'endurance ;
- la préparation de la version 1.0, sauf le namespace ;
- la migration automatique/outillée du format 1 vers le format 2 ;
- un index de catalogue persistant ou un nouveau mécanisme de cache.

Les mesures existantes et les outils `tools/load/` sont conservés. Ce report ne
transforme pas leurs hypothèses en conclusions : la double validation et le pic
isolé du canal laboratoire restent à réexaminer lorsque ce chantier reprendra.

### 1.4 Arbitrages pour les lots suivants

- Après le namespace, le prochain chantier sera la formalisation des contrats.
- Le format `mappings` reste évolutif jusqu'à la version 1.0 ; le lot B doit
  d'abord décrire et tester son état courant, sans annoncer une stabilité 1.0.
- La contrainte éventuelle sur le manifeste et la version des packages sera
  décidée pendant le lot B.
- L'organisation du studio, les liens source-cible, la place du JSON, le mode
  simple/avancé et l'évaluation d'expressions seront tranchés pendant leur
  conception, pas anticipés dans le socle.
- La langue suivra la préférence native de Web Admin si OIE en expose une ;
  sinon le plugin proposera une préférence utilisateur, avec la langue du
  navigateur comme valeur initiale.
- L'aide visera l'élément exact de l'IG publié, avec repli vers le profil puis
  vers la documentation FHIR de base.
- Une map FML publiée ne sera jamais modifiée implicitement : sa dérivation
  créera une nouvelle map inline ou une nouvelle canonique avec imports
  explicites. Les imports seront présentés en arbre, avec sources et diagnostics
  séparés.
- La faisabilité et la granularité d'une trace FML seront décidées au moment du
  lot E.

## 2. Socle livré à préserver

Les lots 1 à 7 sont clos et constituent la base de non-régression :

- règles annotées et activables, historique, inspecteur et diagnostics ciblés ;
- extensions, ConceptMaps, branches, duplication et assistance à la saisie ;
- frontend modulaire, anglais/français, thèmes et assemblage reproductible ;
- samples, résultats attendus, aperçu multi-étapes, traces et rejeu automatisé ;
- FML inline ou canonique, sources générique, HL7 v2 typée et FHIR, complétion,
  squelette et exécutions concurrentes ;
- sous-slices, discriminants matérialisables, `contained` profilé, extensions de
  primitives et couverture R4/R4B/R5 ;
- démo Docker avec profils locaux, FR Core et HL7 Europe Laboratory.

Après le lot A, tout nouveau lot devra conserver la lecture des canaux réécrits
avec `fr.kazepoy.fhir.*`, les résultats de la démo et les contrôles suivants :

```sh
mvn clean package
python3 -m unittest discover -s tools/tests
python3 demo/examples/check.py
cd webadmin && npm run test:e2e
```

Le rejeu de démo et Playwright nécessitent la démo active. Une limitation
volontaire ou un contrôle non exécuté doit être nommé dans le compte rendu du
lot ; un build Maven seul ne suffit pas à clore un changement d'interface ou de
sérialisation.

## 3. Feuille de route active

Les lots A puis B sont décidés. Les lots C à F forment une proposition ordonnée
à ajuster ensemble avant leur mise en œuvre.

### Lot A — Namespace définitif

**Statut : terminé le 13 novembre 2026.**

Travail :

1. Inventorier tous les noms pleinement qualifiés dans Java, `plugin.xml`, le
   runtime Rhino, le frontend, les outils, schémas, canaux, tests et documents.
2. Déplacer les packages vers `fr.kazepoy.fhir.mapper` et
   `fr.kazepoy.fhir.fml`, ponts isolés compris.
3. Changer le `groupId`, les classes de plugin, les appels `Packages.*`, les
   constantes `__type`, les loggers et les noms chargés par réflexion.
4. Réécrire tous les canaux, exemples, fixtures, schémas et outils du dépôt avec
   les nouveaux types.
5. Supprimer les listes blanches, constantes et branches de code devenues
   inutiles ; ne laisser aucun chemin de compatibilité `org.oie.fhir.*`.
6. Mettre à jour la spécification, la documentation d'intégration et le
   CHANGELOG en signalant la rupture des exports de développement.

Critères de fin :

- hors documents historiques, aucune source, ressource, configuration, fixture
  ou documentation active ne contient `org.oie.fhir.*` ;
- un canal réécrit de chaque transformeur est importé, exécuté, exporté puis
  relu sous son type `fr.kazepoy.fhir.*` ;
- les listes blanches XStream n'autorisent que les nouvelles classes ;
- les trois JAR (serveur, catalogue, FML) fonctionnent avec leurs vrais
  chargeurs dans l'image Docker ;
- suite complète, rejeu de démo et tests navigateur verts ;
- la rupture volontaire des exports antérieurs est consignée dans le CHANGELOG.

Hors périmètre : migration v1→v2 du contenu des étapes, changement des routes,
renommage marketing du plugin ou modification fonctionnelle des mappings.

Vérification : 147 tests Java, 43 tests frontend et 13 tests outils passent ;
les neuf canaux réécrits sont importés et déployés dans l'image reconstruite,
le rejeu complet passe, ainsi que les 20 parcours Playwright sous Chromium et
WebKit. Les tests XStream relisent les deux nouveaux types et refusent les types
retirés. Les trois JAR ne contiennent que les packages `fr/kazepoy/fhir` attendus.

### Lot B — Contrats avant nouvelles fonctions

**Statut : prochain lot décidé ; périmètre à préciser après A.**

Objectif : définir la première base contractuelle stable après le renommage et
éviter les ruptures futures non versionnées.

Travail :

- figer le contrat versionné de `mappings` : identités de règles, ordre, chemins,
  instances, slices, constantes, activation, notes et diagnostics ;
- distinguer les propriétés de l'étape, le tableau de règles compilé et le script
  généré, qui n'ont pas la même stabilité ;
- formaliser les modèles sources : `OieMessage`, modèle logique HL7 v2 typé et
  ressource FHIR entrante ;
- documenter ce qui est portable en FML et ce qui reste spécifique à OIE ;
- construire des fixtures de régression conservées dans le temps à partir du
  nouveau namespace ;
- décider si le manifeste des packages et la version du profil restent
  informatifs ou deviennent des contraintes d'exécution.

Critère de fin : une référence de contrat autonome, des exemples valides et
invalides, et des tests qui échouent sur toute rupture non versionnée.

### Lot C — Revue ergonomique et maquette du studio

**Statut : proposé ; conception avant code.**

Questions à trancher ensemble :

- organisation cible des onglets et des trois zones source, cible et inspecteur ;
- représentation d'un lien `PID.5.1 → Patient.name.family`, y compris quand
  l'expression contient une fonction ;
- place de l'édition JSON : panneau du plugin, éditeur JSON natif d'OIE ou vue
  dédiée ;
- mode simple/avancé pour sous-slices, `contained`, extensions, traces et autres
  fonctions denses ;
- réglages réellement utiles au niveau utilisateur, canal ou serveur, sans
  créer des feature flags permanents ;
- évaluation locale ou serveur d'une expression sur le sample courant, avec les
  mêmes règles de sécurité que l'aperçu ;
- aide vers l'élément exact d'un IG publié, avec repli vers le core FHIR ;
- amélioration de la complétion et choix de langue : navigateur ou préférence
  explicite.

Livrables avant implémentation : inventaire des écrans, deux parcours (simple et
avancé), maquette, décisions écrites et scénarios Playwright attendus.

Critère de fin : la maquette est validée et chaque déplacement de fonction a un
parcours utilisateur et un critère d'accessibilité. Le lot ne doit pas devenir
une réécriture générale de l'éditeur.

### Lot D — Matrice de démonstration et de vérité

**Statut : proposé.**

Créer une matrice de capacités plutôt qu'une accumulation de canaux. Chaque cas
porte des tags, un sample préchargé, un résultat attendu et, quand pertinent, un
cas d'erreur diagnostiquable.

Cas à couvrir :

| Famille | Cas minimaux |
|---|---|
| Releases | ressource simple R4 ; Organization ou autre ressource démontrant une fonction propre à R5 ; rejeu R4B |
| Profils | profil R4 externe ; FR Core ; profil dans un package IG |
| FML | map simple ; map d'un IG ; map inline ; surcharge ; imports imbriqués |
| Sources | HL7 v2 classique ; Strict Parser typé ; CSV ; XML ; JSON ; FHIR |
| Modèles | ressource FHIR ; modèle logique HL7 v2 fourni pour ce chantier ; StructureDefinition logique ne dérivant pas d'une ressource |
| Terminologie | ConceptMap locale ; serveur externe léger avec données maîtrisées ; indisponibilité et absence de correspondance |
| Diagnostics | erreur de source, de map, de profil, de référence, de validation et limite connue |

Avant d'ajouter un canal, vérifier qu'un sample, une fixture ou un canal existant
ne couvre pas déjà le cas. Les canaux doivent être groupés et nommés par objectif,
pas par détail d'implémentation.

Critère de fin : une table « capacité → preuve → commande de rejeu » exhaustive,
exécutée en CI dans un temps convenu. Aucun canal de démonstration sans objectif
unique ou sample automatisé.

### Lot E — FML avancé

**Statut : proposé, dépend de B et de la matrice D.**

Travail :

- ouvrir le source d'une map canonique comme base d'une nouvelle map inline sans
  modifier le package d'origine ;
- définir précisément « surcharge » : copie éditable, nouvelle canonique et
  imports explicites, plutôt qu'une substitution implicite ;
- afficher l'arbre des imports et identifier la map propriétaire d'un diagnostic ;
- permettre de naviguer entre les maps imbriquées sans fusionner silencieusement
  leurs sources ;
- ajouter les samples et résultats attendus adaptés à FML ;
- étudier une trace FML utile (groupes/règles) sans promettre la granularité du
  Profile Mapper si le core HL7 ne l'expose pas ;
- documenter que `resolveReference` et `performSearch` restent indisponibles tant
  qu'un besoin et un contrat de sécurité ne sont pas définis.

Critère de fin : une map publiée, une dérivation locale et une cascade d'imports
sont inspectables, testables et diagnostiquées dans la bonne source.

### Lot F — Documentation et nettoyage structurel

**Statut : en cours ; structure et contrôles livrés, revue de fond restante.**

Organisation cible :

```text
doc/
  user-manual/       index des langues
    fr/              procédures et captures en français
  agent-manual/      index des instructions pour agents utilisateurs d'OIE
    fr/              consignes de construction de canaux en français
  reference/         formats, contrats, API et compatibilité
  architecture/      composants, chargeurs, runtime et décisions
  development/       build, tests, contribution et release
  demo/              installation de démo, exemples et rejeu
  history/           ancien plan et comptes rendus clos
```

Travail :

- séparer manuel, référence, architecture, développement, démo et historique ;
- regrouper les hacks, limites et prérequis OIE/HAPI avec leur preuve et leur
  demande amont ;
- expliquer en tête de documentation le choix FML versus Profile Mapper ;
- revoir les traductions sans traduire expressions, chemins ni données FHIR ;
- inventorier et renouveler les captures lorsque l'interface illustrée change ;
- supprimer ou classer `doc/TEMP.md` après confirmation de son rôle ;
- retirer les constats périmés du suivi actif sans effacer leur historique ;
- faire pointer README, CHANGELOG et guides vers la présente feuille de route ;
- ajouter un contrôle des liens Markdown et des documents orphelins.

Critère de fin : chaque document a un public et une autorité identifiés ; aucune
fonction n'est décrite contradictoirement dans deux références actives.

Sous-lot structurel livré le 13 novembre 2026 : index principal et index par
public, manuel français isolé, exemples regroupés avec la démo, ancien plan
archivé, `TEMP.md` classé sans suppression, liens réparés et contrôle automatique
des liens et orphelins ajouté à la CI. Les instructions de développement du
plugin et le manuel des agents utilisateurs d'OIE sont séparés. La revue des
traductions, des captures et des recouvrements de fond reste à conduire avec
les lots fonctionnels concernés.

## 4. Registre exhaustif des écarts et idées

Cette table garantit le classement des éléments connus. Une ligne peut rester
reportée ; elle ne doit plus être perdue dans plusieurs documents.

| Élément | Destination | État |
|---|---|---|
| Namespace `fr.kazepoy.fhir`, sans lecture de `org.oie.fhir` | A | décidé ; rupture de développement assumée |
| Contrat du tableau `mappings` | B | proposé |
| Contrats `OieMessage`, HL7 v2 typé et source FHIR | B | proposé |
| Manifeste de packages et verrouillage de profil | B | à décider |
| Liens visuels source → cible | C | proposé |
| Réorganisation des onglets et trois zones | C | proposé |
| Réutilisation de l'éditeur JSON OIE | C | à étudier |
| Évaluation d'expression sur sample | C | à étudier |
| Liens profonds vers les IG publiés | C | proposé |
| Mode simple/avancé | C | à concevoir, pas de flag avant maquette |
| Réglages de fonctions expérimentales | C | à justifier au cas par cas |
| Amélioration de l'autocomplétion | C | besoin à préciser |
| Préférence de langue explicite | C | à arbitrer ; navigateur déjà pris en charge |
| Canaux R4/R4B/R5, IG, FR Core, sources et terminologie | D | proposé |
| Maps publiées, surchargées et imbriquées | D puis E | proposé |
| Samples, groupes et tags de chaque canal | D | proposé |
| Édition d'une dérivation de map canonique | E | proposé |
| Navigation et diagnostics dans les imports FML | E | proposé |
| Trace FML par groupe/règle | E | faisabilité à étudier |
| Jeux d'essai FML comparables au Profile Mapper | E | proposé |
| Rôle respectif des deux transformeurs | F | décision acquise à documenter |
| Réorganisation de toute la documentation | F | structure et index livrés ; revue de fond continue |
| Inventaire des hacks et prérequis OIE/HAPI | F | proposé |
| Revue des traductions | F | proposé |
| `doc/TEMP.md` et documents orphelins | F | note classée dans l'historique ; contrôle automatique actif |
| Revue complète de véracité et état de l'art | B, D, E, F | à faire par preuves, pas comme un lot vague |
| Sous-slices, `contained`, primitives, R4B/R5 | socle livré | clos au lot 7 |
| Discriminants impossibles à matérialiser | limites documentées | conserver l'erreur explicite |
| `contained` générique sans profil | limites documentées | conserver tant que le type est ambigu |
| Traduction inverse et `dependsOn`/`product` locaux | backlog fonctionnel | aucun besoin priorisé |
| Partage des Bundles entre FML et Profile Mapper en aperçu | backlog fonctionnel | non planifié |
| Gestion graphique des dépendances de packages | backlog Settings | non planifié |
| Bouton de rechargement du catalogue | backlog serveur | reporté avec le cache |
| Migration automatique format 1→2 | travaux reportés | reporté |
| Index de catalogue persistant | travaux reportés | reporté |
| S-3, double validation, runtime partagé, pools | travaux reportés | reporté |
| Durcissement, endurance, permissions finales | travaux reportés | reporté |
| Version 1.0 et release | travaux reportés | reporté, sauf namespace |
| Limites Web Admin et FHIR Data Type FD-01 à FD-03/WA-21 | registre plateforme | surveiller lors des mises à jour |
| Administration Swing | hors produit | Web Admin uniquement |

## 5. Règles de pilotage

1. Une décision fonctionnelle entre d'abord dans ce plan, puis dans un lot.
2. Un lot modifie uniquement les documents dont l'autorité est concernée ; le
   journal historique n'est pas réécrit comme s'il avait toujours été à jour.
3. Chaque lot commence par ses hypothèses et critères vérifiables.
4. Une nouvelle abstraction, option ou préférence doit répondre à au moins deux
   cas réels de la matrice ; sinon elle reste locale.
5. Les résultats de tests et limites non testées sont consignés séparément.
6. La base de compatibilité commence après le lot A ; les exports
   `org.oie.fhir.*` antérieurs ne sont ni conservés ni utilisés comme fixtures.
7. Le plan actif ne contient pas de version fictive : une version n'est annoncée
   qu'au moment de préparer réellement sa release.

## 6. Prochaine décision après le namespace

Après le lot A, choisir ensemble entre :

1. **B — contrats**, pour stabiliser le produit avant toute nouvelle fonction ;
2. **C — maquette du studio**, si l'ergonomie est le risque prioritaire ;
3. **D — matrice de vérité**, si la priorité est d'augmenter immédiatement la
   confiance dans les deux moteurs et les IG.

Le lot E ne devrait pas commencer avant ce choix : son interface et ses contrats
dépendent directement de B, C et D.
