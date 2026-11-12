# Format et exécution des mappings

Ce document fixe le contrat d'une étape FHIR Profile Mapper et la façon dont il
est exécuté. Le [guide de l'éditeur](Mappeur-graphique.md) décrit sa saisie. Les
exemples ci-dessous sont exécutés dans les tests Java.

```text
Profil FHIR + saisie dans l'éditeur
        │
        ▼
Propriétés de l'étape + mappings JSON
        │ FhirProfileMapperStep.getScript()
        ▼
JavaScript généré + runtime embarqué
        │ moteur JavaScript d'OIE
        ▼
Ressources et Bundles FHIR (validation selon validateOutput)
```

L'éditeur n'écrit pas de JavaScript : il enregistre une description déclarative.
[FhirProfileMapperStep.java](../src/main/java/org/oie/fhir/mapper/FhirProfileMapperStep.java)
la contrôle et la compile ; [profile-mapper-runtime.js](../src/main/resources/org/oie/fhir/mapper/profile-mapper-runtime.js)
fournit les conversions, itérations, traductions, l'assemblage des Bundles et la
publication ; [FhirMapperLifecycle.java](../src/main/java/org/oie/fhir/mapper/FhirMapperLifecycle.java)
repère au déploiement la dernière étape de chaque transformeur.

## 1. Unité du contrat et compatibilité

Le contrat est une **étape OIE**, pas un document autonome décrivant tout un
channel. Plusieurs étapes ordonnées d'un même transformeur peuvent construire
un résultat commun. Le channel conserve connecteurs, types de données, templates,
scripts et réglages de transport dans son export XML OIE.

Une étape est représentée par les propriétés de
`org.oie.fhir.mapper.FhirProfileMapperStep`. Dans l'administration web, `__type`
identifie cette classe. Dans l'export XML, le nom de l'élément identifie la classe.
`mappings` et `bundleTargets` sont des **chaînes contenant du JSON**, et non des
tableaux directement inclus dans l'objet de l'étape.

Il n'existe actuellement **aucun champ de version du format**. La version du
plugin et la révision de cette spécification identifient le contrat. Ne pas
inventer un `formatVersion` dans les étapes : sa migration et son interprétation
restent à définir avant une évolution incompatible. `fhirVersion` désigne
uniquement la version FHIR : `R4` par défaut, `R4B` ou `R5`. Les exemples de
référence sont vérifiés en R4 ; cela ne constitue pas un rejeu complet en R4B/R5.

La forme JSON ne dépend d'aucune classe du datatype tiers. Les services FHIR
passent par la [façade interne](Integration-FHIR-Data-Type.md).

## 2. Propriétés d'une étape

| Propriété | Contrat et valeur par défaut |
|---|---|
| `action` | Obligatoire dans les JSON rédigés : `resource` ou `createBundle`. |
| `resourceType` | Type construit, non vide. `Bundle` pour `createBundle`. |
| `fhirVersion` | `R4` par défaut ; doit correspondre à celle des Bundles cibles. |
| `profiles` | Chaîne vide par défaut ; chemins serveur de profils, répertoires ou packages, séparés par `;`. |
| `profileUrl` | URL canonique cible, vide par défaut. Le compilateur accepte le vide ; l'éditeur demande de choisir un profil. |
| `profileVersion` | Version du profil au moment de l'édition, vide par défaut. Sert à avertir d'un changement dans l'éditeur ; ne verrouille pas une version de package au runtime. |
| `addMetaProfile` | `true` : ajouter `profileUrl` dans `meta.profile` si non vide. |
| `validateOutput` | `true`, y compris pour les anciens exports XML où cette propriété manque. Voir §7. |
| `setLastUpdated` | `false` ; si activé, renseigner `meta.lastUpdated` à l'exécution. |
| `traceMessages` | `false` ; si activé, les messages traités par le channel déployé tracent cette étape (voir [Trace.md](Trace.md#trace-des-messages-traités)). |
| `traceCaptureValues` | `false` ; avec `traceMessages`, inclure les valeurs scalaires de cette étape dans la trace. |
| `samples` | Chaîne `"[]"` par défaut ; tableau d'exemples `{id, name, dataType, message, expected}` de l'éditeur et des outils. Sans effet sur le script généré. |
| `variable` | Vide : résultat principal ; sinon nom littéral d'une variable de Channel Map contenant le JSON résultat. Concerne une ressource seule ou une création de Bundle. |
| `bundleName` | Nom littéral, non vide et unique pour une création de Bundle ; vide sur une ressource. |
| `bundleType` | `transaction` par défaut ; également `batch`, `collection`, `document`, `message`. Défini par la création. |
| `bundleTargets` | Chaîne `"[]"` par défaut ; tableau des cibles de la ressource. Une création ne cible pas d'autres Bundles. |
| `refName` | Expression JavaScript donnant le nom de référence de la ressource ajoutée aux Bundles ; vide : pas de nom de référence. |
| `mappings` | Chaîne `"[]"` par défaut ; tableau ordonné de règles. |
| `terminologyServer` | URL du serveur terminologique ; vide ou `n/a` pour les ConceptMaps locales des profils. |
| `terminologyAuthorization` | Expression JavaScript de l'en-tête Authorization ; vide par défaut. |
| `terminologyCacheSeconds` | `300` par défaut ; ramené à zéro si négatif. |
| `terminologyTimeoutSeconds` | `10` par défaut ; une valeur non positive est remplacée par `10`. |

`name`, `sequenceNumber`, `enabled` et `__type` sont des métadonnées OIE.
Les propriétés booléennes de l'étape acceptent les booléens JSON ou les chaînes
`"true"`/`"false"` utilisées par les transports OIE. Les durées acceptent aussi
des entiers sérialisés en texte. Dans un nouveau JSON, préférer les types natifs.
Ces accommodements ne s'étendent pas aux booléens des règles (`keepSource`).

Une cible contient `name`, puis éventuellement `requestMethod` (`POST` par
défaut), `requestUrl` et `ifNoneExist` (expressions JavaScript, vides par défaut) :

```json
[
  {"name":"labo-transaction","requestMethod":"PUT","requestUrl":"'Patient?identifier=' + msg['PID']['PID.3'][0]['PID.3.1']"},
  {"name":"labo-document"}
]
```

Méthodes acceptées : `POST`, `PUT`, `PATCH`, `DELETE`, `GET`, `HEAD`. Les noms
des cibles doivent être uniques dans l'étape. Les anciennes propriétés communes
`output`, `bundleProfile`, `requestMethod`, `requestUrl` et `ifNoneExist` sont
refusées par `fromJson` : les requêtes appartiennent à chaque cible.

## 3. Règles, chemins et portées

Une règle possède `key` et `path`. Les anciens mappings peuvent employer
`element` à la place de `key` ; `key` non vide est prioritaire. `element` reste
également une métadonnée des règles de valeur. Le contrat de rédaction distingue
quatre formes, enregistrées séparément :

| Forme | Champs propres | Sens |
|---|---|---|
| Valeur | `expression`, `type` facultatif, `translate` facultatif | Évaluer, traduire éventuellement, convertir, puis affecter. |
| Itération | `each`, `variable` | Une exécution des règles descendantes par item. |
| Condition | `condition` | Exécuter les règles descendantes si l'expression est vraie. |
| Constante/pattern | `fixed`, `when` facultatif | Compléter les conteneurs construits sans écraser une valeur mappée. |

```json
[
  {"key":"Patient.birthDate","type":"date","expression":"msg['PID']['PID.7']['PID.7.1'].toString()","path":[["birthDate"]]},
  {"key":"Patient.name","each":"msg['PID']['PID.5']","variable":"n","path":[["name","#0"]]},
  {"key":"Patient.name","condition":"n['PID.5.7'].toString() == 'L'","path":[["name","#0"]]},
  {"key":"Patient.name.family","type":"string","expression":"n['PID.5.1']['PID.5.1.1'].toString()","path":[["name","#0"],["family"]]},
  {"key":"Patient.identifier:ipp.system","fixed":"urn:ipp","when":1,"path":[["identifier","ipp#0"],["system"]]}
]
```

`id` est un identifiant de règle optionnel, unique dans l'étape, composé de
1 à 128 caractères (`A-Z`, `a-z`, chiffres, `_`, `.`, `:`, `-`, avec une lettre
ou un chiffre en premier). Il est conservé pendant les modifications et renvoyé
comme `ruleId` dans les diagnostics et traces. Les anciens exports sans id
restent acceptés. Voir le [parcours éditeur et IA](Assistants-et-IA.md).

Chaque segment de `path` est `[nom]` pour une propriété simple ou
`[nom, instance]` pour une entrée répétée. `#0`, `#1` et `ipp#0` sont des marqueurs
d'instance/slice, jamais des propriétés du JSON FHIR. Le nom est le nom FHIR
concret : par exemple `valueQuantity`, pas `value[x]`. Le chemin n'est pas une
expression JavaScript et n'est pas automatiquement déduit de `key`.

`path: []` est réservé à une condition ou une itération de la ressource entière.
Une itération de ressource exige un Bundle cible et est interdite sur la
création de Bundle. Une itération d'élément doit se terminer par un segment à
deux composants. Dans une itération, le marqueur de ce segment est complété par
l'indice courant pour distinguer les entrées.

Le compilateur rattache les règles à la portée la plus proche dont la clé est
identique ou est un préfixe suivi de `.`. Les itérations peuvent s'imbriquer.
Une itération et une condition du même élément s'écrivent en deux règles ; la
condition est évaluée pour chaque item. Les valeurs sont émises dans l'ordre
compilé à partir du tableau ; les constantes sont appliquées à la fin de leur
portée. Un tableau arbitrairement réordonné n'est donc pas forcément équivalent.

`variable` doit être un identifiant JavaScript autorisé, hors mots réservés,
`msg`, `tmp` et préfixe `__`. Son indice est accessible sous `<variable>Index`.
Les corps imbriqués disposent des variables des itérations englobantes.
`when`, entier positif ou nul, indique combien de segments doivent déjà
exister avant de compléter une constante ; défaut `0`. Il doit rester inférieur
ou égal à la longueur du chemin. Les patterns objets/tableaux enrichissent les
valeurs compatibles ; les conteneurs restés vides sont éliminés à la finition.

## 4. Expressions, absence et conversions

Les expressions utilisent le JavaScript Rhino d'OIE, avec E4X pour les messages
XML/HL7 v2. `msg` est la source vue par la **première étape FHIR du transformeur**,
après les éventuelles étapes précédentes de nettoyage. Les étapes suivantes
retrouvent cette source même après une publication FHIR. Les variables et
fonctions OIE et les [fonctions du mapper](#fonctions-des-expressions)
complètent le contexte ; la portée de l'aperçu est précisée au §8.

| Résultat ou erreur | Comportement actuel |
|---|---|
| `undefined`, `null`, texte vide après trim | Aucune valeur écrite. |
| `false`, `0` | Valeurs conservées, selon le type cible. |
| Objet ou tableau JavaScript | Utilisé comme valeur complexe ; pas de conversion récursive selon un profil. |
| `TypeError` dans une valeur | Arrêt avec diagnostic de phase `value`. |
| `TypeError` dans une condition | Arrêt avec diagnostic de phase `condition`. |
| `TypeError` dans `each` | Arrêt avec diagnostic de phase `iteration`. |
| Autre erreur d'expression | Arrêt avec un message nommant la règle. |
| Conversion booléenne, entière ou décimale impossible | Arrêt, même si la validation FHIR est désactivée. |

Une expression qui **renvoie** une absence n'est pas une expression qui **lève**
une exception. Toutes les exceptions d'expression arrêtent le traitement,
indépendamment de `validateOutput`. Le diagnostic contient `errorType: "TypeError"`
pour cette classe d'erreur, ainsi que la règle et l'expression concernées.

### Migration des accès facultatifs

Ce comportement remplace volontairement celui du POC et des premières révisions
du plugin : les `TypeError` y étaient interprétées comme une valeur absente,
une condition fausse ou zéro itération. Les exports restent lisibles sans
changement de structure JSON, mais les expressions qui dépendaient de ce
comportement doivent rendre leurs accès facultatifs explicites. Il n'y a pas
de mode de compatibilité qui masquerait de nouveau ces erreurs.

Avec une source JSON, remplacer un accès non gardé comme `msg.optional.gender`
par `msg.optional == null ? undefined : msg.optional.gender` ; la forme
`msg.optional && msg.optional.gender` convient aussi si `optional` est un objet.
Pour une liste facultative, renvoyer explicitement `undefined`, `null` ou `[]`
quand elle manque. Une condition absente évaluée à `undefined` ou `null` reste
fausse, sans lever d'exception.

Avec E4X, contrôler la longueur avant d'accéder à une répétition :
`msg['PID']['PID.3'].length() > 2 ? msg['PID']['PID.3'][2]['PID.3.1'].toString() : undefined`.
De même, `fhirFind` peut renvoyer `undefined` : vérifier le résultat avant de
lire ses propriétés. Éviter les replis génériques qui transformeraient aussi
des valeurs utiles comme `0` ou `false` en absence.

### Conversions

Les scalaires textuels sont trimés. Les booléens reconnaissent sans tenir compte
de la casse `true/t/y/yes/1` et `false/f/n/no/0`. Les types entiers vérifient une
syntaxe entière, puis utilisent les nombres JavaScript : ni les bornes FHIR ni
la précision des grands entiers ne sont garanties par cette conversion seule.

Pour un décimal exact, fournir une chaîne comme `"6.80"`. Le runtime conserve
sa précision et ses zéros finaux dans le JSON sérialisé. Un nombre déjà calculé
en JavaScript, ou un template JSON natif en sortie, subit les limites de cette
représentation numérique.

Les dates HL7 v2 sont converties en FHIR en conservant leur précision disponible.
Une heure sans fuseau utilise le fuseau du serveur à la date concernée ; fournir
un fuseau explicite pour un résultat indépendant de l'environnement. Un `instant`
HL7 sans heure provoque une erreur. Les chaînes ne correspondant pas à la syntaxe
HL7 sont conservées : la conversion n'est pas une validation complète du
calendrier ni de la syntaxe FHIR. Les contraintes détaillées dépendent de la
validation FHIR optionnelle.

Une traduction précise `conceptMap`, éventuellement les systèmes `source` et
`target`, puis `unmapped` : `none` (défaut), `source`, `fixed`, `function` ou
`error`. `fixed` et `function` exigent `value` non vide. Pour `function`, cette
expression dispose de `code` et `system`. `keepSource` est un booléen, faux par
défaut. La traduction précède la conversion vers le type cible.

## 5. Identités, références et Bundles

Une création doit précéder les étapes qui ciblent son nom, dans le même
transformeur. Une ressource seule ne peut pas itérer à la racine. Une ressource
multi-cibles est construite une seule fois par item, puis copiée dans les Bundles
avec le même `fullUrl` en `urn:uuid:` ; les corps ne partagent pas d'objet mutable.

Le nom obtenu par `refName` et son indice identifient une entrée pour
`fhirRef(name, index, reserve)` et `fhirRefs(name)`. L'indice par défaut vaut zéro.
Sans réservation, une référence inconnue donne `undefined`. Avec `reserve=true`,
une identité est réservée et doit être remplie avant publication. Deux identités
différentes pour le même nom/indice dans les cibles sélectionnées sont une erreur.
Une référence locale `urn:uuid:` doit exister dans **chaque Bundle qui la contient**.
Le runtime n'ajoute pas implicitement les ressources référencées aux autres cibles.

Les requêtes ne sont évaluées que pour `transaction` et `batch`. Si l'URL évaluée
est vide : `POST` utilise le type de ressource ; les autres méthodes utilisent
`resourceType/id` si un id existe, sinon échouent. Les autres types de Bundle
ne produisent pas de requête d'entrée. Le mapping d'un Bundle ne transporte
aucun résultat vers un serveur FHIR : les destinations OIE assurent ce transport.

| Type | Règles prises en compte |
|---|---|
| `transaction`, `batch` | Requête de chaque entrée : méthode, URL, création conditionnelle éventuelle. |
| `collection` | Aucune requête. |
| `document` | Aucune requête ; Composition en tête, identifiant et timestamp (contraintes FHIR). |
| `message` | Aucune requête ; MessageHeader en tête. |

La requête est une fonction différée : pour un document, la méthode et l'URL
éventuellement enregistrées ne sont pas évaluées. Les contraintes FHIR de chaque
type sont vérifiées par la validation, si elle est active ; les contrôles internes
de références et de destinations ne la remplacent pas.

### Fonctions des expressions

| Fonction | Contrat |
|---|---|
| `fhirUuid()` | UUID aléatoire sans préfixe `urn:uuid:`. |
| `fhirRef(name, index, reserve)` | `fullUrl` d'une entrée nommée des Bundles sélectionnés ; indice 0 par défaut ; `undefined` si absente. |
| `fhirRefs(name)` | Références connues sous ce nom ; ne prédit pas une itération future. |
| `fhirFind(list, fn)` | Premier élément satisfaisant `fn(item, index)`, ou `undefined`. |
| `fhirFilter(list, fn)` | Éléments satisfaisant cette condition. |
| `hl7Following(seg, name, stop)` | Segments suivants du type demandé, jusqu'au prochain segment `stop`. |
| `hl7Preceding(seg, name, stop)` | Segment précédent le plus proche du type demandé. |
| `hl7Ordinal(seg)` | Indice du segment parmi ceux de même type, à partir de 0. |

Pour une référence anticipée, `fhirRef('patient', 0, true)` réserve l'URN dans les
cibles sélectionnées ; une entrée `patient` doit la remplir avant publication,
sinon le Bundle échoue avec le nom et l'indice. Une construction partagée reprend
une réservation existante : la même identité sert dans tous les Bundles.

Les fonctions `hl7…` attendent un segment du XML HL7 v2 plat d'OIE ; la limite par
défaut est un segment du type de départ, `[]` la retire. Le catalogue complet,
avec signatures et exemples, est servi par `GET /functions` ([assistants](Assistants-et-IA.md)).
Les méthodes Java `FhirFacade.validate`, `toJson`, `toXml`, `translate`, `lookup`
et `validateCode` restent accessibles via `Packages.org.oie.fhir.mapper.fhir.FhirFacade`.

## 6. Ordre d'exécution et publication

L'état d'assemblage est propre au message et au transformeur : source,
destination et réponse ont des contextes distincts. Au déploiement, le plugin
repère la dernière étape FHIR activée de chaque transformeur. Après celle-ci :

1. Vérifier les réservations et références locales des Bundles.
2. Vérifier l'unicité des destinations de résultat, y compris le résultat principal.
3. Valider les résultats pour lesquels `validateOutput` est actif.
4. Publier les résultats seulement si tous les contrôles ont réussi.

Un `variable` vide désigne l'unique résultat principal, publié dans `tmp` si un
template de sortie existe, sinon dans `msg`. Une variable nommée reçoit le JSON
texte dans la Channel Map. Si tous les résultats sont nommés, la source reste
inchangée. Cette publication groupée ne rend pas transactionnels les effets de
bord que des expressions pourraient elles-mêmes produire dans les maps OIE.

Une étape JavaScript placée après la dernière étape FHIR ne participe pas à
l'assemblage. Les étapes FHIR à actions explicites imbriquées dans un Iterator
OIE sont refusées : utiliser les itérations du mapper.

### Code généré

Chaque étape est une fonction immédiatement exécutée (forme simplifiée) :

```javascript
(function () {
    var __fhir = /* runtime embarqué */;
    __fhir.options = /* version, profils, terminologie */;
    __fhir.traceStep(null);              // ou les métadonnées de l'étape tracée
    __fhir.selectBundles(['labo-transaction', 'labo-document']);
    var __out = (function (msg) {         // msg : la source conservée du transformeur
        var __res = {resourceType: 'Patient'};
        __fhir.set(__res, [['birthDate']], 'date', function () {
            return msg['PID']['PID.7']['PID.7.1'].toString();
        }, 'Patient.birthDate', null);
        __fhir.addToBundles('patient', __fhir.finish(__res), [/* requêtes différées */]);
    })(__fhir.source(msg));
    // Après la dernière étape FHIR du transformeur : __fhir.completeBundles().
})();
```

Chaque règle est précédée d'un marqueur `//~fhir` portant ses métadonnées de
diagnostic. Avec `traceMessages`, le corps est entouré d'un `try`/`finally` qui
termine l'étape dans la trace ; le `scriptHash` est calculé sur le script sans
cette instrumentation ([Trace](Trace.md#trace-des-messages-traités)).

## 7. Validation et dépendances

Sur une ressource seule, `validateOutput` contrôle sa validation finale. Sur
une création de Bundle, il contrôle celle du Bundle assemblé, avec ses ressources.
L'option d'une ressource ajoutée à un Bundle contrôle son aperçu isolé ; le
réglage de chaque Bundle décide de sa validation finale. Une validation échouée
empêche la publication des autres résultats.

`false` ne désactive ni les contrôles du mapping, ni les conversions, ni les
contrôles de références et de destinations. La validation de sortie du datatype
OIE, si configurée, reste indépendante et peut entraîner une seconde validation.

Les profils, ConceptMaps et packages doivent être accessibles sur le serveur
via `profiles`. Le format actuel ne contient ni manifeste de dépendances ni
verrouillage des versions des packages. Conserver les fichiers de référence
avec le déploiement ; l'IG de démonstration est dans `demo/ig`.

## 8. Diagnostics, tests d'API et traces

Les routes existantes sont préfixées par `/api/extensions/fhir-profile-mapper`.
`POST /script` reçoit une étape JSON ; `POST /test` reçoit
`{"step": {...}, "message": "...", "dataType": "JSON"}`. Le corps HTTP est
`text/plain`, la réponse `application/json`, avec l'authentification OIE et
`X-Requested-With: OpenAPI`. `/test` exige la permission d'extension **Test FHIR
mapper steps**, car il exécute le code de l'étape sur le serveur ; les autres routes
exigent **Edit FHIR mappings** ([permissions](Mappeur-graphique.md#9-contrôles-et-échanges-serveur)). Types sources : `HL7V2` (défaut), `XML`, `JSON`, `RAW`.

`/script` renvoie `script` et `errors`. `/test` renvoie `output` (texte ou null),
`validationPerformed`, `issues` et `errors`. Un diagnostic conserve `key` (ou
null), `line` (numéro du script généré sérialisé en chaîne, ou null) et `message`.
Il contient aussi :

- `step` : nom, numéro de séquence, type de ressource et action de l'étape ;
- `phase` : `configuration`, `syntax`, `input`, `execution`, `timeout`, `validation`,
  ou la phase précise d'une règle : `value`, `condition`, `iteration`,
  `translation`, `conversion` ;
- `operation` : forme de la règle (`value`, `condition`, `iteration`, `fixed`), si connue,
  indépendamment de la phase d'échec ;
- `errorType` : nom de l'exception JavaScript d'origine, s'il est disponible
  (`TypeError`, `ReferenceError`, `Error`, etc.) ;
- `ruleIndex` : position de la règle dans le tableau `mappings`, à partir de zéro ;
- `ruleId` : identifiant stable `id` de la règle, s'il existe ;
- `path` : chemin déclaré par la règle, avec ses marqueurs d'instance ;
- `expression` : texte de l'expression de cette règle.

Les champs indisponibles valent `null`. Les erreurs de configuration ou hors
d'une règle ne sont pas attribuées à la dernière règle rencontrée. La ligne
peut désigner le code commun du runtime ; `ruleIndex` et `path` permettent alors
de retrouver la règle. `ruleIndex` n'est pas stable après réordonnancement du
tableau, et `path` ne donne pas les indices concrets des itérations en cours.
Pour une erreur de traduction, `expression` désigne la valeur source de la règle ;
les paramètres et l'éventuel repli sont à lire dans son objet `translate`.

L'éditeur affiche ces détails et propose « Go to rule » pour ouvrir l'élément
concerné et viser le champ de valeur, condition, itération ou traduction.

Une issue de validation contient `severity`, `location` et `message`.
Un résultat sans issue ne signifie pas qu'une validation a été effectuée :
consulter `validationPerformed`.

L'aperçu exécute **une seule étape**, sans assembler les étapes voisines ni
publier leurs sorties. Les références sont simulées et les maps de travail sont
initialement vides ; les fonctions et la configuration serveur sont chargées
par l'environnement de test. Une itération de ressource donne une collection
de prévisualisation. La limite d'exécution JavaScript est de dix secondes ; elle
ne constitue pas une limite globale des appels FHIR/Java. Tester un channel
déployé reste nécessaire pour vérifier références, transports et contexte réel.

`key` identifie une position d'arbre, pas une règle unique : une itération et
une condition peuvent partager cette clé. `ruleIndex` les distingue dans cette
révision du mapping. Le champ optionnel `id` identifie la règle entre révisions.
Les marqueurs `//~fhir` relient les erreurs de
syntaxe à la règle dans le script généré ; le runtime attache les métadonnées
de la règle aux erreurs d'expression, de traduction et de conversion.
L'API de test accepte désormais une option `trace` et renvoie les événements
structurés à la demande ; son contrat et son export sont décrits dans
[Trace.md](Trace.md). Les messages traités par un channel déployé sont tracés
étape par étape avec `traceMessages`, dans le `connectorMap` de chaque message.
Les API `GET /functions` (catalogue) et `POST /source` (sérialisation du message
exemple par OIE) complètent l'assistance ; voir [Assistants-et-IA.md](Assistants-et-IA.md).

## 9. Schéma et vérification reproductible

Le [schéma JSON](schemas/mapping-step.schema.json) décrit la forme de rédaction
du contrat existant. Il utilise [JSON Schema 2020-12](https://json-schema.org/draft/2020-12/json-schema-validation).
Les mots-clés `contentSchema` annotent le JSON contenu dans les chaînes ; ils
ne suffisent pas à le valider automatiquement. Le
[contrôleur hors ligne](../tools/check_mapping.py) décode donc explicitement ces
champs et valide aussi leur contenu avec `jsonschema`.

Ce contrôle n'est pas branché dans le runtime ni dans l'éditeur. Il accepte
les métadonnées OIE supplémentaires au niveau de l'étape, mais refuse les
propriétés inconnues des règles et des cibles pour signaler les fautes de frappe.
Il impose des formes canoniques là où le compilateur historique peut tolérer,
ignorer ou convertir des entrées ambiguës. Les valeurs par défaut du schéma
sont documentaires : aucun fichier n'est réécrit.

Le schéma ne vérifie pas la syntaxe des expressions, les mots réservés des
variables, les préfixes de clés, les bornes de `when`, les noms de cibles uniques,
leur ordre de déclaration, les versions FHIR communes, les références ou la
conformité aux profils. Ces contraintes nécessitent une vérification sémantique ;
la compilation, le déploiement et l'exécution en couvrent une partie, sans être
exhaustifs (par exemple pour les bornes de `when`). Un contrôle de structure
réussi ne suffit donc pas à certifier un mapping exécutable ou un résultat FHIR valide.

Depuis la racine du dépôt, Python 3.9 ou ultérieur :

```sh
python3 -m venv /tmp/oie-mapper-schema-venv
/tmp/oie-mapper-schema-venv/bin/pip install -r tools/requirements.txt
/tmp/oie-mapper-schema-venv/bin/python tools/check_mapping.py doc/examples/mapping/patient.step.json doc/examples/mapping/laboratory.steps.json
/tmp/oie-mapper-schema-venv/bin/python -m unittest discover -s tools/tests -v
mvn -Dtest=MappingSpecificationTest test
```

Les fichiers `*.steps.json` sont de simples listes ordonnées d'étapes pour
lecture et tests ; ce n'est pas un nouvel import de channel ni le corps de `/test`.

| Exemple | Entrée et résultat attendu |
|---|---|
| [Patient](examples/mapping/patient.step.json) | Avec [source.json](examples/mapping/source.json) : Patient `patient-42`, famille Durand, naissance `1985-04-12`. |
| [Laboratoire](examples/mapping/laboratory.steps.json) | Même source : transaction de trois entrées, un Patient et deux Observations le référençant ; décimaux JSON `6.80` et `4.10`. |
| [Chemin invalide](examples/mapping/invalid-path.step.json) | Échec du contrôle de structure et de compilation : segment à trois composants dans `Patient.active`. |
| [Référence non résolue](examples/mapping/unresolved-reference.steps.json) | Structure acceptée ; échec à la finalisation sur `missing-patient[0]`, même sans validation FHIR. Aucune variable `result` publiée. |

Les tests de schéma contrôlent aussi les étapes des six exports XML de la démo.
Le [rejeu HTTP](Demo.md#rejouer-les-exemples) complète ces contrôles dans OIE.
