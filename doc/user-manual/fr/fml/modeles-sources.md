# Choisir le modèle source

[Manuel](../README.md) · [FML](README.md)

Le champ **Source model** de l'onglet **Properties** détermine l'instance remise
au premier paramètre source de la map.

| Choix | Quand l'utiliser | Déclaration `uses` |
|---|---|---|
| **Generic OIE message** | HL7 v2 avec parser par défaut, XML, JSON ou texte | `http://oie.org/fhir/StructureDefinition/OieMessage` |
| **Typed HL7 v2 logical model** | Map fondée sur les groupes et composants HAPI | canonique saisie dans **Source model canonical URL** |
| **FHIR resource** | Le message entrant est déjà une ressource FHIR JSON/XML | canonique du type FHIR, par exemple `Patient` |

## HL7 v2 typé

1. Activer **Use Strict Parser** et **Strip Namespaces** dans les propriétés HL7
   v2 entrantes du connecteur source.
2. Ajouter le `StructureDefinition` logique et les maps à **Profile locations**.
3. Choisir **Typed HL7 v2 logical model** et saisir sa canonique exacte.
4. Dans la map, employer les noms adaptés : `_` devient `__`, `.` devient `_`,
   et le texte d'un élément est accessible par `.value`.
5. Vérifier la structure reçue dans **Test**, puis exécuter la map.

Exemple : `ORU_R01.PATIENT_RESULT` devient
`ORU__R01_PATIENT__RESULT`, et `PID.3/CX.1` devient
`PID_3.CX_1.value`. Les groupes HAPI restent présents, notamment
`ORU__R01_OBSERVATION` entre `ORDER_OBSERVATION` et `OBX`.

Le bouton **Check** contrôle la syntaxe et la disponibilité des `uses` et
`imports`. Le core FHIR utilisé par OIE ne valide pas fiablement tous les chemins
logiques à ce stade : toujours terminer par un test sur un message représentatif.

La démo du port 10807 montre `ORUR01toBundle`, qui importe `PIDtoPatient` et produit
un Bundle transaction Patient + Observation avec validation active.
