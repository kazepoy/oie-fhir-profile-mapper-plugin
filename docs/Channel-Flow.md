# Channel Flow

L’onglet **Flow** de l’éditeur de canal montre le parcours d’un message, comme
[How a message moves](https://docs.openintegrationengine.org/engine/architecture_overview.html#how-a-message-moves).
Le schéma représente le canal en cours d’édition, modifications non enregistrées
comprises. Il ne s’agit pas d’une trace d’exécution.

Flow s’ouvre à chaque entrée dans l’éditeur du canal, y compris au retour d’un
éditeur de filtre ou de transformer.

## Lecture

- **Blocs.** Source, destinations et canal ont le même dessin. On les distingue
  par leur couleur et leur étiquette : *Source*, *Destination n*, *Channel*.
  Le titre trop long est tronqué ; le nom complet s’affiche au survol. Les types
  de données du bloc (`HL7V2 → FHIR`) occupent la ligne sous le titre.
- **Flèches.** Elles donnent l’ordre d’exécution, entre composants d’un bloc
  comme entre blocs :
  - ambre : trajet du message ;
  - pointillés gris : la destination attend la précédente (*waits for Dn*) ;
  - violet : réponse renvoyée à l’émetteur, si une réponse est sélectionnée
    et que la source n’est pas une source interrogée (*Polled*) ;
  - pointillés clairs : destination désactivée. Comme dans le moteur, elle n’ouvre
    pas de chaîne et reste à sa place de déclaration.
- **Chaînes.** Chaque chaîne reçoit le message de la source en parallèle.

## Vues

| Vue | Disposition | Adaptée à |
|---|---|---|
| Line | La source et chaque chaîne se lisent de gauche à droite | peu de destinations |
| Columns | Tout se lit de haut en bas, une colonne par chaîne | plusieurs chaînes courtes |
| Bands | Trois bandes (source, destinations, postprocessing), un bloc par ligne | 5 destinations et plus, ou chaînes longues |

*Auto* choisit Bands à partir de 5 destinations ou d’une chaîne de 3, Columns
s’il y a plusieurs chaînes, sinon Line. Le choix est mémorisé dans le navigateur.

Zoom : molette de souris (autour du pointeur), pincement, boutons `−` / `+`, *Fit*,
*100%*, ou touches `+`, `-`, `0` (Fit), `1` (100%) quand le schéma a le focus. *100%*
affiche la taille réelle à partir du début du schéma (bord gauche et haut, là où entre
le message) ; un schéma qui tient dans la vue reste centré. Le défilement à deux
doigts sur un pavé tactile et le glisser déplacent le schéma.

Un filtre, un transformer ou une response affiche ses 5 premières étapes ; la hauteur
du bloc suit leur nombre. *+N more* ouvre la liste complète, où chaque étape s’ouvre
dans l’éditeur.

## Actions

- Un clic sur un composant ouvre son éditeur : filtre, transformer ou response
  (sur l’étape cliquée), connecteur (onglet Source ou ligne de la destination),
  script (onglet Scripts sur le bon script), pièces jointes (onglet Summary).
- `+` sur un filtre, un transformer ou une response propose les types d’étapes
  enregistrés dans Web Admin. L’étape est ajoutée au canal comme le fait
  l’éditeur, le canal passe à l’état modifié, puis l’éditeur s’ouvre sur la
  nouvelle étape. *Save Changes* l’enregistre.
- `+` sur un script vide ouvre ce script dans l’onglet Scripts.

## Code

[webadmin/web/channel-flow.js](../webadmin/web/channel-flow.js), chargé par
[plugin.js](../webadmin/web/plugin.js) avec `getAssetText`, car une WAR charge le
point d’entrée depuis une URL `blob:`. Tests :
[channel-flow.test.mjs](../webadmin/test/channel-flow.test.mjs).

Web Admin 1.3 n’a pas d’API pour choisir un onglet de l’éditeur, une ligne de
destination ou un script : ces trois gestes passent par les contrôles accessibles
de l’éditeur (`role="tab"`, tableau des destinations, liste des scripts). Les
filtres, transformers et responses passent par leurs routes.

## Vue Flows

L’entrée **Flows** de la section Monitor présente les canaux déployés par groupe de
canaux, *Default Group* en dernier. Chaque canal se lit sur une ligne, de gauche à
droite : canal et état, source, puis ses chaînes de destinations (*then* quand une
destination attend la précédente). Les cartes sont alignées d’une ligne à l’autre.

- Chaque carte donne ses compteurs : Received, Filtered, Queued, Errored pour la
  source ; Sent, Queued, Filtered, Errored pour une destination. Une carte avec des
  erreurs a une bordure rouge, une carte avec une file d’attente une bordure ambre.
  Un connecteur arrêté est en pointillés.
- Un clic sur le titre d’une carte ouvre Messages filtré sur ce connecteur
  (`/messages/<canal>?metaDataId=<n>`). Un clic sur un compteur ajoute son statut
  (Filtered, Queued, Sent, Errored ; Received = tous les statuts) : Messages n’a pas
  de paramètre d’URL pour le statut, Flows le coche dans le menu *Status* puis relance
  *Search*. Le nom du canal ouvre Messages pour tout le canal ; *Edit* ouvre
  l’éditeur, donc Flow.
- Les compteurs se rafraîchissent toutes les 5 secondes, onglet visible. Les groupes
  et les chaînes sont relus à l’ouverture et sur *Refresh* : les statuts du moteur
  indiquent toujours `waitForPrevious = false`, les chaînes viennent donc de la
  configuration des canaux.
- *Lifetime* affiche les compteurs cumulés ; le champ de filtre restreint par nom.

### Droits (plugin Role Based Access Control)

Flows n’a pas d’accès propre : elle lit `channels/statuses`, `channelgroups` et
`channels` avec la session de l’utilisateur, comme le Dashboard. Vérifié avec RBAC
1.3.0 dans la démo :

- un rôle restreint à deux canaux ne voit que ces deux lignes ; un groupe n’affiche
  que ses canaux autorisés et les totaux ne comptent que ceux-là ;
- un compteur ouvre Messages pour un canal autorisé ; Messages d’un autre canal
  est refusé par le serveur (403) ;
- sans `viewDashboard`, l’entrée **Flows** disparaît du menu ; l’URL directe affiche
  `Missing permission: viewDashboard`, sans donnée ;
- **Edit** reste affiché sans `manageChannels` : l’éditeur répond alors *Access
  denied*. Flows ne consulte pas les droits pour masquer ce lien.

Le Dashboard de Web Admin n’accepte pas de troisième mode à côté des cartes et du
tableau : Flows est une vue à part (`registerView` et `registerNavItem`).
Code : [flow-dashboard.js](../webadmin/web/flow-dashboard.js), tests :
[flow-dashboard.test.mjs](../webadmin/test/flow-dashboard.test.mjs).
