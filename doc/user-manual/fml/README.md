# FHIR FML Transform

[Accueil du manuel](../README.md)

Ce transformeur exécute une map **FHIR Mapping Language** et publie la ressource
qu'elle produit. Il convient aux transformations que l'on souhaite exprimer
explicitement en FML, avec groupes de règles, imports et traductions.

![Map FML écrite dans l'étape et vérifiée](images/map-verifiee.png)

- [Configurer une étape et choisir une map fichier](configurer.md)
- [Écrire une map dans l'étape](editer-map.md)
- [Vérifier la map et corriger une erreur](verifier.md)
- [Tester et lire le résultat](tester.md)
- [Choisir le modèle source](modeles-sources.md)
- [Explorer le modèle source OieMessage](modele-oie.md)
- [Publier, valider et passer des variables de contexte](sortie.md)

Une map écrite dans **Map** est prioritaire sur la map sélectionnée dans
**Properties**. La source peut être le modèle générique `OieMessage`, un modèle
logique HL7 v2 alimenté par le Strict Parser, ou une ressource FHIR.

Une map FML construit sa propre ressource, éventuellement un Bundle. Elle ne
partage pas les Bundles nommés du Profile Mapper. Il n'existe pas de trace FML
par règle ni de prise en charge de `resolveReference` et `performSearch`.
Pour la syntaxe et les limites détaillées : [référence FML](../../Transformation-FML.md).
