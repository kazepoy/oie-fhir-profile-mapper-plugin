# Changelog

## Non publié (branche `feat/refonte`)

- **Outils CLI (`tools/`)** : migration des scripts et suites de tests vers Node.js
  natif (`.mjs`, zéro dépendance npm externe, suppression de Python et `pip`),
  support et validation de `FhirFmlTransformStep` dans `tools/channel_mapping.mjs`
  et `tools/check_mapping.mjs`, détails des entrées ZIP dans `tools/check_reproducible.mjs`,
  et exécution automatique de `tools/tests/*.test.mjs` lors de `mvn test`.
- **Settings et sauvegarde OIE** : intégration de *Settings › FHIR Mapper* à la barre
  de tâches Web Admin (*FHIR Mapper Tasks*, indicateur de modification) et à la
  sauvegarde/restauration native de configuration OIE (`PluginMetaData.serverSettings`).
- **Tests FML et Profile Mapper** : instance source FML et message préparé du
  Profile Mapper affichés à côté de l'exemple, ou dessous en zone étroite.
  Résultats dimensionnés dans l'espace disponible pour éviter le double
  défilement du panneau et de l'éditeur. L'API Profile Mapper renvoie `source`
  après préparation de l'entrée, y compris si le mapping échoue ensuite.
- **Catalogue** : préchauffage du validateur avant le verrou du moteur, pour
  éviter un interblocage avec une validation concurrente.
- **Démo et matrice d'exemples** : vingt-trois canaux dans neuf groupes OIE natifs
  (`<Source> - <Transfo>` et `FML versus Mapper`), tags colorés ordonnés, restauration
  native depuis `demo/oie-init/data/` (`configuration.xml`, `channels/`, `groups/`),
  OIE Flow UI `0.8.4`, mot de passe de démo `admin` (`_MP_PASSWORD_MINLENGTH=0`),
  vingt samples Profile Mapper et cinq aperçus FML rejoués par la suite unifiée
  Node/Playwright (`npm --prefix webadmin run test:e2e`). Couverture R4/R5,
  FR Core 2.2.0, HL7 Europe Laboratory 2.0.0, `Permission` R5 en FML, `StructureMap`
  d'IG (`mapUrl`), terminologie externe `$translate` (avec mock HTTP `10819`) et
  six comparaisons parallèles FML vs Mapper (`10817`, `10818`, `10820`–`10823`).
  La map FML typée lit désormais `OBX.5.value` selon le XML réel du Strict
  Parser : le résultat biologique `5.10` n'est plus omis dans la démo.
- **Documentation** : `doc/` est organisé par public entre manuel multilingue,
  référence, architecture, développement, démo et historique. Un index principal
  et des index de section définissent l'autorité de chaque document ; la CI
  refuse les liens locaux cassés et les pages orphelines. Les agents de
  développement et les agents utilisateurs d'OIE disposent de manuels séparés.
  Le journal de reprise est archivé dans `doc/history/`, le TODO ne conserve
  que les travaux ouverts et le `AGENTS.md` de développement est en anglais.
- **Rupture de namespace** : les classes Java, les types sérialisés des
  transformeurs, les ponts isolés et le `groupId` Maven utilisent désormais
  `fr.kazepoy.fhir`. Les canaux de développement du dépôt ont été réécrits ;
  les anciens exports contenant `org.oie.fhir.*` ne sont volontairement plus
  lisibles et aucun adaptateur de compatibilité n'est fourni.
- **Aperçu multi-étapes** : exécution des Profile Mapper activés du même
  transformeur, références réelles, finalisation atomique des Bundles, ressources
  intermédiaires et variables finales consultables. Périmètre mémorisé par sample.
- **Rejeu** : `tools/run_tests.mjs` valide les exports hors ligne ou rejoue leurs
  samples sur serveur ; échec en cas d’écart avec l’attendu. Contrôle hors ligne
  en CI et comparaison des aperçus aux sorties déployées dans la démo.
- **Tableaux et documentation** : import CSV/Markdown des expressions de valeur
  et notes, validation atomique et Undo ; export de tableaux et de documentation
  Markdown/HTML. Comparaison des résultats avec renommage cohérent des UUID,
  conservant les relations de référence.


- **Socle frontend** : modèle/compilation FHIR, adaptation du catalogue et du
  canal, champs d’expression et styles extraits des éditeurs ; tests sans VM.
- **Langues et thèmes** : interface du plugin et aides en anglais/français,
  selon les langues du navigateur, repli anglais ; couleurs sémantiques du thème
  Web Admin. Expressions, chemins FHIR et formats d’étapes conservés.
- **Assemblage** : Maven installe les dépendances Node verrouillées, contrôle,
  construit et teste le frontend avant de produire le ZIP. Vérification de
  reproductibilité depuis une copie isolée contenant un bundle périmé, en CI
  et avec `tools/check_reproducible.mjs`. Node/npm inclus dans le build Docker.


- **Documentation utilisateur** : [manuel illustré](doc/user-manual/README.md),
  avec parcours par fonctionnalité pour le Profile Mapper, FML et les réglages,
  captures réelles de la démo et limites actuelles des aperçus et validations.

- **Studio, assistance et branches (R-05/R-06 partiels)** : menu contextuel par
  clic droit, Maj+F10 ou *⋯* ; duplication des occurrences répétables avec nouveaux
  chemins et IDs, conservés par Undo/Redo ; activation de branche et copie JSON.
  Pickers des slices d'extension et des URL du contexte ; filtrage des ConceptMaps
  par systèmes et binding cible, avec accès à la liste complète. Recherche bornée
  dans les extensions récursives ; menu utilisable au-dessus du studio plein écran.
- **Démo** : slice optionnelle `registrationMode` et extension `ExampleSourceLabel`
  hors du profil Patient, utilisées par les parcours de test de l'éditeur.

- **Studio, inspecteur** : sélection d'un élément au clic ou au clavier ; volet
  avec métadonnées FHIR, définition, exemples, règles modifiables et diagnostics.
  Les champs de condition, itération et traduction sont partagés avec l'arbre ;
  les modifications utilisent le même historique. Affichage à droite en pleine
  largeur, en dessous sur un éditeur étroit. *Go to rule* révèle aussi la cible
  quand la recherche de l'arbre masquait l'élément.

- **Mappeur, règles (R-06 partiel)** : bouton *Rules* sur les éléments mappés et
  la racine, pour saisir une note et activer/désactiver chaque règle séparément.
  Notes et activation sont conservées lors de la compilation et restaurées par
  *Undo / Redo*. Vérification unitaire et parcours Playwright dans la démo.
- Feuille de route active : [doc/plan-suite.md](doc/plan-suite.md). Historique
  de reprise et critères des lots livrés : [TODO.md](TODO.md).

- **FHIR FML Transform** : second transformeur, qui exécute une map FML (StructureMap)
  sur le message vu par le modèle logique générique `OieMessage`, avec le moteur du
  core HL7 livré par FHIR Data Type. Canal de démo sur le port 8087.
- **Contextes FHIR et format 2** : contextes nommés du serveur (*Settings › FHIR Mapper*, routes
  `GET/POST /settings`, permission *Manage FHIR mapper settings*) ; les étapes des deux
  transformeurs peuvent en nommer un (`context`) ; politique de validation `inherit`/`always`/`off` ;
  `formatVersion: 2` ; règles `note` et `disabled` (non compilées). Les étapes au format 1
  fonctionnent sans changement.
- **Catalogue** : routes `GET /catalog`, `/catalog/elements` (un profil et ses types en une
  requête : l'arbre s'ouvre sans chargement type par type) et `/catalog/expand` (codes d'un
  ValueSet) ; les éléments liés proposent leurs codes dans la complétion.
- **FML, map dans l'étape** : onglet *Map* avec l'éditeur de code en langage `fml`, propriété
  `mapSource` enregistrée avec le canal et exécutée à la place de `mapUrl`, bouton *Check*
  (route `POST /check`) qui positionne les erreurs du parseur et signale les `uses` et
  `imports` introuvables.
- **Mappeur, jeux d'essai** : exemples nommés enregistrés dans l'étape (propriété `samples`),
  résultat attendu par exemple, comparaison avec vue côte à côte en cas d'écart, *Run all*.
- **Trace** : action *FHIR mapping trace* sur un message de la liste des messages.
- **Mappeur, saisie** : volet *Sample fields* (champs et valeurs de l'exemple, clic ou glisser),
  déplacement au clavier entre les champs (`Alt` + flèches), erreur soulignée dans le champ.
- **Mappeur, lisibilité** : expressions colorées hors édition ; message exemple, résultat, script
  et JSON dans l'éditeur de code avec la coloration de leur langage ; bouton d'aide **?** par
  onglet (mappeur, FML, réglages). Corrections : `Alt+Espace` et `Ctrl+Espace` ouvrent les
  propositions, propositions de chemins triées et limitées aux champs renseignés, plus de
  feuille de styles de l'éditeur affichée comme du texte. Tests e2e aussi sous WebKit
  (`E2E_BROWSER=webkit`).
- **Mappeur** : expressions éditées dans l'éditeur de code de Web Admin (Monaco) avec
  complétion des fonctions, des variables d'itération, des chemins du message exemple,
  des références des autres étapes et de modèles de garde ; recherche dans l'arbre ;
  Expand mapped / Collapse all ; Undo / Redo ; plein écran ; éléments en erreur marqués.
- Fonctions du mappeur dans le panneau Reference de Web Admin (catégorie *FHIR Mapper*).
- **Build** : les éditeurs sont dans `webadmin/src` et regroupés par esbuild en
  `webadmin/web/plugin.js` (`npm run build`). La CI construit et teste les éditeurs et
  les outils Python avant `mvn package`.
- **Démo** : neuf canaux ; exemples avec résultat attendu sur les étapes Patient des ports 8081
  et 8082 ; canal *FML inline* (port 8089) ; tableau « ce que montre chaque canal ».
- **FML typé** : source HL7 v2 logique alimentée par le Strict Parser, source FHIR
  directe, maps représentatives `PIDtoPatient` et `ORUR01toBundle`, démo Bundle
  Patient + Observation, complétion locale et génération de squelette. Les
  transformations concurrentes n'utilisent plus de verrou global ; aucun pool
  n'est ajouté sans mesure démontrant sa nécessité.
- **Ménage** : modules web jamais branchés retirés, `legacy-editor.js` renommés `editor.js`,
  plan initial `doc/Plan.md` retiré, tests e2e Playwright versionnés.
- Plan de refonte initial, conservé comme historique :
  [doc/history/plan-refonte.md](doc/history/plan-refonte.md).

## 0.2.0

Voir l'historique git.
