# Instructions pour développer le plugin

Ce fichier s'adresse aux agents qui modifient les sources Java, frontend,
outils, tests ou documentation de ce dépôt. Il ne constitue pas le manuel d'un
agent utilisateur chargé de construire des canaux OIE.

## Règles du projet

- Lire [le guide de développement](doc/development/Developpement.md) et la
  [feuille de route active](doc/plan-suite.md) avant un changement structurel.
- Conserver le namespace `fr.kazepoy.fhir` et ne pas ajouter de compatibilité
  avec les anciens types de développement.
- Ne pas modifier directement `webadmin/web/plugin.js` : le reconstruire depuis
  `webadmin/src`.
- Préserver les changements utilisateur sans rapport avec la tâche, notamment
  les fichiers non suivis.
- Vérifier au minimum `mvn clean package`, les tests Python concernés et
  `python3 tools/check_doc_links.py` lorsque la documentation change.

Les instructions destinées aux agents utilisateurs d'OIE sont dans le
[manuel agent](doc/agent-manual/README.md).
