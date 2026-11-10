# Intégration avec FHIR Data Type

## Origine et namespace

Le compilateur, le runtime, l'éditeur et les tests viennent du POC
`kazepoy/fhir-datatype-Eclipse-OIE` (branche `feature/fhir-profile-mapper`, commit
`1df2c4054f5fc93b5dc348a1e43f572dd1cd5f16`, MPL 2.0). L'étape est désormais
`org.oie.fhir.mapper.FhirProfileMapperStep` et les routes de l'éditeur sont sous
`/api/extensions/fhir-profile-mapper`. Le plugin n'enregistre pas de second type
de données FHIR : il utilise le datatype officiel. L'initialisation autorise la
classe de l'étape dans le sérialiseur XML d'OIE ; `ChannelSerializationTest`
couvre l'import/export et les anciens exports sans `validateOutput`.

## Contrat et isolation

Le reste du mapper appelle `org.oie.fhir.mapper.fhir.FhirFacade`. Les résultats
de validation appartiennent au mapper et contiennent des listes/maps Java.
Les appels au datatype et à HAPI restent dans `integration/`.

La validation et les conversions utilisent les méthodes publiques du datatype
officiel **1.5.1**, installé sans modification. Les opérations de catalogue sont
reprises du POC, commit `1df2c4054f5fc93b5dc348a1e43f572dd1cd5f16`, sous MPL 2.0.
Le parseur JSON du POC est repris comme utilitaire interne pour conserver les
décimaux exacts ; celui du datatype publié n'est pas public.

## Pont de catalogue

Les profils, snapshots et ConceptMaps ne disposent pas d'API publique dans cette
version du prérequis. `FhirCatalogBridge` est donc empaqueté dans un JAR distinct,
absent du classpath OIE, et chargé avec le chargeur HAPI du datatype comme parent.
Les dépendances HAPI de Maven servent uniquement à compiler et tester ; aucun
JAR HAPI n'est ajouté à notre extension.

Le pont réutilise le contexte et la spécification du datatype. Il prépare un
catalogue de lecture des profils pour chaque requête, sans conserver ses
références à la spécification après la requête. La lecture des ConceptMaps reste
indépendante du chargement de la spécification.

Cette compatibilité repose sur trois méthodes internes du moteur 1.5.1 :
`validationContext`, `specification` et `loadProfiles`. L'adaptateur utilise aussi
le mécanisme interne `startPeriodicRelease` pour la libération des validateurs.
Ces accès sont confinés à l'intégration ; une évolution du datatype exige de
les revérifier. Ils pourront être remplacés par une API publique si le prérequis
l'expose ultérieurement.

## Vérification

`FhirFacadeTest` utilise le JAR du moteur officiel, sans copier ses sources :
conversions, précision des décimaux, validation contre un profil, génération de
snapshot, traduction locale et erreur sur un profil inconnu.

Les propriétés `fhir.engine.direct` et `fhir.mapper.bridge.direct` du POM sont
réservées à ces tests Maven. Elles ne sont pas définies dans la démo : celle-ci
vérifie les chargeurs réellement utilisés en production.
