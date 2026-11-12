# Tester une étape et conserver des exemples

[Manuel](../README.md) · [Profile Mapper](README.md)

L'onglet **Test** exécute l'étape sur le serveur, sans déployer le canal. Le droit
`Test FHIR mapper steps` est nécessaire.

![Message exemple, exécution et résultat du Patient](images/test-resultat.png)

1. Choisir le type d'entrée : **HL7V2**, **XML**, **JSON** ou **RAW**.
2. Coller le message dans **Sample message**, ou choisir un exemple de la liste
   **Sample**. Le template entrant du transformeur sert de point de départ.
3. Cliquer **Run**.
4. Lire les erreurs, le statut de validation et le résultat coloré.

`Valid.` signifie que la validation demandée n'a pas rapporté d'erreur.
`FHIR validation disabled.` signifie qu'elle n'a pas été exécutée.

## Enregistrer et rejouer des exemples

![Run all sur les exemples enregistrés](images/jeux-essai.png)

- Choisir l'exemple non enregistré, puis **Save as sample** et donner un nom.
- Pour un exemple enregistré, les modifications du message restent dans cet
  exemple. **Delete sample** le retire de l'étape.
- Enregistrer le canal pour partager ces exemples avec les autres utilisateurs.
- **Run all** rejoue tous les exemples enregistrés. Cliquer une ligne pour
  reprendre l'exemple correspondant.

Un résultat `passed` peut signifier qu'un exemple s'exécute sans erreur **sans
résultat attendu**. La colonne de détail le précise. Pour contrôler le contenu,
fixer un [résultat attendu](comparaison.md).

L'exemple non enregistré est mémorisé dans ce navigateur, par canal et
transformeur ; il n'est pas partagé. **Run all** exécute chaque exemple sur cette
étape seule, pas toutes les étapes du canal. Les références des étapes voisines
sont des valeurs de remplacement.
