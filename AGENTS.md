# Instructions projet pour les agents

## Construire ou modifier un canal FHIR

Avant de créer ou modifier un export de canal OIE, lire intégralement
[`doc/reference/Construire-un-channel.md`](doc/reference/Construire-un-channel.md).

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
  explicite. La démo locale du dépôt peut être utilisée pour les vérifications.
