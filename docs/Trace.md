# Trace d'un test de mapping

La trace observe l'**aperçu d'une seule étape** exécuté par `POST /test`.
Elle est désactivée par défaut. Elle n'est pas encore activable sur les messages
des channels déployés et n'assemble pas les étapes voisines. Les références
de cet aperçu restent simulées, comme pour un test sans trace.

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
la publication des destinations nécessitent la future trace des channels.

## Vérification

`FhirMapperTraceTest` couvre les résultats avec/sans trace, les conditions et
absences, les indices imbriqués, les limites, les décimaux, les erreurs partielles,
la validation et l'absence d'inspection des getters. Le test d'arrêt d'une boucle
infinie vérifie aussi le retour d'une trace partielle.

Le [script de rejeu](../demo/examples/check.py) vérifie ces propriétés sur l'API
OIE, avec l'exemple complet et la troncature à trois événements. Les tests Node
vérifient les libellés, les indices et la sérialisation de l'export. La
vérification visuelle du parcours de téléchargement reste distincte.
