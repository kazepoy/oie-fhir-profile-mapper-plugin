# Plan de refonte : OIE FHIR Mapper

Revue complète du projet au 11 novembre 2026 (branche `main`, commit `59e5921` ;
branche `feature/fml-transform`, commit `a845140`) et plan de refonte en phases.
Le plan vise un plugin **complet et ergonomique**, avec une **assistance à la
saisie complète** dans le mappeur graphique, et un **second transformeur FML**
(FHIR Mapping Language) à côté du mappeur.

Le [plan initial](Plan.md) reste le compte rendu de ce qui a été livré ; ce
document le remplace pour la suite.

## État d'avancement (branche `feat/refonte`, 12 novembre 2026)

| Phase | État |
|---|---|
| 1 Socle frontend | **Fait en partie** : projet Node, esbuild, `src/host`, i18n, modèle FHIR pur, CI. Les éditeurs sont encore les fichiers d'origine (`legacy-editor.js`) ; pas de tests e2e versionnés. |
| 3 Studio et saisie | **Fait en partie** : Monaco sur les expressions, complétion (fonctions, variables, chemins, snippets, références), recherche, annuler/rétablir, plein écran, éléments en erreur. Restent : volets source et inspecteur, codes de binding, clavier, menu contextuel. |
| 5 FML | **Fait en partie** : étape de la branche `feature/fml-transform` intégrée, plein écran. Restent : map inline, langage Monaco, modèles typés, pool. |
| 2, 4, 6, 7 | À faire. |

---

## 1. Revue de l'existant

### 1.1 Chiffres

| Sujet | Mesure |
|---|---|
| Java serveur (`src/main/java`) | ≈ 3 200 lignes, 14 classes ; compilateur d'étape 920 lignes |
| Runtime JavaScript embarqué | 1 029 lignes, recopié dans **chaque** étape compilée |
| Éditeur Web Admin | **1 seul fichier**, `webadmin/web/plugin.js`, 1 961 lignes, sans build |
| Tests | 126 Java, 16 Node, 8 Python : tous verts au 11/11 (`mvn test`, `node --test`, `unittest`) |
| Documentation | 9 documents, ≈ 1 460 lignes, en français |
| Démo | 7 canaux, 23 étapes FHIR, 293 règles ; Flow UI 0.8.1, RBAC 1.3.0 |
| Branche FML | 37 fichiers, +2 790 lignes, jamais fusionnée, à rebaser (`docs/` → `doc/`) |
| Charge (10/11, `oru-r01-labo.er7`) | sans validation ni trace : 18 ms ; validation datatype : +85 ms ; validation mapper : +85 ms ; trace : +10 à 30 ms |
| Charge en paliers | canal labo : p95 1,5 s à 1 msg/s ; 31 % d'erreurs (délai 60 s) à 2,3 msg/s |

### 1.2 Ce qui tient

- **Le contrat de mapping** (règles JSON : valeur, itération, condition, constante,
  traduction ; chemins avec slices et instances) est spécifié, schématisé, testé
  et exécuté par un compilateur serveur unique. L'éditeur n'invente pas de
  JavaScript.
- **Les diagnostics** sont rattachés aux règles (`ruleId`, phase, expression) et
  la **trace** (test et messages traités) est structurée et versionnée.
- **L'isolation du prérequis** FHIR Data Type (façade, adaptateur, pont de
  catalogue dans un JAR séparé) est propre ; les limites sont tenues dans un
  registre avec des demandes amont.
- **Les Bundles nommés** (création, cibles multiples, références réservées,
  requêtes différées, finalisation après la dernière étape) couvrent les cas
  réels : transaction + document de laboratoire.
- **La démo** est reproductible (Docker, SHA-256, `check.py`), avec des tests de
  charge outillés (k6) et des rapports datés.
- **Les outils IA** (schéma JSON, `channel_mapping.py`, API `/script`, `/test`,
  `/functions`, `/source`) permettent à un agent de lire, modifier et expliquer
  un mapping.

### 1.3 Constats

Identifiants `R-xx` pour les reprendre dans les phases.

| ID | Domaine | Constat | Preuve | Impact |
|---|---|---|---|---|
| R-01 | Éditeur | Un fichier de 1 961 lignes mélange modèle (arbre, compilation, complétude), état et rendu ; appels `h()` sans JSX ; styles dans une chaîne ; état mutable dans un `useRef` avec rendu forcé | `webadmin/web/plugin.js` | Chaque évolution est coûteuse et risquée ; les tests chargent le fichier dans un `vm` en remplaçant React |
| R-02 | Éditeur | Pas de build, pas de modules, pas d'i18n, pas de jetons de thème, pas de tests e2e | contraste avec `oie-flow-ui-plugin` (esbuild, `src/host`, i18n, Playwright) | Interface figée en anglais, régressions visuelles non détectées |
| R-03 | Saisie | Les expressions sont des `<input type=text>` : une ligne, sans coloration, sans marqueurs d'erreur, sans aide au survol ; complétion maison déclenchée à 3 caractères ou au raccourci | `MapperExpression`, `functionCompletion` | L'étape JavaScript native, elle, a Monaco avec complétion typée et code templates : le mappeur est en retrait |
| R-04 | Saisie | Les chemins source proposés viennent d'une marche locale limitée (5 niveaux, 200 chemins), sans valeur d'exemple, sans type | `mapperSourcePaths` | Peu utile sur un ORU complet |
| R-05 | Saisie | Aucune aide sur les **valeurs** : codes d'un binding, URL d'extensions du profil, noms de référence des autres étapes, ConceptMaps liées à une table HL7 | — | L'utilisateur tape des codes et des URL de mémoire |
| R-06 | Arbre | Pas de recherche d'élément, pas de navigation clavier, pas de « tout déplier », pas d'annuler/rétablir, pas de duplication de branche, pas d'activation/désactivation d'une règle | `mapperPanel` | Lent sur les profils larges (Observation : 33 règles dans la démo) |
| R-07 | Arbre | Les types sont chargés un par un à l'ouverture (une requête par StructureDefinition) et le snapshot complet est envoyé au navigateur | `fetchSd`, `childElements` | Latence à l'ouverture ; logique de slicing dupliquée côté client |
| R-08 | Étape | `profiles`, `terminologyServer`, `terminologyAuthorization`, cache, délai sont **répétés dans chaque étape** d'un canal (10 étapes dans le canal labo) | `FhirProfileMapperStep` | Incohérences possibles ; aucune administration centrale des packages |
| R-09 | Format | Pas de `formatVersion` ; `profileVersion` ne verrouille rien ; pas de manifeste de packages | [Plan](Plan.md#points-ouverts-du-format) | Toute évolution incompatible est bloquée |
| R-10 | Runtime | Le runtime (1 029 lignes) est inséré dans le script de chaque étape ; le canal labo compile dix copies | `compileScript` : `var __fhir = <runtime>` | Scripts générés illisibles ; mémoire et temps de compilation au déploiement |
| R-11 | Validation | Deux validations HAPI par message quand le datatype valide aussi la sortie (+85 ms chacune) ; aucune politique de validation (toujours / jamais / échantillon) | rapport `20261110-114424-oru` | La validation est le premier poste de coût |
| R-12 | Charge | Le canal labo s'effondre au-delà de 2 msg/s (délais 60 s) ; cause non analysée (validateur HAPI sérialisé ? GC ?) | rapport `20261110-113341-paliers` | Pas de seuil tenu en production |
| R-13 | Test | L'aperçu exécute une étape seule ; les références entre étapes sont simulées ; pas de jeu d'essais mémorisé ni de résultat attendu | `FhirMapperTester`, `Mappeur-graphique.md §9` | Les Bundles multi-étapes ne se vérifient qu'en déployant |
| R-14 | Fonctionnel | Non pris en charge : sous-slices, discriminants `type`/`profile`/`exists`, `contained`, extensions de primitives (`_birthDate`), rejeu R4B/R5 | [Plan](Plan.md) | Certains IG (FR Core, EU Lab) ne se mappent pas entièrement |
| R-15 | Intégration | Le script généré est posé dans `element.script` (propriété non énumérable) après un appel différé à `/script`, pour l'onglet *Generated Script* | `scriptFor` | Fonctionne, mais dépend d'un repli non documenté de Web Admin |
| R-16 | Catalogue | Trois méthodes privées du datatype appelées par réflexion (FD-01) | `FhirCatalogBridge.invoke` | Chaque version du datatype peut casser l'éditeur |
| R-17 | CI | La release GitHub lance `mvn package` seulement : ni `node --test`, ni Python | `.github/workflows/release.yml` | Une régression de l'éditeur passe la release |
| R-18 | Docs | Spécification, guide de l'éditeur, trace et assistants se recouvrent ; pas de guide utilisateur illustré ; pas de CHANGELOG ni de TODO | `doc/` | Difficile d'entrer dans le projet |
| R-19 | Exploitation | La trace d'un message traité se lit en fouillant *Messages › Mappings* ; aucune action de message dédiée | `Trace.md` | Diagnostic lent en exploitation |

### 1.4 Branche `feature/fml-transform`

Travail du 10 novembre, un commit, non fusionné. Ce qu'il apporte et ce qui manque :

| Acquis | Manque |
|---|---|
| Étape `FhirFmlTransformStep` : script Rhino qui passe le message (XML interne ou JSON) et un contexte à `FmlFacade.run` | Pas de rebase sur `main` (`docs/` renommé en `doc/` depuis) |
| Moteur FML du core HL7 **6.9.12** livré par FHIR Data Type, sans Matchbox (62 Mo, classes du core remplacées) : décision argumentée | **Pas thread-safe** : une transformation à la fois par contexte ; non mesuré |
| Modèle logique générique `OieMessage` (nom, position, occurrence, valeur, contexte) construit directement en `Element` | Incompatible avec les maps **typées** de l'organisation (`aphm.ig.hl7v2` : `PID_3`, `CX_5`, `ORU__R01_PATIENT__RESULT`) et avec le style v2-to-FHIR |
| Pont dans un JAR séparé chargé par le chargeur HAPI du datatype ; `listMaps`, `source`, `transform`, `reload` ; tests Java et Node | Les maps sont des **fichiers serveur** uniquement : rien n'est versionné dans le canal, rien ne s'édite dans Web Admin |
| Éditeur à deux onglets (Properties, Test), modèle reçu visible | **Aucune assistance** FML : ni coloration, ni complétion, ni diagnostic positionné |
| Validation du résultat par FHIR Data Type, publication comme le mappeur | Pas de trace, pas de partage de Bundles avec le mappeur, `resolveReference`/`performSearch` absents |

### 1.5 Ce que Web Admin 1.3 (API plugin 4.10) offre et que le plugin n'utilise pas

Vérifié dans le WAR de l'image de démo (`core/platform.js`, `core/monaco.js`,
`core/codeeditor.js`, `core/editor-languages.js`, `core/script-completions.js`).

| Capacité | Usage possible dans le mappeur |
|---|---|
| `platform.createCodeEditor(opts)` : éditeur Monaco (servi localement, repli textarea), coloration Rhino/E4X, complétion typée de `msg`, `tmp`, maps, `logger`, code templates du canal comme bibliothèques, vue plein écran (`popoutable`) qui accueille le panneau *Message Trees* | Toutes les expressions du mappeur et la map FML |
| `platform.registerEditorLanguage(id, { load })` : langage Monarch à la demande | Langage **FML** : mots-clés, chaînes, commentaires, noms de règles |
| `platform.registerReferences(category, items)` : entrées du panneau *Reference* **et** de la complétion de tout éditeur JavaScript, par contexte | Les fonctions `fhirRef`, `fhirFind`, `hl7Following`… visibles aussi dans les étapes JavaScript voisines |
| `platform.createDiffEditor` | Comparer deux résultats de test, deux révisions d'un mapping, un résultat attendu |
| `platform.registerMessageAction` (`ctx.connectorMessage`) | Action *FHIR mapping trace* dans la liste des messages |
| `platform.registerSettingsPanel`, propriétés d'extension OIE (`ServicePlugin.update`) | Réglages serveur : packages, serveurs de terminologie, politique de validation |
| `platform.registerCommand` | Palette : « Ouvrir le studio de mapping », « Lancer les tests de l'étape » |
| `platform.ui` : `modal`, `confirmDialog`, `promptDialog`, `contextMenu`, `tabs`, `DataTable`, `toast`, `saveFile`, `pickFile` | Dialogues, menus contextuels de l'arbre, export/import |
| Glisser-déposer natif : type `application/x-oie-accessor` depuis *Message Trees*, déposé dans un Monaco ou un champ | Déjà exploité ; à conserver avec Monaco |
| `@oie/web-api` : `validateScript`, `formatScript` | Contrôle syntaxique côté moteur sans eval |

Limites rencontrées (à enregistrer dans [limites-plateforme.md](limites-plateforme.md), §7) :
pas de point d'extension pour *Generated Script* (R-15), pas d'API de complétion
par plugin (le fournisseur Monaco du cœur lit ses propres sources ; `window.monaco`
est global), pas de réglage de plugin **par canal**, et une zone d'édition d'étape
de hauteur contrainte.

---

## 2. Cible

### 2.1 Principes

1. **Un plugin, deux transformeurs** : *FHIR Profile Mapper* (graphique) et
   *FHIR Mapping Language* (FML). Même façade FHIR, mêmes contextes serveur,
   mêmes outils de test, même trace, même documentation.
2. **Le format JSON reste le contrat** (éditeur, serveur, agents IA). Il passe en
   version 2 avec migration automatique et outillée.
3. **Même architecture que Flow UI** : build esbuild en un seul fichier, `src/host`
   seul à lire `platform`, logique en `.js` testée sans navigateur, composants en
   `.jsx`, i18n, jetons CSS dérivés de Web Admin, tests Playwright contre la démo.
4. **API publique de Web Admin seulement**. Un contournement est isolé dans
   `src/host`, signalé par un message quand il échoue, et noté comme limite.
5. **Le serveur fait le travail lourd** : index des packages, arbre aplati,
   expansions de ValueSets, compilation, tests, FML. Le navigateur affiche.
6. **Chaque phase se termine vérifiable** : tests automatiques, parcours
   Playwright dans la démo, documentation à jour, CHANGELOG.

### 2.2 Architecture cible

```text
webadmin/                          (frontend, Node 22, esbuild → webadmin/web/plugin.js)
  src/
    index.js                       register(platform) : 2 types d'étape, action message,
                                   panneau Settings, commandes, références, langage FML
    host/                          platform, react, api, code-editor (Monaco), drop (Message Trees),
                                   references, prefs, overlay plein écran, i18n
    i18n/locales/{en,fr}.js
    shared/{styles,ui,model}       jetons, Tabs, Field, Badge, Popover, Toolbar, EmptyState, DataTable
    fhir/                          modèle pur : arbre d'éléments, chemins, slices, complétude,
                                   ids de règles, migration v1→v2, documentation des règles
    profile-mapper/                étape graphique : Properties, Studio (3 volets), Tests, Trace
    fml/                           étape FML : Properties, Éditeur (Monaco fml), Tests
    settings/                      Manage › Settings › FHIR Mapper (contextes, terminologie, validation)
  test/unit, test/e2e              node:test, Playwright (démo, comptes RBAC)

src/main/java/org/oie/fhir/
  mapper/                          compilateur d'étape (format v2), lifecycle, runtime partagé
  mapper/server                    servlet, testeur multi-étapes, trace, réglages d'extension
  catalog/                         index des packages, arbre aplati, expansions, caches par contexte
  fml/                             étape FML, façade, servlet, testeur, modèles source
  integration/                     adaptateur FHIR Data Type ; ponts (catalogue, FML) dans lib/
```

Le build frontend s'intègre au POM (`frontend-maven-plugin` ou étape Node dans
le Dockerfile et la CI) : `mvn package` produit toujours le ZIP complet.

### 2.3 Format de l'étape, version 2

Conservé : `mappings` et `bundleTargets` en **chaînes JSON** (contrainte XStream
et Web Admin, décision documentée), les quatre formes de règles, les chemins.

Ajouté :

| Champ | Rôle |
|---|---|
| `formatVersion: 2` | Obligatoire ; une étape sans version est lue comme v1 et migrée à l'ouverture et à l'import |
| `context` | Nom d'un **contexte FHIR** défini dans les réglages du serveur (§2.4). Remplace `profiles`, `terminologyServer`, `terminologyAuthorization`, cache et délai, conservés en lecture pour la migration |
| `samples` | Jeux d'essai de l'étape : `[{ id, name, dataType, message, expected? }]` (§2.6) |
| règle : `id` obligatoire, `note` (documentation libre), `disabled` (règle conservée mais non compilée) | Export de documentation, mise au point sans perte |
| `validation` : `inherit` (contexte), `always`, `off` | Remplace `validateOutput` au niveau étape |

La migration v1 → v2 est faite par le serveur (`fromJson`), par l'éditeur à
l'ouverture (avec avis « étape migrée, enregistrer le canal ») et par
`tools/channel_mapping.py migrate`. Le schéma JSON et les exemples passent en v2 ;
les exports v1 de la démo restent lus.

### 2.4 Contextes FHIR (réglages serveur)

Un panneau *Manage › Settings › FHIR Mapper* (permission **Manage FHIR mapper
settings**) administre des **contextes nommés**, stockés dans les propriétés de
l'extension OIE :

```json
{ "name": "labo", "fhirVersion": "R4",
  "packages": ["/fhir-ig", "/opt/fhir/packages/hl7.fhir.fr.core-2.2.0.tgz"],
  "terminology": { "server": "", "authorization": "", "cacheSeconds": 300, "timeoutSeconds": 10 },
  "validation": "always" }
```

Le serveur construit, pour chaque contexte, un **index** (profils, extensions,
ValueSets, ConceptMaps, StructureMaps, modèles logiques ; url, version, nom,
type, base) mis en cache et invalidé par *Reload*. Les étapes référencent le
contexte par son nom ; l'index alimente les listes et la complétion. Les
packages manquants sont signalés dans le panneau, pas à l'ouverture d'une étape.

### 2.5 Le studio de mapping

L'étape reste éditable dans la zone du transformeur, et s'ouvre en **plein
écran** (même mécanisme que la vue code des éditeurs de Web Admin) en studio à
trois volets :

```text
┌ Source (exemple) ─────────┬ Cible (profil) ────────────────────┬ Inspecteur ──────────────┐
│ recherche                  │ recherche · filtres · ▸▾ tout      │ Patient.birthDate        │
│ ▸ MSH                      │ Patient  ExampleLabPatient 1.0.0   │ date · 0..1 · S          │
│ ▾ PID                      │  ▾ identifier 1..* [ipp] ✓         │ Expression ──────────── │
│    PID.3 [0] 100001^^^EXA… │     system  fixed urn:ipp          │ msg['PID']['PID.7']…    │
│    PID.5 [0] MARTIN^CLAIRE │     value   n['PID.3.1']   ✓       │ (Monaco, 1 ligne)        │
│    PID.7     19850412      │  ▾ name 0..* ↻ msg['PID']['PID.5'] │ Condition  Itération     │
│ valeurs du message exemple │     family  n['PID.5.1']   ✓       │ Traduction  Note         │
│                            │  ▸ gender 1..1 ⇄ v2-0001→gender ✓  │ Aide FHIR · exemples     │
│                            │    birthDate            ⚠ requis   │ Diagnostics de la règle  │
├ Tests ─────────────────────┴────────────────────────────────────┴──────────────────────────┤
│ Jeux d'essai ▾  Lancer  Toutes les étapes  Trace ☐   résultat · validation · diff attendu  │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Source** : l'arbre du message exemple (sérialisé par OIE pour HL7 v2) avec les
  valeurs, filtrable, chaque ligne glissable ; sous une itération, les chemins
  sont réécrits vers la variable.
- **Cible** : l'arbre du profil (aplati par le serveur), filtres *tous / requis
  et Must Support / mappés / en erreur*, recherche, clavier (flèches, Entrée,
  Suppr, Ctrl+Z/Y), menu contextuel (ajouter une instance, itérer, condition,
  traduction, dupliquer la branche, désactiver, copier en JSON), badges de
  complétude et d'erreur, lignes de liaison vers la source pour l'élément
  sélectionné.
- **Inspecteur** : tout ce qui concerne l'élément sélectionné, avec l'éditeur
  d'expression Monaco, les pastilles de type, la définition FHIR (short,
  definition, binding, invariants), les choix de valeur (§2.6) et les
  diagnostics de la règle.
- **Tests** : jeux d'essai, exécution d'une étape ou **de toutes les étapes FHIR
  du transformeur**, trace, comparaison au résultat attendu.

Les volets ont des largeurs mémorisées ; dans la zone du transformeur, les deux
premiers volets se superposent en onglets.

### 2.6 Assistance à la saisie

| Besoin | Mécanisme | API Web Admin | Phase |
|---|---|---|---|
| Coloration, parenthèses, multi-ligne au besoin, Ctrl+Espace, hover, signature | `createCodeEditor` en mode une ligne (hauteur fixe, Entrée = valider, Maj+Entrée = retour à la ligne) ; `completionScope` du canal | `platform.createCodeEditor` | 3 |
| Complétion de `msg`, `tmp`, maps, `$()`, `logger`, Java/E4X | Fournie par le cœur (DTS Rhino) | incluse | 3 |
| Code templates du canal | Fournie par le cœur (bibliothèques du scope) | incluse | 3 |
| Fonctions du mappeur avec signature, doc, exemple, par contexte (valeur, condition, itération, référence, traduction) | Catalogue `mapper-functions.json` publié par `registerReferences("FHIR Mapper", …)` ; filtrage fin par un fournisseur Monaco actif seulement sur les éditeurs du plugin | `registerReferences` ; fournisseur : limite WA | 3 |
| Variables d'itération et indices de la portée | Bibliothèque DTS par champ (`declare const n: any; declare const nIndex: number`) ajoutée au focus, retirée au blur | Monaco global : limite WA | 3 |
| Chemins du message exemple **avec valeur et type**, réécrits sous itération | Arbre source servi par `POST /source` (déjà) + fournisseur de complétion ; hover montre la valeur de l'exemple | Monaco global | 3 |
| Garde des accès facultatifs | Snippets : `x != null ? x : undefined`, `fhirFind(list, function (it) { … })`, `length() > i ? … : undefined` | `registerReferences` (type snippet) | 3 |
| Codes d'un **binding** (required, extensible) | `GET /catalog/expand?context&valueSet&filter` ; liste déroulante dans l'inspecteur et complétion dans les chaînes `'…'` | serveur | 2–3 |
| Constantes et patterns du profil | Pré-remplis et verrouillés ; bouton « utiliser la valeur fixe » | fhir/ | 3 |
| Extensions du profil | Slices d'extension proposées avec leur URL ; ajout d'une extension du contexte hors profil (index) | serveur | 3 |
| Références entre étapes | Picker des `refName` déclarés dans le transformeur, insertion `fhirRef('patient')` ; avertissement si la cible n'est pas dans les mêmes Bundles | fhir/ + contexte du canal | 3 |
| Traductions | ConceptMaps du contexte filtrées par système source/cible ; **suggestion automatique** quand l'élément cible est lié et la source est une table HL7 (`v2-0001` → `…to-gender`) ; test en ligne | serveur | 3 |
| Dates HL7, décimaux, booléens | Hover sur la pastille de type : règle de conversion et exemples ; aperçu de la valeur convertie à partir de l'exemple | fhir/ | 3 |
| Glisser-déposer | Source → élément cible (règle valeur, `.toString()` ajouté pour E4X) ; liste source → élément répétable (propose une itération) ; élément cible → autre élément (déplacer/dupliquer la règle) | drop natif + plugin | 3 |
| Diagnostics en ligne | `/script` à chaque changement (différé) et résultats de test → marqueurs Monaco (soulignés) et badges de l'arbre ; « Aller à la règle » depuis chaque message | Monaco `setModelMarkers` | 3 |
| Annuler / rétablir | Historique des règles (immuable) ; Ctrl+Z/Y dans le studio | shared/model | 3 |
| Édition en masse | Import d'un tableau (CSV, Markdown : chemin cible, expression, note) ; export de la documentation du mapping (Markdown/HTML, avec notes) ; JSON existant conservé | `pickFile`, `saveFile` | 4 |
| FML : coloration, complétion des éléments source/cible, groupes, variables, FHIRPath, `translate()`, `uses`/`imports` du contexte ; diagnostics positionnés | §2.8 | `registerEditorLanguage`, Monaco | 5 |

### 2.7 Tests, traces, exploitation

- **Jeux d'essai dans l'étape** (`samples`) : plusieurs messages nommés, un
  résultat attendu facultatif. *Lancer* exécute et compare (`createDiffEditor`) ;
  un écart est signalé comme un test rouge. L'exécution reste soumise à la
  permission **Test FHIR mapper steps**.
- **Aperçu multi-étapes** : `POST /test` accepte la liste des étapes FHIR du
  transformeur ; le serveur les exécute dans l'ordre, avec les vraies références
  et la finalisation des Bundles, et renvoie chaque résultat. Lève la limite
  « aperçu isolé » (R-13).
- **Exécution par outil** : `tools/run_tests.py` rejoue les jeux d'essai de tous
  les exports d'un dossier contre un serveur (ou hors ligne pour le schéma) ;
  utilisé par la CI de la démo.
- **Trace** : vue arborescente (étape › règle › phase) avec filtre, durées,
  valeurs si capturées ; action de message **FHIR mapping trace** dans *Messages*
  (`registerMessageAction`) qui lit `fhirMapperTrace` et l'affiche.
- **Historique** : comparer la révision déployée et le brouillon (diff du JSON
  des règles), à partir de l'export du canal.

### 2.8 Transformer FML

**Étape `FHIR Mapping Language`** (classe `org.oie.fhir.fml.FhirFmlTransformStep`,
reprise de la branche) :

| Propriété | Contrat |
|---|---|
| `context` | Contexte FHIR (packages, dont les StructureMaps et modèles logiques) |
| `mapSource` | **Texte FML dans l'étape**, édité dans Web Admin, versionné avec le canal, compilé au déploiement et mis en cache par empreinte. Vide si `mapUrl` est utilisé |
| `mapUrl` | Canonique d'une StructureMap du contexte (fichiers `.fml`/`.map`, ressources, packages) |
| `sourceModel` | `oie-message` (générique, par défaut), `hl7v2-logical` (modèle typé d'un IG), `fhir` (le message est déjà une ressource FHIR : FHIR → FHIR) |
| `sourceModelUrl` | Pour `hl7v2-logical` : canonique du modèle racine (`…/StructureDefinition/ORU__R01`) |
| `variable`, `validation`, `contextVariables` | Comme aujourd'hui |

**Modèles source** :

- `oie-message` : le modèle générique de la branche (nom, position, occurrence),
  pour tout type de données sans IG.
- `hl7v2-logical` : adaptateur du XML du **Strict Parser** d'OIE vers une
  instance d'un modèle logique d'IG. La convention de nommage de `aphm.ig.hl7v2`
  est mécanique (`.` → `_`, `_` → `__` : `ORU_R01.PATIENT_RESULT` →
  `ORU__R01_PATIENT__RESULT`, `CX.5` → `CX_5`, texte d'une feuille → `value`),
  ce qui permet d'exécuter **les maps existantes de l'organisation**
  (`PIDtoPatient`, `CXtoIdentifier`, `ORUR01toBundle`) dans OIE. La convention
  est un paramètre du contexte, pour d'autres IG.
- `fhir` : une ressource FHIR (JSON ou XML) lue comme instance de son profil ;
  couvre les conversions de profil et de version (packages xver).

**Éditeur** : onglet *Map* avec Monaco en langage `fml` (Monarch :
`map`, `uses`, `imports`, `group`, `source`, `target`, `where`, `then`, `as`,
`create`, `translate`, `first`, `last`… ; chaînes, commentaires, noms de règles).
Complétion depuis un petit analyseur local (alias de `uses`, variables `as x`,
groupes) et depuis le serveur : éléments du modèle source et des profils cible
(`GET /catalog/elements`), canoniques du contexte (`uses`, `imports`,
`translate`), fonctions FHIRPath. Diagnostics : `POST /fml/check` renvoie les
erreurs du parseur **avec ligne et colonne** et les chemins inconnus détectés
contre les StructureDefinitions → marqueurs Monaco. **Générateur de squelette** :
à partir du modèle source et du profil cible, le serveur produit une map avec
les `uses`, un groupe et une règle commentée par élément requis.

**Exécution** : moteur `StructureMapUtilities` du core 6.9.12 (décision de la
branche conservée, à confirmer par le spike S-2) ; un **pool de contextes** par
contexte FHIR, taille réglable, pour lever la sérialisation ; relecture au
déploiement ; journal de transformation (`ITransformerServices.log`) joint aux
tests ; erreurs portant le nom de règle FML. Pas de trace par règle (limite
documentée) ; une trace de phases (`input`, `transform`, `validation`,
`publication`) est écrite dans `fhirMapperTrace` comme pour le mappeur.

**Démo** : canal *ORU vers Patient (FML)* avec map inline (port 8087) ; canal
*ORU vers Bundle (FML, modèle typé)* exécutant les maps `aphm-ig-oru` sur le
Strict Parser (port 8089) ; `check.py` compare avec les canaux du mappeur.

### 2.9 Performance

Objectifs à fixer avant la phase 7, mesurés avec `tools/load` :

| Mesure | Cible indicative |
|---|---|
| ORU vers Bundle (12 ressources), validation active | p95 < 300 ms à 5 msg/s, aucune erreur |
| Canal labo (deux Bundles) | p95 < 1 s à 5 msg/s, aucune erreur |
| Sans validation | p95 < 60 ms |

Leviers, par ordre : une seule validation par résultat (R-11) ; politique de
validation par contexte ; analyse de l'effondrement du canal labo (R-12 :
validateur partagé, verrou du pont, GC) ; runtime chargé **une fois** par
déploiement et partagé par les étapes (R-10, scope Rhino scellé exposé par
`FhirMapperLifecycle`) ; pool de validateurs.

### 2.10 Documentation, i18n, accessibilité

- `doc/` réorganisé : *Guide utilisateur* (studio, FML, tests, captures),
  *Référence du format v2*, *Architecture*, *FML*, *Développement*, *Limites de
  la plateforme*, *Démo*, `CHANGELOG.md`, `TODO.md`. La spécification actuelle
  devient la référence du format, allégée des parties « éditeur ».
- Interface en anglais, catalogue français, langue du navigateur (comme Flow UI).
- Clavier complet dans le studio, rôles ARIA sur l'arbre (`tree`, `treeitem`),
  contrastes des jetons vérifiés en clair et en sombre.

---

## 3. Phases

Chaque phase est fusionnée dans `main` seulement quand ses vérifications passent.
Les tailles sont indicatives pour une personne outillée.

| Phase | Objet | Taille | Constats traités |
|---|---|---|---|
| 0 | Cadrage et spikes | 1 semaine | décisions §5 |
| 1 | Socle frontend à iso-fonctionnalité | 2 semaines | R-01, R-02, R-17, R-18 (partiel) |
| 2 | Serveur : contextes, index, format v2, validation unique | 2 semaines | R-07, R-08, R-09, R-11, R-16 (partiel) |
| 3 | Studio et assistance à la saisie | 4 semaines | R-03 à R-06, R-15 |
| 4 | Tests, traces, exploitation | 2 semaines | R-13, R-19 |
| 5 | Transformer FML | 4 semaines | §1.4 |
| 6 | Compléments fonctionnels du mappeur | 2 semaines | R-14 |
| 7 | Performance, durcissement, 1.0 | 2 semaines | R-10, R-12 |

### Phase 0 : cadrage et spikes

- **S-1 Monaco une ligne** : `createCodeEditor` en champ d'expression (hauteur,
  Entrée, Tab), injection d'une bibliothèque DTS au focus, fournisseur de
  complétion limité aux éditeurs du plugin, marqueurs. Sortie : prototype dans la
  démo, liste des limites WA.
- **S-2 FML sur core 6.9.12 avec modèle typé** : exécuter `PIDtoPatient` et
  `ORUR01toBundle` d'`aphm-ig-oru` sur l'XML du Strict Parser converti ; mesurer
  ; comparer avec Matchbox (chargeur isolé). Sortie : décision moteur, convention
  de nommage, risques.
- **S-3 Charge** : reproduire l'effondrement du canal labo avec un profil JVM
  (threads, GC) pour nommer la cause avant de choisir les leviers.
- Décisions §5 prises et consignées ; `CHANGELOG.md`, `TODO.md` créés.

### Phase 1 : socle frontend (iso-fonctionnalité)

- `webadmin/` devient un projet Node : `package.json`, `build.mjs`, `jsconfig`,
  `src/host`, `src/fhir`, `src/profile-mapper`, `src/shared`, `src/i18n` ; le
  code actuel est **découpé sans changer le comportement** ; les 16 tests Node
  deviennent des tests unitaires normaux sur les modules purs.
- Tests Playwright contre la démo : ouvrir une étape, charger un profil, saisir
  une expression, lancer un test, lire la trace ; comptes `admin` et un rôle
  restreint.
- CI : `npm ci && npm test && npm run build` et `python -m unittest` avant
  `mvn package` ; Dockerfile de la démo avec une étape Node.
- Sortie : 0.3.0 ; aucune différence visible pour l'utilisateur ; docs
  *Développement* et *Architecture* à jour.

### Phase 2 : serveur

- Contextes FHIR : propriétés d'extension, permission, routes `GET/PUT /settings`,
  `POST /contexts/{name}/reload`, panneau Settings (minimal, sans studio).
- Index de catalogue par contexte ; `GET /catalog?context&kind` ;
  `GET /catalog/elements?context&url` (arbre aplati : types résolus, slices,
  discriminants, fixed/pattern, bindings, short/definition) ; `GET /catalog/expand`.
- Format v2 : `formatVersion`, `context`, `samples`, `note`, `disabled`,
  `validation` ; migration serveur, éditeur, outil Python ; schéma et exemples v2.
- Validation unique et politique par contexte ; `validateOutput` lu comme `always`/`off`.
- Pont de catalogue : index construit une fois (FD-01 toujours par réflexion, mais
  une fois par contexte) ; relance de la demande amont #29 avec les signatures.
- Sortie : 0.4.0 ; l'éditeur existant consomme les nouvelles routes ; la démo
  migre ses sept canaux ; `check.py` inchangé en résultats.

### Phase 3 : studio et assistance à la saisie

- Plein écran (overlay), trois volets, recherche, filtres, clavier, menu
  contextuel, annuler/rétablir, liaison source → cible.
- Expressions Monaco : tout le tableau §2.6 sauf l'édition en masse.
- Pickers : codes de binding, extensions, références, ConceptMaps, valeurs fixes.
- Diagnostics en ligne et badges ; « Aller à la règle » depuis tout message.
- Sortie : 0.5.0 ; guide utilisateur illustré ; parcours Playwright du studio ;
  revue d'ergonomie avec l'utilisateur sur les sept canaux de la démo.

### Phase 4 : tests, traces, exploitation

- Jeux d'essai dans l'étape, résultat attendu, diff ; aperçu multi-étapes ;
  `tools/run_tests.py` ; action de message *FHIR mapping trace* ; vue de trace.
- Import de tableau, export de documentation du mapping.
- Sortie : 0.6.0 ; CI de la démo rejoue les jeux d'essai des sept canaux.

### Phase 5 : transformer FML

- Rebase et fusion de la branche sur le socle (contexte, format, tests).
- `mapSource` inline, compilation au déploiement, cache par empreinte, pool.
- Langage `fml` Monaco, complétion, `POST /fml/check`, générateur de squelette.
- Modèles source `oie-message`, `hl7v2-logical` (adaptateur Strict Parser),
  `fhir` ; convention de nommage paramétrée.
- Deux canaux de démo, `check.py`, doc *FML*.
- Sortie : 0.7.0.

### Phase 6 : compléments fonctionnels du mappeur

- Sous-slices, discriminants `type`/`profile`/`exists`, `contained`, extensions
  de primitives ; rejeu des exemples en R4B et R5 ; profils FR Core et EU Lab
  dans la démo.
- Sortie : 0.8.0.

### Phase 7 : performance, durcissement, 1.0

- Leviers §2.9 selon S-3 ; seuils tenus dans `tools/load` et consignés.
- Namespace `fr.kazepoy` avec lecture des exports `org.oie.fhir.mapper` ;
  canoniques définitifs (`OieMessage`).
- Revue de sécurité (permissions, expressions évaluées, chemins de packages).
- Sortie : 1.0.0.

---

## 4. Risques

| ID | Risque | Parade |
|---|---|---|
| K-1 | Monaco en champ d'une ligne et injection de complétion reposent sur `window.monaco` (global non contractuel) | Spike S-1 ; repli : champ texte actuel conservé derrière la même interface `host/code-editor` ; demande amont d'une API de complétion par plugin |
| K-2 | Le core 6.9.12 ne reproduit pas les maps typées (raisons des correctifs Matchbox) | Spike S-2 ; repli : Matchbox dans un chargeur isolé, coût 62 Mo documenté |
| K-3 | Thread-safety du moteur FML et du validateur HAPI sous charge | Pool par contexte, tests de charge dès la phase 5 |
| K-4 | Migration v1 → v2 sur des canaux en production | Lecture v1 conservée indéfiniment ; migration idempotente ; outil hors ligne ; tests sur les sept exports |
| K-5 | FHIR Data Type change ses méthodes privées (FD-01) | Index construit une fois par contexte ; erreur explicite ; issue #29 relancée |
| K-6 | Le studio plein écran dépend du mécanisme `oie:code-view` pour récupérer *Message Trees* | Le studio a son propre arbre source ; l'événement n'est qu'un plus |
| K-7 | Charge de travail : 7 phases | Chaque phase livre une version utilisable ; l'ordre 1 → 2 → 3 donne le plus de valeur tôt ; 5 peut précéder 4 si l'FML est prioritaire |

## 5. Décisions à valider

1. **Un plugin, deux étapes** (recommandé) plutôt que deux plugins.
2. **Contextes FHIR au niveau serveur** (recommandé) ; les champs par étape
   restent lus pour la compatibilité.
3. **`mappings` reste une chaîne JSON** dans l'XML (recommandé, contrainte XStream).
4. **Map FML inline par défaut**, canonique du contexte en option (recommandé).
5. **Convention `aphm.ig.hl7v2`** comme premier modèle typé (recommandé, maps
   existantes) ; v2-to-FHIR officiel à vérifier s'il publie des modèles logiques.
6. Moteur FML : core 6.9.12 (recommandé) ou Matchbox, après S-2.
7. Ordre des phases 4 et 5 selon la priorité FML.
8. Langues : anglais par défaut, français fourni.
9. Moment de la migration de namespace `fr.kazepoy` (phase 7 recommandée).

## 6. Vérification d'ensemble

À chaque release : `npm test`, `npm run check`, `npm run test:e2e` (démo),
`python -m unittest`, `mvn package`, `check.py`, et un profil `rapide` de
`tools/load` dont le rapport est versionné. Le CHANGELOG nomme les constats
`R-xx` clos.

## 7. Limites de plateforme à enregistrer

| ID proposé | Constat | Contournement prévu | Demande amont |
|---|---|---|---|
| WA-16 | Pas de point d'extension pour *Generated Script* d'un type d'étape de plugin | `element.script` non énumérable (actuel) | `def.generateScript(element)` dans `registerStepType` |
| WA-17 | Pas d'API de complétion Monaco par plugin ; `window.monaco` global | Fournisseur limité aux éditeurs du plugin, isolé dans `host/code-editor` | `platform.registerCompletionProvider(language, provider, { scope })` |
| WA-18 | `createCodeEditor` ne couvre pas le champ d'une ligne | `updateOptions` après l'amélioration Monaco | option `singleLine` |
| WA-19 | Pas de réglage de plugin par canal | Contextes serveur nommés | `registerChannelSettingsPanel` |
| WA-20 | Hauteur contrainte de la zone d'édition d'une étape | Plein écran par overlay | option `fill` pour un type d'étape |

---

## Annexe A : routes cibles

Sous `/api/extensions/fhir-profile-mapper` (permissions entre parenthèses).

| Route | Rôle |
|---|---|
| `GET /settings`, `PUT /settings` (manage) | Contextes FHIR |
| `POST /contexts/{name}/reload` (manage) | Reconstruire l'index |
| `GET /catalog?context&kind&filter` (edit) | Profils, extensions, ValueSets, ConceptMaps, StructureMaps, modèles logiques |
| `GET /catalog/elements?context&url` (edit) | Arbre aplati d'une StructureDefinition |
| `GET /catalog/expand?context&valueSet&filter` (edit) | Codes d'un ValueSet |
| `GET /functions`, `POST /source` (edit) | Inchangés |
| `POST /script` (edit) | Inchangé, format v2 |
| `POST /test` (test) | `{ steps: [...], sample, trace }` : une ou toutes les étapes ; résultats, références, validation |
| `GET /translate` (edit) | Inchangé, par contexte |
| `GET /fml/maps?context` (edit) | StructureMaps du contexte |
| `POST /fml/check` (edit) | Erreurs positionnées d'une map |
| `POST /fml/scaffold` (edit) | Squelette de map |
| `POST /fml/test` (test) | Exécution d'une étape FML |

## Annexe B : étape v2 (extrait)

```json
{
  "__type": "org.oie.fhir.mapper.FhirProfileMapperStep",
  "formatVersion": 2,
  "name": "Patient",
  "action": "resource",
  "resourceType": "Patient",
  "context": "labo",
  "profileUrl": "http://example.org/fhir/oru2fhir/StructureDefinition/ExampleLabPatient",
  "profileVersion": "1.0.0",
  "validation": "inherit",
  "bundleTargets": "[{\"name\":\"labo-transaction\"},{\"name\":\"labo-document\"}]",
  "refName": "'patient'",
  "mappings": "[{\"id\":\"birth\",\"key\":\"Patient.birthDate\",\"type\":\"date\",\"expression\":\"msg['PID']['PID.7']['PID.7.1'].toString()\",\"path\":[[\"birthDate\"]],\"note\":\"PID-7, date seule\"}]",
  "samples": "[{\"id\":\"minimal\",\"name\":\"ORU minimal\",\"dataType\":\"HL7V2\",\"message\":\"MSH|^~\\\\&|...\",\"expected\":null}]"
}
```

## Annexe C : étape FML avec modèle typé (extrait)

```json
{
  "__type": "org.oie.fhir.fml.FhirFmlTransformStep",
  "formatVersion": 2,
  "name": "ORU vers Bundle",
  "context": "aphm-oru",
  "sourceModel": "hl7v2-logical",
  "sourceModelUrl": "http://fhir.ap-hm.fr/hl7v2/StructureDefinition/ORU__R01",
  "mapUrl": "http://fhir.ap-hm.fr/oru/StructureMap/ORUR01toBundle",
  "mapSource": "",
  "validation": "inherit"
}
```

Le message est lu par le Strict Parser (`Use Strict Parser`, `Strip Namespaces`),
puis `ORU_R01.PATIENT_RESULT/ORU_R01.PATIENT/PID/PID.3/CX.5` devient
`ORU__R01_PATIENT__RESULT.ORU__R01_PATIENT.PID.PID_3.CX_5.value` dans l'instance
du modèle logique.
