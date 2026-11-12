// SPDX-License-Identifier: MPL-2.0
// Français. Les clés absentes retombent sur l'anglais.
export default {
  common: {
    loading: "Chargement…", load: "Charger", reload: "Recharger", run: "Exécuter", running: "Exécution…", cancel: "Annuler", close: "Fermer",
    save: "Enregistrer", add: "Ajouter", remove: "Retirer", apply: "Appliquer", copy: "Copier", export: "Exporter", import: "Importer",
    search: "Rechercher", all: "Tous", none: "Aucun", yes: "oui", no: "non", undo: "Annuler la modification", redo: "Rétablir",
    fullScreen: "Plein écran", exitFullScreen: "Quitter le plein écran (Échap)", help: "Aide", test: "Tester", error: "Erreur"
  },
  settings: {
    savedLocally: "Réglages conservés dans ce navigateur seulement : le serveur les a refusés.",
    panelLabel: "FHIR Mapper",
    panelIntro: "Contextes FHIR partagés par toutes les étapes FHIR Profile Mapper et FHIR Mapping Language de ce serveur : packages, serveur de terminologie et politique de validation. Une étape nomme son contexte.",
    contexts: "Contextes FHIR", newContext: "Nouveau contexte", name: "Nom", fhirVersion: "Version FHIR",
    packages: "Packages et fichiers de profils", packagesHint: "Un chemin par ligne, sur le serveur OIE : fichiers, dossiers ou packages .tgz.",
    terminologyServer: "Serveur de terminologie", terminologyHint: "Vide : traduction locale avec les ConceptMaps des packages.",
    authorization: "Authorization (JavaScript)", cache: "Cache (secondes)", timeout: "Délai (secondes)",
    validation: "Validation des résultats", validationAlways: "toujours", validationOff: "désactivée",
    saveContexts: "Enregistrer les contextes", saved: "Contextes enregistrés.", reloaded: "Contexte rechargé : {count} ressources indexées.",
    deleteContext: "Supprimer ce contexte", confirmDelete: "Supprimer le contexte « {name} » ? Les étapes qui le nomment reviendront à leurs propres packages.",
    noPermission: "La gestion des contextes FHIR demande la permission « Manage FHIR mapper settings ».",
    index: "{profiles} profils, {valueSets} jeux de valeurs, {conceptMaps} ConceptMaps, {maps} maps",
    editor: "Éditeur",
    treeFilter: { label: "Filtre par défaut de l'arbre", all: "Tous les éléments", mustSupport: "Must Support et requis", mapped: "Mappés seulement" },
    showExtensions: { label: "Afficher extensions et ids", true: "Oui", false: "Non" },
    autoCompile: { label: "Compiler pendant la saisie", true: "Oui", false: "Non" },
    traceByDefault: { label: "Tracer les tests par défaut", true: "Oui", false: "Non" }
  },
  mapper: {
    tabs: { properties: "Propriétés", mapper: "Mappeur", tests: "Tests" },
    requiredBadge: "{count} élément(s) requis non mappé(s)", failedBadge: "Le dernier test a échoué",
    migrated: "Cette étape était au format {from} ; elle est maintenant au format {to}. Enregistrer le canal pour la conserver.",
    noProfile: "Charger un profil cible dans Propriétés pour mapper ses éléments.", loadingProfile: "Chargement du profil cible…"
  },
  tree: {
    element: "Élément", type: "Type", mapping: "Mapping", show: "Afficher", filterAll: "Tous les éléments", filterMustSupport: "Must Support et requis",
    filterMapped: "Mappés seulement", filterErrors: "En erreur", extensions: "extensions et ids", searchPlaceholder: "Rechercher un élément…",
    expandAll: "Tout déplier", collapseAll: "Tout replier", required: "Requis, non mappés : {keys}", mustSupportMissing: "Must Support, non mappés : {keys}",
    complete: "Tous les éléments requis sous les éléments mappés ont un mapping ou une valeur fixe."
  },
  inspector: {
    title: "Élément", noSelection: "Sélectionner un élément de l'arbre cible.", expression: "Expression", note: "Note",
    notePlaceholder: "Pourquoi cette règle, pour le prochain lecteur", definition: "Définition", binding: "Binding", codes: "Codes du jeu de valeurs",
    codesLoad: "Charger les codes", codesFilter: "Filtrer les codes…", references: "Références", diagnostics: "Diagnostics", goToRule: "Aller à la règle"
  },
  source: {
    title: "Source", sample: "Message exemple", dataType: "Type de données", filter: "Filtrer les champs…",
    empty: "Coller un message exemple pour voir ses champs.", dragHint: "Glisser un champ sur un élément cible, ou cliquer pour insérer son chemin dans l'expression sélectionnée.",
    hideEmpty: "Masquer les champs vides", edit: "Modifier l'exemple"
  },
  tests: {
    title: "Tests", samples: "Messages exemples", newSample: "Nouvel exemple", run: "Exécuter", runAll: "Exécuter tous les exemples",
    allSteps: "Toutes les étapes FHIR du transformeur", thisStep: "Cette étape seulement (références simulées)", trace: "Trace",
    expected: "Résultat attendu", setExpected: "Prendre ce résultat comme attendu", match: "Conforme au résultat attendu.", mismatch: "Différent du résultat attendu :",
    valid: "Valide.", validationDisabled: "Validation FHIR désactivée.", generatedScript: "Script généré", hideScript: "Masquer le script"
  },
  trace: { action: "Trace du mapping FHIR", none: "Ce message n'a pas de trace de mapping FHIR. Activer « Trace processed messages » sur une étape et redéployer." },
  fml: {
    tabs: { properties: "Propriétés", map: "Map", tests: "Tests" }, context: "Contexte FHIR", source: "Modèle source",
    sourceOie: "Message OIE (modèle générique)", sourceHl7: "Modèle logique HL7 v2 d'un IG", sourceFhir: "Ressource FHIR",
    mapInline: "Écrite dans cette étape", mapUrl: "Une StructureMap du contexte", check: "Vérifier", noErrors: "Aucune erreur dans la map.",
    errors: "{count} problème(s) dans la map", scaffold: "Générer un squelette…", runTest: "Exécuter le test", model: "Modèle reçu par la map"
  }
};
