# Changelog

## Non publié (branche `feat/refonte`)

- **FHIR FML Transform** : second transformeur, qui exécute une map FML (StructureMap)
  sur le message vu par le modèle logique générique `OieMessage`, avec le moteur du
  core HL7 livré par FHIR Data Type. Canal de démo sur le port 8087.
- **FML, map dans l'étape** : onglet *Map* avec l'éditeur de code en langage `fml`, propriété
  `mapSource` enregistrée avec le canal et exécutée à la place de `mapUrl`, bouton *Check*
  (route `POST /check`) qui positionne les erreurs du parseur et signale les `uses` et
  `imports` introuvables.
- **Mappeur, jeux d'essai** : exemples nommés enregistrés dans l'étape (propriété `samples`),
  résultat attendu par exemple, comparaison avec vue côte à côte en cas d'écart, *Run all*.
- **Trace** : action *FHIR mapping trace* sur un message de la liste des messages.
- **Mappeur, saisie** : volet *Sample fields* (champs et valeurs de l'exemple, clic ou glisser),
  déplacement au clavier entre les champs (`Alt` + flèches), erreur soulignée dans le champ.
- **Mappeur** : expressions éditées dans l'éditeur de code de Web Admin (Monaco) avec
  complétion des fonctions, des variables d'itération, des chemins du message exemple,
  des références des autres étapes et de modèles de garde ; recherche dans l'arbre ;
  Expand mapped / Collapse all ; Undo / Redo ; plein écran ; éléments en erreur marqués.
- Fonctions du mappeur dans le panneau Reference de Web Admin (catégorie *FHIR Mapper*).
- **Build** : les éditeurs sont dans `webadmin/src` et regroupés par esbuild en
  `webadmin/web/plugin.js` (`npm run build`). La CI construit et teste les éditeurs et
  les outils Python avant `mvn package`.
- Plan de refonte : [doc/plan-refonte.md](doc/plan-refonte.md).

## 0.2.0

Voir l'historique git.
