// OIE FHIR Mapper 0.3.0 · MPL-2.0 · generated from webadmin/src by build.mjs: do not edit

// src/host/react.js
var React = null;
function bindReact(instance) {
  React = instance;
}

// src/host/platform.js
var current = null;
function bindPlatform(platform2) {
  current = platform2;
}
function platform() {
  if (!current) throw new Error("FHIR Mapper: the platform is not bound yet");
  return current;
}

// src/host/styles.js
var ATTRIBUTE = "data-plugin";
var ID = "fhir-mapper";
function installStyles(sheets) {
  document.head.querySelector(`style[${ATTRIBUTE}="${ID}"]`)?.remove();
  const style = document.createElement("style");
  style.setAttribute(ATTRIBUTE, ID);
  style.textContent = sheets.join("\n");
  document.head.append(style);
}

// src/host/api.js
var MAPPER_API = "/extensions/fhir-profile-mapper";
async function getJson(base, path, params) {
  const text = await platform().api.get(`${base}${path}`, params, { raw: true });
  return text === "" || text == null ? null : JSON.parse(text);
}
var functionsPromise = null;
function mapperFunctions() {
  if (!functionsPromise) {
    functionsPromise = getJson(MAPPER_API, "/functions").catch((error) => {
      functionsPromise = null;
      throw error;
    });
  }
  return functionsPromise;
}

// src/host/references.js
var CONTEXTS = ["SOURCE_FILTER_TRANSFORMER", "DESTINATION_FILTER_TRANSFORMER", "DESTINATION_RESPONSE_TRANSFORMER"];
async function registerMapperReferences() {
  const p = platform();
  if (typeof p.registerReferences !== "function") return;
  const functions = await mapperFunctions();
  p.registerReferences("FHIR Mapper", functions.map((fn) => ({
    name: fn.signature,
    description: `${fn.description} Example: ${fn.example}. Available inside FHIR Profile Mapper expressions.`,
    code: `function ${fn.name}(${(fn.parameters || []).map((x) => x.name).join(", ")}) {}`,
    type: "FUNCTION",
    contexts: CONTEXTS
  })));
}

// src/i18n/locales/en.js
var en_default = {
  common: {
    loading: "Loading…",
    load: "Load",
    reload: "Reload",
    run: "Run",
    running: "Running…",
    cancel: "Cancel",
    close: "Close",
    save: "Save",
    add: "Add",
    remove: "Remove",
    apply: "Apply",
    copy: "Copy",
    export: "Export",
    import: "Import",
    search: "Search",
    all: "All",
    none: "None",
    yes: "yes",
    no: "no",
    undo: "Undo",
    redo: "Redo",
    fullScreen: "Full screen",
    exitFullScreen: "Exit full screen (Esc)",
    help: "Help",
    test: "Test",
    error: "Error",
    savedLocally: "Settings kept in this browser only: the server refused them."
  },
  settings: {
    savedLocally: "Settings kept in this browser only: the server refused them.",
    panelLabel: "FHIR Mapper",
    panelIntro: "FHIR contexts shared by every FHIR Profile Mapper and FHIR Mapping Language step of this server: packages, terminology server and validation policy. A step names its context.",
    contexts: "FHIR contexts",
    newContext: "New context",
    name: "Name",
    fhirVersion: "FHIR version",
    packages: "Packages and profile files",
    packagesHint: "One path per line, on the OIE server: files, folders, or .tgz packages.",
    terminologyServer: "Terminology server",
    terminologyHint: "Empty: translate locally with the ConceptMaps of the packages.",
    authorization: "Authorization (JavaScript)",
    cache: "Cache (seconds)",
    timeout: "Timeout (seconds)",
    validation: "Validation of results",
    validationAlways: "always",
    validationOff: "off",
    saveContexts: "Save contexts",
    saved: "Contexts saved.",
    reloaded: "Context reloaded: {count} resources indexed.",
    deleteContext: "Delete this context",
    confirmDelete: "Delete the context “{name}”? Steps that name it will fall back to their own packages.",
    noPermission: "Managing FHIR contexts requires the permission “Manage FHIR mapper settings”.",
    index: "{profiles} profiles, {valueSets} value sets, {conceptMaps} concept maps, {maps} maps",
    editor: "Editor",
    treeFilter: { label: "Default filter of the element tree", all: "All elements", mustSupport: "Must Support and required", mapped: "Mapped only" },
    showExtensions: { label: "Show extensions and ids", true: "Yes", false: "No" },
    autoCompile: { label: "Compile while typing", true: "Yes", false: "No" },
    traceByDefault: { label: "Trace tests by default", true: "Yes", false: "No" }
  },
  mapper: {
    title: "FHIR Profile Mapper",
    tabs: { properties: "Properties", mapper: "Mapper", tests: "Tests" },
    requiredBadge: "{count} required element(s) not mapped",
    failedBadge: "The last test failed",
    migrated: "This step was written in format {from}; it is now format {to}. Save the channel to keep it.",
    noProfile: "Load a target profile in Properties to map its elements.",
    loadingProfile: "Loading the target profile…",
    functionCatalogue: "Function catalogue: {error}",
    unresolved: "Cannot find these mapped elements in the profile (editing is blocked so they are not lost): {keys}.",
    removeUnresolved: "Remove these mappings",
    versionNotice: "The profile is now version {now}; these mappings were made with version {was}. Check them (elements no longer in the profile are listed).",
    checked: "Checked",
    notInProfile: "Not in this profile, removed: {keys}.",
    fixedAdded: "Fixed values of required elements were added to the mappings.",
    elementMissing: "The element {key} is not in the loaded profile."
  },
  properties: {
    action: "Action",
    createBundle: "Create a Bundle",
    buildResource: "Build a resource",
    actionHint: "Bundles are named and created explicitly; results are completed after the last FHIR mapper.",
    bundleName: "Bundle name",
    bundleNameHint: "Internal name used by resource steps; separate from the FHIR id and profile URL.",
    fhirVersion: "FHIR version",
    context: "FHIR context",
    contextHint: "Packages, terminology and validation policy defined in Manage › Settings › FHIR Mapper.",
    contextNone: "(this step's own packages)",
    contextUnknown: "Context “{name}” is not defined on this server.",
    packages: "Profile packages",
    packagesHint: "Server-side profile files or folders, separated by ';'.",
    targetProfile: "Target profile",
    targetPlaceholder: "Canonical URL of the profile, or a resource type (Patient)",
    targetHint: "Loading another profile keeps the mappings of the elements it also has.",
    listProfiles: "List profiles",
    terminologyServer: "Terminology server",
    terminologyHint: "Empty or n/a: translate locally using the packages. Otherwise, the terminology server URL as reached by OIE.",
    terminologyOptions: "Terminology server options",
    authorization: "Authorization",
    authorizationHint: "JavaScript expression of the Authorization header; empty for none.",
    cache: "Cache (seconds)",
    cacheHint: "How long answers of the server are reused; 0 for not at all.",
    timeout: "Timeout (seconds)",
    timeoutHint: "How long to wait for the server.",
    bundleType: "Bundle type",
    bundleTypeHint: "Defines the Bundle and its entry rules. A fixed type in the target profile takes precedence.",
    resultDestination: "Result destination",
    outboundMessage: "Outbound message",
    channelMapVariable: "Channel map variable",
    bundleDestinationHint: "The completed Bundle is published here after the configured checks of all named Bundles.",
    resourceDestinationHint: "Destination of this standalone resource.",
    variableName: "Variable name",
    variableHint: "FHIR JSON in the channel map; use it from another destination.",
    addToBundles: "Add to Bundles",
    addToBundlesHint: "Build this resource once, then add the same resource to each selected Bundle. Leave all unchecked for a standalone result.",
    referenceName: "Reference name",
    referenceNameHint: "Common to the selected Bundles. fhirRef(name) must resolve to the same resource in these Bundles.",
    noBundleBefore: "Create a Bundle earlier in this transformer to select it here.",
    notDeclared: "not declared earlier",
    createdBy: "Created by step “{name}”.",
    method: "Method",
    requestUrl: "Request URL",
    requestUrlPlaceholder: "Empty: the resource type or type/id",
    ifNoneExist: "If-None-Exist",
    ifNoneExistHint: "Conditional creation for this Bundle entry.",
    noRequest: "No request for a {type} Bundle.",
    mustBeCreated: "This Bundle must be created earlier in the transformer.",
    options: "Options",
    addMetaProfile: "Add the profile to meta.profile",
    validation: "Validation of the result",
    validationInherit: "as the context says",
    validationAlways: "always",
    validationOff: "off",
    validationPreview: "Validate this preview (final validation is set on each Bundle)",
    setLastUpdated: "Set meta.lastUpdated",
    trace: "Trace",
    traceMessages: "Trace processed messages",
    traceValues: "Include scalar values",
    traceValuesTitle: "Also record the scalar values of this step's rules (256 characters per value). They may contain patient data.",
    traceHint: "Each message processed by the deployed channel keeps this step's events, and the finalization of its Bundles, in the connector map (fhirMapperTrace). Off by default; redeploy to apply.",
    json: "Edit as JSON",
    jsonHint: "The whole step — properties and rules — as text: copy it to another step or channel, paste a mapping written by hand or by an AI agent, or make bulk edits. Validate and apply compiles it on the server first.",
    readStep: "Read current step",
    validateApply: "Validate and apply",
    jsonAfter: "Applies to this step only; its OIE sequence and enabled state are preserved. Save the channel to persist changes.",
    exchange: "Documentation and tables",
    exportDoc: "Export documentation (Markdown)",
    importTable: "Import a mapping table…",
    importTableHint: "CSV, TSV or Markdown rows: element key, expression, note. Existing rules of the same elements are replaced.",
    imported: "{count} rule(s) imported; {skipped} row(s) skipped."
  },
  tree: {
    element: "Element",
    type: "Type",
    mapping: "Mapping",
    show: "Show",
    filterAll: "All elements",
    filterMustSupport: "Must Support and required",
    filterMapped: "Mapped only",
    filterErrors: "With errors",
    extensions: "extensions & ids",
    extensionsTitle: "Also show extension, modifierExtension and id of every element (to add an extension the profile does not have)",
    searchPlaceholder: "Search elements…",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    expand: "Expand {key}",
    collapse: "Collapse {key}",
    mustSupport: "Must Support",
    fhirHelp: "FHIR help for {key}",
    officialDefinition: "Official FHIR definition",
    chooseType: "choose a type below",
    addEntry: "Add an entry",
    removeEntry: "Remove this entry and its mappings",
    iterate: "One entry for each item of a list (for each repetition)",
    iterateResource: "One resource for each item of a list (e.g. each OBX)",
    translate: "Translate the value with ConceptMap/$translate",
    condition: "Only map this element (and what is below it) when a condition holds",
    conditionResource: "Only make the resource when a condition holds",
    required: "Required, not mapped: {keys}",
    mustSupportMissing: "Must Support, not mapped: {keys}",
    complete: "Every required element below the mapped ones has a mapping or a fixed value.",
    entryNote: "Bundle.entry is filled by the resource steps that select this Bundle in “Add to Bundles”.",
    completionHint: "{shortcut}: functions, scoped variables and sample paths. ↑/↓ to choose, Enter/Tab to insert, Esc to close. Guard optional values.",
    forEach: "↻ For each",
    forEachResource: "↻ One resource for each",
    as: "as",
    forEachHint: "below: {variable} (the item), {variable}Index (0, 1, …); fields dragged in are rewritten to {variable}[…]",
    onlyIf: "? Only if",
    onlyMakeIf: "? Only make the resource if",
    perItem: "per item: keeps the items it holds for",
    conditionHint: "false, or an error on a missing segment: nothing below",
    conceptMapLocal: "⇄ ConceptMap (local)",
    conceptMap: "⇄ ConceptMap",
    conceptMapLocalTitle: "ConceptMap/$translate locally, on the ConceptMaps of the packages",
    conceptMapTitle: "ConceptMap/$translate on the terminology server",
    conceptMapPlaceholder: "canonical URL of the ConceptMap",
    sourceSystem: "source system (optional)",
    targetSystem: "target system (optional)",
    unmapped: { none: "no match: leave empty", source: "no match: keep the source code", fixed: "no match: fixed value", function: "no match: expression", error: "no match: error" },
    keepSource: "+ source coding",
    keepSourceTitle: "Add the source code as a second coding",
    fixedPlaceholder: "code or system|code",
    functionPlaceholder: "myFunction(code, system)",
    fixedTitle: "The value for codes without a match: a code, or system|code",
    functionTitle: "JavaScript with code and system (the source code and its system), e.g. a code template function; gives a code, system|code or {system, code, display}, or null for no value",
    tryCode: "a source code to try",
    noMatch: "→ no match (then the rule chosen for no match)",
    suggestedMap: "Suggested: {name}",
    disabled: "disabled",
    enable: "Enable this rule",
    disable: "Disable this rule (kept, not compiled)",
    duplicate: "Duplicate the mappings of this entry to a new entry",
    clear: "Clear the mappings of this element and below",
    copyJson: "Copy the rules of this element as JSON",
    useFixed: "Use the fixed value",
    menu: "Actions for {key}"
  },
  inspector: {
    title: "Element",
    noSelection: "Select an element of the target tree.",
    expression: "Expression",
    note: "Note",
    notePlaceholder: "Why this rule, for the next reader",
    definition: "Definition",
    comment: "Comment",
    binding: "Binding",
    bindingStrength: "{strength} binding to {valueSet}",
    codes: "Codes of the value set",
    codesLoad: "Load codes",
    codesFilter: "Filter codes…",
    codesMore: "{count} more; refine the filter.",
    codesNone: "No code found (the value set may need a terminology server).",
    insertCode: "Insert '{code}'",
    constraints: "Constraints",
    conversion: "Conversion",
    conversionDate: "HL7 v2 dates (YYYYMMDD[HHMM[SS]][±ZZZZ]) become FHIR {type}; a time without zone gets the server's offset.",
    conversionDecimal: "Give the text of the number ('6.80') to keep its exact digits; a JavaScript number loses trailing zeros.",
    conversionBoolean: "true/t/y/yes/1 and false/f/n/no/0, case-insensitive; anything else stops the message.",
    conversionInteger: "An integer syntax is checked; FHIR bounds are left to validation.",
    conversionReference: "Use fhirRef('name') for a resource built by another step of this transformer.",
    conversionObject: "An object or array JavaScript value is used as it is (no conversion by profile).",
    references: "References",
    referencesHint: "Resources built by the other steps of this transformer:",
    insertRef: "Insert fhirRef({name})",
    extensions: "Extensions of the profile",
    diagnostics: "Diagnostics",
    goToRule: "Go to rule",
    target: "Target: {target}",
    forms: "Rules on this element",
    instanceOf: "entry {n}"
  },
  source: {
    title: "Source",
    sample: "Sample message",
    dataType: "Data type",
    placeholder: { XML: "<root>...</root>", JSON: '{"field":"value"}', HL7V2: "MSH|^~\\&|...", RAW: "Sample message", DELIMITED: "a,b,c" },
    filter: "Filter fields…",
    empty: "Paste a sample message to see its fields.",
    unreadable: "The sample cannot be read as {type}.",
    dragHint: "Drag a field onto a target element, or click it to insert its path into the selected expression.",
    hideEmpty: "Hide empty fields",
    edit: "Edit sample",
    value: "value",
    inserted: "Inserted into {key}"
  },
  tests: {
    title: "Tests",
    samples: "Sample messages",
    newSample: "New sample",
    fromSource: "From the Source pane",
    sampleName: "Name",
    deleteSample: "Delete this sample",
    expected: "Expected result",
    expectedHint: "Saved with the step. Random identities (urn:uuid) and meta.lastUpdated are ignored in the comparison.",
    setExpected: "Use this result as expected",
    clearExpected: "Clear the expected result",
    run: "Run",
    runAll: "Run all samples",
    allSteps: "All FHIR steps of the transformer",
    allStepsTitle: "Runs every FHIR Profile Mapper step of this transformer in order, with real references and the finalization of the Bundles.",
    thisStep: "This step only (references are stand-ins)",
    trace: "Trace",
    traceValues: "Include scalar values",
    traceValuesTitle: "Explicitly include scalar values in the trace and its JSON export (256 characters per value).",
    maxEvents: "Max events",
    generatedScript: "Generated script",
    hideScript: "Hide the script",
    runsOnServer: "Runs on the server and validates what it makes.",
    permission: "Testing a step runs its code on the server, like a deployed channel: it requires the permission “Test FHIR mapper steps”.",
    validationDisabled: "FHIR validation disabled.",
    valid: "Valid.",
    issues: "{count} validation issue(s):",
    match: "Matches the expected result.",
    mismatch: "Differs from the expected result:",
    noOutput: "No output.",
    events: "Execution trace: {count} event(s)",
    truncated: "truncated",
    exportTrace: "Export trace JSON",
    valuesIncluded: "Scalar values included.",
    valuesNotCaptured: "Runtime values not captured.",
    items: "{count} item(s)",
    passed: "passed",
    failed: "failed",
    results: "Results",
    step: "Step {name}",
    bundles: "Bundles",
    published: "Published: {where}",
    diff: "Compare with expected"
  },
  trace: {
    action: "FHIR mapping trace",
    actionTitle: "The trace of the FHIR Profile Mapper steps that processed this message",
    none: "This message has no FHIR mapping trace. Enable “Trace processed messages” on a step and redeploy.",
    title: "FHIR mapping trace of message {id}",
    channel: "Channel {name}, revision {revision}",
    connector: "Connector {name} ({transformer})",
    steps: "Steps: {steps}",
    export: "Export JSON"
  },
  fml: {
    title: "FHIR Mapping Language",
    tabs: { properties: "Properties", map: "Map", tests: "Tests" },
    context: "FHIR context",
    source: "Source model",
    sourceOie: "OIE message (generic model)",
    sourceHl7: "HL7 v2 logical model of an IG",
    sourceFhir: "FHIR resource",
    sourceHint: "How the message is given to the map: the generic OieMessage model, a typed HL7 v2 logical model of the context (Strict Parser), or the FHIR resource it already is.",
    sourceModelUrl: "Root logical model",
    sourceModelUrlHint: "Canonical URL of the message's logical model, e.g. …/StructureDefinition/ORU__R01.",
    naming: "Naming convention",
    namingHint: "How OIE's XML names become element names: dots to underscores and underscores doubled (aphm), or unchanged.",
    mapKind: "Map",
    mapInline: "Written in this step",
    mapUrl: "A StructureMap of the context",
    mapUrlHint: "Canonical URL of the StructureMap to run.",
    loadMaps: "Load maps",
    noMaps: "No map in this context",
    loadFirst: "Load the maps first",
    chooseMap: "Choose a map…",
    unknownMap: "Map {url} is not in the loaded list.",
    unreadable: "Unreadable files:",
    resultDestination: "Result destination",
    variable: "Variable",
    contextVariables: "Context variables",
    contextVariablesHint: "Variables of the OIE maps ($) copied to context.variable of the model, separated by commas.",
    validation: "Validation",
    validate: "Validate the result",
    validateHint: "Against the profiles in meta.profile, else the base definition. An invalid result stops the message.",
    check: "Check",
    checking: "Checking…",
    noErrors: "No error found in the map.",
    errors: "{count} problem(s) in the map",
    scaffold: "Generate a skeleton…",
    scaffoldTitle: "A map with the uses lines, one group and a commented rule per required target element",
    scaffoldTarget: "Target profile (canonical URL or resource type)",
    scaffoldReplace: "Replace the current map with the skeleton?",
    model: "Model received by the map",
    log: "Transformation log",
    runTest: "Run test",
    permission: "Testing a step requires the permission “Test FHIR FML transforms”.",
    noMap: "Write a map or choose one to run.",
    editorHint: "Ctrl+Space: elements of the source and target models, groups, variables, FHIRPath functions, maps and ConceptMaps of the context.",
    mapTemplateHint: 'map "url" = "name" · uses … as source/target · group name(source src, target tgt) { … }'
  }
};

// src/i18n/locales/fr.js
var fr_default = {
  common: {
    loading: "Chargement…",
    load: "Charger",
    reload: "Recharger",
    run: "Exécuter",
    running: "Exécution…",
    cancel: "Annuler",
    close: "Fermer",
    save: "Enregistrer",
    add: "Ajouter",
    remove: "Retirer",
    apply: "Appliquer",
    copy: "Copier",
    export: "Exporter",
    import: "Importer",
    search: "Rechercher",
    all: "Tous",
    none: "Aucun",
    yes: "oui",
    no: "non",
    undo: "Annuler la modification",
    redo: "Rétablir",
    fullScreen: "Plein écran",
    exitFullScreen: "Quitter le plein écran (Échap)",
    help: "Aide",
    test: "Tester",
    error: "Erreur"
  },
  settings: {
    savedLocally: "Réglages conservés dans ce navigateur seulement : le serveur les a refusés.",
    panelLabel: "FHIR Mapper",
    panelIntro: "Contextes FHIR partagés par toutes les étapes FHIR Profile Mapper et FHIR Mapping Language de ce serveur : packages, serveur de terminologie et politique de validation. Une étape nomme son contexte.",
    contexts: "Contextes FHIR",
    newContext: "Nouveau contexte",
    name: "Nom",
    fhirVersion: "Version FHIR",
    packages: "Packages et fichiers de profils",
    packagesHint: "Un chemin par ligne, sur le serveur OIE : fichiers, dossiers ou packages .tgz.",
    terminologyServer: "Serveur de terminologie",
    terminologyHint: "Vide : traduction locale avec les ConceptMaps des packages.",
    authorization: "Authorization (JavaScript)",
    cache: "Cache (secondes)",
    timeout: "Délai (secondes)",
    validation: "Validation des résultats",
    validationAlways: "toujours",
    validationOff: "désactivée",
    saveContexts: "Enregistrer les contextes",
    saved: "Contextes enregistrés.",
    reloaded: "Contexte rechargé : {count} ressources indexées.",
    deleteContext: "Supprimer ce contexte",
    confirmDelete: "Supprimer le contexte « {name} » ? Les étapes qui le nomment reviendront à leurs propres packages.",
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
    requiredBadge: "{count} élément(s) requis non mappé(s)",
    failedBadge: "Le dernier test a échoué",
    migrated: "Cette étape était au format {from} ; elle est maintenant au format {to}. Enregistrer le canal pour la conserver.",
    noProfile: "Charger un profil cible dans Propriétés pour mapper ses éléments.",
    loadingProfile: "Chargement du profil cible…"
  },
  tree: {
    element: "Élément",
    type: "Type",
    mapping: "Mapping",
    show: "Afficher",
    filterAll: "Tous les éléments",
    filterMustSupport: "Must Support et requis",
    filterMapped: "Mappés seulement",
    filterErrors: "En erreur",
    extensions: "extensions et ids",
    searchPlaceholder: "Rechercher un élément…",
    expandAll: "Tout déplier",
    collapseAll: "Tout replier",
    required: "Requis, non mappés : {keys}",
    mustSupportMissing: "Must Support, non mappés : {keys}",
    complete: "Tous les éléments requis sous les éléments mappés ont un mapping ou une valeur fixe."
  },
  inspector: {
    title: "Élément",
    noSelection: "Sélectionner un élément de l'arbre cible.",
    expression: "Expression",
    note: "Note",
    notePlaceholder: "Pourquoi cette règle, pour le prochain lecteur",
    definition: "Définition",
    binding: "Binding",
    codes: "Codes du jeu de valeurs",
    codesLoad: "Charger les codes",
    codesFilter: "Filtrer les codes…",
    references: "Références",
    diagnostics: "Diagnostics",
    goToRule: "Aller à la règle"
  },
  source: {
    title: "Source",
    sample: "Message exemple",
    dataType: "Type de données",
    filter: "Filtrer les champs…",
    empty: "Coller un message exemple pour voir ses champs.",
    dragHint: "Glisser un champ sur un élément cible, ou cliquer pour insérer son chemin dans l'expression sélectionnée.",
    hideEmpty: "Masquer les champs vides",
    edit: "Modifier l'exemple"
  },
  tests: {
    title: "Tests",
    samples: "Messages exemples",
    newSample: "Nouvel exemple",
    run: "Exécuter",
    runAll: "Exécuter tous les exemples",
    allSteps: "Toutes les étapes FHIR du transformeur",
    thisStep: "Cette étape seulement (références simulées)",
    trace: "Trace",
    expected: "Résultat attendu",
    setExpected: "Prendre ce résultat comme attendu",
    match: "Conforme au résultat attendu.",
    mismatch: "Différent du résultat attendu :",
    valid: "Valide.",
    validationDisabled: "Validation FHIR désactivée.",
    generatedScript: "Script généré",
    hideScript: "Masquer le script"
  },
  trace: { action: "Trace du mapping FHIR", none: "Ce message n'a pas de trace de mapping FHIR. Activer « Trace processed messages » sur une étape et redéployer." },
  fml: {
    tabs: { properties: "Propriétés", map: "Map", tests: "Tests" },
    context: "Contexte FHIR",
    source: "Modèle source",
    sourceOie: "Message OIE (modèle générique)",
    sourceHl7: "Modèle logique HL7 v2 d'un IG",
    sourceFhir: "Ressource FHIR",
    mapInline: "Écrite dans cette étape",
    mapUrl: "Une StructureMap du contexte",
    check: "Vérifier",
    noErrors: "Aucune erreur dans la map.",
    errors: "{count} problème(s) dans la map",
    scaffold: "Générer un squelette…",
    runTest: "Exécuter le test",
    model: "Modèle reçu par la map"
  }
};

// src/i18n/index.js
var CATALOGS = { en: en_default, fr: fr_default };
var FALLBACK = "en";
var locale = FALLBACK;
function resolveLocale(preferred = []) {
  for (const tag of preferred) {
    if (!tag) continue;
    if (CATALOGS[tag]) return tag;
    const base = tag.split("-")[0];
    if (CATALOGS[base]) return base;
  }
  return FALLBACK;
}
function setLocale(preferred) {
  locale = resolveLocale(preferred);
}

// src/shared/styles/tokens.css
var tokens_default = "/* SPDX-License-Identifier: MPL-2.0\n * Design tokens of the FHIR Mapper editors, derived from the Web Admin variables\n * so both themes follow the host. Other style sheets use --fm-* only.\n */\n.fm {\n  --fm-canvas: var(--bg1, #f3f6f9);\n  --fm-surface: var(--bg2, #ffffff);\n  --fm-sunken: var(--bg0, #e9edf2);\n  --fm-raised: var(--bg3, #e1e9f1);\n  --fm-line: var(--line, #cdd7e0);\n  --fm-line-strong: var(--line-strong, #aebbc8);\n  --fm-ink: var(--text, #1f2c38);\n  --fm-dim: var(--text-dim, #4d6173);\n  --fm-faint: var(--text-faint, #7d8fa0);\n  --fm-accent: var(--accent, #2e6da4);\n  --fm-accent-ink: var(--accent-ink, #ffffff);\n  --fm-ok: var(--ok, #2e9e4f);\n  --fm-warn: var(--warn, #b97f0a);\n  --fm-error: var(--err, #cc3b3b);\n  --fm-must-support: color-mix(in srgb, var(--fm-warn) 80%, var(--fm-ink));\n  --fm-mapped: color-mix(in srgb, var(--fm-accent) 10%, var(--fm-surface));\n  --fm-selected: color-mix(in srgb, var(--fm-accent) 18%, var(--fm-surface));\n  --fm-branch: color-mix(in srgb, var(--fm-accent) 4%, var(--fm-surface));\n  --fm-radius: 8px;\n  --fm-radius-small: 5px;\n  --fm-font: var(--font-ui, system-ui, sans-serif);\n  --fm-mono: var(--font-mono, ui-monospace, monospace);\n  --fm-shadow: 0 1px 2px color-mix(in srgb, var(--fm-ink) 10%, transparent);\n  --fm-shadow-raised: 0 12px 30px -10px color-mix(in srgb, var(--fm-ink) 45%, transparent);\n  --fm-control: 26px;\n  color: var(--fm-ink);\n  font-family: var(--fm-font);\n  font-size: 12.5px;\n  line-height: 1.4;\n  container-type: inline-size;\n  min-width: 0;\n}\n\n:where(.fm) *, :where(.fm) *::before, :where(.fm) *::after { box-sizing: border-box; }\n:where(.fm) button { font: inherit; color: inherit; }\n.fm :focus-visible { outline: 2px solid var(--fm-accent); outline-offset: 1px; }\n.fm .fm-mono { font-family: var(--fm-mono); font-size: 12px; }\n.fm .fm-muted { color: var(--fm-dim); font-size: 11.5px; }\n.fm .fm-faint { color: var(--fm-faint); font-size: 11px; }\n.fm .fm-error { color: var(--fm-error); }\n.fm .fm-warn { color: var(--fm-warn); }\n.fm .fm-ok { color: var(--fm-ok); }\n";

// src/shared/styles/controls.css
var controls_default = "/* SPDX-License-Identifier: MPL-2.0\n * Controls shared by the editors: tabs, badges, toolbars, panes, popovers, menus.\n */\n.fm .fm-tabs { display: flex; gap: 2px; margin-bottom: 10px; border-bottom: 1px solid color-mix(in srgb, var(--fm-faint) 35%, transparent); align-items: center; }\n.fm .fm-tabs [role=tab] { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; margin-bottom: -1px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--fm-faint); font: inherit; font-weight: 600; cursor: pointer; }\n.fm .fm-tabs [role=tab]:hover { color: var(--fm-ink); }\n.fm .fm-tabs [role=tab][aria-selected=true] { color: var(--fm-ink); border-bottom-color: var(--fm-accent); }\n.fm .fm-tabs [role=tab]:focus-visible { outline: 2px solid var(--fm-accent); outline-offset: -2px; }\n.fm .fm-tabs__end { margin-left: auto; display: flex; gap: 6px; align-items: center; }\n.fm .fm-badge { min-width: 16px; padding: 0 5px; border-radius: 8px; background: var(--fm-error); color: white; font-size: 11px; line-height: 16px; text-align: center; font-weight: 600; }\n.fm .fm-badge--warn { background: var(--fm-warn); }\n.fm .fm-badge--ok { background: var(--fm-ok); }\n.fm .fm-badge--muted { background: var(--fm-faint); }\n\n.fm .fm-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin-bottom: 8px; }\n.fm .fm-toolbar select { width: auto; max-width: 100%; height: var(--fm-control); min-height: var(--fm-control); padding: 2px 6px; }\n.fm .fm-toolbar input[type=search], .fm .fm-toolbar input[type=text] { height: var(--fm-control); min-height: var(--fm-control); padding: 2px 8px; width: auto; flex: 1 1 160px; min-width: 120px; }\n.fm .fm-toolbar .fm-spacer { flex: 1 1 auto; }\n.fm .fm-tool { display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: var(--fm-control); min-width: var(--fm-control); padding: 0 8px; border: 1px solid var(--fm-line); border-radius: var(--fm-radius-small); background: var(--fm-surface); cursor: pointer; white-space: nowrap; font-size: 12px; }\n.fm .fm-tool:hover:not(:disabled) { border-color: var(--fm-line-strong); background: var(--fm-raised); }\n.fm .fm-tool:disabled { opacity: 0.5; cursor: default; }\n.fm .fm-tool--active { border-color: var(--fm-accent); color: var(--fm-accent); font-weight: 600; }\n.fm .fm-tool--small { height: 22px; min-width: 22px; padding: 0 5px; font-size: 11px; }\n.fm .fm-tool--primary { background: var(--fm-accent); color: var(--fm-accent-ink); border-color: var(--fm-accent); }\n.fm .fm-tool--primary:hover:not(:disabled) { background: color-mix(in srgb, var(--fm-accent) 85%, black); }\n.fm .fm-tool--link { border: 0; background: none; color: var(--fm-accent); padding: 0 4px; }\n.fm .fm-tool--danger { color: var(--fm-error); }\n\n.fm .fm-settings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; align-items: start; }\n.fm .fm-settings > *, .fm .field { min-width: 0; }\n.fm .fm-settings .field { margin-bottom: 0; }\n.fm .fm-wide { grid-column: 1 / -1; }\n.fm .fm-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }\n.fm .fm-row input[type=text] { flex: 1 1 240px; min-width: 0; width: auto; }\n.fm .fm-row select { flex: none; width: auto; }\n.fm .fm-row button { flex: none; white-space: nowrap; }\n.fm .fm-checks { display: flex; flex-wrap: wrap; gap: 8px 18px; }\n.fm .check { white-space: nowrap; }\n.fm .fm-box { padding: 12px; border: 1px solid color-mix(in srgb, var(--fm-accent) 40%, var(--fm-line)); border-radius: var(--fm-radius); background: color-mix(in srgb, var(--fm-accent) 6%, var(--fm-surface)); }\n.fm .fm-box__title { margin-bottom: 4px; font-weight: 600; }\n.fm .fm-card { margin-top: 10px; padding: 10px 12px; border: 1px solid var(--fm-line); border-radius: var(--fm-radius-small); background: var(--fm-surface); }\n.fm .fm-choice { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; text-transform: none; letter-spacing: normal; font-weight: 600; }\n.fm .fm-choice input[type=checkbox] { width: 16px; height: 16px; margin: 0; flex: none; }\n.fm .fm-request { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 10px; margin-top: 10px; }\n.fm .fm-message { padding: 6px 10px; border-radius: var(--fm-radius-small); margin: 6px 0; font-size: 12px; }\n.fm .fm-message--error { background: color-mix(in srgb, var(--fm-error) 10%, var(--fm-surface)); color: var(--fm-error); }\n.fm .fm-message--warn { background: color-mix(in srgb, var(--fm-warn) 12%, var(--fm-surface)); color: var(--fm-warn); }\n.fm .fm-message--info { background: color-mix(in srgb, var(--fm-accent) 10%, var(--fm-surface)); color: var(--fm-ink); }\n.fm .fm-message--ok { background: color-mix(in srgb, var(--fm-ok) 10%, var(--fm-surface)); color: var(--fm-ok); }\n.fm pre.fm-code { max-height: 360px; overflow: auto; font-size: 11px; background: color-mix(in srgb, var(--fm-ink) 3%, transparent); padding: 6px; border-radius: var(--fm-radius-small); white-space: pre-wrap; margin: 4px 0; }\n.fm details > summary { cursor: pointer; }\n\n/* Menus and popovers */\n.fm-menu { position: fixed; z-index: 1000; min-width: 220px; padding: 4px; border: 1px solid var(--fm-line-strong, #aebbc8); border-radius: 6px; background: var(--bg2, white); color: var(--text, #1f2c38); box-shadow: 0 8px 24px #0004; font-size: 12px; }\n.fm-menu [role=menuitem] { display: flex; justify-content: space-between; gap: 12px; width: 100%; padding: 6px 10px; border: 0; background: none; text-align: left; cursor: pointer; border-radius: 4px; color: inherit; font: inherit; }\n.fm-menu [role=menuitem]:hover, .fm-menu [role=menuitem]:focus-visible { background: var(--fm-selected, #dbeafe); outline: none; }\n.fm-menu [role=menuitem]:disabled { opacity: 0.5; cursor: default; }\n.fm-menu hr { margin: 4px 0; border: 0; border-top: 1px solid var(--fm-line, #cdd7e0); }\n.fm-menu kbd { color: var(--fm-faint, #7d8fa0); font-family: inherit; font-size: 11px; }\n\n/* Plain-input completion popover (fallback without Monaco) */\n.fm-functions { position: fixed; inset: auto; margin: 0; padding: 4px; border: 1px solid #94a3b8; border-radius: 6px; background: var(--bg2, white); color: var(--text, #1e293b); box-shadow: 0 4px 16px #0003; overflow: auto; box-sizing: border-box; z-index: 1000; }\n.fm-functions [role=option] { padding: 6px 8px; cursor: pointer; border-radius: 4px; font-size: 12px; white-space: normal; }\n.fm-functions [aria-selected=true] { background: var(--fm-selected, #dbeafe); color: var(--text, #1e293b); }\n.fm-functions code { display: block; overflow-wrap: anywhere; }\n\n/* Full screen */\n.fm-overlay { position: fixed; inset: 0; z-index: 900; display: flex; flex-direction: column; background: var(--bg1, #f3f6f9); color: var(--text, #1f2c38); }\n.fm-overlay__head { flex: none; display: flex; align-items: center; gap: 14px; padding: 8px 14px; border-bottom: 1px solid var(--line, #cdd7e0); background: var(--bg2, #fff); }\n.fm-overlay__title { font-weight: 600; }\n.fm-overlay__body { flex: 1; min-height: 0; overflow: auto; padding: 14px 18px; background: var(--bg2, #fff); }\n\n/* One-line expression editor */\n.fm-code-editor--line { width: 100%; height: 26px; min-height: 26px !important; border-radius: 4px; overflow: hidden; }\n.fm-code-editor--line .ce-gutter { display: none; }\n.fm-code-editor--line textarea.ce-area { height: 26px; min-height: 26px; padding: 3px 6px; resize: none; white-space: nowrap; overflow: hidden; }\n.fm-code-editor--line .monaco-host { height: 26px; }\n.fm-code-editor--invalid { outline: 1px solid var(--err, #cc3b3b); }\n.mapper-expression-editing { flex: 1 1 auto; min-width: 160px; }\n\n.fhir-profile-mapper.mapper-fullscreen { position: fixed; inset: 0; z-index: 900; overflow: auto; padding: 14px 18px; background: var(--bg2, #fff); color: var(--text, #1f2c38); }\n";

// src/styles.js
var STYLE_SHEETS = [tokens_default, controls_default];

// src/host/code-editor.js
var OWNER = "fhir-mapper";
var SCOPE_LIB = "ts:fhir-mapper-scope.d.ts";
var models = /* @__PURE__ */ new Map();
var providerRegistered = false;
var scopeLib = null;
var monaco = () => (
  /** @type {any} */
  window.monaco || null
);
function kindOf(m, kind) {
  const kinds = m.languages.CompletionItemKind;
  return kind === "function" ? kinds.Function : kind === "variable" ? kinds.Variable : kind === "path" ? kinds.Field : kind === "snippet" ? kinds.Snippet : kinds.Text;
}
function registerProvider(m) {
  if (providerRegistered) return;
  providerRegistered = true;
  m.languages.registerCompletionItemProvider("javascript", {
    triggerCharacters: ["'", "["],
    provideCompletionItems(model, position) {
      const entry = models.get(model.uri.toString());
      if (!entry) return { suggestions: [] };
      const word = model.getWordUntilPosition(position);
      const line = model.getLineContent(position.lineNumber);
      const before = line.slice(0, position.column - 1);
      const quotes = (before.match(/'/g) || []).length + (before.match(/"/g) || []).length;
      const inString = quotes % 2 === 1;
      const afterDot = before.trimEnd().endsWith(".");
      if (afterDot && !inString) return { suggestions: [] };
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
      const suggestions = [];
      for (const item of entry.getItems({ inString })) {
        suggestions.push({
          label: item.label,
          filterText: item.filterText || item.label,
          kind: kindOf(m, item.kind),
          detail: item.detail,
          documentation: item.documentation,
          insertText: item.insertText,
          sortText: item.sortText,
          range,
          insertTextRules: item.snippet ? m.languages.CompletionItemInsertTextRule.InsertAsSnippet : void 0
        });
      }
      return { suggestions };
    }
  });
}
function installScope(m, dts) {
  try {
    const defaults = m.languages.typescript?.javascriptDefaults;
    if (!defaults) return;
    if (scopeLib) scopeLib.dispose();
    scopeLib = defaults.addExtraLib(dts, SCOPE_LIB);
  } catch {
  }
}
function singleLine(m, instance, el, onEnter) {
  instance.updateOptions({
    lineNumbers: "off",
    glyphMargin: false,
    folding: false,
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 0,
    renderLineHighlight: "none",
    scrollBeyondLastLine: false,
    scrollBeyondLastColumn: 2,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    scrollbar: { vertical: "hidden", horizontal: "hidden", alwaysConsumeMouseWheel: false, handleMouseWheel: false },
    wordWrap: "off",
    minimap: { enabled: false },
    fixedOverflowWidgets: true,
    contextmenu: false,
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on",
    find: { addExtraSpaceOnTop: false },
    padding: { top: 3, bottom: 3 },
    renderWhitespace: "none",
    cursorBlinking: "smooth",
    lineHeight: 18
  });
  el.style.height = "26px";
  instance.layout();
  instance.addCommand(m.KeyCode.Enter, () => onEnter?.(), "!suggestWidgetVisible");
  instance.addCommand(m.KeyCode.Enter | m.KeyMod.Shift, () => onEnter?.(), "!suggestWidgetVisible");
  instance.onDidChangeModelContent(() => {
    const value = instance.getValue();
    if (value.includes("\n")) instance.setValue(value.replace(/\s*\n\s*/g, " "));
  });
}
function createExpressionEditor(options) {
  const { value = "", onChange, onEnter, onFocus, onBlur, placeholder, ariaLabel, completionScope, multiline = false, language = "javascript", getItems, getDts, minHeight } = options;
  const editor = platform().createCodeEditor({
    value,
    language,
    onChange,
    completionScope,
    ariaLabel,
    minHeight: multiline ? minHeight || "120px" : void 0,
    popoutable: multiline,
    popoutTitle: ariaLabel
  });
  const el = editor.el;
  el.classList.add("fm-code-editor", multiline ? "fm-code-editor--multi" : "fm-code-editor--line");
  if (placeholder) el.dataset.placeholder = placeholder;
  const area = el.querySelector("textarea");
  if (area) {
    if (placeholder) area.placeholder = placeholder;
    area.addEventListener("focus", () => onFocus?.());
    area.addEventListener("blur", () => onBlur?.());
    if (!multiline) area.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onEnter?.();
      }
    });
  }
  let disposed = false;
  let instance = null;
  const subscriptions = [];
  const upgraded = () => {
    const m = monaco();
    instance = editor.monaco;
    if (!m || !instance || disposed) return;
    registerProvider(m);
    const model = instance.getModel();
    const uri = model.uri.toString();
    if (getItems) models.set(uri, { getItems, getDts });
    if (!multiline) singleLine(m, instance, el, onEnter);
    if (!multiline) {
      const text = instance.getValue();
      instance.setPosition({ lineNumber: 1, column: text.length + 1 });
    }
    subscriptions.push(instance.onDidFocusEditorText(() => {
      if (getDts) installScope(m, getDts());
      onFocus?.();
    }));
    subscriptions.push(instance.onDidBlurEditorText(() => onBlur?.()));
    updatePlaceholder();
    subscriptions.push(instance.onDidChangeModelContent(updatePlaceholder));
    if (pendingMarkers) setMarkers(pendingMarkers);
  };
  const updatePlaceholder = () => {
    if (instance) el.classList.toggle("fm-code-editor--empty", !instance.getValue());
  };
  const watch = setInterval(() => {
    if (disposed) {
      clearInterval(watch);
      return;
    }
    if (editor.monaco) {
      clearInterval(watch);
      upgraded();
    }
  }, 50);
  setTimeout(() => clearInterval(watch), 15e3);
  let pendingMarkers = null;
  const setMarkers = (messages) => {
    pendingMarkers = messages;
    const m = monaco();
    if (!m || !instance) return;
    const model = instance.getModel();
    const text = model.getValue();
    const lines = text.split("\n");
    m.editor.setModelMarkers(model, OWNER, (messages || []).map((message) => ({
      severity: m.MarkerSeverity.Error,
      message,
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: lines.length,
      endColumn: (lines[lines.length - 1]?.length || 0) + 1
    })));
    el.classList.toggle("fm-code-editor--invalid", !!(messages && messages.length));
  };
  const insert = (text) => {
    if (instance) {
      const m = monaco();
      const pos = instance.getPosition();
      instance.executeEdits("fhir-mapper", [{ range: new m.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text, forceMoveMarkers: true }]);
      instance.focus();
      return;
    }
    if (area) {
      const start = area.selectionStart ?? area.value.length;
      const end = area.selectionEnd ?? start;
      area.value = area.value.slice(0, start) + text + area.value.slice(end);
      area.selectionStart = area.selectionEnd = start + text.length;
      area.dispatchEvent(new Event("input", { bubbles: true }));
      area.focus();
    }
  };
  return {
    el,
    getValue: () => editor.getValue(),
    setValue: (text) => {
      if (editor.getValue() !== (text ?? "")) editor.setValue(text ?? "");
      updatePlaceholder();
    },
    focus: () => editor.focus && editor.focus(),
    setMarkers,
    insert,
    hasMonaco: () => !!instance,
    dispose: () => {
      disposed = true;
      clearInterval(watch);
      for (const s of subscriptions) s.dispose?.();
      if (instance) models.delete(instance.getModel()?.uri.toString());
      try {
        editor.dispose && editor.dispose();
      } catch {
      }
      el.remove();
    }
  };
}

// src/fhir/completion.js
var SNIPPETS = [
  { name: "guard", label: "guard optional (x != null ? x : undefined)", insert: "${1:value} != null ? ${1:value} : undefined", description: "Give nothing when the source is missing, instead of a TypeError." },
  { name: "repetition", label: "nth repetition if present", insert: "${1:msg['PID']['PID.3']}.length() > ${2:1} ? ${1:msg['PID']['PID.3']}[${2:1}]${3:['PID.3.1']}.toString() : undefined", description: "HL7 v2 repetition guarded by its count." },
  { name: "find", label: "fhirFind(list, function)", insert: "fhirFind(${1:list}, function (${2:item}) { return ${3:condition}; })", description: "First item of a list matching a condition." },
  { name: "filter", label: "fhirFilter(list, function)", insert: "fhirFilter(${1:list}, function (${2:item}) { return ${3:condition}; })", description: "Items of a list matching a condition." },
  { name: "ternary", label: "condition ? a : b", insert: "${1:condition} ? ${2:a} : ${3:b}", description: "A choice between two values." }
];
function monacoItems(functions, context = {}, sampleValues = /* @__PURE__ */ new Map()) {
  const items = [];
  for (const fn of functions) {
    if (context.role && !fn.contexts.includes(context.role)) continue;
    const params = (fn.parameters || []).map((p) => p.name);
    items.push({
      label: fn.signature,
      filterText: fn.name,
      kind: "function",
      insertText: params.length ? `${fn.name}(${params.map((p, i) => `\${${i + 1}:${p}}`).join(", ")})` : `${fn.name}()`,
      snippet: true,
      detail: `FHIR Mapper · ${fn.returnType || ""}`,
      documentation: `${fn.description}

Example: ${fn.example}`,
      sortText: `1${fn.name}`
    });
  }
  for (const name of context.variables || []) {
    items.push({ label: name, kind: "variable", insertText: name, detail: name.endsWith("Index") ? "iteration index (0, 1, …)" : "iteration item", sortText: `0${name}` });
  }
  if (context.role === "translation") {
  }
  for (const path of context.paths || []) {
    const value = sampleValues.get(path);
    items.push({ label: path, kind: "path", insertText: path, detail: value == null ? "sample path" : `sample: ${String(value).slice(0, 60)}`, documentation: "From the sample message; guard optional values.", sortText: `2${path}` });
  }
  for (const s of SNIPPETS) {
    items.push({ label: s.label, filterText: s.name, kind: "snippet", insertText: s.insert, snippet: true, detail: "snippet", documentation: s.description, sortText: `3${s.name}` });
  }
  return items;
}
function scopeDts(functions, context = {}) {
  const lines = ["// FHIR Profile Mapper: functions of the runtime and variables of this expression's scope."];
  for (const fn of functions) {
    const params = (fn.parameters || []).map((p) => `${p.name}${p.optional ? "?" : ""}: any`).join(", ");
    lines.push(`/** ${fn.description} Example: ${fn.example} */`, `declare function ${fn.name}(${params}): ${tsType(fn.returnType)};`);
  }
  for (const name of context.variables || []) {
    lines.push(`/** ${name.endsWith("Index") ? "Index of the current item of the iteration (0, 1, …)." : "Current item of the iteration."} */`, `declare const ${name}: ${name.endsWith("Index") ? "number" : "any"};`);
  }
  return lines.join("\n") + "\n";
}
function tsType(returnType) {
  const t = String(returnType || "any");
  if (t === "string") return "string";
  if (t === "string[]") return "string[]";
  if (/undefined/.test(t)) return "any";
  if (/\[\]$/.test(t)) return "any[]";
  if (t === "number") return "number";
  return "any";
}

// src/fhir/history.js
function snapshot(state) {
  return {
    values: [...state.values],
    iterations: [...state.iterations].map(([k, v]) => [k, { ...v }]),
    translations: [...state.translations].map(([k, v]) => [k, { ...v }]),
    conditions: [...state.conditions],
    notes: [...state.notes || []],
    disabled: [...state.disabled || []],
    instances: [...state.instances || []]
  };
}
function restore(state, snap) {
  state.values = new Map(snap.values);
  state.iterations = new Map(snap.iterations.map(([k, v]) => [k, { ...v }]));
  state.translations = new Map(snap.translations.map(([k, v]) => [k, { ...v }]));
  state.conditions = new Map(snap.conditions);
  state.notes = new Map(snap.notes);
  state.disabled = new Set(snap.disabled);
  state.instances = new Map(snap.instances);
}

// src/profile-mapper/legacy-editor.js
var PKG = "org.oie.fhir.mapper";
var MAPPER_TYPE = `${PKG}.FhirProfileMapperStep`;
var MAPPER_API2 = "/extensions/fhir-profile-mapper";
var FHIR_BASE = "http://hl7.org/fhir/StructureDefinition/";
var MAPPER_STYLES = `
.fhir-profile-mapper { container-type: inline-size; min-width: 0; }
.fhir-profile-mapper .mapper-settings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; align-items: start; }
.fhir-profile-mapper .mapper-settings > *, .fhir-profile-mapper .field { min-width: 0; }
.fhir-profile-mapper .mapper-settings .field { margin-bottom: 0; }
.fhir-profile-mapper .mapper-wide { grid-column: 1 / -1; }
.fhir-profile-mapper .mapper-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.fhir-profile-mapper .mapper-actions input[type=text] { flex: 1 1 240px; min-width: 0; width: auto; }
.fhir-profile-mapper .mapper-actions select { flex: none; width: auto; }
.fhir-profile-mapper .mapper-actions button { flex: none; white-space: nowrap; }
.fhir-profile-mapper .mapper-checks { display: flex; flex-wrap: wrap; gap: 10px 20px; }
.fhir-profile-mapper .check { white-space: nowrap; }
.fhir-profile-mapper .mapper-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-bottom: 8px; }
.fhir-profile-mapper .mapper-toolbar select { width: auto; max-width: 100%; }
.fhir-profile-mapper .mapper-toolbar .hint { flex: 1 1 280px; }
.fhir-profile-mapper .mapper-expression { display: inline-flex; width: 100%; min-width: 0; }
.fhir-profile-mapper .mapper-functions { position: fixed; inset: auto; margin: 0; padding: 4px; border: 1px solid #94a3b8; border-radius: 6px; background: var(--bg, white); color: var(--text, #1e293b); box-shadow: 0 4px 16px #0003; overflow: auto; box-sizing: border-box; }
.fhir-profile-mapper .mapper-functions [role=option] { padding: 6px 8px; cursor: pointer; border-radius: 4px; font-size: 12px; white-space: normal; }
.fhir-profile-mapper .mapper-functions [aria-selected=true] { background: #dbeafe; color: #1e293b; }
.fhir-profile-mapper .mapper-functions code { display: block; overflow-wrap: anywhere; }
.fhir-profile-mapper table.mapper-tree td { padding: 3px 8px; }
.fhir-profile-mapper .mapper-tree input:not([type=checkbox]), .fhir-profile-mapper .mapper-tree select { box-sizing: border-box; height: 26px; min-height: 26px; padding: 2px 6px; line-height: 20px; }
.fhir-profile-mapper .mapper-tree .mapper-expression { padding: 0; min-height: 0; vertical-align: middle; }
.fhir-profile-mapper .mapper-tree .btn { height: 22px; min-height: 22px; line-height: 18px; font-size: 11px; }
.fhir-profile-mapper .mapper-help { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; flex: 0 0 16px; width: 16px; height: 16px; min-height: 0; padding: 0; margin: 0; border: 1px solid currentColor; border-radius: 50%; font-size: 11px; line-height: 1; text-decoration: none; }
.fhir-profile-mapper .mapper-help:focus-visible { outline: 2px solid var(--accent, #2563eb); outline-offset: 2px; }
.fhir-profile-mapper .mapper-tree tbody > tr > td:first-child { position: relative; border-left: 2px solid transparent; }
.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr > td { background: color-mix(in srgb, var(--accent, #2563eb) 4%, var(--bg2, white)); }
.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr > td:first-child { border-left-color: color-mix(in srgb, var(--accent, #2563eb) 40%, transparent); }
.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr:first-child > td { border-top: 1px solid color-mix(in srgb, var(--accent, #2563eb) 25%, transparent); background: color-mix(in srgb, var(--accent, #2563eb) 8%, var(--bg2, white)); }
.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr:last-child > td { border-bottom: 1px solid color-mix(in srgb, var(--accent, #2563eb) 25%, transparent); }
.fhir-profile-mapper .mapper-node-open .mapper-node-label { font-weight: 600; }
.fhir-profile-mapper .mapper-tree tr:focus-within > td, .fhir-profile-mapper .mapper-tree .mapper-branch-open tr:focus-within > td { background: color-mix(in srgb, var(--accent, #2563eb) 12%, var(--bg2, white)); }
.fhir-profile-mapper .mapper-tree-guides { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.fhir-profile-mapper .mapper-tree-guides i { position: absolute; top: -1px; bottom: -1px; border-left: 1px solid color-mix(in srgb, var(--text-faint, #64748b) 45%, transparent); }
.fhir-profile-mapper .mapper-tree-guides b { position: absolute; top: 50%; width: 20px; border-top: 1px solid color-mix(in srgb, var(--text-faint, #64748b) 45%, transparent); }
.fhir-profile-mapper .bundle-routing { padding: 14px; border: 1px solid #93c5fd; border-radius: 8px; background: color-mix(in srgb, #3b82f6 7%, var(--bg, white)); }
.fhir-profile-mapper .bundle-routing-title { margin-bottom: 4px; font-weight: 600; }
.fhir-profile-mapper .bundle-target { margin-top: 10px; padding: 12px; border: 1px solid #bfdbfe; border-radius: 6px; background: var(--bg, white); }
.fhir-profile-mapper .bundle-choice { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; text-transform: none; letter-spacing: normal; font-weight: 600; }
.fhir-profile-mapper .bundle-choice input[type=checkbox] { width: 16px; height: 16px; margin: 0; flex: none; }
.fhir-profile-mapper .bundle-request { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 10px; margin-top: 10px; }
.fhir-profile-mapper .bundle-target .field { margin-top: 8px; }
.fhir-profile-mapper .mapper-tabs { display: flex; gap: 2px; margin-bottom: 12px; border-bottom: 1px solid color-mix(in srgb, var(--text-faint, #64748b) 35%, transparent); }
.fhir-profile-mapper .mapper-tabs [role=tab] { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; margin-bottom: -1px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--text-faint, #64748b); font: inherit; font-weight: 600; cursor: pointer; }
.fhir-profile-mapper .mapper-tabs [role=tab]:hover { color: var(--text, #1e293b); }
.fhir-profile-mapper .mapper-tabs [role=tab][aria-selected=true] { color: var(--text, #1e293b); border-bottom-color: var(--accent, #2563eb); }
.fhir-profile-mapper .mapper-tabs [role=tab]:focus-visible { outline: 2px solid var(--accent, #2563eb); outline-offset: -2px; }
.fhir-profile-mapper .mapper-tab-badge { min-width: 16px; padding: 0 5px; border-radius: 8px; background: #b91c1c; color: white; font-size: 11px; line-height: 16px; text-align: center; }
.fhir-profile-mapper .mapper-tab-panel > details:first-child, .fhir-profile-mapper .mapper-tab-panel > .mapper-settings + details { margin-top: 14px; }
@container (max-width: 640px) {
  .fhir-profile-mapper .mapper-settings { grid-template-columns: minmax(0, 1fr); }
}
`;
var React2 = null;
var h2 = (...args) => React2.createElement(...args);
var MAPPER_FUNCTIONS = [];
var mapperFunctionsRequest = null;
function functionCompletion(value, caret, selectionEnd = caret, context = {}, forced = false) {
  const before = value.slice(0, caret).replace(/"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?|`(?:\\.|[^`\\])*`?|\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/g, (s) => " ".repeat(s.length));
  const token = /[A-Za-z_$][\w$]*$/.exec(before);
  if (caret && before[caret - 1] !== value[caret - 1]) return null;
  if ((!token || token[0].length < 3) && !forced) return null;
  const start = token ? token.index : caret;
  if (before.slice(0, start).trimEnd().endsWith(".")) return null;
  const symbols = [
    ...MAPPER_FUNCTIONS.filter((fn) => !context.role || fn.contexts.includes(context.role)),
    ...[.../* @__PURE__ */ new Set(["msg", "tmp", "channelMap", "sourceMap", "connectorMap", "configurationMap", ...context.variables || []])].map((name) => ({ name, signature: name, example: name, description: "Variable available in this scope.", kind: "variable" })),
    ...(context.paths || []).map((name) => ({ name, signature: name, example: name, description: "Source path from the sample; guard optional values.", kind: "path" }))
  ];
  const prefix = token ? token[0] : "";
  const items = symbols.filter((fn) => fn.name.startsWith(prefix) || forced && `${fn.signature} ${fn.description}`.toLowerCase().includes(prefix.toLowerCase()));
  if (!items.length) return null;
  const end = selectionEnd > caret ? selectionEnd : caret + /^[\w$]*/.exec(value.slice(caret))[0].length;
  return { start, end, items };
}
function completeFunction(value, completion, fn) {
  const tail = value.slice(completion.end);
  const text = !fn.kind && /^\s*\(/.test(tail) ? fn.name : fn.example;
  return { value: value.slice(0, completion.start) + text + tail, caret: completion.start + text.length };
}
function mapperSourcePaths(sample) {
  const paths = [];
  const add = (path) => {
    if (!paths.includes(path) && paths.length < 200) paths.push(path);
  };
  try {
    if (sample.dataType === "JSON") {
      const walk = (value, path, depth) => {
        if (depth > 5 || paths.length >= 200 || !value || typeof value !== "object") return;
        if (Array.isArray(value)) {
          if (value.length) {
            add(`${path}[0]`);
            walk(value[0], `${path}[0]`, depth + 1);
          }
        } else for (const key of Object.keys(value)) {
          const next = `${path}[${JSON.stringify(key)}]`;
          add(next);
          walk(value[key], next, depth + 1);
        }
      };
      walk(JSON.parse(sample.message), "msg", 0);
    } else if (sample.dataType === "XML") {
      const doc = new DOMParser().parseFromString(sample.message, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) return [];
      const walk = (node, path, depth) => {
        if (depth > 5 || paths.length >= 200) return;
        for (const child of node.children) {
          const next = `${path}[${JSON.stringify(child.localName)}]`;
          add(next);
          walk(child, next, depth + 1);
        }
      };
      walk(doc.documentElement, "msg", 0);
    }
  } catch {
  }
  return paths;
}
function mapperHelpUrl(version, type, key = type) {
  const release = ["R4", "R4B", "R5"].includes(version) ? version : "R4";
  if (!/^[A-Z][A-Za-z0-9]+$/.test(type || "")) return `https://hl7.org/fhir/${release}/`;
  const field = key.split(".")[1]?.replace(/:[^.]*/, "").replace(/\[\d+\]/g, "");
  return `https://hl7.org/fhir/${release}/${type.toLowerCase()}-definitions.html#${encodeURIComponent(type + (field ? "." + field : ""))}`;
}
function mapperJsonImport(element, text) {
  const patch = JSON.parse(text);
  if (!patch || Array.isArray(patch) || typeof patch !== "object") throw new Error("Expected a step JSON object.");
  for (const key of ["__proto__", "constructor", "prototype"]) if (Object.prototype.hasOwnProperty.call(patch, key)) throw new Error(`Invalid step property: ${key}`);
  if (patch.__type && patch.__type !== MAPPER_TYPE) throw new Error("This is not a FHIR Profile Mapper step.");
  const merged = {
    ...element,
    ...patch,
    __type: element.__type || MAPPER_TYPE,
    sequenceNumber: element.sequenceNumber,
    enabled: element.enabled
  };
  if (!["resource", "createBundle"].includes(merged.action) || !merged.resourceType) throw new Error("An action and resourceType are required.");
  for (const field of ["mappings", "bundleTargets"]) {
    if (typeof (merged[field] ?? "[]") !== "string" || !Array.isArray(JSON.parse(merged[field] || "[]")))
      throw new Error(`${field} must be a string containing a JSON array.`);
  }
  const allowed = /* @__PURE__ */ new Set(["id", "key", "element", "type", "expression", "path", "each", "variable", "condition", "fixed", "when", "translate"]);
  for (const rule of JSON.parse(merged.mappings || "[]")) {
    if (!rule || typeof rule !== "object" || !Array.isArray(rule.path)) throw new Error("Every rule needs a path.");
    for (const key of Object.keys(rule)) if (!allowed.has(key)) throw new Error(`Unknown rule property: ${key}`);
  }
  merged.mappings = JSON.stringify(mapperRuleIds(JSON.parse(merged.mappings || "[]"), parseMappings(element.mappings)));
  return merged;
}
function mapperRuleIds(entries, previous = [], createId = () => crypto.randomUUID()) {
  const identity = (rule) => `${"each" in rule ? "each" : "condition" in rule ? "condition" : "fixed" in rule ? "fixed" : "value"}:${rule.key || rule.element}`;
  const known = new Map(previous.filter((rule) => rule.id).map((rule) => [identity(rule), rule.id]));
  const used = /* @__PURE__ */ new Set();
  return entries.map((rule) => {
    const id = rule.id === void 0 ? known.get(identity(rule)) || createId() : rule.id;
    if (typeof id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(id) || used.has(id)) throw new Error("Rule ids must be valid and unique within a step.");
    used.add(id);
    return { ...rule, id };
  });
}
function mapperCompletionContext(node, iterationMap, paths, role = "value") {
  const iterations = [];
  for (let current2 = role === "iteration" ? node?.parent : node; current2; current2 = current2.parent) {
    const iteration = iterationMap.get(current2.key);
    if (iteration) iterations.push(iteration);
  }
  const variables = iterations.flatMap((it) => [it.variable, `${it.variable}Index`]);
  if (role === "translation") variables.push("code", "system");
  const normalize = (path) => path.replace(/\[['"]([^'"]+)['"]\]/g, (_, key) => `[${JSON.stringify(key)}]`);
  const aliases = paths.map((path) => {
    let alias = path;
    for (let round = 0; round < iterations.length; round++) {
      for (const it of iterations) {
        const prefix = normalize(it.expression.trim());
        if (alias.startsWith(prefix + "[")) alias = it.variable + alias.slice(prefix.length).replace(/^\[0\]/, "");
      }
    }
    return alias;
  });
  return { role, variables, paths: [.../* @__PURE__ */ new Set([...paths, ...aliases])], targetType: node?.code };
}
function isCompletionShortcut(e) {
  return (e.code === "Space" || e.key === " " || e.key === " ") && !e.metaKey && !e.shiftKey && e.ctrlKey !== e.altKey;
}
var COMPLETION_HINT = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "") ? "⌥Space (or ⌃Space) for suggestions" : "Ctrl+Space or Alt+Space for suggestions";
function MapperExpression({ style, onChange, completionContext = {}, ...props }) {
  const input = React2.useRef(null);
  const popup = React2.useRef(null);
  const selection = React2.useRef({});
  const caret = React2.useRef(null);
  const id = React2.useId();
  const [menu, setMenu] = React2.useState(null);
  const [active, setActive] = React2.useState(0);
  const update = (el, forced = false) => {
    const next = { value: el.value, start: el.selectionStart, end: el.selectionEnd };
    const previous = selection.current;
    if (!forced && previous.value === next.value && previous.start === next.start && previous.end === next.end) return;
    selection.current = next;
    setMenu(functionCompletion(el.value, el.selectionStart, el.selectionEnd, completionContext, forced));
    setActive(0);
  };
  const accept = (fn) => {
    const next = completeFunction(input.current.value, menu, fn);
    caret.current = next.caret;
    onChange({ target: { value: next.value } });
    setMenu(null);
  };
  React2.useLayoutEffect(() => {
    if (caret.current !== null) {
      input.current.focus();
      input.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });
  React2.useLayoutEffect(() => {
    const panel = popup.current;
    if (!menu) {
      if (panel.matches(":popover-open")) panel.hidePopover();
      return;
    }
    const position = (e) => {
      if (e?.type === "scroll" && panel.contains(e.target)) return;
      const box = input.current.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) {
        setMenu(null);
        return;
      }
      const width = Math.min(Math.max(box.width, 360), window.innerWidth - 16);
      const below = window.innerHeight - box.bottom - 8;
      const above = box.top - 8;
      const down = below >= Math.min(260, above);
      panel.style.width = `${width}px`;
      panel.style.left = `${Math.max(8, Math.min(box.left, window.innerWidth - width - 8))}px`;
      panel.style.top = down ? `${box.bottom + 4}px` : "auto";
      panel.style.bottom = down ? "auto" : `${window.innerHeight - box.top + 4}px`;
      panel.style.maxHeight = `${Math.min(300, Math.max(0, down ? below : above))}px`;
      if (!panel.matches(":popover-open")) panel.showPopover();
      const selected = panel.children[active];
      if (selected.offsetTop < panel.scrollTop) panel.scrollTop = selected.offsetTop;
      else if (selected.offsetTop + selected.offsetHeight > panel.scrollTop + panel.clientHeight)
        panel.scrollTop = selected.offsetTop + selected.offsetHeight - panel.clientHeight;
    };
    position();
    window.addEventListener("scroll", position, true);
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("scroll", position, true);
      window.removeEventListener("resize", position);
    };
  }, [menu, active]);
  return h2(
    "span",
    { className: "mapper-expression", style },
    h2("input", {
      ...props,
      ref: input,
      type: "text",
      autoComplete: "off",
      role: "combobox",
      "aria-label": props["aria-label"] || "JavaScript expression",
      title: props.title || `${completionContext.role || "value"}${completionContext.targetType ? ` → FHIR ${completionContext.targetType}` : ""}. ${COMPLETION_HINT}.`,
      "aria-autocomplete": "list",
      "aria-expanded": !!menu,
      "aria-controls": id,
      "aria-activedescendant": menu ? `${id}-${active}` : void 0,
      style: { ...style, flex: void 0, width: "100%", minWidth: 0 },
      onChange: (e) => {
        onChange(e);
        update(e.target);
      },
      onSelect: (e) => update(e.target),
      onBlur: () => setMenu(null),
      onKeyDown: (e) => {
        if (e.nativeEvent.isComposing) return;
        if (isCompletionShortcut(e)) {
          e.preventDefault();
          e.stopPropagation();
          update(e.target, true);
          return;
        }
        if (!menu) return;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setActive((active + (e.key === "ArrowDown" ? 1 : menu.items.length - 1)) % menu.items.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          accept(menu.items[active]);
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          setMenu(null);
        }
      }
    }),
    h2(
      "div",
      { ref: popup, id, popover: "manual", role: "listbox", "aria-label": "Mapper functions", className: "mapper-functions" },
      menu ? menu.items.map((fn, index) => h2("div", {
        key: fn.name,
        id: `${id}-${index}`,
        role: "option",
        "aria-selected": index === active,
        onMouseDown: (e) => e.preventDefault(),
        onClick: () => accept(fn)
      }, h2("code", null, fn.signature + (fn.returnType ? ` → ${fn.returnType}` : "")), h2("div", null, fn.description), h2("code", null, fn.example))) : null
    )
  );
}
function ExpressionField(props) {
  const [editing, setEditing] = React2.useState(false);
  const host = React2.useRef(null);
  const editor = React2.useRef(null);
  const latest = React2.useRef(props);
  latest.current = props;
  const available = typeof createExpressionEditor === "function" && typeof document !== "undefined";
  React2.useEffect(() => {
    if (!editing || !host.current) return void 0;
    const context = () => latest.current.completionContext || {};
    let ed;
    try {
      ed = createExpressionEditor({
        value: latest.current.value ?? "",
        ariaLabel: latest.current["aria-label"] || "JavaScript expression",
        onChange: (value) => latest.current.onChange({ target: { value } }),
        onEnter: () => setEditing(false),
        getItems: () => monacoItems(MAPPER_FUNCTIONS, context()),
        getDts: () => scopeDts(MAPPER_FUNCTIONS, context())
      });
    } catch (error) {
      console.error("[fhir-mapper] expression editor:", error);
      setEditing(false);
      return void 0;
    }
    editor.current = ed;
    host.current.appendChild(ed.el);
    ed.focus();
    const focusWhenReady = setInterval(() => {
      if (ed.hasMonaco()) {
        clearInterval(focusWhenReady);
        ed.focus();
      }
    }, 60);
    const outside = (e) => {
      if (host.current && !host.current.contains(e.target) && !e.target.closest?.(".suggest-widget, .monaco-hover, .parameter-hints-widget")) setEditing(false);
    };
    const onKey = (e) => {
      if (e.key === "Tab" && host.current?.contains(e.target) && !document.querySelector(".suggest-widget.visible")) setEditing(false);
    };
    document.addEventListener("mousedown", outside, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      clearInterval(focusWhenReady);
      document.removeEventListener("mousedown", outside, true);
      document.removeEventListener("keydown", onKey, true);
      editor.current = null;
      ed.dispose();
    };
  }, [editing]);
  React2.useEffect(() => {
    if (editor.current && (props.value ?? "") !== editor.current.getValue()) editor.current.setValue(props.value ?? "");
  }, [props.value]);
  if (!available || !editing || props.disabled) return h2(MapperExpression, { ...props, onFocus: () => {
    if (available && !props.disabled) setEditing(true);
  } });
  return h2("span", { className: "mapper-expression mapper-expression-editing", style: props.style, ref: host });
}
var sdPromises = /* @__PURE__ */ new Map();
var sdLoaded = /* @__PURE__ */ new Map();
var sdKey = (version, profiles, url) => `${version}|${profiles}|${url}`;
function indexSd(sd) {
  const elements = sd.snapshot && sd.snapshot.element || [];
  const byParent = /* @__PURE__ */ new Map();
  const byId = /* @__PURE__ */ new Map();
  for (const el of elements) byId.set(el.id, el);
  for (const el of elements.slice(1)) {
    const parent = el.id.slice(0, el.id.lastIndexOf("."));
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(el);
  }
  return { sd, root: elements[0], byParent, byId };
}
function fetchSd(platform2, version, profiles, url) {
  const key = sdKey(version, profiles, url);
  if (!sdPromises.has(key)) {
    const promise = platform2.api.get(`${MAPPER_API2}/structure`, { url, fhirVersion: version, profiles }, { raw: true }).then((text) => {
      const index = indexSd(JSON.parse(text));
      sdLoaded.set(key, index);
      return index;
    }).catch((e) => {
      sdPromises.delete(key);
      throw e;
    });
    sdPromises.set(key, promise);
  }
  return sdPromises.get(key);
}
function errorText(e) {
  const body = e && e.body || "";
  const m = /<detailMessage>([\s\S]*?)<\/detailMessage>/.exec(body);
  if (m) return m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  return e && e.message || String(e);
}
var cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
var lastSegment = (id) => id.slice(id.lastIndexOf(".") + 1);
var shortType = (code) => (code || "").replace("http://hl7.org/fhirpath/System.", "").replace(/^http:\/\/hl7\.org\/fhirpath\//, "");
var isPrimitive = (code) => /^[a-z]/.test(code) || code.startsWith("http://hl7.org/fhirpath/");
var NOT_EXPANDED = /* @__PURE__ */ new Set(["Resource", "BackboneElement", "Element"]);
function fixedOf(el) {
  for (const k of Object.keys(el)) {
    if (/^(fixed|pattern)[A-Z]/.test(k)) return { kind: k.startsWith("fixed") ? "fixed" : "pattern", value: el[k] };
  }
  return null;
}
function hiddenElement(el, parent, showAll) {
  if (el.max === "0") return true;
  const name = lastSegment(el.id).split(":")[0];
  if (showAll) return (el.type || []).some((t) => t.code === "Resource");
  if ((name === "extension" || name === "modifierExtension") && !el.sliceName) return true;
  if (name === "id" && !parent.resourceRoot) return true;
  return (el.type || []).some((t) => t.code === "Resource");
}
function makeTree(rootIndex, ctx) {
  const root = {
    key: rootIndex.sd.type,
    label: rootIndex.sd.type,
    el: rootIndex.root,
    sdx: rootIndex,
    path: [],
    depth: 0,
    resourceRoot: true,
    instance: 0,
    index: 0,
    code: rootIndex.sd.type,
    min: 1,
    max: "1"
  };
  const cache = /* @__PURE__ */ new Map();
  function makeNode(parent, el, sdx, choiceType, instance, index) {
    const name = lastSegment(el.id).split(":")[0];
    let types = el.type || [];
    let sliceName = el.sliceName || null;
    let jsonName;
    let label;
    let choice = false;
    if (choiceType) {
      types = [choiceType];
      jsonName = name.replace("[x]", "") + cap(choiceType.code);
      label = jsonName;
      sliceName = null;
    } else if (name.endsWith("[x]")) {
      const base = name.slice(0, -3);
      const sliced = sliceName ? types.filter((t) => base + cap(t.code) === sliceName) : [];
      if (sliced.length === 1) types = sliced;
      if (types.length === 1) {
        jsonName = sliceName && sliceName.startsWith(base) ? sliceName : base + cap(types[0].code);
        label = jsonName;
        sliceName = null;
      } else {
        choice = true;
        label = sliceName ? `${name}:${sliceName}` : name;
        jsonName = null;
      }
    } else {
      jsonName = name;
      label = sliceName ? `${name}:${sliceName}` : name;
    }
    const baseMax = el.base && el.base.max || el.max || "1";
    const repeats = !choiceType && !choice && baseMax !== "1" && baseMax !== "0";
    const keyBase = `${parent.key}.${label}`;
    const key = keyBase + (instance ? `[${instance}]` : "");
    const segment = repeats ? [jsonName, `${sliceName || ""}#${instance}`] : [jsonName];
    const code = types.length === 1 ? types[0].code : null;
    const primitive = !!code && isPrimitive(code);
    let typeUrl = null;
    if (!choice && code && !primitive && !NOT_EXPANDED.has(code)) {
      typeUrl = types[0].profile && types[0].profile[0] || FHIR_BASE + code;
    }
    return {
      key,
      keyBase,
      label,
      jsonName,
      el,
      sdx,
      choiceType,
      choice,
      sliceName,
      repeats,
      instance,
      index,
      path: jsonName == null ? parent.path : parent.path.concat([segment]),
      code,
      primitive,
      typeUrl,
      types,
      min: choiceType ? parent.min : el.min,
      max: choiceType ? parent.max : el.max,
      short: el.short || "",
      mustSupport: !!el.mustSupport || (choiceType ? parent.mustSupport : false),
      fixed: choiceType ? null : fixedOf(el),
      depth: parent.depth + 1,
      parent
    };
  }
  function childElements(node) {
    if (node.choice) return node.types.map((t) => ({ el: node.el, sdx: node.sdx, choiceType: t }));
    const own = node.choiceType ? [] : node.sdx.byParent.get(node.el.id) || [];
    if (own.length) return own.map((el) => ({ el, sdx: node.sdx }));
    if (!node.typeUrl) return [];
    const typeIndex = sdLoaded.get(sdKey(ctx.version, ctx.profiles, node.typeUrl));
    if (!typeIndex) return null;
    return (typeIndex.byParent.get(typeIndex.root.id) || []).map((el) => ({ el, sdx: typeIndex }));
  }
  function children(node) {
    if (cache.has(node.key)) return cache.get(node.key);
    const elements = childElements(node);
    if (elements === null) return null;
    const list = [];
    for (const { el, sdx, choiceType } of elements) {
      if (!choiceType && hiddenElement(el, node, ctx.showAll)) continue;
      const first = makeNode(node, el, sdx, choiceType, 0, list.length);
      const count = Math.max(1, ctx.instances.get(first.keyBase) || 1);
      list.push(first);
      for (let i = 1; i < count; i++) list.push(makeNode(node, el, sdx, choiceType, i, list.length));
    }
    cache.set(node.key, list);
    return list;
  }
  const expandable = (node) => node.choice || !!node.typeUrl || !node.choiceType && (node.sdx.byParent.get(node.el.id) || []).length > 0;
  function chain(key) {
    if (key === root.key) return [root];
    if (!key.startsWith(root.key + ".")) return null;
    const result = [root];
    let node = root;
    for (const segment of key.slice(root.key.length + 1).split(".")) {
      const list = children(node);
      if (!list) return null;
      node = list.find((n) => n.key === `${node.key}.${segment}`);
      if (!node) return null;
      result.push(node);
    }
    return result;
  }
  function discriminators(node) {
    if (!node.sliceName) return [];
    const base = node.sdx.byId.get(node.el.id.replace(/:[^.:]+$/, ""));
    return (base && base.slicing && base.slicing.discriminator || []).map((d) => d.path).filter((p) => p && p !== "$this");
  }
  return { root, children, expandable, chain, discriminators };
}
function instancesOf(keys) {
  const instances = /* @__PURE__ */ new Map();
  for (const key of keys) {
    const parts = key.split(".");
    for (let i = 1; i < parts.length; i++) {
      const m = /^(.*)\[(\d+)\]$/.exec(parts[i]);
      if (m) {
        const keyBase = parts.slice(0, i).join(".") + "." + m[1];
        instances.set(keyBase, Math.max(instances.get(keyBase) || 1, Number(m[2]) + 1));
      }
    }
  }
  return instances;
}
function parseMappings(text) {
  try {
    const list = JSON.parse(text || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
function compile(tree, values, iterations, translations, conditions) {
  const entries = [];
  const fixed = /* @__PURE__ */ new Map();
  for (const [key, it] of iterations) {
    const nodes = it.expression.trim() ? tree.chain(key) : null;
    if (!nodes) continue;
    const node = nodes[nodes.length - 1];
    if (node !== tree.root && !node.repeats) continue;
    entries.push({ key, each: it.expression.trim(), variable: (it.variable || "item").trim(), path: node.path, order: node === tree.root ? [] : nodes.map((n) => n.index) });
  }
  for (const [key, condition] of conditions) {
    const nodes = condition.trim() ? tree.chain(key) : null;
    if (!nodes) continue;
    const node = nodes[nodes.length - 1];
    entries.push({ key, condition: condition.trim(), path: node.path, order: node === tree.root ? [] : nodes.map((n) => n.index) });
  }
  const mapped = new Set([...values.keys()].filter((k) => values.get(k).trim() !== ""));
  for (const key of mapped) {
    const nodes = tree.chain(key);
    if (!nodes) continue;
    const leaf = nodes[nodes.length - 1];
    if (leaf.choice) continue;
    const entry = {
      key,
      element: key,
      type: shortType(leaf.code),
      expression: values.get(key).trim(),
      path: leaf.path,
      order: nodes.map((n) => n.index)
    };
    const t = translations.get(key);
    if (t && t.conceptMap && t.conceptMap.trim()) {
      entry.translate = { conceptMap: t.conceptMap.trim(), source: (t.source || "").trim(), target: (t.target || "").trim(), unmapped: t.unmapped || "none", keepSource: !!t.keepSource };
      if (entry.translate.unmapped === "fixed" || entry.translate.unmapped === "function") entry.translate.value = (t.value || "").trim();
    }
    entries.push(entry);
    const onChain = new Set(nodes.map((n) => n.key));
    for (const container of nodes.slice(0, -1)) {
      const when = container.path.length;
      if (container !== tree.root && container.fixed && container.jsonName != null && !fixed.has(container.key)) {
        fixed.set(container.key, { key: container.key, element: container.key, fixed: container.fixed.value, when, path: container.path });
      }
      const discriminators = tree.discriminators(container);
      const walk = (node, rel, required) => {
        for (const d of tree.children(node) || []) {
          if (d.instance || onChain.has(d.key) || mapped.has(d.key) || d.jsonName == null) continue;
          const path = rel ? `${rel}.${d.jsonName}` : d.jsonName;
          const req = required && Number(d.min) >= 1;
          if (d.fixed && (req || discriminators.includes(path))) {
            if (!fixed.has(d.key)) fixed.set(d.key, { key: d.key, element: d.key, fixed: d.fixed.value, when, path: d.path });
          } else if (req || discriminators.some((p) => p.startsWith(path + "."))) {
            walk(d, path, req);
          }
        }
      };
      walk(container, "", true);
    }
  }
  const cmp = (a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
    return a.length - b.length;
  };
  entries.sort((a, b) => cmp(a.order, b.order));
  return [...entries.map(({ order, ...e }) => e), ...fixed.values()];
}
function completeness(tree, saved) {
  const entries = saved.filter((e) => e.key || e.element).map((e) => ({ ...e, key: e.key || e.element }));
  const covered = (node) => entries.some((e) => e.key === node.key || e.key.startsWith(node.key + ".") || e.key.startsWith(node.key + ":") || e.key.startsWith(node.key + "[") && /^\[\d+\]/.test(e.key.slice(node.key.length)));
  const required = [];
  const mustSupport = [];
  const walk = (node) => {
    for (const child of tree.children(node) || []) {
      if (child.instance || child.choiceType) continue;
      if (covered(child) || child.fixed) {
        if (!child.primitive) walk(child);
      } else if (Number(child.min) >= 1) {
        required.push(child.key);
      } else if (child.mustSupport) {
        mustSupport.push(child.key);
      }
    }
  };
  walk(tree.root);
  return { required, mustSupport };
}
function inserted(before, after) {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let end = 0;
  while (end < before.length - start && end < after.length - start && before[before.length - 1 - end] === after[after.length - 1 - end]) end++;
  const text = after.slice(start, after.length - end);
  return text.length > 1 ? { start, end: after.length - end, text } : null;
}
var asBool = (v, def) => v === void 0 || v === null || v === "" ? def : v === true || v === "true";
var fixedText = (f) => typeof f.value === "object" ? JSON.stringify(f.value) : String(f.value);
var TRANSLATABLE = /* @__PURE__ */ new Set(["code", "string", "Coding", "CodeableConcept"]);
var isLocalServer = (server) => !String(server || "").trim() || String(server).trim().toLowerCase() === "n/a";
var escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function substitute(text, iterations) {
  for (const it of iterations) {
    const prefix = it.expression.trim().replace(/\.toString\(\)$/, "");
    if (!prefix) continue;
    const m = new RegExp("^" + escapeRegExp(prefix) + "(\\[\\d+\\])?").exec(text);
    if (m) return (it.variable || "item") + text.slice(m[0].length);
  }
  return text;
}
function mapperContext(platform2, element) {
  const channel = platform2.store?.getState("editingChannel");
  if (!channel) return null;
  const connectors = [channel.sourceConnector, ...platform2.oie.destinationsOf(channel) || []].filter(Boolean);
  const matches = [];
  for (const connector of connectors) {
    for (const transformer of [connector.transformer, connector.responseTransformer]) {
      const steps = platform2.oie.elementsToArray(transformer?.elements);
      const index = steps.findIndex((s) => s.__type === MAPPER_TYPE && String(s.sequenceNumber) === String(element.sequenceNumber) && s.name === element.name && s.profileUrl === element.profileUrl);
      if (index >= 0) matches.push({ channel, connector, transformer, steps, index, response: transformer === connector.responseTransformer });
    }
  }
  return matches.length === 1 ? matches[0] : null;
}
function mapperBundleDeclarations(platform2, element) {
  const ctx = mapperContext(platform2, element);
  return ctx ? ctx.steps.slice(0, ctx.index).filter((s) => s.__type === MAPPER_TYPE && s.action === "createBundle" && asBool(s.enabled, true)) : [];
}
function mapperSample(platform2, element) {
  const ctx = mapperContext(platform2, element);
  const message = ctx?.transformer.inboundTemplate || "";
  const inbound = ctx?.transformer.inboundDataType || "HL7V2";
  const dataType = inbound === "FHIR" ? message.trim().startsWith("{") ? "JSON" : "XML" : ["HL7V2", "XML", "JSON", "RAW"].includes(inbound) ? inbound : "RAW";
  const key = ctx ? `fhir-profile-mapper-sample:${ctx.channel.id}:${ctx.connector.metaDataId}:${ctx.response ? "response" : "transformer"}` : "fhir-profile-mapper-sample:unknown";
  return { key, sample: { message, dataType } };
}
function mapperDiagnostic(error) {
  const step = error.step || {};
  const label = [
    step.name || (step.sequenceNumber ? `Step ${step.sequenceNumber}` : ""),
    error.phase,
    error.errorType,
    error.key,
    error.line ? `line ${error.line}` : ""
  ].filter(Boolean).join(" · ");
  const target = Array.isArray(error.path) ? [step.resourceType || "", ...error.path.map(([name, instance]) => name + (instance === void 0 ? "" : `[${instance}]`))].filter(Boolean).join(".") : "";
  const kind = error.operation === "iteration" ? "each" : error.operation === "condition" ? "condition" : error.phase === "translation" ? "translate" : "value";
  return { label, target, kind };
}
function mapperTraceRows(trace) {
  return trace.events.map((event) => ({
    event,
    label: mapperDiagnostic({ ...event, step: trace.step }).label,
    duration: `${(Number(event.durationNanos) / 1e6).toFixed(3)} ms`,
    iterations: (event.iterations || []).map((item) => `rule ${item.ruleIndex}, item ${item.index}`).join(" / ")
  }));
}
function mapperTraceExport(trace) {
  return JSON.stringify(trace, null, 2);
}
function downloadMapperTrace(trace) {
  const url = URL.createObjectURL(new Blob([mapperTraceExport(trace)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `fhir-mapper-trace-${trace.id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function ProfileMapperEditor({ element, onChange, platform: platform2 }) {
  const [, rerender] = React2.useReducer((x) => x + 1, 0);
  const tabId = React2.useId();
  const state = React2.useRef(null);
  if (state.current === null) {
    const saved = parseMappings(element.mappings);
    const values = /* @__PURE__ */ new Map();
    const iterations = /* @__PURE__ */ new Map();
    const translations = /* @__PURE__ */ new Map();
    const conditions = /* @__PURE__ */ new Map();
    for (const e of saved) {
      const key = e.key || e.element;
      if (!key) continue;
      if (typeof e.each === "string") iterations.set(key, { expression: e.each, variable: e.variable || "item" });
      else if (typeof e.condition === "string") conditions.set(key, e.condition);
      else if (typeof e.expression === "string") values.set(key, e.expression);
      if (e.translate && typeof e.translate === "object") translations.set(key, { ...e.translate });
    }
    const initial = mapperSample(platform2, element);
    let sample = initial.sample;
    try {
      sample = JSON.parse(localStorage.getItem(initial.key) || "null") || sample;
    } catch {
    }
    state.current = {
      values,
      iterations,
      translations,
      conditions,
      // shown when something below an extension, modifierExtension or id (that "extensions & ids" shows) is mapped
      showAll: [...values.keys(), ...iterations.keys(), ...conditions.keys()].some((k) => /\.(extension|modifierExtension|id)(\[\d+\])?(\.|$)/.test(k)),
      sample,
      sampleKey: initial.key,
      testResult: null,
      scriptResult: null,
      testing: false,
      traceOptions: { enabled: false, captureValues: false, maxEvents: 200 },
      versionNotice: "",
      instances: instancesOf([...values.keys(), ...iterations.keys(), ...translations.keys(), ...conditions.keys()]),
      conceptMaps: null,
      tests: /* @__PURE__ */ new Map(),
      expanded: /* @__PURE__ */ new Set(),
      rootIndex: null,
      loading: false,
      error: "",
      unresolved: [],
      notice: "",
      profileList: null,
      sourcePaths: [],
      jsonDraft: "",
      filter: "all",
      search: "",
      undo: [],
      redo: [],
      current: null,
      lastPush: 0,
      // An existing mapping opens on its rules; a new step on its properties.
      tab: saved.length ? "mapper" : "properties"
    };
  }
  const st = state.current;
  React2.useEffect(() => {
    let active = true;
    if (!mapperFunctionsRequest) mapperFunctionsRequest = platform2.api.get(`${MAPPER_API2}/functions`, {}, { raw: true }).then((text2) => {
      MAPPER_FUNCTIONS = JSON.parse(text2);
    }).catch((error) => {
      mapperFunctionsRequest = null;
      throw error;
    });
    mapperFunctionsRequest.then(() => {
      if (active) rerender();
    }).catch((error) => {
      if (active) {
        st.error = `Function catalogue: ${errorText(error)}`;
        rerender();
      }
    });
    return () => {
      active = false;
    };
  }, []);
  React2.useEffect(() => {
    let active = true;
    const sample = { ...st.sample };
    st.sourcePaths = mapperSourcePaths(sample);
    rerender();
    const timer = setTimeout(async () => {
      if (sample.dataType !== "HL7V2" || !sample.message.trim()) return;
      try {
        const text2 = await platform2.api.post(`${MAPPER_API2}/source`, JSON.stringify(sample), { contentType: "text/plain", raw: true });
        if (active) {
          st.sourcePaths = mapperSourcePaths(JSON.parse(text2));
          rerender();
        }
      } catch {
        if (active) {
          st.sourcePaths = [];
          rerender();
        }
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [st, st.sample.message, st.sample.dataType]);
  const version = element.fhirVersion || "R4";
  const profiles = element.profiles || "";
  const ctx = { version, profiles, instances: st.instances, showAll: st.showAll };
  const tree = st.rootIndex ? makeTree(st.rootIndex, ctx) : null;
  const revealDiagnostic = (error) => {
    const chain = st.rootIndex && makeTree(st.rootIndex, { ...ctx, showAll: true }).chain(error.key);
    if (!chain) {
      st.notice = `The element ${error.key} is not in the loaded profile.`;
    } else {
      st.showAll = true;
      st.filter = "all";
      for (const node of chain.slice(0, -1)) st.expanded.add(node.key);
      st.pendingDiagnostic = { key: error.key, kind: mapperDiagnostic(error).kind };
      st.tab = "mapper";
    }
    rerender();
  };
  const diagnosticRef = (key, kind) => (node) => {
    if (node && st.pendingDiagnostic?.key === key && st.pendingDiagnostic.kind === kind) {
      st.pendingDiagnostic = null;
      node.scrollIntoView({ block: "center" });
      node.querySelector("input, textarea")?.focus();
    }
  };
  const diagnosticView = (error, id) => {
    const display = mapperDiagnostic(error);
    return h2(
      "div",
      { key: id, style: { color: "#b91c1c", fontSize: "12px", marginBottom: "6px" } },
      h2("strong", null, display.label),
      error.key && tree ? h2("button", { type: "button", className: "btn btn-sm", style: { marginLeft: "6px" }, onClick: () => revealDiagnostic(error) }, "Go to rule") : null,
      h2("div", null, error.message),
      display.target ? h2("div", { style: { fontFamily: "monospace" } }, `Target: ${display.target}`) : null,
      error.expression ? h2("pre", { style: { whiteSpace: "pre-wrap", margin: "4px 0" } }, error.expression) : null
    );
  };
  const allKeys = () => /* @__PURE__ */ new Set([...st.values.keys(), ...st.iterations.keys(), ...st.translations.keys(), ...st.conditions.keys()]);
  const forget = (key) => {
    st.values.delete(key);
    st.iterations.delete(key);
    st.translations.delete(key);
    st.conditions.delete(key);
  };
  const compiled = (index, local) => JSON.stringify(mapperRuleIds(compile(makeTree(index, { ...local, showAll: true }), st.values, st.iterations, st.translations, st.conditions), parseMappings(element.mappings)));
  const save = () => {
    if (!tree) return;
    element.mappings = compiled(st.rootIndex, ctx);
    const snap = snapshot(st);
    if (st.current && JSON.stringify(snap) !== JSON.stringify(st.current)) {
      if (Date.now() - st.lastPush > 1e3) {
        st.undo.push(st.current);
        if (st.undo.length > 100) st.undo.shift();
      }
      st.lastPush = Date.now();
      st.redo = [];
    }
    st.current = snap;
    onChange();
  };
  const travel = (from, to) => {
    if (!from.length || !tree) return;
    to.push(st.current || snapshot(st));
    st.current = from.pop();
    restore(st, st.current);
    st.lastPush = 0;
    element.mappings = compiled(st.rootIndex, { ...ctx, instances: st.instances });
    onChange();
    rerender();
  };
  const toggleFullScreen = () => {
    st.fullScreen = !st.fullScreen;
    rerender();
  };
  React2.useEffect(() => {
    if (!st.fullScreen) return void 0;
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector(".suggest-widget.visible, .mapper-expression-editing")) return;
      st.fullScreen = false;
      rerender();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [st.fullScreen]);
  const load = async (url) => {
    st.loading = true;
    st.error = "";
    st.notice = "";
    st.unresolved = [];
    rerender();
    try {
      const index = await fetchSd(platform2, version, profiles, url);
      const sameProfile = element.profileUrl === url && element.resourceType === index.sd.type;
      st.rootIndex = index;
      if (element.action && index.sd.type === "Bundle") {
        element.action = "createBundle";
        element.bundleTargets = "[]";
        const fixedType = index.byId.get("Bundle.type")?.fixedCode;
        if (fixedType) element.bundleType = fixedType;
      }
      st.expanded.add(index.sd.type);
      const local = { version, profiles, instances: st.instances, showAll: true };
      const unresolved = [];
      for (const key of allKeys()) {
        const parts = key.split(".");
        let found = true;
        for (let i = 1; i <= parts.length && found; i++) {
          const prefix = parts.slice(0, i).join(".");
          let t = makeTree(index, local);
          let nodes = t.chain(prefix);
          if (!nodes) {
            const parentNodes = t.chain(parts.slice(0, i - 1).join("."));
            const parent = parentNodes && parentNodes[parentNodes.length - 1];
            if (parent && parent.typeUrl) {
              await fetchSd(platform2, version, profiles, parent.typeUrl);
              t = makeTree(index, local);
              nodes = t.chain(prefix);
            }
          }
          if (!nodes) found = false;
          else if (i < parts.length) st.expanded.add(prefix);
        }
        if (!found) unresolved.push(key);
      }
      for (let round = 0; round < 4; round++) {
        const t = makeTree(index, local);
        const urls = /* @__PURE__ */ new Set();
        const walk = (node, depth) => {
          for (const d of t.children(node) || []) {
            if (Number(d.min) < 1 || d.instance) continue;
            const kids = t.children(d);
            if (kids === null && d.typeUrl) urls.add(d.typeUrl);
            else if (kids && depth < 6) walk(d, depth + 1);
          }
        };
        for (const key of allKeys()) {
          const nodes = t.chain(key);
          if (nodes) for (const n of nodes.slice(0, -1)) walk(n, 0);
        }
        if (!urls.size) break;
        await Promise.all([...urls].map((u) => fetchSd(platform2, version, profiles, u).catch(() => null)));
      }
      const sdVersion = index.sd.version || "";
      if (sameProfile && element.profileVersion && sdVersion && element.profileVersion !== sdVersion) {
        st.versionNotice = `The profile is now version ${sdVersion}; these mappings were made with version ${element.profileVersion}. Check them (elements no longer in the profile are listed).`;
      }
      if (sameProfile) {
        st.unresolved = unresolved;
        const before = parseMappings(element.mappings).filter((e) => "fixed" in e).length;
        const now = compiled(index, local);
        if (!unresolved.length && JSON.parse(now).filter((e) => "fixed" in e).length > before) {
          element.mappings = now;
          st.notice = "Fixed values of required elements were added to the mappings.";
          onChange();
        }
      } else {
        for (const key of unresolved) forget(key);
        if (unresolved.length) st.notice = `Not in this profile, removed: ${unresolved.join(", ")}.`;
      }
      if (!sameProfile) {
        element.profileUrl = url;
        element.profileVersion = index.sd.version || "";
        element.resourceType = index.sd.type;
        element.mappings = compiled(index, local);
        onChange();
      }
    } catch (e) {
      st.error = errorText(e);
    } finally {
      st.loading = false;
      st.current = snapshot(st);
      rerender();
    }
  };
  React2.useEffect(() => {
    if (element.profileUrl) load(element.profileUrl);
  }, [st]);
  const scriptFor = React2.useRef({ source: null, timer: null });
  React2.useEffect(() => {
    const source = JSON.stringify(element);
    if (source === scriptFor.current.source) return void 0;
    clearTimeout(scriptFor.current.timer);
    scriptFor.current.timer = setTimeout(async () => {
      try {
        const text2 = await platform2.api.post(`${MAPPER_API2}/script`, source, { contentType: "text/plain", raw: true });
        const result = JSON.parse(text2);
        const errors = (result.errors || []).map((e) => `// ${e.key ? `${e.key}: ` : ""}${e.message}`).join("\n");
        Object.defineProperty(element, "script", { value: (errors ? errors + "\n" : "") + (result.script || ""), enumerable: false, writable: true, configurable: true });
        scriptFor.current.source = source;
      } catch {
      }
    }, 800);
    return void 0;
  });
  React2.useEffect(() => () => clearTimeout(scriptFor.current.timer), []);
  const loadProfileList = async () => {
    try {
      const text2 = await platform2.api.get(`${MAPPER_API2}/profiles`, { fhirVersion: version, profiles }, { raw: true });
      st.profileList = JSON.parse(text2);
      st.error = "";
    } catch (e) {
      st.error = errorText(e);
    }
    rerender();
  };
  const toggle = async (node) => {
    if (st.expanded.has(node.key)) {
      st.expanded.delete(node.key);
      rerender();
      return;
    }
    st.expanded.add(node.key);
    rerender();
    if (tree.children(node) === null) {
      try {
        await fetchSd(platform2, version, profiles, node.typeUrl);
      } catch (e) {
        st.error = `${node.typeUrl}: ${errorText(e)}`;
      }
      rerender();
    }
  };
  const setValue = (node, value) => {
    if (value.trim() === "") st.values.delete(node.key);
    else st.values.set(node.key, value);
    save();
    rerender();
  };
  const addInstance = (node) => {
    st.instances.set(node.keyBase, Math.max(1, st.instances.get(node.keyBase) || 1) + 1);
    rerender();
  };
  const removeInstance = (node) => {
    for (const key of allKeys()) {
      if (key === node.key || key.startsWith(node.key + ".")) forget(key);
    }
    st.instances.set(node.keyBase, node.instance);
    save();
    rerender();
  };
  const removeUnresolved = () => {
    for (const key of st.unresolved) forget(key);
    st.unresolved = [];
    save();
    rerender();
  };
  const toggleIteration = (node) => {
    if (st.iterations.has(node.key)) st.iterations.delete(node.key);
    else st.iterations.set(node.key, { expression: "", variable: "item" });
    save();
    rerender();
  };
  const setIteration = (node, prop, value) => {
    st.iterations.get(node.key)[prop] = value;
    save();
    rerender();
  };
  const toggleCondition = (node) => {
    if (st.conditions.has(node.key)) st.conditions.delete(node.key);
    else st.conditions.set(node.key, "");
    save();
    rerender();
  };
  const setCondition = (node, value) => {
    st.conditions.set(node.key, value);
    save();
    rerender();
  };
  const saveSample = () => {
    try {
      localStorage.setItem(st.sampleKey, JSON.stringify(st.sample));
    } catch {
    }
  };
  const runTest = async () => {
    st.testing = true;
    st.testResult = null;
    rerender();
    try {
      const text2 = await platform2.api.post(`${MAPPER_API2}/test`, JSON.stringify({ step: element, message: st.sample.message, dataType: st.sample.dataType, trace: st.traceOptions }), {
        contentType: "text/plain",
        raw: true,
        timeoutMs: 6e4
      });
      st.testResult = JSON.parse(text2);
    } catch (e) {
      const message = errorText(e);
      st.testResult = { output: null, issues: [], errors: [{ key: null, line: null, message: e?.status === 403 || /Test FHIR mapper steps/.test(message) ? "Testing a step runs its code on the server, like a deployed channel: it requires the permission “Test FHIR mapper steps”." : message }] };
    }
    st.testing = false;
    rerender();
  };
  const showScript = async () => {
    if (st.scriptResult) {
      st.scriptResult = null;
      rerender();
      return;
    }
    try {
      const text2 = await platform2.api.post(`${MAPPER_API2}/script`, JSON.stringify(element), { contentType: "text/plain", raw: true });
      st.scriptResult = JSON.parse(text2);
    } catch (e) {
      st.scriptResult = { script: "", errors: [{ key: null, line: null, message: errorText(e) }] };
    }
    rerender();
  };
  const withSubstitution = (node, before, after) => {
    const around = iterationsAround(node);
    const ins = around.length ? inserted(before, after) : null;
    if (!ins || !/^msg\[/.test(ins.text)) return after;
    return after.slice(0, ins.start) + substitute(ins.text, around) + after.slice(ins.end);
  };
  const toggleTranslation = (node) => {
    if (st.translations.has(node.key)) st.translations.delete(node.key);
    else st.translations.set(node.key, { conceptMap: "", source: "", target: "", unmapped: "none" });
    save();
    rerender();
  };
  const setTranslation = (node, prop, value) => {
    st.translations.get(node.key)[prop] = value;
    save();
    rerender();
  };
  const loadConceptMaps = async () => {
    const server = (element.terminologyServer || "").trim();
    const source = `${server}|${profiles}|${version}`;
    if (st.conceptMaps && st.conceptMaps.source === source) return;
    try {
      const text2 = await platform2.api.get(`${MAPPER_API2}/conceptMaps`, { server, profiles, fhirVersion: version }, { raw: true });
      st.conceptMaps = { source, list: JSON.parse(text2) };
      st.error = "";
    } catch (e) {
      st.conceptMaps = { source, list: [] };
      st.error = errorText(e);
    }
    rerender();
  };
  const testTranslation = async (node) => {
    const t = st.translations.get(node.key);
    const test = st.tests.get(node.key) || {};
    test.result = "…";
    st.tests.set(node.key, test);
    rerender();
    try {
      const text2 = await platform2.api.get(
        `${MAPPER_API2}/translate`,
        { server: element.terminologyServer || "", profiles, conceptMap: t.conceptMap, system: t.source || "", code: test.code || "", targetSystem: t.target || "", fhirVersion: version },
        { raw: true }
      );
      const match = JSON.parse(text2);
      test.result = match ? `→ ${[match.system, match.code].filter(Boolean).join("|")}${match.display ? ` (${match.display})` : ""}` : "→ no match (then the rule chosen for no match)";
    } catch (e) {
      test.result = errorText(e);
    }
    rerender();
  };
  const iterationsAround = (node) => {
    const list = [];
    for (let n = node; n; n = n.parent) {
      const it = st.iterations.get(n.key);
      if (it) list.push(it);
    }
    return list;
  };
  const completionFor = (node, role = "value") => mapperCompletionContext(node, st.iterations, st.sourcePaths, role);
  const field = (label, control, hint) => h2("div", { className: "field" }, h2("label", null, label), control, hint ? h2("div", { className: "hint" }, hint) : null);
  const number = (prop, fallback) => h2("input", {
    type: "number",
    min: 0,
    value: element[prop] ?? fallback,
    onChange: (e) => {
      const n = parseInt(e.target.value, 10);
      element[prop] = Number.isFinite(n) && n >= 0 ? n : fallback;
      onChange();
      rerender();
    }
  });
  const text = (prop, placeholder, code) => h2(code ? ExpressionField : "input", {
    completionContext: code ? completionFor(tree?.root, "reference") : void 0,
    type: "text",
    placeholder,
    style: code ? { fontFamily: "monospace", fontSize: "12px" } : void 0,
    value: element[prop] ?? "",
    onChange: (e) => {
      element[prop] = e.target.value;
      onChange();
      rerender();
    }
  });
  const hasMappedBelow = (node) => {
    for (const key of allKeys()) if (key === node.key || key.startsWith(node.key + ".") || key.startsWith(node.key + "[")) return true;
    return false;
  };
  const term = (st.search || "").trim().toLowerCase();
  const matches = (node, depth = 0) => node.key.toLowerCase().includes(term) || depth < 4 && (tree.children(node) || []).some((child) => matches(child, depth + 1));
  const opened = (node) => st.expanded.has(node.key) || !!term && !node.key.toLowerCase().includes(term) && matches(node);
  const visible = (node) => {
    if (element.action === "createBundle" && (node.key === "Bundle.entry" || node.key.startsWith("Bundle.entry."))) return false;
    if (term && !matches(node)) {
      for (let p = node.parent; p; p = p.parent) if (p.depth > 0 && p.key.toLowerCase().includes(term)) return true;
      return false;
    }
    if (st.filter === "mapped") return hasMappedBelow(node);
    if (st.filter === "mustSupport") return node.mustSupport || Number(node.min) >= 1 || hasMappedBelow(node);
    return true;
  };
  const rows = [];
  const rowGroups = [];
  const guides = (node, auxiliary = false) => {
    const levels = [];
    for (let parent = auxiliary ? node : node.parent; parent && parent.depth > 0; parent = parent.parent) levels.push(parent.depth);
    return h2(
      "span",
      { className: "mapper-tree-guides", "aria-hidden": true },
      levels.map((depth) => h2("i", { key: depth, style: { left: `${depth * 20 + 11}px` } })),
      levels.length ? h2("b", { style: { left: `${(auxiliary ? node.depth + 1 : node.depth) * 20 - 9}px` } }) : null
    );
  };
  const blocked = st.loading || st.unresolved.length > 0;
  const addNode = (child, list) => {
    if (!visible(child)) return;
    rows.push(row(child, list));
    if (st.iterations.has(child.key)) rows.push(iterationRow(child));
    if (st.conditions.has(child.key)) rows.push(conditionRow(child));
    if (st.translations.has(child.key)) rows.push(translationRow(child));
    if (opened(child)) addRows(child);
  };
  const addRows = (node) => {
    const list = tree.children(node);
    if (list === null) {
      rows.push(h2("tr", { key: node.key + "/loading" }, h2("td", { colSpan: 3, style: { paddingLeft: `${(node.depth + 1) * 20 + 26}px` } }, guides(node, true), h2("span", { className: "text-text-faint" }, "Loading…"))));
      return;
    }
    for (const child of list) {
      addNode(child, list);
    }
  };
  const row = (node, siblings) => {
    const open = opened(node);
    const canExpand = tree.expandable(node);
    const count = siblings.filter((s) => s.keyBase === node.keyBase).length;
    const iterated = st.iterations.has(node.key);
    const canAdd = !iterated && node.repeats && node.instance === count - 1 && (node.max === "*" || Number(node.max) > count);
    const canIterate = node.repeats && !node.choice;
    const canTranslate = !node.choice && TRANSLATABLE.has(node.code);
    const value = st.values.get(node.key) ?? "";
    const types = node.types.map((t) => shortType(t.code) + (t.profile ? ` (${t.profile.map((p) => p.slice(p.lastIndexOf("/") + 1)).join(", ")})` : "")).join(" | ");
    const placeholder = node.fixed ? `${node.fixed.kind}: ${fixedText(node.fixed)}` : node.choice ? "choose a type below" : "";
    const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
    const tool = (label, title, onClick, active) => h2("button", { type: "button", className: "btn btn-sm", style: { flex: "none", padding: "0 6px", fontWeight: active ? 700 : 400, borderColor: active ? "#2563eb" : void 0 }, title, disabled: blocked, onClick }, label);
    return h2(
      "tr",
      { key: node.key, className: open ? "mapper-node-open" : void 0, "data-depth": node.depth, ref: diagnosticRef(node.key, "value"), title: node.short ? `${node.key}: ${node.short}` : node.key },
      h2(
        "td",
        { style: { paddingLeft: `${node.depth * 20}px` } },
        guides(node),
        h2(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "4px", minWidth: 0 } },
          h2(
            "button",
            {
              type: "button",
              className: "btn btn-sm",
              "aria-expanded": canExpand ? open : void 0,
              "aria-label": `${open ? "Collapse" : "Expand"} ${node.key}`,
              style: { flex: "none", visibility: canExpand ? "visible" : "hidden", minWidth: "22px", padding: "0 4px" },
              onClick: () => toggle(node)
            },
            open ? "▾" : "▸"
          ),
          h2("span", { className: "mapper-node-label", style: { ...ellipsis, minWidth: 0, fontWeight: node.mustSupport || open ? 600 : 400 } }, node.label + (node.instance ? ` [${node.instance}]` : "")),
          h2("span", { className: "text-text-faint", style: { flex: "none", fontSize: "11px" } }, `${node.min ?? 0}..${node.max ?? "*"}`),
          node.mustSupport ? h2("span", { title: "Must Support", style: { flex: "none", color: "#c2410c", fontSize: "11px" } }, "S") : null,
          h2("a", {
            className: "mapper-help",
            href: mapperHelpUrl(version, element.resourceType, node.key),
            target: "_blank",
            rel: "noopener noreferrer",
            title: "Official FHIR definition",
            "aria-label": `FHIR help for ${node.key}`
          }, "?")
        )
      ),
      h2("td", { className: "text-text-faint", style: { ...ellipsis, fontSize: "11px" }, title: types }, types),
      h2(
        "td",
        null,
        h2(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "4px", minWidth: 0 } },
          node.choice ? h2("span", { className: "text-text-faint", style: { ...ellipsis, flex: "1 1 auto", fontSize: "11px" } }, placeholder) : h2(ExpressionField, {
            completionContext: completionFor(node),
            type: "text",
            value,
            disabled: blocked || element.action === "createBundle" && node.key === "Bundle.type",
            placeholder,
            title: value || placeholder,
            style: { flex: "1 1 auto", width: "auto", minWidth: "160px", fontFamily: "monospace", fontSize: "12px" },
            onChange: (e) => setValue(node, withSubstitution(node, value, e.target.value)),
            onDrop: (e) => {
              const dropped = e.dataTransfer && e.dataTransfer.getData("text/plain");
              const around = iterationsAround(node);
              if (!dropped || !around.length) return;
              e.preventDefault();
              const input = e.target;
              const start = input.selectionStart ?? input.value.length;
              const end = input.selectionEnd ?? start;
              setValue(node, input.value.slice(0, start) + substitute(dropped, around) + input.value.slice(end));
            }
          }),
          canAdd ? tool("+", "Add an entry", () => addInstance(node), false) : null,
          node.instance && node.instance === count - 1 ? tool("−", "Remove this entry and its mappings", () => removeInstance(node), false) : null,
          canIterate ? tool("↻", "One entry for each item of a list (for each repetition)", () => toggleIteration(node), iterated) : null,
          canTranslate ? tool("⇄", "Translate the value with ConceptMap/$translate", () => toggleTranslation(node), st.translations.has(node.key)) : null,
          node.choice ? null : tool("?", "Only map this element (and what is below it) when a condition holds", () => toggleCondition(node), st.conditions.has(node.key))
        )
      )
    );
  };
  const subRow = (node, suffix, children) => h2("tr", { key: `${node.key}/${suffix}`, ref: diagnosticRef(node.key, suffix), "data-owner": node.key }, h2("td", { colSpan: 3, style: { paddingLeft: `${node.depth * 20 + 34}px` } }, guides(node, true), h2("div", { style: { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" } }, children)));
  const mono = { fontFamily: "monospace", fontSize: "12px" };
  const iterationRow = (node) => {
    const it = st.iterations.get(node.key);
    const variable = (it.variable || "item").trim() || "item";
    return subRow(node, "each", [
      h2("span", { key: "l", title: node === tree.root ? "One resource for each item" : "One entry of this element for each item" }, node === tree.root ? "↻ One resource for each" : "↻ For each"),
      h2(ExpressionField, { key: "e", completionContext: completionFor(node, "iteration"), value: it.expression, disabled: blocked, placeholder: "msg['PID']['PID.3']", style: { ...mono, flex: "1 1 240px" }, onChange: (e) => setIteration(node, "expression", e.target.value) }),
      h2("span", { key: "a" }, "as"),
      h2("input", { key: "v", type: "text", value: it.variable, disabled: blocked, style: { ...mono, width: "90px" }, onChange: (e) => setIteration(node, "variable", e.target.value) }),
      h2("span", { key: "h", className: "text-text-faint", style: { fontSize: "11px" } }, `below: ${variable} (the item), ${variable}Index (0, 1, …); fields dragged in are rewritten to ${variable}[…]`)
    ]);
  };
  const conditionRow = (node) => subRow(node, "condition", [
    h2("span", { key: "l", title: "What is below this element is only mapped when the condition holds" }, node === tree.root ? "? Only make the resource if" : "? Only if"),
    h2(ExpressionField, {
      completionContext: completionFor(node, "condition"),
      key: "c",
      type: "text",
      value: st.conditions.get(node.key) || "",
      disabled: blocked,
      placeholder: st.iterations.has(node.key) ? `${(st.iterations.get(node.key).variable || "item").trim()}['PID.3.5'].toString() == 'PI'` : "msg['PID']['PID.8']['PID.8.1'].toString() != ''",
      style: { ...mono, flex: "1 1 300px" },
      onChange: (e) => setCondition(node, withSubstitution(node, st.conditions.get(node.key) || "", e.target.value))
    }),
    h2("span", { key: "h", className: "text-text-faint", style: { fontSize: "11px" } }, st.iterations.has(node.key) ? "per item: keeps the items it holds for" : "false, or an error on a missing segment: nothing below")
  ]);
  const translationRow = (node) => {
    const t = st.translations.get(node.key);
    const test = st.tests.get(node.key) || {};
    const maps = st.conceptMaps && st.conceptMaps.list || [];
    const listId = "fhir-profile-mapper-conceptmaps";
    const localTx = isLocalServer(element.terminologyServer);
    const needsValue = t.unmapped === "fixed" || t.unmapped === "function";
    return subRow(node, "translate", [
      h2("span", { key: "l", title: localTx ? "ConceptMap/$translate locally, on the ConceptMaps of the Profile Packages" : "ConceptMap/$translate on the terminology server" }, localTx ? "⇄ ConceptMap (local)" : "⇄ ConceptMap"),
      h2("input", {
        key: "m",
        type: "text",
        list: listId,
        value: t.conceptMap,
        disabled: blocked,
        placeholder: "canonical URL of the ConceptMap",
        style: { ...mono, flex: "1 1 220px" },
        onFocus: loadConceptMaps,
        onChange: (e) => setTranslation(node, "conceptMap", e.target.value)
      }),
      h2("datalist", { key: "d", id: listId }, maps.map((m) => h2("option", { key: m.url, value: m.url }, m.title || m.name || m.url))),
      h2("input", { key: "s", type: "text", value: t.source, disabled: blocked, placeholder: "source system (optional)", title: "system of the source code", style: { ...mono, flex: "1 1 160px" }, onChange: (e) => setTranslation(node, "source", e.target.value) }),
      h2("input", { key: "t", type: "text", value: t.target, disabled: blocked, placeholder: "target system (optional)", title: "targetsystem of $translate", style: { ...mono, flex: "1 1 140px" }, onChange: (e) => setTranslation(node, "target", e.target.value) }),
      h2(
        "select",
        { key: "u", value: t.unmapped || "none", disabled: blocked, title: "When $translate gives no match", onChange: (e) => setTranslation(node, "unmapped", e.target.value) },
        h2("option", { value: "none" }, "no match: leave empty"),
        h2("option", { value: "source" }, "no match: keep the source code"),
        h2("option", { value: "fixed" }, "no match: fixed value"),
        h2("option", { value: "function" }, "no match: expression"),
        h2("option", { value: "error" }, "no match: error")
      ),
      node.code === "CodeableConcept" ? h2(
        "label",
        { key: "k", className: "check", title: "Add the source code as a second coding" },
        h2("input", { type: "checkbox", checked: !!t.keepSource, disabled: blocked, onChange: (e) => setTranslation(node, "keepSource", e.target.checked) }),
        " + source coding"
      ) : null,
      needsValue ? h2(t.unmapped === "function" ? ExpressionField : "input", {
        completionContext: t.unmapped === "function" ? completionFor(node, "translation") : void 0,
        key: "f",
        type: "text",
        value: t.value || "",
        disabled: blocked,
        placeholder: t.unmapped === "fixed" ? "code or system|code" : "myFunction(code, system)",
        title: t.unmapped === "fixed" ? "The value for codes without a match: a code, or system|code" : "JavaScript with code and system (the source code and its system), e.g. a code template function; gives a code, system|code or {system, code, display}, or null for no value",
        style: { ...mono, flex: "1 1 180px" },
        onChange: (e) => setTranslation(node, "value", e.target.value)
      }) : null,
      h2("input", {
        key: "c",
        type: "text",
        value: test.code || "",
        placeholder: "code",
        title: "a source code to try",
        style: { ...mono, width: "70px" },
        onChange: (e) => {
          st.tests.set(node.key, { ...test, code: e.target.value });
          rerender();
        }
      }),
      h2("button", { key: "b", type: "button", className: "btn btn-sm", disabled: !t.conceptMap || !test.code, onClick: () => testTranslation(node) }, "Test"),
      test.result ? h2("span", { key: "r", className: "text-text-faint", style: { fontSize: "11px" } }, test.result) : null
    ]);
  };
  const createBundle = element.action === "createBundle";
  const declarations = mapperBundleDeclarations(platform2, element);
  const targets = parseMappings(element.bundleTargets);
  const bundle = createBundle || targets.length > 0;
  const updateTarget = (name, change) => {
    const next = change === null ? targets.filter((t) => t.name !== name) : targets.some((t) => t.name === name) ? targets.map((t) => t.name === name ? { ...t, ...change } : t) : [...targets, { name, ...change }];
    element.bundleTargets = JSON.stringify(next);
    onChange();
    rerender();
  };
  if (tree) {
    const rootTool = (label, title, onClick, active) => h2("button", { type: "button", className: "btn btn-sm", style: { marginLeft: "6px", padding: "0 6px", fontWeight: active ? 700 : 400, borderColor: active ? "#2563eb" : void 0 }, title, disabled: blocked, onClick }, label);
    rows.push(
      h2(
        "tr",
        { key: tree.root.key, ref: diagnosticRef(tree.root.key, "value") },
        h2(
          "td",
          { colSpan: 3 },
          h2("strong", null, tree.root.label),
          h2("span", { className: "text-text-faint", style: { marginLeft: "8px" } }, st.rootIndex.sd.url + (st.rootIndex.sd.version ? ` | ${st.rootIndex.sd.version}` : "")),
          bundle && !createBundle ? rootTool("↻", "One resource for each item of a list (e.g. each OBX)", () => toggleIteration(tree.root), st.iterations.has(tree.root.key)) : null,
          rootTool("?", "Only make the resource when a condition holds", () => toggleCondition(tree.root), st.conditions.has(tree.root.key))
        )
      )
    );
    if (st.iterations.has(tree.root.key)) rows.push(iterationRow(tree.root));
    if (st.conditions.has(tree.root.key)) rows.push(conditionRow(tree.root));
    rowGroups.push(h2("tbody", { key: "root" }, rows.splice(0)));
    const children = tree.children(tree.root);
    if (children) for (const child of children) {
      if (!visible(child)) continue;
      addNode(child, children);
      const grouped = st.expanded.has(child.key) || st.iterations.has(child.key) || st.conditions.has(child.key) || st.translations.has(child.key);
      rowGroups.push(h2("tbody", { key: child.key, className: grouped ? "mapper-branch-open" : void 0, "aria-label": child.key }, rows.splice(0)));
    }
  }
  const check = tree ? completeness(tree, parseMappings(element.mappings)) : { required: [], mustSupport: [] };
  const entryKey = (k) => k === "Bundle.entry" || k.startsWith("Bundle.entry.") || k.startsWith("Bundle.entry:");
  if (createBundle) {
    check.required = check.required.filter((k) => k !== "Bundle.type" && !entryKey(k));
    check.mustSupport = check.mustSupport.filter((k) => !entryKey(k));
  }
  const entryNote = createBundle && tree ? h2("div", { className: "hint", style: { marginTop: "6px" } }, "Bundle.entry is filled by the resource steps that select this Bundle in “Add to Bundles”.") : null;
  const testResult = st.testResult;
  const profileOptions = (st.profileList || []).map((p) => h2("option", { key: p.url, value: p.url }, `${p.title || p.name || p.url} (${p.type})`));
  const propertiesPanel = h2(
    React2.Fragment,
    null,
    h2(
      "div",
      { className: "mapper-settings" },
      field(
        "Action",
        h2(
          "select",
          {
            value: element.action || "",
            onChange: (e) => {
              element.action = e.target.value;
              if (element.action === "resource") element.bundleName = "";
              else element.bundleTargets = "[]";
              onChange();
              if (element.action === "createBundle" && element.resourceType !== "Bundle") {
                element.profileUrl = "Bundle";
                load("Bundle");
              } else rerender();
            }
          },
          h2("option", { value: "createBundle" }, "Create a Bundle"),
          h2("option", { value: "resource" }, "Build a resource")
        ),
        "Bundles are named and created explicitly; results are completed after the last FHIR mapper."
      ),
      createBundle ? field("Bundle Name", text("bundleName", "labo"), "Internal name used by resource steps; separate from the FHIR id and profile URL.") : null,
      field(
        "FHIR Version",
        h2(
          "select",
          {
            value: version,
            onChange: (e) => {
              element.fhirVersion = e.target.value;
              onChange();
              rerender();
            }
          },
          ["R4", "R4B", "R5"].map((v) => h2("option", { key: v, value: v }, v))
        )
      ),
      field("Profile Packages", text("profiles", "/profiles"), "Server-side profile files or folders, separated by ';'."),
      h2(
        "div",
        { className: "mapper-wide" },
        field(
          "Target Profile",
          h2(
            "div",
            { className: "mapper-actions" },
            h2("input", {
              type: "text",
              list: "fhir-profile-mapper-profiles",
              placeholder: "Canonical URL of the profile, or a resource type (Patient)",
              value: element.profileUrl ?? "",
              onFocus: () => {
                if (st.profileList === null && profiles) loadProfileList();
              },
              onChange: (e) => {
                element.profileUrl = e.target.value;
                rerender();
              }
            }),
            h2("datalist", { id: "fhir-profile-mapper-profiles" }, profileOptions),
            h2("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !element.profileUrl, onClick: () => load(element.profileUrl.trim()) }, st.loading ? "Loading…" : "Load"),
            h2("button", { type: "button", className: "btn btn-sm", disabled: !profiles, onClick: loadProfileList }, "List profiles")
          ),
          "Loading another profile keeps the mappings of the elements it also has."
        )
      ),
      h2(
        "div",
        { className: "mapper-wide" },
        field(
          "Terminology Server",
          text("terminologyServer", "n/a"),
          "Empty or n/a: translate locally using Profile Packages. Otherwise, enter the terminology server URL as reached by OIE."
        )
      ),
      h2(
        "details",
        { className: "mapper-wide" },
        h2("summary", { className: "text-text-faint", style: { cursor: "pointer", fontSize: "12px" } }, "Terminology server options"),
        h2(
          "div",
          { className: "mapper-settings", style: { marginTop: "8px" } },
          h2("div", { className: "mapper-wide" }, field("Authorization", text("terminologyAuthorization", "'Bearer ' + $cfg('tx.token')", true), "JavaScript expression of the Authorization header; empty for none.")),
          field("Cache (seconds)", number("terminologyCacheSeconds", 300), "How long answers of the server are reused; 0 for not at all."),
          field("Timeout (seconds)", number("terminologyTimeoutSeconds", 10), "How long to wait for the server.")
        )
      ),
      h2(
        React2.Fragment,
        null,
        createBundle ? field(
          "Bundle Type",
          h2("select", {
            value: element.bundleType || "transaction",
            disabled: !!st.rootIndex?.byId.get("Bundle.type")?.fixedCode,
            onChange: (e) => {
              element.bundleType = e.target.value;
              onChange();
              rerender();
            }
          }, ["transaction", "batch", "collection", "document", "message"].map((v) => h2("option", { key: v, value: v }, v))),
          "Defines the Bundle and its entry rules. A fixed type in the target profile takes precedence."
        ) : null,
        createBundle || !bundle ? field(
          "Result destination",
          h2("select", {
            value: element.variable ? "variable" : "message",
            onChange: (e) => {
              element.variable = e.target.value === "variable" ? element.bundleName ? `bundle_${element.bundleName}` : "resourceResult" : "";
              onChange();
              rerender();
            }
          }, h2("option", { value: "message" }, "Outbound message"), h2("option", { value: "variable" }, "Channel map variable")),
          createBundle ? "The completed Bundle is published here after the configured checks of all named Bundles." : "Destination of this standalone resource."
        ) : null,
        (createBundle || !bundle) && element.variable ? field("Variable name", text("variable", "bundleDocument"), "FHIR JSON in the channel map; use it from another destination.") : null,
        !createBundle ? h2(
          "section",
          { className: "mapper-wide bundle-routing", "aria-label": "Add to Bundles" },
          h2("div", { className: "bundle-routing-title" }, "Add to Bundles"),
          h2("div", { className: "hint" }, "Build this resource once, then add the same resource to each selected Bundle. Leave all unchecked for a standalone result."),
          targets.length ? field("Reference Name", text("refName", "'patient'", true), "Common to the selected Bundles. fhirRef(name) must resolve to the same resource in these Bundles.") : null,
          !declarations.length && !targets.length ? h2("div", { className: "hint", style: { marginTop: "8px" } }, "Create a Bundle earlier in this transformer to select it here.") : null,
          [...declarations, ...targets.filter((t) => !declarations.some((b) => b.bundleName === t.name)).map((t) => ({ bundleName: t.name }))].map((b) => {
            const target = targets.find((t) => t.name === b.bundleName);
            const request = target && ["transaction", "batch"].includes(b.bundleType);
            return h2(
              "div",
              { key: b.bundleName, className: "bundle-target", "data-bundle": b.bundleName },
              h2(
                "label",
                { className: "bundle-choice" },
                h2("input", { type: "checkbox", checked: !!target, onChange: (e) => updateTarget(b.bundleName, e.target.checked ? { requestMethod: "POST", requestUrl: "", ifNoneExist: "" } : null) }),
                b.bundleName,
                h2("span", { className: "hint" }, b.bundleType || "not declared earlier")
              ),
              b.name ? h2("div", { className: "hint" }, `Created by step “${b.name}”.`) : null,
              request ? h2(
                "div",
                { className: "bundle-request" },
                field("Method", h2(
                  "select",
                  { value: target.requestMethod || "POST", onChange: (e) => updateTarget(b.bundleName, { requestMethod: e.target.value }) },
                  ["POST", "PUT", "PATCH", "DELETE", "GET", "HEAD"].map((v) => h2("option", { key: v, value: v }, v))
                )),
                field("Request URL", h2(ExpressionField, { completionContext: completionFor(tree?.root, "reference"), value: target.requestUrl || "", placeholder: "Empty: the resource type or type/id", onChange: (e) => updateTarget(b.bundleName, { requestUrl: e.target.value }), style: mono }))
              ) : null,
              request && (!target.requestMethod || target.requestMethod === "POST") ? field("If-None-Exist", h2(ExpressionField, { completionContext: completionFor(tree?.root, "reference"), value: target.ifNoneExist || "", placeholder: "'identifier=' + ...", onChange: (e) => updateTarget(b.bundleName, { ifNoneExist: e.target.value }), style: mono }), "Conditional creation for this Bundle entry.") : null,
              target && !request ? h2("div", { className: "hint", style: { marginTop: "8px" } }, b.bundleType ? `No request for a ${b.bundleType} Bundle.` : "This Bundle must be created earlier in the transformer.") : null
            );
          })
        ) : null
      ),
      h2(
        "div",
        { className: "mapper-wide" },
        field(
          "Options",
          h2(
            "div",
            { className: "mapper-checks" },
            h2(
              "label",
              { className: "check" },
              h2("input", {
                type: "checkbox",
                checked: asBool(element.addMetaProfile, true),
                onChange: (e) => {
                  element.addMetaProfile = e.target.checked;
                  onChange();
                  rerender();
                }
              }),
              " Add the profile to meta.profile"
            ),
            h2(
              "label",
              { className: "check" },
              h2("input", {
                type: "checkbox",
                checked: asBool(element.validateOutput, true),
                onChange: (e) => {
                  element.validateOutput = e.target.checked;
                  onChange();
                  rerender();
                }
              }),
              bundle && !createBundle ? " Validate this preview (final validation is set on each Bundle)" : " Validate FHIR output"
            ),
            h2(
              "label",
              { className: "check" },
              h2("input", {
                type: "checkbox",
                checked: asBool(element.setLastUpdated, false),
                onChange: (e) => {
                  element.setLastUpdated = e.target.checked;
                  onChange();
                  rerender();
                }
              }),
              " Set meta.lastUpdated"
            )
          )
        )
      ),
      h2(
        "div",
        { className: "mapper-wide" },
        field(
          "Trace",
          h2(
            "div",
            { className: "mapper-checks" },
            h2(
              "label",
              { className: "check" },
              h2("input", {
                type: "checkbox",
                checked: asBool(element.traceMessages, false),
                onChange: (e) => {
                  element.traceMessages = e.target.checked;
                  if (!e.target.checked) element.traceCaptureValues = false;
                  onChange();
                  rerender();
                }
              }),
              " Trace processed messages"
            ),
            h2(
              "label",
              { className: "check", title: "Also record the scalar values of this step's rules (256 characters per value). They may contain patient data." },
              h2("input", {
                type: "checkbox",
                checked: asBool(element.traceCaptureValues, false),
                disabled: !asBool(element.traceMessages, false),
                onChange: (e) => {
                  element.traceCaptureValues = e.target.checked;
                  onChange();
                  rerender();
                }
              }),
              " Include scalar values"
            )
          ),
          "Each message processed by the deployed channel keeps this step's events, and the finalization of its Bundles, in the connector map (fhirMapperTrace). Off by default; redeploy to apply."
        )
      )
    ),
    h2(
      "details",
      { style: { marginTop: "10px" } },
      h2("summary", { style: { cursor: "pointer" } }, "Edit as JSON"),
      h2("div", { className: "hint", style: { margin: "6px 0" } }, "The whole step — properties and rules — as text: copy it to another step or channel, paste a mapping written by hand or by an AI agent, or make bulk edits. Validate and apply compiles it on the server first."),
      h2(
        "div",
        { className: "mapper-actions" },
        h2("button", { type: "button", className: "btn btn-sm", onClick: () => {
          st.jsonDraft = JSON.stringify(element, null, 2);
          rerender();
        } }, "Read current step"),
        h2("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !st.jsonDraft.trim(), onClick: async () => {
          try {
            const next = mapperJsonImport(element, st.jsonDraft);
            const result = JSON.parse(await platform2.api.post(`${MAPPER_API2}/script`, JSON.stringify(next), { contentType: "text/plain", raw: true }));
            if (result.errors?.length) throw new Error(result.errors.map((e) => e.message).join("\n"));
            Object.assign(element, next);
            state.current = null;
            onChange();
            rerender();
          } catch (error) {
            st.error = errorText(error);
            rerender();
          }
        } }, "Validate and apply")
      ),
      h2("textarea", {
        rows: 8,
        value: st.jsonDraft,
        "aria-label": "Step mapping JSON",
        style: { width: "100%", fontFamily: "monospace" },
        onChange: (e) => {
          st.jsonDraft = e.target.value;
          rerender();
        }
      }),
      h2("div", { className: "hint" }, "Applies to this step only; its OIE sequence and enabled state are preserved. Save the channel to persist changes.")
    )
  );
  const messages = h2(
    React2.Fragment,
    null,
    st.error ? h2("div", { className: "hint", style: { color: "#b91c1c", marginTop: "6px" } }, st.error) : null,
    st.notice ? h2("div", { className: "hint", style: { color: "#b45309", marginTop: "6px" } }, st.notice) : null,
    st.versionNotice ? h2(
      "div",
      { className: "hint", style: { color: "#b45309", marginTop: "6px" } },
      st.versionNotice + " ",
      h2(
        "button",
        {
          type: "button",
          className: "btn btn-sm",
          onClick: () => {
            element.profileVersion = st.rootIndex.sd.version || "";
            st.versionNotice = "";
            onChange();
            rerender();
          }
        },
        "Checked"
      )
    ) : null,
    st.unresolved.length ? h2(
      "div",
      { className: "hint", style: { color: "#b45309", marginTop: "6px" } },
      `Cannot find these mapped elements in the profile (editing is blocked so they are not lost): ${st.unresolved.join(", ")}. `,
      h2("button", { type: "button", className: "btn btn-sm", onClick: removeUnresolved }, "Remove these mappings")
    ) : null
  );
  const mapperPanel = tree ? h2(
    "div",
    null,
    h2(
      "div",
      { className: "mapper-toolbar" },
      h2("span", { className: "text-text-faint" }, "Show"),
      h2(
        "select",
        {
          value: st.filter,
          onChange: (e) => {
            st.filter = e.target.value;
            rerender();
          }
        },
        h2("option", { value: "all" }, "All elements"),
        h2("option", { value: "mustSupport" }, "Must Support and required"),
        h2("option", { value: "mapped" }, "Mapped only")
      ),
      h2(
        "label",
        { className: "check", title: "Also show extension, modifierExtension and id of every element (to add an extension the profile does not have)" },
        h2("input", {
          type: "checkbox",
          checked: st.showAll,
          onChange: (e) => {
            st.showAll = e.target.checked;
            rerender();
          }
        }),
        " extensions & ids"
      ),
      h2("input", {
        type: "search",
        value: st.search || "",
        placeholder: "Search elements…",
        "aria-label": "Search elements",
        style: { width: "180px", flex: "none", height: "26px", minHeight: "26px", padding: "2px 8px" },
        onChange: (e) => {
          st.search = e.target.value;
          rerender();
        }
      }),
      h2("button", { type: "button", className: "btn btn-sm", title: "Expand the mapped elements", onClick: () => {
        for (const key of allKeys()) {
          const parts = key.split(".");
          for (let i = 1; i < parts.length; i++) st.expanded.add(parts.slice(0, i).join("."));
        }
        rerender();
      } }, "Expand mapped"),
      h2("button", { type: "button", className: "btn btn-sm", title: "Collapse every element", onClick: () => {
        st.expanded = /* @__PURE__ */ new Set([tree.root.key]);
        rerender();
      } }, "Collapse all"),
      h2("button", { type: "button", className: "btn btn-sm", title: "Undo the last change of the mappings", disabled: !(st.undo || []).length || blocked, onClick: () => travel(st.undo, st.redo) }, "↶ Undo"),
      h2("button", { type: "button", className: "btn btn-sm", title: "Redo", disabled: !(st.redo || []).length || blocked, onClick: () => travel(st.redo, st.undo) }, "↷ Redo"),
      h2("span", { className: "hint text-text-faint", style: { fontSize: "11px" } }, `Click a field to edit it with completion. ${COMPLETION_HINT}: functions, scoped variables and sample paths. ↑/↓ to choose, Enter/Tab to insert, Esc to close. Guard optional values.`)
    ),
    h2(
      "div",
      { className: "dt-wrap border border-line rounded", style: { maxHeight: "none", overflowX: "auto", overflowY: "visible" } },
      h2(
        "table",
        { className: "dt mapper-tree", style: { tableLayout: "fixed", width: "100%", minWidth: "720px" } },
        h2("colgroup", null, h2("col", { style: { width: "36%" } }), h2("col", { style: { width: "14%" } }), h2("col", { style: { width: "50%" } })),
        h2("thead", null, h2("tr", null, h2("th", null, "Element"), h2("th", null, "Type"), h2("th", null, "Mapping"))),
        rowGroups
      )
    ),
    check.required.length || check.mustSupport.length ? h2(
      "div",
      { className: "hint", style: { marginTop: "6px" } },
      check.required.length ? h2("div", { style: { color: "#b91c1c" } }, `Required, not mapped: ${check.required.join(", ")}`) : null,
      check.mustSupport.length ? h2("div", { style: { color: "#b45309" } }, `Must Support, not mapped: ${check.mustSupport.join(", ")}`) : null
    ) : h2("div", { className: "hint", style: { marginTop: "6px", color: "#15803d" } }, "Every required element below the mapped ones has a mapping or a fixed value."),
    entryNote
  ) : h2("div", { className: "hint" }, st.loading ? "Loading the target profile…" : "Load a target profile in Properties to map its elements.");
  const testPanel = tree ? h2(
    "div",
    null,
    h2(
      "div",
      { style: { display: "flex", gap: "6px", alignItems: "center", margin: "6px 0" } },
      h2(
        "select",
        {
          style: { width: "auto", flex: "none" },
          value: st.sample.dataType,
          onChange: (e) => {
            st.sample.dataType = e.target.value;
            saveSample();
            rerender();
          }
        },
        ["HL7V2", "XML", "JSON", "RAW"].map((v) => h2("option", { key: v, value: v }, v))
      ),
      h2("button", { type: "button", className: "btn btn-sm", disabled: st.testing || !st.sample.message.trim(), onClick: runTest }, st.testing ? "Running…" : "Run"),
      h2("button", { type: "button", className: "btn btn-sm", onClick: showScript }, st.scriptResult ? "Hide the script" : "Generated script"),
      h2("span", { className: "text-text-faint", style: { fontSize: "11px" } }, "Runs this step on the server and validates what it makes; fhirRef() of earlier steps gives stand-ins.")
    ),
    h2(
      "div",
      { style: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "6px" } },
      h2("label", null, h2("input", {
        type: "checkbox",
        checked: st.traceOptions.enabled,
        onChange: (e) => {
          st.traceOptions.enabled = e.target.checked;
          if (!e.target.checked) st.traceOptions.captureValues = false;
          rerender();
        }
      }), " Trace"),
      h2(
        "label",
        { title: "Explicitly include scalar values in the trace and its JSON export (256 characters per value)." },
        h2("input", {
          type: "checkbox",
          checked: st.traceOptions.captureValues,
          disabled: !st.traceOptions.enabled,
          onChange: (e) => {
            st.traceOptions.captureValues = e.target.checked;
            rerender();
          }
        }),
        " Include scalar values"
      ),
      h2("label", null, "Max events ", h2("input", {
        type: "number",
        min: 1,
        max: 1e3,
        value: st.traceOptions.maxEvents,
        disabled: !st.traceOptions.enabled,
        style: { width: "80px" },
        onChange: (e) => {
          st.traceOptions.maxEvents = Number(e.target.value);
          rerender();
        }
      }))
    ),
    h2("textarea", {
      rows: 6,
      value: st.sample.message,
      placeholder: st.sample.dataType === "XML" ? "<root>...</root>" : st.sample.dataType === "JSON" ? '{"field":"value"}' : st.sample.dataType === "HL7V2" ? "MSH|^~\\&|..." : "Sample message",
      style: { width: "100%", fontFamily: "monospace", fontSize: "12px" },
      onChange: (e) => {
        st.sample.message = e.target.value;
        saveSample();
        rerender();
      }
    }),
    testResult ? h2(
      "div",
      { style: { marginTop: "6px" } },
      testResult.errors.map((e, i) => diagnosticView(e, `e${i}`)),
      testResult.trace ? h2(
        "details",
        { style: { marginTop: "8px" } },
        h2(
          "summary",
          { style: { cursor: "pointer" } },
          `Execution trace: ${testResult.trace.events.length} event(s)${testResult.trace.truncated ? " — truncated" : ""}`
        ),
        h2("button", { type: "button", className: "btn btn-sm", onClick: () => downloadMapperTrace(testResult.trace) }, "Export trace JSON"),
        h2("div", { className: "hint" }, testResult.trace.captureValues ? "Scalar values included." : "Runtime values not captured."),
        h2(
          "ol",
          { style: { maxHeight: "360px", overflow: "auto", fontSize: "12px" } },
          mapperTraceRows(testResult.trace).map(({ event, label, duration, iterations }, index) => h2(
            "li",
            { key: index, style: { margin: "6px 0" } },
            h2("strong", null, `${label} · ${event.status}`),
            h2("span", { style: { marginLeft: "6px" } }, duration),
            event.key && tree ? h2("button", { type: "button", className: "btn btn-sm", onClick: () => revealDiagnostic(event) }, "Go to rule") : null,
            iterations ? h2("div", null, iterations) : null,
            event.reason ? h2("div", null, event.reason) : null,
            event.count !== void 0 ? h2("div", null, `${event.count} item(s)`) : null,
            event.value ? h2("pre", { style: { whiteSpace: "pre-wrap", margin: "4px 0" } }, JSON.stringify(event.value)) : null
          ))
        )
      ) : null,
      testResult.output !== null && testResult.output !== void 0 ? h2(
        "div",
        null,
        h2(
          "div",
          { style: { fontSize: "12px", margin: "4px 0", color: testResult.issues.some((i) => i.severity === "error" || i.severity === "fatal") ? "#b91c1c" : "#15803d" } },
          testResult.validationPerformed === false ? "FHIR validation disabled." : testResult.issues.length ? `${testResult.issues.length} validation issue(s):` : "Valid."
        ),
        testResult.issues.map((i, n) => h2("div", { key: `i${n}`, style: { fontSize: "11px", fontFamily: "monospace" } }, `${i.severity} ${i.location}: ${i.message}`)),
        h2("pre", { style: { maxHeight: "360px", overflow: "auto", fontSize: "11px", background: "rgba(0,0,0,0.03)", padding: "6px" } }, prettyJson(testResult.output))
      ) : null
    ) : null,
    st.scriptResult ? h2(
      "div",
      { style: { marginTop: "6px" } },
      st.scriptResult.errors.map((e, i) => diagnosticView(e, `s${i}`)),
      h2("pre", { style: { maxHeight: "360px", overflow: "auto", fontSize: "11px", background: "rgba(0,0,0,0.03)", padding: "6px" } }, st.scriptResult.script || "")
    ) : null
  ) : h2("div", { className: "hint" }, st.loading ? "Loading the target profile…" : "Load a target profile in Properties to test this step.");
  const tabs = [
    { id: "properties", label: "Properties", panel: propertiesPanel },
    {
      id: "mapper",
      label: "Mapper",
      panel: mapperPanel,
      badge: check.required.length ? { text: String(check.required.length), title: `${check.required.length} required element(s) not mapped` } : null
    },
    {
      id: "test",
      label: "Test",
      panel: testPanel,
      badge: testResult?.errors?.length ? { text: "!", title: "The last test failed" } : null
    }
  ];
  const current2 = tabs.find((t) => t.id === st.tab) || tabs[0];
  const tabKeys = (e) => {
    const index = tabs.indexOf(current2);
    const next = e.key === "ArrowRight" ? (index + 1) % tabs.length : e.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    st.tab = tabs[next].id;
    rerender();
    e.currentTarget.querySelectorAll("[role=tab]")[next]?.focus();
  };
  return h2(
    "div",
    { className: "fhir-profile-mapper" + (st.fullScreen ? " mapper-fullscreen" : "") },
    h2("style", null, MAPPER_STYLES),
    h2(
      "div",
      { className: "mapper-tabs", role: "tablist", "aria-label": "FHIR mapper sections", onKeyDown: tabKeys },
      tabs.map((t) => h2("button", {
        key: t.id,
        id: `${tabId}-${t.id}`,
        type: "button",
        role: "tab",
        "aria-selected": t === current2,
        "aria-controls": `${tabId}-panel`,
        tabIndex: t === current2 ? 0 : -1,
        onClick: () => {
          st.tab = t.id;
          rerender();
        }
      }, t.label, t.badge ? h2("span", { className: "mapper-tab-badge", title: t.badge.title }, t.badge.text) : null)),
      h2(
        "button",
        { type: "button", className: "btn btn-sm", style: { marginLeft: "auto", alignSelf: "center" }, title: "Edit this step on the whole page (Esc to come back)", onClick: toggleFullScreen },
        st.fullScreen ? "Exit full screen (Esc)" : "⤢ Full screen"
      )
    ),
    messages,
    h2("div", { className: "mapper-tab-panel", id: `${tabId}-panel`, role: "tabpanel", "aria-labelledby": `${tabId}-${current2.id}` }, current2.panel)
  );
}
function prettyJson(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return String(text);
  }
}
function registerProfileMapper(platform2) {
  React2 = platform2.React;
  try {
    if (platform2.oie && platform2.oie.STEP_TYPES && !platform2.oie.STEP_TYPES[MAPPER_TYPE]) platform2.oie.STEP_TYPES[MAPPER_TYPE] = { label: "FHIR Profile Mapper" };
  } catch {
  }
  platform2.registerStepType(MAPPER_TYPE, {
    label: "FHIR Profile Mapper",
    create: () => ({
      __type: MAPPER_TYPE,
      name: "",
      enabled: true,
      fhirVersion: "R4",
      profiles: "",
      profileUrl: "",
      resourceType: "",
      profileVersion: "",
      addMetaProfile: true,
      validateOutput: true,
      setLastUpdated: false,
      variable: "",
      action: "resource",
      bundleName: "",
      bundleTargets: "[]",
      bundleType: "transaction",
      refName: "",
      terminologyServer: "",
      terminologyAuthorization: "",
      terminologyCacheSeconds: 300,
      terminologyTimeoutSeconds: 10,
      mappings: "[]",
      traceMessages: false,
      traceCaptureValues: false
    }),
    validate: (el) => {
      if (!["createBundle", "resource"].includes(el.action)) return "Choose the action: create a Bundle or build a resource.";
      if (!el.profileUrl || !String(el.profileUrl).trim()) return "Choose the target profile.";
      if (!el.resourceType) return "Load the target profile.";
      if (el.action === "createBundle" && !String(el.bundleName || "").trim()) return "Give the Bundle a name.";
      if (el.action === "createBundle" && el.resourceType !== "Bundle") return "Create a Bundle needs a Bundle target profile.";
      const entries = parseMappings(el.mappings);
      const noValue = entries.find((e) => e.translate && (e.translate.unmapped === "fixed" || e.translate.unmapped === "function") && !String(e.translate.value || "").trim());
      if (noValue) return `The translation of ${noValue.key} needs a ${noValue.translate.unmapped === "fixed" ? "fixed value" : "expression"} for codes without a match.`;
      const bad = entries.find((e) => typeof e.each === "string" && !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e.variable || ""));
      if (bad) return `The variable of the iteration on ${bad.key} must be a JavaScript name.`;
      if (!(el.action === "createBundle" || parseMappings(el.bundleTargets).length) && entries.some((e) => typeof e.each === "string" && Array.isArray(e.path) && !e.path.length))
        return "One resource for each item needs a named Bundle target.";
      return "";
    },
    component: ProfileMapperEditor
  });
}
function register(platform2) {
  registerProfileMapper(platform2);
}

// src/fml/legacy-editor.js
var FML_TYPE = "org.oie.fhir.fml.FhirFmlTransformStep";
var FML_API = "/extensions/fhir-fml";
var DATA_TYPES = ["HL7V2", "XML", "JSON", "RAW", "DELIMITED"];
var FML_STYLES = `
.fhir-fml { container-type: inline-size; min-width: 0; }
.fhir-fml .fml-settings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; align-items: start; }
.fhir-fml .fml-settings > *, .fhir-fml .field { min-width: 0; }
.fhir-fml .fml-wide { grid-column: 1 / -1; }
.fhir-fml .fml-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.fhir-fml .fml-row > select, .fhir-fml .fml-row > input[type=text] { flex: 1 1 240px; min-width: 0; width: auto; }
.fhir-fml .fml-row > button { flex: none; white-space: nowrap; }
.fhir-fml .fml-tabs { display: flex; gap: 4px; margin: 12px 0 8px; border-bottom: 1px solid #cbd5e1; }
.fhir-fml .fml-tabs button { border: 0; border-bottom: 2px solid transparent; background: none; padding: 6px 10px; cursor: pointer; color: inherit; }
.fhir-fml .fml-tabs button[aria-selected=true] { border-bottom-color: #2563eb; font-weight: 600; }
.fhir-fml pre.fml-json { max-height: 420px; overflow: auto; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; white-space: pre; }
.fhir-fml .fml-error { color: #b91c1c; overflow-wrap: anywhere; }
.fhir-fml .fml-issue-warning { color: #b45309; }
.fhir-fml .fml-ok { color: #15803d; }
@container (max-width: 640px) { .fhir-fml .fml-settings { grid-template-columns: minmax(0, 1fr); } }
`;
var React3;
var h3 = (...args) => React3.createElement(...args);
function errorText2(e) {
  const body = e && e.body || "";
  const m = /<detailMessage>([\s\S]*?)<\/detailMessage>/.exec(body);
  if (m) return m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  return e && e.message || String(e);
}
function pretty(value) {
  if (value === null || value === void 0) return "";
  try {
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2);
  } catch {
    return String(value);
  }
}
function fmlSample(platform2, element) {
  const channel = platform2.store?.getState("editingChannel");
  let found = null;
  if (channel) {
    const connectors = [channel.sourceConnector, ...platform2.oie.destinationsOf(channel) || []].filter(Boolean);
    for (const connector of connectors) {
      for (const transformer of [connector.transformer, connector.responseTransformer]) {
        const steps = platform2.oie.elementsToArray(transformer?.elements);
        if (steps.some((s) => s.__type === FML_TYPE && String(s.sequenceNumber) === String(element.sequenceNumber) && s.name === element.name)) {
          found = found ? "ambiguous" : { channel, connector, transformer };
        }
      }
    }
  }
  const ctx = found && found !== "ambiguous" ? found : null;
  const inbound = ctx?.transformer.inboundDataType || "HL7V2";
  const key = ctx ? `fhir-fml-sample:${ctx.channel.id}:${ctx.connector.metaDataId}` : "fhir-fml-sample:unknown";
  return { key, sample: { message: ctx?.transformer.inboundTemplate || "", dataType: DATA_TYPES.includes(inbound) ? inbound : "RAW" } };
}
function FmlTransformEditor({ element, onChange, platform: platform2 }) {
  const [, rerender] = React3.useReducer((x) => x + 1, 0);
  const state = React3.useRef(null);
  if (state.current === null) {
    const initial = fmlSample(platform2, element);
    let sample = initial.sample;
    try {
      sample = JSON.parse(localStorage.getItem(initial.key) || "null") || sample;
    } catch {
    }
    state.current = { tab: "settings", maps: null, mapErrors: {}, loading: false, loadError: "", sampleKey: initial.key, sample, testing: false, result: null };
  }
  const st = state.current;
  const set = (prop, value) => {
    element[prop] = value;
    onChange();
    rerender();
  };
  const field = (label, control, hint, wide) => h3("div", { className: wide ? "field fml-wide" : "field" }, h3("label", null, label), control, hint ? h3("div", { className: "hint" }, hint) : null);
  const text = (prop, placeholder) => h3("input", { type: "text", placeholder, value: element[prop] ?? "", onChange: (e) => set(prop, e.target.value) });
  const loadMaps = async (reload) => {
    st.loading = true;
    st.loadError = "";
    rerender();
    try {
      if (reload) await platform2.api.post(`${FML_API}/reload`, "", { contentType: "text/plain", raw: true });
      const answer = JSON.parse(await platform2.api.get(`${FML_API}/maps`, { fhirVersion: element.fhirVersion || "R4", profiles: element.profiles || "" }, { raw: true }));
      st.maps = answer.maps || [];
      st.mapErrors = answer.errors || {};
    } catch (e) {
      st.maps = null;
      st.loadError = errorText2(e);
    }
    st.loading = false;
    rerender();
  };
  React3.useEffect(() => {
    if ((element.profiles || "").trim()) loadMaps(false);
  }, []);
  const saveSample = () => {
    try {
      localStorage.setItem(st.sampleKey, JSON.stringify(st.sample));
    } catch {
    }
  };
  const runTest = async () => {
    st.testing = true;
    st.result = null;
    rerender();
    try {
      const text2 = await platform2.api.post(`${FML_API}/test`, JSON.stringify({ step: element, message: st.sample.message, dataType: st.sample.dataType }), {
        contentType: "text/plain",
        raw: true,
        timeoutMs: 12e4
      });
      st.result = JSON.parse(text2);
    } catch (e) {
      const message = errorText2(e);
      st.result = { model: null, output: null, issues: [], errors: [{ phase: "request", message: e?.status === 403 || /Test FHIR FML transforms/.test(message) ? "Testing a step requires the permission “Test FHIR FML transforms”." : message }] };
    }
    st.testing = false;
    rerender();
  };
  const mapOptions = st.maps || [];
  const knownMap = mapOptions.some((m) => m.url === element.mapUrl);
  const settings = h3(
    "div",
    { className: "fml-settings" },
    field("FHIR version", h3(
      "select",
      { value: element.fhirVersion || "R4", onChange: (e) => set("fhirVersion", e.target.value) },
      ["R4", "R4B", "R5"].map((v) => h3("option", { key: v, value: v }, v))
    ), "Version of the resources the map produces."),
    field(
      "Result destination",
      h3("select", {
        value: element.variable ? "variable" : "message",
        onChange: (e) => set("variable", e.target.value === "variable" ? element.variable || "fhirResource" : "")
      }, h3("option", { value: "message" }, "Outbound message"), h3("option", { value: "variable" }, "Channel Map variable")),
      "The outbound template (tmp) if there is one, else msg."
    ),
    element.variable ? field("Variable", text("variable", "fhirResource")) : null,
    field(
      "Profile locations",
      h3(
        "div",
        { className: "fml-row" },
        text("profiles", "/opt/fhir/ig;/opt/fhir/maps"),
        h3("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !(element.profiles || "").trim(), onClick: () => loadMaps(false) }, st.loading ? "Loading…" : "Load maps"),
        h3("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !(element.profiles || "").trim(), title: "Read the map files again", onClick: () => loadMaps(true) }, "Reload")
      ),
      "Files and folders on the OIE server, separated by ';': FML files (.fml, .map), StructureMaps, profiles, ConceptMaps and packages (.tgz).",
      true
    ),
    field(
      "Map",
      h3(
        "div",
        { className: "fml-row" },
        h3(
          "select",
          { value: knownMap ? element.mapUrl : "", onChange: (e) => set("mapUrl", e.target.value) },
          h3("option", { value: "" }, st.maps ? mapOptions.length ? "Choose a map…" : "No map in these locations" : "Load the maps first"),
          mapOptions.map((m) => h3("option", { key: m.url, value: m.url }, `${m.title || m.name} — ${m.url}`))
        )
      ),
      knownMap || !element.mapUrl ? "The map runs with the message as its source (OieMessage) and builds its target." : `Map ${element.mapUrl} is not in the loaded list.`,
      true
    ),
    st.loadError ? h3("div", { className: "fml-wide fml-error" }, st.loadError) : null,
    Object.keys(st.mapErrors).length ? h3(
      "div",
      { className: "fml-wide fml-error" },
      "Unreadable files: ",
      Object.entries(st.mapErrors).map(([file, message]) => h3("div", { key: file }, `${file}: ${message}`))
    ) : null,
    field(
      "Context variables",
      text("contextVariables", "site, sendingFacility"),
      "Variables of the OIE maps ($) copied to context.variable of the model, separated by commas."
    ),
    field("Validation", h3(
      "label",
      { className: "check" },
      h3("input", { type: "checkbox", checked: element.validateOutput !== false && element.validateOutput !== "false", onChange: (e) => set("validateOutput", e.target.checked) }),
      " Validate the result"
    ), "Against the profiles in meta.profile, else the base definition. An invalid result stops the message.")
  );
  const result = st.result;
  const test = h3(
    "div",
    null,
    h3(
      "div",
      { className: "fml-settings" },
      field("Data type", h3(
        "select",
        { value: st.sample.dataType, onChange: (e) => {
          st.sample.dataType = e.target.value;
          saveSample();
          rerender();
        } },
        DATA_TYPES.map((v) => h3("option", { key: v, value: v }, v))
      )),
      h3(
        "div",
        { className: "field" },
        h3("label", null, " "),
        h3("button", { type: "button", className: "btn btn-primary", disabled: st.testing || !element.mapUrl, onClick: runTest }, st.testing ? "Running…" : "Run test")
      ),
      field("Sample message", h3("textarea", {
        rows: 8,
        value: st.sample.message,
        style: { width: "100%", fontFamily: "monospace" },
        onChange: (e) => {
          st.sample.message = e.target.value;
          saveSample();
          rerender();
        }
      }), null, true)
    ),
    result ? h3(
      "div",
      null,
      (result.errors || []).map((e, i) => h3("div", { key: `e${i}`, className: "fml-error" }, `${e.phase}: ${e.message}`)),
      result.validationPerformed && !(result.issues || []).some((i) => ["error", "fatal"].includes(i.severity)) && !(result.errors || []).length ? h3("div", { className: "fml-ok" }, "Valid.") : null,
      (result.issues || []).filter((i) => i.severity !== "information").map((i, n) => h3("div", { key: `i${n}`, className: i.severity === "warning" ? "fml-issue-warning" : "fml-error" }, `${i.severity} ${i.location || ""}: ${i.message}`)),
      result.output ? h3("div", null, h3("h4", null, "Result"), h3("pre", { className: "fml-json" }, pretty(result.output))) : null,
      result.model ? h3("details", null, h3("summary", null, "OIE model of the message (source of the map)"), h3("pre", { className: "fml-json" }, pretty(result.model))) : null
    ) : null
  );
  const tabs = [{ id: "settings", label: "Properties", panel: settings }, { id: "test", label: "Test", panel: test }];
  const current2 = tabs.find((t) => t.id === st.tab) || tabs[0];
  return h3(
    "div",
    { className: "fhir-fml" },
    h3("style", null, FML_STYLES),
    h3("div", { className: "fml-tabs", role: "tablist" }, tabs.map((t) => h3("button", { key: t.id, type: "button", role: "tab", "aria-selected": t.id === current2.id, onClick: () => {
      st.tab = t.id;
      rerender();
    } }, t.label))),
    h3("div", { role: "tabpanel" }, current2.panel)
  );
}
function register2(platform2) {
  React3 = platform2.React;
  try {
    if (platform2.oie && platform2.oie.STEP_TYPES && !platform2.oie.STEP_TYPES[FML_TYPE]) platform2.oie.STEP_TYPES[FML_TYPE] = { label: "FHIR FML Transform" };
  } catch {
  }
  platform2.registerStepType(FML_TYPE, {
    label: "FHIR FML Transform",
    create: () => ({
      __type: FML_TYPE,
      name: "",
      enabled: true,
      fhirVersion: "R4",
      profiles: "",
      mapUrl: "",
      variable: "",
      validateOutput: true,
      contextVariables: ""
    }),
    validate: (el) => {
      if (!String(el.mapUrl || "").trim()) return "Choose the map to run.";
      if (el.variable !== void 0 && el.variable !== "" && !String(el.variable).trim()) return "Give the Channel Map variable a name.";
      return "";
    },
    component: FmlTransformEditor
  });
}

// src/index.js
function register3(platform2) {
  bindPlatform(platform2);
  bindReact(platform2.React);
  setLocale(navigator.languages ?? [navigator.language]);
  installStyles(STYLE_SHEETS);
  register(platform2);
  register2(platform2);
  registerMapperReferences().catch((error) => console.warn("[fhir-mapper] references unavailable:", error));
}
export {
  register3 as register
};
