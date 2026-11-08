# FHIR Profile Mapper : mappings, code généré et exécution

Ce document décrit l'implémentation du [contrat de mapping](Specification-mapping.md). Le fonctionnement de l'interface qui prépare ce contrat est décrit dans [Le mapper graphique](Mappeur-graphique.md).

## 1. Les deux étages

```text
Profil FHIR + saisie dans l'éditeur graphique
                    │
                    ▼
Configuration de step + mappings JSON
                    │ FhirProfileMapperStep.getScript()
                    ▼
JavaScript généré + runtime embarqué
                    │ moteur JavaScript d'OIE
                    ▼
Ressources et Bundles FHIR (validation selon validateOutput)
```

L'éditeur graphique ne génère pas directement le JavaScript. Il enregistre une description déclarative. La classe Java `FhirProfileMapperStep` compile cette description, et `profile-mapper-runtime.js` fournit les opérations communes d'exécution.

Sources principales :

- [FhirProfileMapperStep.java](../src/main/java/org/oie/fhir/mapper/FhirProfileMapperStep.java) : propriétés, contrôles de configuration et compilation.
- [profile-mapper-runtime.js](../src/main/resources/org/oie/fhir/mapper/profile-mapper-runtime.js) : conversions, conditions, itérations, traductions, assemblage et publication.
- [FhirMapperLifecycle.java](../src/main/java/org/oie/fhir/mapper/FhirMapperLifecycle.java) : repérage de la dernière étape explicite de chaque transformeur au déploiement.
- [FhirMapperChannelPlugin.java](../src/main/java/org/oie/fhir/mapper/server/FhirMapperChannelPlugin.java) : intégration de ce repérage au cycle de déploiement OIE.

## 2. Configuration d'une étape

Une étape garde le type OIE `org.oie.fhir.mapper.FhirProfileMapperStep`. Les deux actions explicites utilisent le même compilateur.

| Propriété | Sens |
|---|---|
| `action` | `createBundle` ou `resource`, explicitement enregistrée. |
| `resourceType` | Type FHIR construit, par exemple `Patient`. Doit être `Bundle` pour `createBundle`. |
| `fhirVersion` | `R4`, `R4B` ou `R5`. Une ressource ajoutée à un Bundle doit utiliser sa version. |
| `profiles` | Fichiers et répertoires de profils/packages sur le serveur, séparés par `;`. |
| `profileUrl` | URL canonique du profil cible. |
| `addMetaProfile` | Ajoute cette URL dans `meta.profile` de la ressource construite. |
| `validateOutput` | Validation FHIR du résultat, activée par défaut. Sur une ressource ajoutée à des Bundles, la validation finale dépend de chaque Bundle ; l'option contrôle son aperçu isolé. |
| `setLastUpdated` | Renseigne `meta.lastUpdated` à l'exécution. |
| `bundleName` | Nom interne **littéral** du Bundle créé, réservé à `createBundle`. |
| `bundleTargets` | Chaîne contenant un tableau JSON des cibles d’une ressource, vide pour une ressource seule. Chaque cible porte son nom et sa requête éventuelle. |
| `bundleType` | Type du conteneur, défini par son étape de création. |
| `variable` | Destination du résultat : vide pour le message sortant, sinon nom d'une variable de Channel Map. Défini sur la création du Bundle ou sur une ressource seule. |
| `refName` | Expression JavaScript donnant le nom de référence d'une ressource ajoutée, par exemple `'patient'` ou `'obs-' + obxIndex`. |
| `bundleTargets[].requestMethod`, `requestUrl`, `ifNoneExist` | Requête propre à une cible transaction/batch. L’URL et la condition sont des expressions JavaScript. |
| `terminologyServer`, `terminologyAuthorization`, `terminologyCacheSeconds`, `terminologyTimeoutSeconds` | Paramètres des traductions ConceptMap pendant le mapping. |
| `mappings` | Tableau JSON de règles, enregistré comme une chaîne dans la propriété de l'étape. |

Le profil du Bundle est son `profileUrl`, sans second champ de profil. Le format utilise uniquement les actions et cibles explicites décrites ci-dessus.

Le contenu du champ `bundleTargets` est par exemple :

```json
[
  {"name":"labo-transaction","requestMethod":"PUT","requestUrl":"'Patient?identifier=' + msg['PID']['PID.3'][0]['PID.3.1']","ifNoneExist":""},
  {"name":"labo-document"}
]
```

Ce tableau est sérialisé comme une chaîne JSON dans la propriété du step, comme `mappings`. Une même cible ne peut pas être sélectionnée deux fois. Les paramètres de requête ne sont pas des propriétés communes de l’étape : deux cibles transaction peuvent employer des méthodes/URL différentes.

## 3. Format des mappings

Une règle décrit un élément et son chemin de construction, sans être elle-même du JavaScript exécutable : seule la valeur des expressions l'est.

```json
[
  {
    "key": "Patient.birthDate",
    "element": "Patient.birthDate",
    "type": "date",
    "expression": "msg['PID']['PID.7']['PID.7.1'].toString()",
    "path": [["birthDate"]]
  },
  {
    "key": "Patient.name",
    "each": "msg['PID']['PID.5']",
    "variable": "n",
    "path": [["name", "#0"]]
  },
  {
    "key": "Patient.name.family",
    "element": "Patient.name.family",
    "type": "string",
    "expression": "n['PID.5.1']['PID.5.1.1'].toString()",
    "path": [["name", "#0"], ["family"]]
  }
]
```

`key` identifie la règle dans l'arbre et dans les diagnostics ; `element` est accepté pour les règles de valeur. Le type sert à convertir le résultat de l'expression.

Chaque segment de `path` est `[nom]` ou `[nom, instance]`. `#0`, `#1`, etc. distinguent les entrées répétées ; `ipp#0` distingue aussi une slice. Les marqueurs sont internes au mapper et ne deviennent pas des propriétés du JSON FHIR. Dans une itération, le compilateur remplace l'instance concernée par l'indice courant.

Les autres formes de règles sont :

```json
{"key":"Patient.name","condition":"n['PID.5.7'].toString() == 'L'","path":[["name","#0"]]}
```

```json
{"key":"Patient.identifier:ipp.system","fixed":"urn:ipp","when":1,"path":[["identifier","ipp#0"],["system"]]}
```

```json
{"key":"Observation","each":"msg['OBX']","variable":"obx","path":[]}
```

`when` indique la longueur du préfixe qui doit déjà exister avant d'appliquer une valeur fixe. `0` autorise une application sans conteneur préexistant. Un chemin vide désigne la ressource entière ; une itération à ce niveau nécessite un Bundle cible. Une création de Bundle nommé n'itère pas : ses ressources peuvent itérer.

Une règle de valeur peut porter `translate`, avec `conceptMap`, `source`, `target`, `unmapped`, `value` et `keepSource`. Le compilateur transforme le repli de type fonction en callback JavaScript ; le runtime appelle la traduction puis convertit son résultat vers le type cible.

## 4. Règles de compilation

Le compilateur regroupe les règles par portée : ressource, répétition, condition et sous-éléments. Une règle appartient à la portée la plus proche dont la clé est un préfixe de la sienne. Les itérations peuvent s'imbriquer.

Les valeurs sont construites dans l'ordre compilé ; les valeurs fixes/patterns complètent ensuite les éléments créés dans leur portée. Une valeur mappée n'est pas écrasée par une valeur fixe. Les patterns d'objets et de tableaux enrichissent les entrées compatibles.

Une variable d'itération doit être un identifiant JavaScript autorisé, distinct de `msg`, `tmp`, des mots réservés et des noms internes commençant par `__`. Son indice est accessible par `<variable>Index`.

Chaque règle est précédée dans le script par un commentaire `//@ clé` et un
marqueur `//~fhir` contenant ses métadonnées de diagnostic. Des marqueurs de fin
empêchent d'attribuer du code hors règle à la règle précédente. Les erreurs de
syntaxe sont localisées dans ces régions ; les erreurs d'expression, de traduction
et de conversion portent directement le contexte de la règle, sans recherche
de sa clé dans le message d'erreur. Voir le [contrat des diagnostics](Specification-mapping.md#8-diagnostics-tests-dapi-et-traces).

## 5. Forme du JavaScript généré

Chaque étape est encapsulée dans une fonction immédiatement exécutée. Voici une forme simplifiée, et non une copie complète du code généré :

```javascript
(function () {
    var __fhir = /* runtime embarqué */;
    __fhir.options = /* version, profils, terminologie */;
    __fhir.selectBundles(['labo-transaction', 'labo-document']);

    // Le paramètre msg reçoit la source conservée pour ce transformeur.
    var __out = (function (msg) {
        var __res = {resourceType: 'Patient'};
        __fhir.set(__res, [['birthDate']], 'date', function () {
            return msg['PID']['PID.7']['PID.7.1'].toString();
        }, 'Patient.birthDate', null);
        // Une seule construction, deux entrées contenant la même ressource et le même fullUrl.
        __fhir.addToBundles('patient', __fhir.finish(__res), [
            function () { return __fhir.request('POST', __res, function () { return ''; }, function () { return ''; }); },
            function () { return __fhir.request('POST', __res, function () { return ''; }, function () { return ''; }); }
        ]);
        // La seconde fonction de requête n'est pas évaluée pour le Bundle document.
    })(__fhir.source(msg));

    // Après la dernière étape explicite de ce transformeur :
    // __fhir.completeBundles(), puis écriture du résultat principal.
})();
```

L'état de travail est propre au **message et au transformeur**. Il contient la source initiale, les Bundles nommés, leurs références et les ressources seules en attente de publication. Ce n'est pas la Global Map OIE. Deux destinations et un transformeur de réponse disposent de contextes distincts.

Les expressions voient la source conservée par la première étape FHIR, même si une sortie FHIR est produite ensuite. Une étape de création initialise son conteneur ; une étape de ressource retrouve ses cibles par leurs noms, jamais par leurs profils. Le corps de la ressource est évalué une seule fois par item, puis copié dans les cibles avec un même fullUrl. Les copies ne partagent pas d’objet mutable ; les requêtes restent propres aux entrées.

## 6. Valeurs absentes, conversions et erreurs

- Une expression donnant `undefined`, `null` ou une chaîne vide n'ajoute pas l'élément.
- Un `TypeError` pendant l'expression de valeur est traité comme une absence. Dans une condition, il vaut faux ; dans une expression de liste, il donne zéro itération. Cela facilite les segments/répétitions absents, mais peut aussi masquer une erreur de chemin : tester les mappings et valider le résultat reste nécessaire.
- Les autres erreurs d'expression arrêtent le traitement en nommant l'élément.
- Les booléens, entiers, dates et heures sont convertis. Une valeur incompatible provoque une erreur ; les contraintes FHIR détaillées sont ensuite vérifiées si la validation est activée.
- Les dates HL7 v2 sont converties vers FHIR. Un `instant` doit inclure une heure ; sans fuseau source, le fuseau du serveur est utilisé.
- Un décimal est conservé sous une représentation interne dédiée. Le sérialiseur du runtime préserve sa précision et ses zéros finaux. Un template JSON natif impose les limites des nombres JavaScript.
- `finish()` supprime les objets/entrées vides et prépare les tableaux FHIR.

## 7. Bundles nommés et règles liées au type

Un Bundle est créé une seule fois par message, avant les étapes qui l'alimentent. Les noms dupliqués, cibles inexistantes, types mappés contradictoires, versions FHIR incompatibles et destinations de résultat dupliquées sont refusés.

| Type | Règles prises en compte |
|---|---|
| `transaction`, `batch` | Évaluation de la requête de chaque entrée, avec méthode, URL et éventuellement création conditionnelle. |
| `collection` | Aucune requête d'entrée générée. |
| `document` | Aucune requête ; Composition en première entrée, identifiant et timestamp obligatoires. |
| `message` | Aucune requête ; MessageHeader en première entrée. |

Les contraintes complètes sont contrôlées sur le résultat assemblé par le validateur FHIR. Construire un Bundle transaction ne déclenche pas un appel HTTP vers un serveur FHIR : le transport appartient aux destinations OIE. Voir les [règles FHIR R4 du Bundle](https://hl7.org/fhir/R4/bundle.html).

La requête est une fonction différée : pour un document, sa méthode/URL éventuellement enregistrées ne sont pas évaluées. C'est le type du Bundle sélectionné qui décide du comportement, pas un second type conservé dans l'étape Patient.

## 8. Fonctions disponibles dans les expressions

| Fonction | Contrat |
|---|---|
| `fhirUuid()` | UUID aléatoire sans préfixe `urn:uuid:`. |
| `fhirRef(name, index, reserve)` | `fullUrl` d'une entrée nommée des Bundles sélectionnés. Indice 0 par défaut. Absente : `undefined`. |
| `fhirRefs(name)` | Tableau des références connues sous ce nom dans les Bundles sélectionnés. Ne prédit pas une itération future. |
| `fhirFind(list, fn)` | Premier élément satisfaisant `fn(item, index)`, ou `undefined`. |
| `fhirFilter(list, fn)` | Tableau des éléments satisfaisant cette condition. |
| `hl7Following(seg, name, stop)` | Segments XML suivants du type demandé. |
| `hl7Preceding(seg, name, stop)` | Segment XML précédent le plus proche du type demandé. |
| `hl7Ordinal(seg)` | Indice du segment parmi ceux de même type, à partir de 0. |

Pour une référence anticipée, demander explicitement `fhirRef('patient', 0, true)`. L’URN est réservée dans les cibles sélectionnées et doit être remplie par une entrée nommée `patient` avant publication. Si une Composition réserve dans le document le Patient qui sera ajouté ensuite aux deux Bundles, la construction partagée reprend cette réservation et utilise la même identité dans les deux résultats. Sinon le Bundle échoue avec le nom et l'indice de la référence. Sans réservation, un Encounter ou Specimen facultatif absent reste une valeur absente, sans créer de réservation.

Quand plusieurs Bundles sont sélectionnés, `fhirRef` et `fhirRefs` réunissent leurs références par nom et indice. Deux identités différentes pour le même nom/indice sont une erreur : on ne choisit pas arbitrairement un Patient. Une référence locale URN doit exister dans chaque Bundle qui la contient ; partager une Observation n’ajoute pas implicitement son Patient aux autres cibles. Il faut sélectionner ces cibles aussi pour le Patient.

Les fonctions `hl7…` attendent un segment du XML HL7 v2 plat d'OIE, pas un message ER7 brut ni un objet JSON. La limite de recherche par défaut est un segment du type de départ ; `[]` retire cette limite.

Ces aides sont installées par le runtime de l'étape. Les méthodes serveur `FhirFacade.validate`, `toJson`, `toXml`, `translate`, `lookup` et `validateCode` sont une API Java distincte, accessible depuis les scripts via `Packages.org.oie.fhir.mapper.fhir.FhirFacade`.

## 9. Validation et publication automatique

Au déploiement, `FhirMapperLifecycle` repère la dernière étape explicite activée de chaque transformeur source, destination et réponse. Les scripts consultent cet index pour déclencher la finalisation après cette étape, sans ajouter un nouveau type de step. Il est reconstruit au redéploiement et supprimé à l'undeploy.

La finalisation :

1. vérifie les réservations de références et les destinations des résultats ;
2. valide les ressources seules et les Bundles dont `validateOutput` est actif contre leurs profils/version, y compris les résultats destinés à une variable ;
3. publie les variables seulement si tous les contrôles et validations demandés réussissent ;
4. renvoie l'unique résultat principal, s'il existe, vers `tmp` ou `msg` selon le template OIE.

Si tous les résultats vont dans des variables, le message source n'est pas remplacé. Un échec de validation empêche la publication des autres résultats. La validation de sortie du type de données FHIR, si activée, demeure un contrôle supplémentaire du message principal.

Les étapes JavaScript ordinaires placées après la dernière étape FHIR ne participent pas à cet assemblage automatique. Les actions explicites imbriquées dans un Iterator OIE sont refusées : utiliser les itérations du mapper sur la ressource. Les conditions sur les ressources restent possibles ; la dernière étape peut ne produire aucune ressource tout en déclenchant la finalisation.

## 10. Contrôle et exemples

Les [channels de démonstration](../demo/oie-init/channels/) montrent les actions explicites. Le channel à deux Bundles construit un laboratoire transaction et un document, avec une seule construction des ressources communes, ajoutées aux deux conteneurs avec les mêmes identités. La Composition et l’organisation auteur sont propres au document. Le document est inspectable dans sa variable et sa destination dédiée ; les chemins HTTP sont décrits dans le [README de la démo](Demo.md).

Les tests Java exécutent les scripts générés dans Rhino : conversions, portées, isolation des conteneurs, construction unique à cibles multiples, références anticipées et publication après validation. Les tests JavaScript de l'éditeur contrôlent notamment la compilation des mappings déclaratifs et l'aide à la saisie.
