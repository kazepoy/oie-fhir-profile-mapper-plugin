# Instructions pour construire des canaux FHIR dans OIE

Ce fichier s'adresse à un agent utilisateur du plugin dans OIE. Il ne donne pas
d'instructions pour modifier les sources du plugin.

Avant de créer ou modifier un export de canal, lire intégralement le guide
[Construire ou modifier un canal FHIR avec un agent](../../reference/Construire-un-channel.md).

Règles minimales :

- choisir FML lorsqu'une map portable convient ; utiliser Profile Mapper pour
  une transformation graphique spécifique au runtime OIE ;
- utiliser uniquement les types `fr.kazepoy.fhir.*` ;
- préserver les UUID, `sequenceNumber`, IDs de règles et parties XML sans
  rapport avec la modification ;
- préférer `tools/channel_mapping.py` à une réécriture globale d'un export ;
- valider les mappings, relire l'export produit et exécuter ses samples avant
  de considérer le canal terminé ;
- ne jamais importer, déployer ou modifier un serveur externe sans demande
  explicite. La démo locale du dépôt peut servir aux vérifications.
