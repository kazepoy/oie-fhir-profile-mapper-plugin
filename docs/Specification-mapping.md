# Spécification du format de mapping existant

Ce document fixe le contrat repris du POC dans le plugin **0.1.0-SNAPSHOT**.
Il décrit ce qui est exécuté aujourd'hui. Le [guide du runtime](Runtime-mapping.md)
détaille les mécanismes et les fonctions ; le [guide graphique](Mappeur-graphique.md)
décrit leur édition. Les exemples ci-dessous sont exécutés dans les tests Java.

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
défaut), `requestUrl` et `ifNoneExist` (expressions JavaScript, vides par défaut).
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
fonctions OIE et les [fonctions du mapper](Runtime-mapping.md#8-fonctions-disponibles-dans-les-expressions)
complètent le contexte ; la portée de l'aperçu est précisée au §8.

| Résultat ou erreur | Comportement actuel |
|---|---|
| `undefined`, `null`, texte vide après trim | Aucune valeur écrite. |
| `false`, `0` | Valeurs conservées, selon le type cible. |
| Objet ou tableau JavaScript | Utilisé comme valeur complexe ; pas de conversion récursive selon un profil. |
| `TypeError` dans une valeur | Élément absent. |
| `TypeError` dans une condition | Condition fausse. |
| `TypeError` dans `each` | Zéro itération. |
| Autre erreur d'expression | Arrêt avec un message nommant la règle. |
| Conversion booléenne, entière ou décimale impossible | Arrêt, même si la validation FHIR est désactivée. |

Le traitement des `TypeError` est une **limite héritée**, pas une distinction
fiable entre donnée absente et erreur de programmation. Sa modification sera
un changement explicite du contrat, testé sur les exemples existants.

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

Pour un `document`, Composition en tête, identifiant et timestamp sont des
contraintes FHIR, vérifiées si la validation est active ; de même pour
MessageHeader en tête d'un `message`. Les contrôles internes de références et
de destinations ne remplacent pas la validation FHIR du Bundle.

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
`X-Requested-With: OpenAPI`. Types sources : `HL7V2` (défaut), `XML`, `JSON`, `RAW`.

`/script` renvoie `script` et `errors`. `/test` renvoie `output` (texte ou null),
`validationPerformed`, `issues` et `errors`. Un diagnostic actuel contient
`key` (ou null), `line` (numéro sérialisé en chaîne, ou null) et `message`.
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
une condition peuvent partager cette clé. Il n'existe pas encore d'identifiant
stable distinct ni de format de trace structuré public. Les commentaires
`//@ clé` du script et les messages du runtime servent aujourd'hui au rattachement
des erreurs. Les métadonnées internes de phase/durée ne constituent pas une API
de trace. Identifiants, corrélation et export de trace seront définis au jalon suivant.

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
/tmp/oie-mapper-schema-venv/bin/python tools/check_mapping.py docs/examples/mapping/patient.step.json docs/examples/mapping/laboratory.steps.json
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
