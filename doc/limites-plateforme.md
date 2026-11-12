# Limites de la plateforme

Registre des manques et limites constatés dans les composants dont dépend FHIR
Profile Mapper : API publique insuffisante, comportements gênants, points non
documentés. Il sert à trois choses :

- justifier les choix de conception du mapper (ce qui est contourné, et comment) ;
- préparer les demandes aux projets amont ;
- savoir quoi revérifier à chaque montée de version.

## Versions concernées

| Composant | Version | Source |
|---|---|---|
| Open Integration Engine | 4.7.0 | Build officiel depuis le tag `v4.7.0` |
| FHIR Data Type | 1.5.1 | [matthydehoog/fhir-datatype-Eclipse-OIE](https://github.com/matthydehoog/fhir-datatype-Eclipse-OIE) |

## Tenir le registre

Une entrée par constat, avec un identifiant stable (`FD-` FHIR Data Type, `OIE-`
moteur). Une entrée n'est jamais renumérotée ; une entrée résolue reste, avec la
version qui la corrige.

| Champ | Contenu |
|---|---|
| Constat | Ce qui manque ou ne va pas, en une ou deux phrases |
| Preuve | Où on l'a vu : classe, comportement observé, test |
| Impact | Conséquence pour le mapper |
| Contournement | Ce que fait le mapper ; « aucun » si la fonction est abandonnée |
| Demande amont | Ce qu'il faudrait côté projet concerné, lien vers l'issue une fois ouverte |

**Statut** : *À vérifier* (supposé, pas encore prouvé), *Ouvert* (prouvé, rien de
fait), *Contourné* (le mapper vit avec), *Signalé* (issue ouverte), *Résolu* (version).
**Gravité** : *Bloquant* (empêche une fonction), *Gênant* (dégrade l'usage),
*Mineur* (inconfort, documentation).

## Synthèse

| ID | Composant | Constat | Gravité | Statut |
|---|---|---|---|---|
| [FD-01](#fd-01) | FHIR Data Type | Profils, snapshots et ConceptMaps sans API publique | Gênant | Signalé |
| [FD-02](#fd-02) | FHIR Data Type | Validateurs du catalogue jamais libérés sans minuteur | Gênant | Signalé |
| [FD-03](#fd-03) | FHIR Data Type | Parseur JSON à décimaux exacts non public | Mineur | Contourné |
| [WA-21](#wa-21) | Web Admin | Menu contextuel derrière le studio plein écran | Gênant | Contourné |

---

## Web Admin 1.3

### WA-21

**Menu contextuel derrière le studio plein écran.** · Gênant · Contourné

- **Constat.** `platform.ui.contextMenu(x, y, items)` crée un portail de menu
  à `z-index: 150`, sous l'overlay du studio (`900`). Le menu reçoit le focus
  clavier, mais l'arbre intercepte les clics.
- **Preuve.** Parcours Playwright du menu ouvert par Maj+F10 en plein écran ;
  styles calculés et interception des clics par les cellules de l'arbre.
- **Contournement.** Styles isolés dans `host/context-menu.js`, actifs seulement
  quand le mappeur est en plein écran : portail de menu placé à `960`. Ce style
  dépend du conteneur Radix de Web Admin ; à revérifier à sa mise à jour.
- **Demande amont.** Permettre aux plugins de rattacher les menus à leur overlay,
  ou exposer une politique commune de superposition. Aucune issue envoyée.

## FHIR Data Type 1.5.1

### FD-01

**Profils, snapshots et ConceptMaps sans API publique.** · Gênant · Signalé

- **Constat.** Le datatype charge les profils et les ConceptMaps des paquets
  configurés, mais n'expose ni la liste des profils, ni leur snapshot, ni la lecture
  des ConceptMaps ou une traduction locale.
- **Preuve.** `HapiFhirEngine` : `validationContext`, `specification` et
  `loadProfiles` sont privées ; `FhirEngine` ne publie que validation, conversions,
  `warmUp` et `retainValidators`.
- **Impact.** L'éditeur ne peut pas proposer l'arbre d'un profil ni les traductions
  sans lire ces méthodes privées. Toute version du datatype peut les changer.
- **Contournement.** `FhirCatalogBridge`, dans un JAR séparé chargé avec le chargeur
  HAPI du datatype, appelle ces trois méthodes par réflexion ; une méthode absente
  donne l'erreur « FHIR Data Type 1.5.1 compatibility: missing … ». Le catalogue
  n'est pas conservé entre deux requêtes. Voir
  [Intégration](Integration-FHIR-Data-Type.md#pont-de-catalogue).
- **Demande amont.** Petite API en lecture seule : profils chargés, snapshot par URL,
  lecture des ConceptMaps et `$translate` local. Le mainteneur y est ouvert et attend
  les signatures exactes ([#29](https://github.com/matthydehoog/fhir-datatype-Eclipse-OIE/issues/29)).
  Sa question reste à traiter : `loadProfiles` modifie-t-il le contexte de validation
  partagé avec les canaux ?

### FD-02

**Validateurs du catalogue jamais libérés sans minuteur.** · Gênant · Signalé

- **Constat.** Le datatype libère chaque minute les validateurs inactifs depuis 15
  minutes et non utilisés par un canal déployé. Ce minuteur n'est démarré qu'après
  une validation (`FhirSerializer`, `FhirTools.validate`) ou le préchauffage d'un
  canal. `FhirEngine.warmUp`, public, construit et met en cache un validateur sans
  le démarrer, et `FhirValidatorUsage.startPeriodicRelease` n'est pas public.
- **Preuve.** Bytecode 1.5.1 : `startPeriodicRelease` est appelée dans
  `FhirSerializer.validate`, le préchauffage de `FhirSerializer` et
  `FhirTools.validate` ; `HapiFhirEngine.warmUp` appelle seulement `validator(options)`.
- **Impact.** Le pont de catalogue appelle `warmUp` à chaque requête de l'éditeur
  (profils, StructureDefinition, ConceptMaps, traductions). Sur un serveur où aucun
  canal FHIR n'a tourné et aucune validation n'a eu lieu, ces validateurs restent en
  mémoire jusqu'au redémarrage. Avant ce contournement, le mapper appelait
  `startPeriodicRelease` par réflexion, ce que le mainteneur déconseille : la
  méthode appartient au cycle de vie des ressources du plugin.
- **Contournement.** Tant que le plugin est démarré, le mapper exécute chaque minute
  la même passe de libération, par les membres publics
  `FhirValidatorUsage.releaseNow(engine, FhirValidatorUsage.IDLE_MILLIS)`
  (`FhirDataTypeAdapter.startValidatorRelease`, thread démon *FHIR mapper validator
  release*, arrêté avec le plugin). La passe ne fait rien tant que le moteur HAPI
  n'est pas chargé (`FhirEngineLoader.loadedEngine()`). Quand le minuteur du
  datatype tourne aussi, la libération passe deux fois par minute, sans effet de
  bord. Test : `FhirValidatorReleaseTest`.
- **Demande amont.** Que le moteur démarre lui-même le minuteur quand il construit
  un validateur (dans `validator`, donc aussi pour `warmUp`). Le mapper supprimerait
  alors son minuteur. Proposé dans
  [#29](https://github.com/matthydehoog/fhir-datatype-Eclipse-OIE/issues/29).
- **À revérifier.** `releaseNow` et `IDLE_MILLIS` sont publics mais ne sont pas
  documentés comme API : les contrôler à chaque version du datatype.

### FD-03

**Parseur JSON à décimaux exacts non public.** · Mineur · Contourné

- **Constat.** Le datatype a un parseur JSON qui conserve l'écriture exacte des
  décimaux (`1.50`), mais la classe et ses méthodes sont privées au paquet.
- **Preuve.** `com.mirth.connect.plugins.datatypes.fhir.FhirJson` : classe `final`
  sans modificateur public, `parse` et `write` de même.
- **Impact.** Le mapper ne peut pas le réutiliser pour lire et écrire les ressources
  sans perdre la précision des décimaux.
- **Contournement.** Copie interne reprise du POC (`org.oie.fhir.mapper.util.FhirJson`,
  MPL 2.0), couverte par `FhirFacadeTest`.
- **Demande amont.** Aucune pour l'instant : la copie est petite et stable.
