# Settings › FHIR Mapper

[Accueil du manuel](../README.md)

Ce panneau administre les **contextes FHIR nommés** du serveur. Ils évitent de
répéter les emplacements et les réglages dans chaque étape.

![Panneau des contextes FHIR dans Settings](images/contextes.png)

- [Créer, nommer, enregistrer ou supprimer un contexte](contextes.md)
- [Configurer les packages et fichiers](packages.md)
- [Régler la terminologie](terminologie.md)
- [Choisir la validation et appliquer les changements](validation.md)

Ouvrir **Settings**, puis l'onglet **FHIR Mapper**. L'action **Save** du panneau
de tâches (*FHIR Mapper Tasks*) enregistre les contextes du plugin ; une pastille
`●` signale les modifications non enregistrées et OIE propose de les sauver en
quittant l'onglet. Le droit `Manage FHIR mapper settings` est nécessaire pour
les modifier. **?** ouvre l'aide du panneau.

Les étapes choisissent un contexte par son nom. Sans contexte, leurs propriétés
locales restent utilisées. La prise en compte côté traitement nécessite le
redéploiement des canaux concernés.

Le panneau n'importe pas un package depuis le poste de l'utilisateur : les
fichiers doivent déjà être accessibles au serveur. Il ne propose pas encore de
bouton de rechargement de catalogue par contexte ni de gestionnaire graphique
des dépendances des packages.
