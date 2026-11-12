# Transformation FML

L'étape **FHIR FML Transform** est un second transformeur, à côté du FHIR Profile
Mapper. Elle offre une autre façon de produire des ressources conformes à des
profils FHIR : elle exécute une map écrite en
[FHIR Mapping Language](https://hl7.org/fhir/R4/mapping-language.html) (FML,
ressource `StructureMap`) sur le message, présenté sous la forme d'un **modèle
logique générique OIE**, puis valide et publie le résultat.

Les maps sont des fichiers écrits ailleurs, dans un IG ou un dépôt. L'étape ne
fournit pas d'outil d'écriture de FML : elle désigne la map à exécuter et permet
de la tester sur un message.

| | FHIR Profile Mapper | FHIR FML Transform |
|---|---|---|
| Où vit le mapping | Dans l'étape : règles JSON saisies dans l'éditeur | Hors de l'étape : fichiers FML |
| Langage | Expressions JavaScript/E4X | FML, expressions FHIRPath |
| Source | `msg` OIE | Modèle logique `OieMessage` |
| Exécution | JavaScript généré + runtime embarqué | Moteur FML du core HL7, en Java |
| Pour qui | Intégrateur OIE, saisie guidée sur l'arbre du profil | Équipe qui maintient ses transformations en FML |

Les deux étapes partagent la validation de FHIR Data Type et les emplacements de
profils. Elles coexistent ; la démo les montre côte à côte (§6).

## 1. L'étape

Classe `org.oie.fhir.fml.FhirFmlTransformStep`, nom affiché **FHIR FML Transform**.

| Propriété | Contrat |
|---|---|
| `fhirVersion` | `R4` par défaut, `R4B`, `R5` : version des ressources produites. |
| `profiles` | Fichiers et répertoires du serveur, séparés par `;` : maps (`.fml`, `.map`, `StructureMap` JSON/XML), profils, ConceptMaps, packages `.tgz`. |
| `mapSource` | Texte FML de la map, écrit dans l'onglet **Map** et enregistré avec le canal. S'il n'est pas vide, il est exécuté à la place de `mapUrl` ; il peut importer les maps des emplacements. |
| `mapUrl` | Canonique d'une `StructureMap` des emplacements. Obligatoire si `mapSource` est vide. |
| `variable` | Vide : résultat principal ; sinon nom d'une variable de Channel Map. |
| `validateOutput` | `true` par défaut, y compris pour un export sans la propriété. |
| `contextVariables` | Noms de variables OIE (`$`) copiées dans `context.variable` du modèle, séparés par des virgules. |

À l'exécution, le script de l'étape :

1. lit le message : XML interne d'OIE (`msg.toXMLString()`, pour HL7 v2, délimité,
   XML…), JSON, ou texte ;
2. ajoute le contexte : `channelId`, `channelName`, `messageId`, `connectorName`,
   `receivedDate`, et les variables demandées ;
3. exécute la map ;
4. si `validateOutput`, valide le résultat avec FHIR Data Type, contre les profils
   de son `meta.profile` ou sa définition de base. Un résultat invalide arrête
   le message avec la liste des erreurs ;
5. publie comme le Profile Mapper : le modèle de sortie `tmp` (XML FHIR, texte ou
   objet JSON) s'il existe, sinon `msg`, ou la variable de Channel Map.

Une map inconnue, une erreur de la map ou une erreur de lecture du message
arrêtent aussi le message, avec le nom de l'étape et de la map.

Les maps sont lues une fois par combinaison de version FHIR et d'emplacements,
puis gardées en mémoire. Elles sont relues au déploiement d'un channel qui
contient une étape FML, à chaque déploiement global, et par le bouton **Reload**
de l'éditeur.

## 2. Modèle logique OIE

`http://oie.org/fhir/StructureDefinition/OieMessage`
([StructureDefinition](../src/main/resources/org/oie/fhir/fml/bridge/StructureDefinition-OieMessage.json),
canonique provisoire). Un **seul modèle** pour tous les types de messages : il
reflète l'arbre XML interne d'OIE, celui que voit E4X, ou l'arbre d'un JSON. La
map trouve un nœud par son **nom** ou sa **position**.

```text
OieMessage                       le message : son nœud racine et son contexte
├── context
│   ├── channelId, channelName, messageId, connectorName, receivedDate
│   ├── dataType                 HL7V2, DELIMITED, XML, JSON ou RAW, déduit du message
│   └── variable 0..*  { name, value }
├── name                         nœud racine : HL7Message, delimited, élément XML racine
├── value                        texte d'un message sans nœuds (RAW)
├── attribute 0..*  { name, value }
└── node 0..*                    nœuds enfants, récursifs
    ├── name        string       PID, PID.5, PID.5.1, élément XML, clé JSON
    ├── position    integer      nombre qui termine le nom (5 pour PID.5),
    │                            sinon rang parmi les frères, à partir de 1
    ├── occurrence  integer      rang parmi les frères de même nom, à partir de 1 :
    │                            répétition d'un champ, n-ième OBX
    ├── value       string       texte d'un nœud sans enfants
    ├── attribute 0..*
    └── node 0..*
```

Exemple : `PID|1||100001^^^EXAMPLE^PI||MARTIN^CLAIRE^ANNE^^Mme^^L` donne

| Nœud | `name` | `position` | `occurrence` | `value` |
|---|---|---|---|---|
| segment | `PID` | 2 (après MSH) | 1 | |
| champ | `PID.5` | 5 | 1 | |
| composant | `PID.5.1` | 1 | 1 | `MARTIN` |
| composant | `PID.5.2` | 2 | 1 | `CLAIRE` |

Particularités du XML HL7 v2 d'OIE, reprises telles quelles :

- les champs vides intermédiaires sont présents (`PID.2` sans `value`) ;
- un champ contient toujours ses composants : le sexe est `PID.8` → `PID.8.1` ;
- un sous-composant n'apparaît que s'il existe (`PID.3.4` porte directement
  `EXAMPLE`, sans `PID.3.4.1`) ;
- les segments sont à plat, sans groupes ; un OBX se distingue par son
  `occurrence`.

Pour un JSON, chaque propriété est un nœud (`name` = clé) ; un tableau donne un
nœud par élément, de même nom, avec son `occurrence`.

Le modèle de l'instance reçue par une map pour un message donné est visible dans
l'onglet Test de l'éditeur et par `POST /source` (§4).

### Exemple de map

Extrait de la [map de démo](../demo/fml/OruR01ToPatient.fml) :

```fml
map "http://example.org/fhir/oru2fhir/StructureMap/OruR01ToPatient" = "OruR01ToPatient"

uses "http://oie.org/fhir/StructureDefinition/OieMessage" alias OieMessage as source
uses "http://example.org/fhir/oru2fhir/StructureDefinition/ExampleLabPatient" alias Patient as target

group OruR01ToPatient(source src : OieMessage, target patient : Patient) {
  src.node as pid where name = 'PID' then {
    pid.node as xpn where name = 'PID.5' -> patient.name as name then {
      xpn.node as family where position = 1 then { family.value as v -> name.family = v "family"; } "family-name";
      xpn.node as given where position = 2 then { given.value as v -> name.given = v "given"; } "given-name";
      xpn.node as type where position = 7 and value = 'L' -> name.use = 'official' "use-official";
    } "name";
    pid.node as sex where name = 'PID.8' then {
      sex.node as code where position = 1 then {
        code.value as v -> patient.gender = translate(v, 'http://example.org/fhir/oru2fhir/ConceptMap/v2-0001-to-gender', 'code') "gender";
      } "sex-code";
    } "sex";
  } "pid";
}
```

Le groupe d'entrée a **un seul paramètre source** (le moteur n'en accepte pas
plusieurs) : le contexte est donc dans le modèle (`src.context`), pas dans un
second paramètre. `translate()` utilise les ConceptMaps des emplacements de
l'étape. Les maps peuvent en importer d'autres (`imports`), créer des ressources
(`create('Observation')`) et des types choix (`value = create('Quantity')`).

## 3. Architecture

### 3.1 Choix : le core HL7 de FHIR Data Type, sans Matchbox

FHIR Data Type 1.5.1 installe HAPI 8.12.1 et le core HL7 **6.9.12**, qui contient
le moteur FML (`StructureMapUtilities`). L'étape l'utilise directement, à
travers le contexte de validation du datatype : aucun JAR n'est ajouté.

[Matchbox](https://github.com/ahdis/matchbox) (matchbox-engine 4.1.21, utilisé par
le POC `aphm-fhir-svc-transform`) a été examiné et écarté :

- 62 Mo, dont ≈ 61 Mo de packages FHIR embarqués ;
- il **remplace des classes du core** sous le même nom (`StructureMapUtilities`,
  `elementmodel.Element`, `XmlParser`, `Property`, `BaseWorkerContext`…) et vise le
  core 6.10.4, quand OIE charge le 6.9.12 : il exigerait un chargeur isolé avec une
  seconde copie complète de HAPI et du core ;
- ses correctifs ne sont pas nécessaires ici : la lecture XML des modèles
  logiques est remplacée par la construction directe du modèle OIE, et les types
  choix fonctionnent avec le core 6.9.12 (vérifié par les tests) ;
- ses classes utiles sont petites et ont été réécrites (§3.2), sous licence MPL,
  d'après `TransformSupportServices` (Apache 2.0).

Enseignements repris du POC : vérifier l'existence de la map avant d'exécuter
(le moteur lève sinon une `NullPointerException`), et ne pas exécuter deux
transformations à la fois sur le même contexte (moteur non thread-safe).

### 3.2 Code

Le code est dans un package dédié, séparé du Profile Mapper :

| Package | Rôle | JAR |
|---|---|---|
| `org.oie.fhir.fml` | `FhirFmlTransformStep` (script de l'étape), `FmlFacade` (exécution et validation), `FmlServletInterface` | serveur |
| `org.oie.fhir.fml.integration` | `FmlBridgeAdapter` : charge le pont avec le chargeur de FHIR Data Type et l'appelle par réflexion, avec des `String` et des `Map` | serveur |
| `org.oie.fhir.fml.server` | `FmlServlet`, `FmlTester`, `FmlServicePlugin` (sérialisation, permissions), `FmlChannelPlugin` (relecture des maps au déploiement) | serveur |
| `org.oie.fhir.fml.bridge` | Le moteur, côté HAPI | `lib/fhir-fml-bridge.jar` |

Le pont (`org.oie.fhir.fml.bridge`) :

| Classe | Rôle |
|---|---|
| `FmlBridge` | Point d'entrée : `listMaps`, `source`, `transform`, `clearCaches`. Résout la cible depuis le paramètre cible du premier groupe (le `getTargetType` du core refuse une map qui déclare plusieurs cibles). |
| `FmlContext` | Chaîne de validation HAPI du datatype (spécification, profils) exposée en `IWorkerContext` R5 par `WorkerContextValidationSupportAdapter` ; lecture des maps (`.fml`, `.map`, `StructureMap`, packages) et des ConceptMaps. |
| `FmlResources` | Sert au moteur les `StructureMap` (pour les `imports`), les `ConceptMap` (pour `translate()`) et le modèle `OieMessage`, que `PrePopulatedValidationSupport` ne conserve pas. |
| `OieModelBuilder` | Construit directement l'arbre `Element` du modèle à partir du XML d'OIE ou du JSON. |
| `OieTransformerServices` | `ITransformerServices` : création des types et des ressources de la cible. |

La sortie est sérialisée par l'`elementmodel` du core : elle suit la forme de la
version des définitions (R4 pour la démo), dans l'ordre des définitions, avec
les décimaux tels quels (`5.10`).

## 4. API

Sous `/api/extensions/fhir-fml`, avec l'authentification OIE, `X-Requested-With:
OpenAPI` et des corps `text/plain` :

| Route | Permission | Rôle |
|---|---|---|
| `GET /maps?fhirVersion&profiles` | Edit FHIR FML transforms | `{"maps": [{url, name, title}], "errors": {fichier: message}}` |
| `POST /source` | Edit FHIR FML transforms | Instance `OieMessage` d'un message : `{"message", "dataType", "fhirVersion", "profiles"}` |
| `POST /check` | Edit FHIR FML transforms | Analyse une map écrite dans l'étape : `{"mapSource", "fhirVersion", "profiles"}` → `{"url", "name", "groups", "errors": [{line, column, message}]}` ; signale aussi les `uses` et `imports` absents des emplacements |
| `POST /reload` | Edit FHIR FML transforms | Oublie les maps chargées : elles sont relues au prochain appel |
| `POST /test` | Test FHIR FML transforms | `{"step", "message", "dataType"}` → `{"model", "output", "validationPerformed", "issues", "errors": [{phase, message}]}` |

Les phases d'erreur du test sont `configuration`, `input`, `transform` et
`validation`. Les permissions sont déclarées par le plugin et appliquées par un
plugin d'autorisation comme RBAC.

## 5. Éditeur

[legacy-editor.js](../webadmin/src/fml/legacy-editor.js), trois onglets :

- **Map** : la map de l'étape dans l'éditeur de code de Web Admin, en langage `fml`
  (coloration des mots-clés, chaînes, commentaires, noms de règles). **Check** envoie
  la map au serveur et souligne chaque erreur à sa ligne ; **Start from an example**
  pose un squelette ; **Clear** revient à la map choisie dans Properties ;

- **Properties** : version FHIR, destination du résultat, emplacements, map
  choisie parmi celles chargées (**Load maps**, **Reload**), variables de
  contexte, validation ;
- **Test** : message exemple (modèle entrant du transformeur par défaut), type de
  données, **Run test** ; affiche les erreurs, la validation, le résultat et le
  modèle OIE reçu par la map.

## 6. Démo

Le channel **ORU R01 vers Patient FHIR (FML)** (port 8087, `/patient/`) exécute
[OruR01ToPatient.fml](../demo/fml/OruR01ToPatient.fml), montée dans `/fhir-fml`,
avec les profils et ConceptMaps de `/fhir-ig`. Il produit le même Patient
`ExampleLabPatient` que le channel Profile Mapper du port 8082 ;
[check.py](../demo/examples/check.py) le vérifie.

## 7. Tests

| Test | Ce qu'il vérifie |
|---|---|
| [FmlBridgeTest](../src/test/java/org/oie/fhir/fml/bridge/FmlBridgeTest.java) | Liste des maps, modèle OIE (noms, positions, occurrences, contexte), Patient avec `translate()`, Bundle avec `imports` et type choix, map inconnue |
| [FhirFmlTransformStepTest](../src/test/java/org/oie/fhir/fml/FhirFmlTransformStepTest.java) | Script exécuté dans Rhino avec E4X, publication dans `msg` ou une variable, échec d'une map inconnue, test sur message exemple, map de démo valide contre `ExampleLabPatient`, sérialisation XML du channel |
| [fml-transform.test.mjs](../webadmin/test/fml-transform.test.mjs) | Enregistrement de l'étape dans l'administration web |

Les fixtures sont dans `src/test/resources/fml/` : deux maps et un ORU sérialisé
par OIE.

## 8. Limites et suites

- **Canonique du modèle** `http://oie.org/fhir/…` : provisoire, à fixer avec la
  migration de namespace prévue au [plan](Plan.md#phases-ultérieures).
- **Concurrence** : une transformation à la fois par contexte (mêmes version et
  emplacements). À mesurer avec les outils de charge ; un pool de contextes est
  possible si besoin.
- **Mémoire** : les contextes sont gardés jusqu'au prochain déploiement global
  ou rechargement.
- **Pas de trace par règle** ni de diagnostic relié à une règle FML : les erreurs
  portent le message du moteur, l'étape et la map.
- **Pas de Bundles partagés** avec le Profile Mapper : une map FML produit sa
  propre ressource, Bundle compris.
- `resolveReference` et `performSearch` ne sont pas pris en charge ; une
  ConceptMap absente des emplacements fait échouer `translate()`.
- Fonctions d'aide éventuelles (dates HL7 v2, accès par chemin positionnel) :
  non implémentées ; les maps utilisent FHIRPath (`substring`, `where`).
