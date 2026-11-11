# Trace d'exécution des mappings

La trace existe sous deux formes, désactivées par défaut et de même format
d'événements :

- la trace d'un **test**, qui observe l'aperçu d'une seule étape exécuté par
  `POST /test`. Ses références restent simulées, comme pour un test sans trace ;
- la trace des **messages traités** par un channel déployé, qui suit les étapes
  tracées d'un connecteur, les références réelles, la finalisation des Bundles
  et la publication des résultats (voir [Trace des messages](#trace-des-messages-traités)).

## Activation et export

Dans l'onglet **Test**, cocher **Trace**, puis **Run**. La liste
**Execution trace** montre les phases et résultats ; **Go to rule** ouvre
l'élément concerné. **Export trace JSON** télécharge la trace de ce test.

**Include scalar values** autorise explicitement la capture des valeurs scalaires.
Cette option n'est pas mémorisée dans le channel ou dans le stockage local ;
désactiver la trace la remet à faux. **Max events** vaut 200 par défaut et doit
être un entier de 1 à 1000. Les réglages appartiennent au test, pas à l'étape.

Sur `/api/extensions/fhir-profile-mapper/test`, ajouter au corps JSON existant :

```json
{
  "trace": {"enabled": true, "captureValues": false, "maxEvents": 200}
}
```

Le corps reste envoyé en `text/plain` avec l'authentification OIE. Voir la
[requête complète](../demo/examples/trace-preview.json) et
[demo.http](../demo/examples/demo.http). Les options doivent être des booléens
et un entier JSON ; une configuration invalide est signalée dans `errors`.
Un `trace` absent, null ou avec `enabled: false` ne produit pas de champ `trace`
dans la réponse.

## Enveloppe JSON, version 1

La réponse habituelle conserve `output`, `errors`, `issues`, `validationPerformed`.
Quand la trace est demandée, elle ajoute `trace` :

| Champ | Sens |
|---|---|
| `formatVersion` | Version du format de trace, actuellement `1`. |
| `id` | Identifiant unique de ce test. |
| `scope` | `step-preview`. Aucun identifiant de message ou channel déployé n'est inventé. |
| `mappingHash` | SHA-256 de l'objet `step` reçu, resérialisé par `FhirJson`, avant les ajustements de prévisualisation. |
| `step` | Métadonnées reçues : `name`, `sequenceNumber`, `resourceType`, `action`. |
| `captureValues` | Autorisation de capturer les valeurs scalaires de cette exécution. |
| `maxEvents` | Nombre maximal d'événements retenus. |
| `maxCharacters` | Budget de 262 144 caractères de JSON d'événements collectés, hors enveloppe et mise en forme de l'export. |
| `truncated` | La limite d'événements ou le budget de caractères a empêché de conserver toute la trace. |
| `events` | Tableau dans l'ordre de collecte. |

L'empreinte identifie une représentation de l'étape, pas un identifiant stable
de règle ni une version sémantique du format. L'ordre des propriétés, les espaces
des chaînes JSON imbriquées ou les métadonnées OIE peuvent la faire changer.
Elle ne verrouille ni le message source, ni les profils, ni les fonctions du
serveur. Le couple `mappingHash`/`ruleIndex` relie un événement à la règle de
cette représentation précise. Lorsqu'une règle possède un `id`, l'événement
porte aussi `ruleId`, conservé entre révisions par l'éditeur et les agents.
Les anciens mappings sans id continuent d'utiliser `ruleIndex` et l'empreinte.

## Événements

Une opération de règle porte les mêmes métadonnées que les
[diagnostics](Specification-mapping.md#8-diagnostics-tests-dapi-et-traces) :
`key`, `ruleIndex`, `path`, `expression`, `operation`, si disponibles. Elle ajoute
`phase`, `status`, `durationNanos` et `iterations`. Les événements de phases
globales, comme `input` ou `validation`, ne désignent pas une règle.

`iterations` contient les indices actifs de l'extérieur vers l'intérieur,
par exemple `[{"ruleIndex":0,"index":1},{"ruleIndex":2,"index":3}]`.
Les indices commencent à zéro. Le chemin de règle conserve ses marqueurs
déclarés ; cette pile indique les items effectivement parcourus.

| Phase | Résultats observables |
|---|---|
| `input` | `success` après lecture de la source, ou `error`. |
| `value` | `success`, `absent` pour undefined/null, ou `error`. |
| `conversion` | `success`, `absent` avec raison `empty-or-missing`, ou `error`. |
| `translation` | `success`, `absent` si elle ne produit pas de valeur, ou `error`. |
| `condition` | `passed`, `skipped` avec raison `falsey`, ou `error`. |
| `iteration` | `ready` ou `empty`, avec le nombre d'items dans `count`, ou `error`. |
| `fixed` | `applied`, `merged`, ou `skipped` : conteneur absent, pattern incompatible ou valeur déjà présente. |
| `execution` | Résultat global `success` ou `error` de l'exécution de l'aperçu. |
| `validation` | `passed`, `failed`, `error`, ou `skipped` avec raison `disabled`. |

Les erreurs d'expression portent `errorType`, sans recopier leur message dans
la trace. Le diagnostic complet reste dans `errors`. Une trace partielle reste
disponible après une erreur ou un dépassement de temps ; une troncature peut
masquer les derniers événements, sans masquer les diagnostics de la réponse.

La durée d'itération mesure l'évaluation et la préparation de la liste ; elle
ne représente pas le coût total de son corps. Les phases globales englobent
d'autres opérations : ne pas additionner toutes les durées comme si elles
étaient indépendantes. La trace ajoute un coût d'observation et peut rapprocher
une exécution de la limite de dix secondes du test.

## Valeurs et limites

Sans `captureValues`, aucun champ `value` n'est enregistré. Les métadonnées
du mapping restent présentes, y compris les expressions et leurs constantes ;
cette option contrôle les valeurs d'exécution, pas l'anonymisation du code.

Avec autorisation, `value` contient un `type` et, pour les chaînes, nombres et
booléens, un `text` limité à 256 caractères avec son indicateur `truncated`.
Un décimal du runtime conserve son texte exact (`6.80`). Undefined et null
sont identifiés par leur type. Les objets et tableaux portent le type `object`,
le XML le type `xml` : aucun getter utilisateur ni conversion `toString()` d'un objet complexe
n'est déclenché pour produire cette capture. Les valeurs scalaires converties
depuis XML restent visibles dans l'événement de conversion.

La troncature de la trace ne tronque ni le résultat FHIR ni les diagnostics.
La collecte est propre au test et n'est conservée ni dans une map globale ni
dans les journaux serveur. Les opérations internes de `meta.profile` et
`meta.lastUpdated` sans règle déclarative ne sont pas tracées individuellement.
La résolution des références réelles, la finalisation de plusieurs Bundles et
la publication relèvent de la trace des messages traités.

## Trace des messages traités

### Activation et portée

Dans l'onglet **Properties** d'une étape, **Trace processed messages** inclut
cette étape dans la trace des messages traités ; **Include scalar values**
autorise la capture de ses valeurs scalaires. Ces réglages sont enregistrés
dans l'étape (`traceMessages`, `traceCaptureValues`, `false` par défaut) et
prennent effet au **redéploiement** du channel.

Le filtre est l'étape : seules les étapes tracées enregistrent leurs règles,
leurs références et leurs ajouts aux Bundles. Une étape non tracée entre deux
étapes tracées n'ajoute rien. La finalisation (contrôle des références,
validation et publication) est tracée dès qu'une étape du transformer l'est.
La capture des valeurs reste décidée étape par étape.

### Stockage et récupération

Chaque message traité reçoit **une trace par transformer de connecteur**, dans
son `connectorMap` : `fhirMapperTrace` pour le transformer, `fhirMapperResponseTrace`
pour le transformer de réponse. La trace est réécrite à la fin de chaque étape
tracée et de la finalisation : un message en erreur garde la trace partielle
jusqu'à l'échec. Aucun stockage propre au plugin n'est ajouté.

- Administration web : **Messages**, choisir le message, onglet **Mappings**,
  variable `fhirMapperTrace` de portée *Connector*.
- API OIE : `GET /api/channels/{channelId}/messages/{messageId}`, puis
  `connectorMessages/…/connectorMapContent`. Voir `connector_trace()` dans
  [check.py](../demo/examples/check.py).

Le mode de stockage des messages du channel doit conserver les maps : c'est le
cas du mode *Development* utilisé par la démo ; vérifier ce point pour un autre
mode. Sinon la trace est calculée mais pas conservée. Elle suit l'élagage des
messages du channel.

### Enveloppe

| Champ | Sens |
|---|---|
| `scope` | `channel-message`. |
| `channel` | `id`, `name` et `revision` du channel **déployé**. |
| `connector` | `metaDataId`, `name` et `transformer` (`transformer` ou `response`). |
| `messageId`, `serverId` | Identité du message OIE traité. |
| `steps` | Étapes tracées dans l'ordre : `sequenceNumber` (numérotation OIE, à partir de 0), `name`, `action`, `resourceType`, `bundleName`, `captureValues` et `scriptHash`. |
| `maxEvents`, `maxCharacters`, `truncated`, `events` | Comme pour le test ; 1 000 événements au plus par trace. |

**Versionnement.** `channel.revision` désigne la révision déployée ;
`scriptHash` est le SHA-256 du script compilé de l'étape, avant l'ajout de
l'instrumentation de trace. Il change dès qu'une règle, une option ou le runtime
change, et identifie donc exactement ce qui a été exécuté. Les `ruleId` stables
relient ensuite un événement à sa règle d'une révision à l'autre ; `ruleIndex`
reste valable pour le `scriptHash` donné.

### Événements supplémentaires

Les événements de règles sont ceux du test, avec le champ `step`
(`sequenceNumber` de l'étape). S'y ajoutent :

| Phase | Résultats et champs |
|---|---|
| `reference` | `resolved`, `reserved` (réservation anticipée) ou `missing` ; `name`, `index`, `fullUrl`, `bundles`, et la règle qui a appelé `fhirRef` (`key`, `ruleIndex`, `ruleId`). |
| `bundle-entry` | `added` : `bundles`, `resourceType`, `refName`, `fullUrl`, `reserved` si l'identité avait été réservée. |
| `step` | `success` ou `error` (`errorType`) : durée de l'étape tracée. |
| `references` | Finalisation, par Bundle : `passed` avec le nombre d'`entries`, ou `error`. |
| `validation` | Par résultat : `passed`, `failed`, `skipped` (`disabled`), ou `error`. |
| `publication` | `published` vers `outbound-message` ou `channelMap` (`variable`). Rien n'est publié si un résultat échoue. |

Une référence `missing` explique l'absence d'un élément : dans la démo, le
message ORU minimal n'a ni PV1 ni SPM, et la trace montre `encounter` et `spm-0`
manquants pour l'Observation.

## Vérification

`FhirMapperTraceTest` couvre les résultats avec/sans trace, les conditions et
absences, les indices imbriqués, les limites, les décimaux, les erreurs partielles,
la validation et l'absence d'inspection des getters. Le test d'arrêt d'une boucle
infinie vérifie aussi le retour d'une trace partielle.

`FhirMessageTraceTest` couvre la trace des messages : absence sans étape tracée,
résultat identique avec et sans trace, corrélation (channel, révision, message,
`scriptHash`), références réelles et indices d'itération, ajouts aux Bundles,
finalisation et publication, étapes non tracées, consentement aux valeurs par
étape, trace partielle sur erreur et troncature.

Le [script de rejeu](../demo/examples/check.py) vérifie ces propriétés sur l'API
OIE, avec l'exemple complet et la troncature à trois événements, puis la trace
du dernier message ORU du channel de démo, dont les étapes Patient et Observation
sont tracées. Les tests Node vérifient les libellés, les indices et la
sérialisation de l'export. Le téléchargement de l'export, l'activation dans
**Properties** et la lecture dans **Messages > Mappings** ont été vérifiés dans
le navigateur.
