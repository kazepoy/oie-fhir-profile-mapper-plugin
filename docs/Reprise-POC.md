# Reprise fonctionnelle du POC

Le compilateur, le runtime JavaScript, l'éditeur et les tests proviennent du POC
`kazepoy/fhir-datatype-Eclipse-OIE`, branche `feature/fhir-profile-mapper`, commit
`1df2c4054f5fc93b5dc348a1e43f572dd1cd5f16`, sous MPL 2.0.

L'étape est désormais `org.oie.fhir.mapper.FhirProfileMapperStep`. Les routes de
l'éditeur sont sous `/api/extensions/fhir-profile-mapper`. Le plugin n'enregistre
pas un second type de données FHIR : il utilise le datatype officiel 1.5.1.

Les itérations, conditions, conversions exactes, traductions ConceptMap, Bundles
nommés, ressources partagées et références anticipées sont conservés. Le contrat
JSON reste celui du POC, décrit dans [Runtime-mapping.md](Runtime-mapping.md).
L'utilisation de l'éditeur est décrite dans [Mappeur-graphique.md](Mappeur-graphique.md).

## Validation optionnelle

`validateOutput` est activé par défaut. Il contrôle la validation FHIR d'une
ressource seule ou du Bundle terminé. Pour une ressource ajoutée à des Bundles,
chaque Bundle contrôle sa validation finale ; l'option de la ressource contrôle
son aperçu isolé dans l'éditeur.

Les contrôles du mapping et des références restent actifs. Le résultat du test
indique `validationPerformed` et l'éditeur ne présente pas un résultat non
validé comme conforme. La validation de sortie du datatype OIE, si activée dans
le channel, reste un contrôle supplémentaire indépendant.

## Limites conservées

- Édition dans l'administration web ; pas d'éditeur Swing.
- Pas d'extensions primitives, de ressources `contained`, de sous-slices ou de
  discriminants de slicing `type`, `profile` et `exists`.
- Traduction locale sans `dependsOn`/`product` ni traduction inverse.
- Test isolé d'une étape : les références vers les autres étapes sont simulées.
- Les `TypeError` d'expressions sont encore assimilées à des valeurs absentes,
  comme dans le POC. Leur traitement explicite fera l'objet d'une évolution du
  contrat et de tests dédiés.
- Un template JSON natif impose la précision des nombres JavaScript.

L'intégration du catalogue avec le datatype utilise des points internes de sa
version 1.5.1 : voir [Integration-FHIR-Data-Type.md](Integration-FHIR-Data-Type.md).

## Vérifier

```sh
mvn clean package
node --test webadmin/test/
```

Les tests Java exécutent les scripts générés dans Rhino, les tests JavaScript
couvrent la logique de l'éditeur. La démonstration vérifie ensuite les chargeurs,
API et channels réellement utilisés par OIE.

Les six exports de canaux, leur IG et leurs messages d'entrée sont repris dans
`demo/`. Les classes des étapes de mapping ont changé de namespace ; les
propriétés du datatype conservent celui du plugin officiel. Le
[guide de la démo](Demo.md) décrit leur rejeu automatisé et les résultats attendus.

L'initialisation du plugin autorise explicitement sa classe d'étape dans le
sérialiseur XML OIE. Le test `ChannelSerializationTest` couvre l'import/export
et les anciens exports sans `validateOutput` : leur validation reste activée.
