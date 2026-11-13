// OIE FHIR Mapper 0.1.0-SNAPSHOT · MPL-2.0 · generated from webadmin/src by build.mjs: do not edit

// src/i18n/locales/en.js
var en_default = Object.fromEntries([
  "FHIR resource",
  "Generate skeleton",
  "Generating…",
  "Generic OIE message",
  "Required. Dots become underscores and existing underscores are doubled.",
  "Source instance",
  "Source instance received by the map",
  "Source model",
  "Source model canonical URL",
  "Target profile for the skeleton",
  "The typed HL7 v2 model reads the XML produced by OIE's Strict Parser.",
  "The typed HL7 v2 source model requires its canonical URL.",
  "Typed HL7 v2 logical model",
  "Used by the map skeleton; the FHIR resource itself declares its type.",
  " (final validation is set on each Bundle)",
  " (groups: {groups})",
  " + source coding",
  " Add the profile to meta.profile",
  " All ConceptMaps ({p0} matching)",
  " Include scalar values",
  " Set meta.lastUpdated",
  " Trace",
  " Trace processed messages",
  " Validate the result",
  " extensions & ids",
  " in {name}",
  " {p0} rule",
  " — disabled (kept, not executed)",
  "'Bearer ' + $cfg('tx.token')",
  "'identifier=' + ...",
  "'patient'",
  "'{p0}'{p1}",
  "(none: this step's own packages and terminology server)",
  "(none: this step's own version and locations)",
  "(unsaved sample, this browser)",
  ", truncated",
  "-> patient.gender = translate(v, 'url', 'code')",
  "? Only if",
  "? Only make the resource if",
  "A FHIR FML Transform step runs a map written in the FHIR Mapping Language on the message and publishes the resource it builds.",
  "A FHIR Profile Mapper step builds one FHIR resource from the message, or creates a named Bundle that later steps fill.",
  "A FHIR context is a named set of profile packages, a terminology server and a validation policy. FHIR Profile Mapper and FHIR FML Transform steps that name a context share them; a step without a context keeps its own. A deployed channel takes a change when it is redeployed.",
  "A choice between two values.",
  "A context of Settings › FHIR Mapper gives the packages, the terminology server and the validation policy to every step that names it.",
  "A context of Settings › FHIR Mapper gives the version and the locations to every step that names it.",
  "A map written here is saved with the channel and runs instead of the map chosen in Properties. It may import the maps and use the profiles and ConceptMaps of the profile locations.",
  "A map written in the step is saved with the channel and runs first.",
  "A missing optional field must give nothing, not an error: guard it, e.g. x.length() > 1 ? x[1].toString() : undefined.",
  "A named set of locations defined in Settings › FHIR Mapper, shared by the steps that name it.",
  "A named set of packages, terminology server and validation policy, defined once in Settings › FHIR Mapper and shared by every step that names it.",
  "A named set of profile packages, a terminology server and a validation policy, shared by the FHIR Profile Mapper and FHIR FML Transform steps that name it.",
  "A small map to adapt.",
  "A step without a context keeps its own packages and settings.",
  "A value the profile imposes: it is added by itself once its container gets a value.",
  "Action",
  "Actions for {p0}",
  "Add an entry",
  "Add an extension by URL…",
  "Add context extension",
  "Add or remove an entry of a repeating element.",
  "Add the source code as a second coding",
  "Add to Bundles",
  "Against the profiles in meta.profile, else the base definition. An invalid result stops the message.",
  "Against the profiles of meta.profile, else the base definition. An invalid result stops the message.",
  "All elements",
  "All elements, Must Support and required, or mapped only.",
  "Also record the scalar values of this step's rules (256 characters per value). They may contain patient data.",
  "Also show extension, modifierExtension and id of every element (to add an extension the profile does not have)",
  "Alt+↓ ↑ → ←",
  "An action and resourceType are required.",
  "Applies to this step only; its OIE sequence and enabled state are preserved. Save the channel to persist changes.",
  "Authorization",
  "Base URL as OIE reaches it; empty to translate with the ConceptMaps of the packages.",
  "Base URL as the OIE server reaches it; empty to translate locally.",
  "Binding",
  "Branch actions and extensions",
  "Build a resource",
  "Build this resource once, then add the same resource to each selected Bundle. Leave all unchecked for a standalone result.",
  "Bundle Name",
  "Bundle Type",
  "Bundle.entry is filled by the resource steps that select this Bundle in “Add to Bundles”.",
  "Bundles are named and created explicitly; results are completed after the last FHIR mapper.",
  "Buttons",
  "Buttons of a row",
  "Cache (seconds)",
  "Cannot find these mapped elements in the profile (editing is blocked so they are not lost): {p0}. ",
  "Canonical URL of the profile, or a resource type (Patient)",
  "Canonical URL of the profile, or a resource type. Load reads its elements; mappings of elements it also has are kept.",
  "Cardinality",
  "Changing the FHIR contexts requires the permission “Manage FHIR mapper settings”.",
  "Channel Map variable",
  "Channel map variable",
  "Channel {name}, revision {revision}",
  "Check",
  "Checked",
  "Checking…",
  "Choose a map…",
  "Choose an extension of the profile…",
  "Choose the action: create a Bundle or build a resource.",
  "Choose the target profile.",
  "Clear",
  "Clear the expected result",
  "Click a field to edit it with completion. {p0}: functions, scoped variables and sample paths. ↑/↓ to choose, Enter/Tab to insert, Esc to close. Guard optional values.",
  "Click a field to edit it. An expression is JavaScript, usually a path of the message; a constant is written 'final'.",
  "Collapse all",
  "Collapse every element",
  "Common to the selected Bundles. fhirRef(name) must resolve to the same resource in these Bundles.",
  "ConceptMap for {p0}",
  "ConceptMap/$translate locally, on the ConceptMaps of the Profile Packages",
  "ConceptMap/$translate on the terminology server",
  "ConceptMaps are suggested by source/target systems and the target binding. All ConceptMaps restores the full list. A suggestion never replaces the current selection automatically.",
  "Condition",
  "Conditional creation for this Bundle entry.",
  "Connector {name} ({transformer})",
  "Context name",
  "Context variables",
  "Copy branch as JSON",
  "Create a Bundle",
  "Create a Bundle earlier in this transformer to select it here.",
  "Create a Bundle needs a Bundle target profile.",
  "Created by step “{p0}”.",
  "Ctrl+Space or Alt+Space for suggestions",
  "Data type",
  "Declares a Bundle by name and type. Resource steps placed after it select it in “Add to Bundles”.",
  "Defines the Bundle and its entry rules. A fixed type in the target profile takes precedence.",
  "Definition",
  "Delete",
  "Delete sample",
  "Description",
  "Destination of this standalone resource.",
  "Diagnostics",
  "Diagnostics belong to the selected element. Go to rule reveals its field in the tree. On a narrow editor the inspector sits below the tree.",
  "Differs from the expected result.",
  "Disable branch rules",
  "Duplicate branch",
  "Duplicate branch copies a mapped repeating entry to a new occurrence, with new rule identities. Expressions and notes are kept. Iterated entries and entries at their maximum cardinality cannot be duplicated.",
  "Each message processed by the deployed channel keeps this step's events, and the finalization of its Bundles, in the connector map (fhirMapperTrace). Off by default; redeploy to apply.",
  "Edit as JSON",
  "Edit this step on the whole page (Esc to come back)",
  "Element",
  "Element inspector",
  "Empties the map: the step then runs the map chosen in Properties.",
  "Empty or n/a: translate locally using Profile Packages. Otherwise, enter the terminology server URL as reached by OIE.",
  "Empty the map: the step then runs the map chosen in Properties",
  "Empty: the resource type or type/id",
  "Enable branch rules",
  "Enable {p0} rule for {p1}",
  "Enabled",
  "Every required element below the mapped ones has a mapping or a fixed value.",
  "Every rule needs a path.",
  "Example",
  "Execution trace: {p0} event(s){p1}",
  "Exit full screen (Esc)",
  "Expand mapped",
  "Expand the mapped elements",
  "Expected a step JSON object.",
  "Explicitly include scalar values in the trace and its JSON export (256 characters per value).",
  "Export CSV table",
  "Export HTML documentation",
  "Export Markdown documentation",
  "Export Markdown table",
  "Export trace JSON",
  "Expression",
  "Expression / fixed value",
  "Extensions",
  "FHIR JSON in the channel map; use it from another destination.",
  "FHIR Mapper · {p0}",
  "FHIR Mapper: the platform is not bound yet",
  "FHIR Version",
  "FHIR context",
  "FHIR contexts saved. Redeploy the channels that use a changed context.",
  "FHIR help for {p0}",
  "FHIR mapper sections",
  "FHIR mapping trace",
  "FHIR mapping trace of message {p0}",
  "FHIR validation disabled.",
  "FHIR version",
  "Fields",
  "Files and folders on the OIE server, separated by ';': FML files (.fml, .map), StructureMaps, profiles, ConceptMaps and packages (.tgz).",
  "Filter fields and values…",
  "Filter sample fields",
  "Filters the tree and opens the branches that contain the text.",
  "Finds a node of the message by its name, its position or its occurrence.",
  "First item of a list matching a condition.",
  "Fixed value",
  "Fixed values of required elements were added to the mappings.",
  "Fixes the reference result of the sample. Later runs say whether the result matches, and show both side by side when it differs.",
  "For the steps whose validation is “as the context says”.",
  "Full screen",
  "Function catalogue: {p0}",
  "Generated script",
  "Give nothing when the source is missing, instead of a TypeError.",
  "Give the Bundle a name.",
  "Give the Channel Map variable a name.",
  "Go to rule",
  "HL7 v2 repetition guarded by its count.",
  "Help: FHIR contexts",
  "Help: Map",
  "Help: Mapper",
  "Help: Properties",
  "Help: Test",
  "Hide the script",
  "How long answers of the server are reused; 0 for not at all.",
  "How long to wait for the server.",
  "If-None-Exist",
  "Import value table",
  "Imported {count} value edit(s).",
  "In the inspector, Profile extension reveals a declared slice and its URL. List context extensions offers other URLs to add to an open extension collection; choose its value type in the tree afterwards.",
  "Inspect element",
  "Inspect {p0}",
  "Inspector expression for {p0}",
  "Internal name used by resource steps; separate from the FHIR id and profile URL.",
  "Invalid CSV quoting.",
  "Invalid or duplicate value target: {key}",
  "Invalid step property: {p0}",
  "Invalid table row {number}.",
  "Items of a list matching a condition.",
  "Iteration",
  "JavaScript expression",
  "JavaScript expression of the Authorization header; empty for none.",
  "JavaScript with code and system (the source code and its system), e.g. a code template function; gives a code, system|code or {system, code, display}, or null for no value",
  "Keep this message in the step, so it is saved with the channel",
  "Keeps the message in the step, so it is saved with the channel and shared by every user.",
  "Keeps this step's events on each processed message; read them with the “FHIR mapping trace” action of Messages. Redeploy to apply.",
  "Letters, digits, '_', '.', '-'. Steps refer to this name.",
  "Line {p0}, column {p1}: {p2}",
  "List context extensions",
  "List profiles",
  "Load",
  "Load a profile before importing a table.",
  "Load a target profile in Properties to map its elements.",
  "Load a target profile in Properties to test this step.",
  "Load maps",
  "Load the maps first",
  "Load the target profile.",
  "Loading another profile keeps the mappings of the elements it also has.",
  "Loading the target profile…",
  "Loading…",
  "Locations: {p0} · validation policy of the context: {p1}.",
  "Map",
  "Map tab",
  "Map {p0} is not in the loaded list.",
  "Mapped only",
  "Mapper",
  "Mapper functions",
  "Mapping",
  "Maps of the context",
  "Maps the message onto a profile. The resource is the result of the step, or is added to one or several Bundles.",
  "Matches the expected result.",
  "Max events ",
  "Method",
  "Minimum and maximum. A red count on the tab is the number of required elements still unmapped.",
  "Must Support",
  "Must Support and required",
  "Must Support in the profile.",
  "Must Support, not mapped: {p0}",
  "Name",
  "New context",
  "Next or previous field; open or close the element.",
  "No",
  "No diagnostic reported for this element.",
  "No extension in this context",
  "No extension occurrence is available.",
  "No field: paste a sample message in the Test tab (HL7 v2 is read by the server).",
  "No map in these locations",
  "No problem found{p0}{p1}.",
  "No request for a {p0} Bundle.",
  "No saved rule for this element.",
  "Not in this profile, removed: {p0}.",
  "Not used: the step runs the map written in the Map tab.",
  "Note",
  "Note for {p0} rule for {p1}",
  "OIE model",
  "OIE model of the message",
  "OIE model of the message (source of the map)",
  "Of the mappings, while the step is open.",
  "Official FHIR definition",
  "One entry for each item of a list (for each repetition)",
  "One entry of this element for each item",
  "One entry per item of a list. Fields below use the item variable, e.g. n['PID.5.1'].",
  "One path per line, on the OIE server: files, folders or .tgz packages (profiles, ConceptMaps, FML maps).",
  "One resource for each item",
  "One resource for each item needs a named Bundle target.",
  "One resource for each item of a list (e.g. each OBX)",
  "One row per element of the profile: its name and cardinality, its type, its mapping.",
  "One server path per line: files, folders or .tgz packages with profiles, ConceptMaps, value sets and FML maps.",
  "Only make the resource when a condition holds",
  "Only map this element (and what is below it) when a condition holds",
  "Only map this element, and what is below it, when a condition holds.",
  "Opens the element an error or a trace event belongs to.",
  "Options",
  "Otherwise, a StructureMap of the locations: .fml or .map files, StructureMap resources, packages.",
  "Outbound message",
  "Packages",
  "Packages and profile files",
  "Packages: {p0} · terminology: {p1} · validation: {p2}. Defined in Settings › FHIR Mapper.",
  "Parses the map on the server. Errors are underlined at their line; unknown uses and imports are reported.",
  "Pattern",
  "Preview scope",
  "Preview scope chooses this step alone (stand-in references) or the enabled Profile Mapper steps of this transformer (real references and finalized Bundles). Other step types are excluded.",
  "Produced resources by step",
  "Profile Mapper steps of this transformer",
  "Profile Packages",
  "Profile extension",
  "Profile locations",
  "Properties",
  "Published channel variables",
  "Random identities (urn:uuid) and meta.lastUpdated are ignored when comparing",
  "Random identities (urn:uuid) and meta.lastUpdated are ignored when comparing.",
  "Read current step",
  "Read the map files again",
  "Read the profile's definition, cardinality, binding, fixed value and examples. Edit expressions, existing conditions, iterations, translations, notes and activation in the same rules as the tree.",
  "Reading the tree",
  "Records each rule: value, conversion, translation, condition, iteration. Include scalar values only when patient data may be shown.",
  "Redo",
  "Reference Name",
  "Reload",
  "Remove these mappings",
  "Remove this entry and its mappings",
  "Remove this sample from the step",
  "Replace the expected result with this one",
  "Request URL",
  "Required, not mapped: {p0}",
  "Result",
  "Result destination",
  "Results of the saved samples",
  "Right-click a row, press Shift+F10 on its name, or use its ⋯ button to open the actions menu.",
  "Rule",
  "Rule details for {p0}",
  "Rule ids must be valid and unique within a step.",
  "Rule note…",
  "Rules",
  "Rules (disabled)",
  "Run",
  "Run all",
  "Run all ({p0})",
  "Run every saved sample and compare with its expected result",
  "Run test",
  "Run test executes the map on the sample message, on the server, and validates the result.",
  "Running…",
  "Runs enabled Profile Mapper steps in order, with real references and Bundle finalization. Other step types are excluded.",
  "Runs every saved sample: passed, or failed on an error, an invalid result or a difference.",
  "Runs this step on the server and validates what it makes; fhirRef() of earlier steps gives stand-ins.",
  "Runtime values not captured.",
  "S",
  "Sample",
  "Sample fields",
  "Sample fields ({p0})",
  "Sample message",
  "Sample {count}",
  "Samples",
  "Samples saved with the step",
  "Save as sample",
  "Save contexts",
  "Save the sample with the step",
  "Saving needs the permission “Manage FHIR mapper settings”.",
  "Saving…",
  "Scalar values included.",
  "Search",
  "Search elements",
  "Search elements…",
  "Search is limited to part of the loaded tree. Select a branch or narrow the search.",
  "Select an element by its name, with a click or Enter, or focus one of its fields. The inspector follows the selection.",
  "Select an element in the tree to inspect its definition and rules.",
  "Server-side profile files or folders, separated by ';'.",
  "Show",
  "Slice",
  "Source path from the sample; guard optional values.",
  "Start from an example",
  "Step mapping JSON",
  "Step {number}",
  "Steps: {steps}",
  "Suggestions: iteration variables, codes of the value set, references of other steps, mapper functions, paths of the sample.",
  "Tables edit value expressions and notes only. Other rules remain in the step. Empty expressions remove their value mapping.",
  "Target",
  "Target Profile",
  "Target: {p0}",
  "Terminology Server",
  "Terminology server",
  "Terminology server options",
  "Test",
  "Testing a step requires the permission “Test FHIR FML transforms”.",
  "Testing a step runs its code on the server, like a deployed channel: it requires the permission “Test FHIR mapper steps”.",
  "Testing needs the permission “Test FHIR FML transforms”.",
  "Testing runs the step's code on the server and needs the permission “Test FHIR mapper steps”.",
  "The JavaScript the server compiles from the mappings.",
  "The Test tab shows the model the map receives for a message: use it to find the names and positions of the nodes.",
  "The completed Bundle is published here after the configured checks of all named Bundles.",
  "The current transformer cannot be identified.",
  "The editors use it at once. A deployed channel keeps the context it read when it was deployed: redeploy it.",
  "The element takes its codes from a value set: they are offered while typing.",
  "The element {p0} is not in the loaded profile.",
  "The fields of the sample message with their values. Click one to insert its path into the field being edited, or drag it onto a field.",
  "The last test failed",
  "The last test or the compilation reported this element; its message is in the tooltip.",
  "The map runs with the message as its source (OieMessage) and builds its target.",
  "The message is given to the map as the generic OieMessage model: nodes with a name, a position, an occurrence and a value.",
  "The name other steps give to fhirRef('name') to point at this resource inside the Bundles.",
  "The outbound message, or a channel map variable to use from another destination.",
  "The outbound message, or a channel map variable.",
  "The outbound template (tmp) if there is one, else msg.",
  "The profile is now version {p0}; these mappings were made with version {p1}. Check them (elements no longer in the profile are listed).",
  "The resource the map built.",
  "The step on the whole page; Esc comes back.",
  "The table contains no value edits.",
  "The table must have key, expression and note columns.",
  "The translation of {p0} needs a {p1} for codes without a match.",
  "The value for codes without a match: a code, or system|code",
  "The variable of the iteration on {p0} must be a JavaScript name.",
  "The whole step as text, to copy it elsewhere or paste a mapping written by hand or by an agent. It is compiled on the server before it is applied.",
  "The whole step — properties and rules — as text: copy it to another step or channel, paste a mapping written by hand or by an AI agent, or make bulk edits. Validate and apply compiles it on the server first.",
  "This Bundle must be created earlier in the transformer.",
  "This diagnostic belongs to step {name}. Select that step to edit its rule.",
  "This is not a FHIR Profile Mapper step.",
  "This message has no FHIR mapping trace. Enable “Trace processed messages” on a FHIR Profile Mapper step, redeploy the channel, and check that its message storage keeps the maps.",
  "This step only",
  "Timeout (seconds)",
  "Toggle condition",
  "Toggle iteration",
  "Toggle translation",
  "Toolbar",
  "Trace",
  "Trace processed messages",
  "Translate the value with ConceptMap/$translate",
  "Translate the value with a ConceptMap; choose what happens without a match.",
  "Translates with a ConceptMap of the locations.",
  "Translation",
  "Type",
  "Understanding a result",
  "Undo / Redo",
  "Undo the last change of the mappings",
  "Unknown rule property: {p0}",
  "Unreadable files: ",
  "Use this result as expected",
  "Uses the groups of another map of the locations.",
  "Valid.",
  "Validate FHIR output",
  "Validate FHIR output ",
  "Validate and apply",
  "Validate this preview ",
  "Validation",
  "Validation of results",
  "Value",
  "Variable",
  "Variable available in this scope.",
  "Variable name",
  "Variables of the OIE maps ($) copied to context.variable of the model, separated by commas.",
  "Variables of the OIE maps copied into context.variable of the model.",
  "Version of the resources the map produces.",
  "What a context is",
  "What a test runs",
  "What is below this element is only mapped when the condition holds",
  "What the map received as its source: the names, positions and values to use in its rules.",
  "What this step does",
  "When $translate gives no match",
  "When a change applies",
  "Where the profile comes from",
  "Which map runs",
  "Without a context: server paths of profile files, folders or .tgz packages, separated by ';'.",
  "Write the map in the Map tab, or choose the map to run.",
  "Writing a mapping",
  "Writing the map",
  "Yes",
  "a source code to try",
  "always",
  "always, off, or as the context says. An invalid result stops the message.",
  "as",
  "as the context says{p0}",
  "below: {p0} (the item), {p1}Index (0, 1, …); fields dragged in are rewritten to {p2}[…]",
  "bundleDocument",
  "canonical URL of the ConceptMap",
  "choose a type below",
  "code",
  "code of the {p0} binding{p1}",
  "code or system|code",
  "condition ? a : b",
  "differs from the expected result",
  "empty: translate with the packages",
  "failed",
  "false, or an error on a missing segment: nothing below",
  "fhirFilter(list, function)",
  "fhirFind(list, function)",
  "fhirRef({p0})",
  "fhirResource",
  "fixed / pattern",
  "guard optional (x != null ? x : undefined)",
  'imports "url"',
  "invalid FHIR result",
  "item {indices}",
  "iteration index (0, 1, …)",
  "iteration item",
  "labo",
  "line {number}",
  "local",
  'map "url" = "Name", then uses … as source / as target, then one or more groups of rules.',
  "matches the expected result",
  "myFunction(code, system)",
  "n/a",
  "no match: error",
  "no match: expression",
  "no match: fixed value",
  "no match: keep the source code",
  "no match: leave empty",
  "no package",
  "none",
  "not declared earlier",
  "nth repetition if present",
  "off",
  "passed",
  "per item: keeps the items it holds for",
  "red row",
  "reference · {p0} built by step “{p1}”",
  "rule {rule}, item {index}",
  "runs (no expected result)",
  "sample path",
  "sample: {p0}",
  "site, sendingFacility",
  "snippet · {p0}",
  "source system (optional)",
  "src.node as pid where name = 'PID'",
  "system of the source code",
  "target system (optional)",
  "targetsystem of $translate",
  "values of the sample message of the Test tab — click to insert into the field being edited, or drag onto a field",
  "{count} event(s){suffix}",
  "{count} item(s)",
  "{p0}\n\nExample: {p1}",
  "{p0} (JSON)",
  "{p0} (not defined on this server)",
  "{p0} ({p1})",
  "{p0} Example: {p1}. Available inside FHIR Profile Mapper expressions.",
  "{p0} item(s)",
  "{p0} must be a string containing a JSON array.",
  "{p0} problem(s)",
  "{p0} required element(s) not mapped",
  "{p0} validation issue(s):",
  "{p0} {p1}",
  "{p0} {p1}: {p2}",
  "{p0} · {p1}",
  "{p0} — {p1}",
  "{p0} — {p1}, {p2}",
  "{p0}..{p1}",
  "{p0}: {p1}",
  "{p0}['PID.3.5'].toString() == 'PI'",
  "{p0}{p1}. {p2}.",
  "{strength} binding: {valueSet}",
  "… binding",
  "→ no match (then the rule chosen for no match)",
  "→ {p0}{p1}",
  "↶ Undo",
  "↷ Redo",
  "↻ For each",
  "↻ One resource for each",
  "⇄ ConceptMap",
  "⇄ ConceptMap (local)",
  "⌥Space",
  "⌥Space (or ⌃Space) for suggestions",
  "── finalization",
  "⤢ Full screen"
].map((message) => [message, message]));

// src/i18n/locales/fr.js
var fr_default = {
  "FHIR resource": "Ressource FHIR",
  "Generate skeleton": "Générer le squelette",
  "Generating…": "Génération…",
  "Generic OIE message": "Message OIE générique",
  "Required. Dots become underscores and existing underscores are doubled.": "Obligatoire. Les points deviennent des tirets bas et les tirets bas existants sont doublés.",
  "Source instance": "Instance source",
  "Source instance received by the map": "Instance source reçue par la map",
  "Source model": "Modèle source",
  "Source model canonical URL": "URL canonique du modèle source",
  "Target profile for the skeleton": "Profil cible du squelette",
  "The typed HL7 v2 model reads the XML produced by OIE's Strict Parser.": "Le modèle HL7 v2 typé lit le XML produit par le Strict Parser d’OIE.",
  "The typed HL7 v2 source model requires its canonical URL.": "Le modèle source HL7 v2 typé exige son URL canonique.",
  "Typed HL7 v2 logical model": "Modèle logique HL7 v2 typé",
  "Used by the map skeleton; the FHIR resource itself declares its type.": "Utilisée par le squelette de map ; la ressource FHIR déclare elle-même son type.",
  " (final validation is set on each Bundle)": " (la validation finale se règle sur chaque Bundle)",
  " (groups: {groups})": " (groupes : {groups})",
  " + source coding": " + codage source",
  " Add the profile to meta.profile": " Ajouter le profil à meta.profile",
  " All ConceptMaps ({p0} matching)": " Toutes les ConceptMaps ({p0} correspondantes)",
  " Include scalar values": " Inclure les valeurs scalaires",
  " Set meta.lastUpdated": " Renseigner meta.lastUpdated",
  " Trace": " Trace",
  " Trace processed messages": " Tracer les messages traités",
  " Validate the result": " Valider le résultat",
  " extensions & ids": " extensions et identifiants",
  " in {name}": " dans {name}",
  " {p0} rule": " Règle {p0}",
  " — disabled (kept, not executed)": " — désactivée (conservée, non exécutée)",
  "'Bearer ' + $cfg('tx.token')": "'Bearer ' + $cfg('tx.token')",
  "'identifier=' + ...": "'identifier=' + ...",
  "'patient'": "'patient'",
  "'{p0}'{p1}": "'{p0}'{p1}",
  "(none: this step's own packages and terminology server)": "(aucun : packages et serveur terminologique propres à cette étape)",
  "(none: this step's own version and locations)": "(aucun : version et emplacements propres à cette étape)",
  "(unsaved sample, this browser)": "(exemple non enregistré, dans ce navigateur)",
  ", truncated": ", tronquée",
  "-> patient.gender = translate(v, 'url', 'code')": "-> patient.gender = translate(v, 'url', 'code')",
  "? Only if": "? Seulement si",
  "? Only make the resource if": "? Créer la ressource seulement si",
  "A FHIR FML Transform step runs a map written in the FHIR Mapping Language on the message and publishes the resource it builds.": "Une étape FHIR FML Transform exécute une map FHIR Mapping Language sur le message et publie la ressource produite.",
  "A FHIR Profile Mapper step builds one FHIR resource from the message, or creates a named Bundle that later steps fill.": "Une étape FHIR Profile Mapper construit une ressource FHIR à partir du message, ou crée un Bundle nommé que les étapes suivantes remplissent.",
  "A FHIR context is a named set of profile packages, a terminology server and a validation policy. FHIR Profile Mapper and FHIR FML Transform steps that name a context share them; a step without a context keeps its own. A deployed channel takes a change when it is redeployed.": "Un contexte FHIR regroupe des packages de profils, un serveur terminologique et une politique de validation. Les étapes qui le nomment partagent ces réglages ; sans contexte, elles gardent leurs propriétés. Redéployer un canal pour appliquer un changement.",
  "A choice between two values.": "Un choix entre deux valeurs.",
  "A context of Settings › FHIR Mapper gives the packages, the terminology server and the validation policy to every step that names it.": "Un contexte de Settings › FHIR Mapper fournit les packages, le serveur terminologique et la politique de validation aux étapes qui le nomment.",
  "A context of Settings › FHIR Mapper gives the version and the locations to every step that names it.": "Un contexte de Settings › FHIR Mapper fournit la version et les emplacements aux étapes qui le nomment.",
  "A map written here is saved with the channel and runs instead of the map chosen in Properties. It may import the maps and use the profiles and ConceptMaps of the profile locations.": "La map écrite ici est enregistrée avec le canal et remplace celle choisie dans Propriétés. Elle peut importer les maps et utiliser les profils et ConceptMaps des emplacements configurés.",
  "A map written in the step is saved with the channel and runs first.": "Une map écrite dans l’étape est enregistrée avec le canal et devient prioritaire.",
  "A missing optional field must give nothing, not an error: guard it, e.g. x.length() > 1 ? x[1].toString() : undefined.": "Un champ facultatif absent doit ne rien produire, plutôt qu’une erreur : protéger l’accès, par exemple x.length() > 1 ? x[1].toString() : undefined.",
  "A named set of locations defined in Settings › FHIR Mapper, shared by the steps that name it.": "Des emplacements nommés, définis dans Settings › FHIR Mapper et partagés par les étapes qui les nomment.",
  "A named set of packages, terminology server and validation policy, defined once in Settings › FHIR Mapper and shared by every step that names it.": "Des packages, une terminologie et une politique de validation nommés, définis une fois dans Settings › FHIR Mapper et partagés par les étapes qui les nomment.",
  "A named set of profile packages, a terminology server and a validation policy, shared by the FHIR Profile Mapper and FHIR FML Transform steps that name it.": "Des packages de profils, un serveur terminologique et une politique de validation nommés, partagés par les étapes qui nomment ce contexte.",
  "A small map to adapt.": "Une petite map à adapter.",
  "A step without a context keeps its own packages and settings.": "Une étape sans contexte conserve ses propres packages et réglages.",
  "A value the profile imposes: it is added by itself once its container gets a value.": "Une valeur imposée par le profil : elle est ajoutée dès que son conteneur reçoit une valeur.",
  "Action": "Action",
  "Actions for {p0}": "Actions pour {p0}",
  "Add an entry": "Ajouter une occurrence",
  "Add an extension by URL…": "Ajouter une extension par URL…",
  "Add context extension": "Ajouter une extension du contexte",
  "Add or remove an entry of a repeating element.": "Ajouter ou retirer une occurrence d’un élément répétable.",
  "Add the source code as a second coding": "Ajouter le code source comme second codage",
  "Add to Bundles": "Ajouter aux Bundles",
  "Against the profiles in meta.profile, else the base definition. An invalid result stops the message.": "Selon les profils de meta.profile, sinon la définition de base. Un résultat invalide arrête le message.",
  "Against the profiles of meta.profile, else the base definition. An invalid result stops the message.": "Selon les profils de meta.profile, sinon la définition de base. Un résultat invalide arrête le message.",
  "All elements": "Tous les éléments",
  "All elements, Must Support and required, or mapped only.": "Tous les éléments, les éléments requis/Must Support, ou les éléments mappés.",
  "Also record the scalar values of this step's rules (256 characters per value). They may contain patient data.": "Conserver aussi les valeurs scalaires des règles (256 caractères par valeur). Elles peuvent contenir des données patient.",
  "Also show extension, modifierExtension and id of every element (to add an extension the profile does not have)": "Afficher aussi extension, modifierExtension et id sur chaque élément pour ajouter une extension hors profil.",
  "Alt+↓ ↑ → ←": "Alt+↓ ↑ → ←",
  "An action and resourceType are required.": "Une action et un resourceType sont requis.",
  "Applies to this step only; its OIE sequence and enabled state are preserved. Save the channel to persist changes.": "S’applique à cette étape seulement ; son ordre OIE et son activation sont conservés. Enregistrer le canal pour conserver les changements.",
  "Authorization": "Autorisation",
  "Base URL as OIE reaches it; empty to translate with the ConceptMaps of the packages.": "URL de base accessible par OIE ; vide pour traduire avec les ConceptMaps des packages.",
  "Base URL as the OIE server reaches it; empty to translate locally.": "URL de base accessible par le serveur OIE ; vide pour traduire localement.",
  "Binding": "Binding",
  "Branch actions and extensions": "Actions de branche et extensions",
  "Build a resource": "Construire une ressource",
  "Build this resource once, then add the same resource to each selected Bundle. Leave all unchecked for a standalone result.": "Construire cette ressource une fois et l’ajouter à chaque Bundle sélectionné. Ne rien cocher pour un résultat autonome.",
  "Bundle Name": "Nom du Bundle",
  "Bundle Type": "Type du Bundle",
  "Bundle.entry is filled by the resource steps that select this Bundle in “Add to Bundles”.": "Bundle.entry est rempli par les étapes ressources qui sélectionnent ce Bundle dans « Ajouter aux Bundles ».",
  "Bundles are named and created explicitly; results are completed after the last FHIR mapper.": "Les Bundles sont nommés et créés explicitement ; les résultats sont finalisés après la dernière étape de mapping FHIR.",
  "Buttons": "Boutons",
  "Buttons of a row": "Boutons d’une ligne",
  "Cache (seconds)": "Cache (secondes)",
  "Cannot find these mapped elements in the profile (editing is blocked so they are not lost): {p0}. ": "Éléments mappés introuvables dans ce profil (édition bloquée pour éviter leur perte) : {p0}. ",
  "Canonical URL of the profile, or a resource type (Patient)": "URL canonique du profil ou type de ressource (Patient)",
  "Canonical URL of the profile, or a resource type. Load reads its elements; mappings of elements it also has are kept.": "URL canonique du profil ou type de ressource. Charger lit ses éléments ; les mappings des éléments communs sont conservés.",
  "Cardinality": "Cardinalité",
  "Changing the FHIR contexts requires the permission “Manage FHIR mapper settings”.": "Modifier les contextes FHIR nécessite la permission « Manage FHIR mapper settings ».",
  "Channel Map variable": "Variable de Channel Map",
  "Channel map variable": "Variable de Channel Map",
  "Channel {name}, revision {revision}": "Canal {name}, révision {revision}",
  "Check": "Vérifier",
  "Checked": "Vérifié",
  "Checking…": "Vérification…",
  "Choose a map…": "Choisir une map…",
  "Choose an extension of the profile…": "Choisir une extension du profil…",
  "Choose the action: create a Bundle or build a resource.": "Choisir l’action : créer un Bundle ou construire une ressource.",
  "Choose the target profile.": "Choisir le profil cible.",
  "Clear": "Effacer",
  "Clear the expected result": "Effacer le résultat attendu",
  "Click a field to edit it with completion. {p0}: functions, scoped variables and sample paths. ↑/↓ to choose, Enter/Tab to insert, Esc to close. Guard optional values.": "Cliquer un champ pour l’éditer avec la complétion. {p0} : fonctions, variables de portée et chemins de l’exemple. ↑/↓ pour choisir, Entrée/Tab pour insérer, Échap pour fermer. Protéger les valeurs facultatives.",
  "Click a field to edit it. An expression is JavaScript, usually a path of the message; a constant is written 'final'.": "Cliquer un champ pour l’éditer. Une expression est du JavaScript, souvent un chemin du message ; une constante s’écrit 'final'.",
  "Collapse all": "Tout replier",
  "Collapse every element": "Replier tous les éléments",
  "Common to the selected Bundles. fhirRef(name) must resolve to the same resource in these Bundles.": "Commun aux Bundles sélectionnés. fhirRef(name) doit désigner la même ressource dans ces Bundles.",
  "ConceptMap for {p0}": "ConceptMap pour {p0}",
  "ConceptMap/$translate locally, on the ConceptMaps of the Profile Packages": "ConceptMap/$translate localement, sur les ConceptMaps des packages de profils",
  "ConceptMap/$translate on the terminology server": "ConceptMap/$translate sur le serveur terminologique",
  "ConceptMaps are suggested by source/target systems and the target binding. All ConceptMaps restores the full list. A suggestion never replaces the current selection automatically.": "Les ConceptMaps sont proposées selon les systèmes source/cible et le binding cible. Toutes les ConceptMaps rétablit la liste complète. Une suggestion ne remplace jamais le choix actuel.",
  "Condition": "Condition",
  "Conditional creation for this Bundle entry.": "Création conditionnelle pour cette entrée du Bundle.",
  "Connector {name} ({transformer})": "Connecteur {name} ({transformer})",
  "Context name": "Nom du contexte",
  "Context variables": "Variables de contexte",
  "Copy branch as JSON": "Copier la branche en JSON",
  "Create a Bundle": "Créer un Bundle",
  "Create a Bundle earlier in this transformer to select it here.": "Créer un Bundle plus haut dans ce transformeur pour le sélectionner ici.",
  "Create a Bundle needs a Bundle target profile.": "Créer un Bundle nécessite un profil cible de type Bundle.",
  "Created by step “{p0}”.": "Créé par l’étape « {p0} ».",
  "Ctrl+Space or Alt+Space for suggestions": "Ctrl+Espace ou Alt+Espace pour les suggestions",
  "Data type": "Type de données",
  "Declares a Bundle by name and type. Resource steps placed after it select it in “Add to Bundles”.": "Déclare un Bundle par son nom et son type. Les étapes ressources suivantes le sélectionnent dans « Ajouter aux Bundles ».",
  "Defines the Bundle and its entry rules. A fixed type in the target profile takes precedence.": "Définit le Bundle et ses règles d’entrée. Un type fixé par le profil cible est prioritaire.",
  "Definition": "Définition",
  "Delete": "Supprimer",
  "Delete sample": "Supprimer l’exemple",
  "Description": "Description",
  "Destination of this standalone resource.": "Destination de cette ressource autonome.",
  "Diagnostics": "Diagnostics",
  "Diagnostics belong to the selected element. Go to rule reveals its field in the tree. On a narrow editor the inspector sits below the tree.": "Les diagnostics concernent l’élément sélectionné. Aller à la règle révèle son champ dans l’arbre. Sur un éditeur étroit, l’inspecteur passe sous l’arbre.",
  "Differs from the expected result.": "Différent du résultat attendu.",
  "Disable branch rules": "Désactiver les règles de la branche",
  "Duplicate branch": "Dupliquer la branche",
  "Duplicate branch copies a mapped repeating entry to a new occurrence, with new rule identities. Expressions and notes are kept. Iterated entries and entries at their maximum cardinality cannot be duplicated.": "Dupliquer la branche copie une occurrence répétable mappée avec de nouveaux identifiants de règles. Expressions et notes sont conservées. Une occurrence itérée ou à sa cardinalité maximale ne peut pas être dupliquée.",
  "Each message processed by the deployed channel keeps this step's events, and the finalization of its Bundles, in the connector map (fhirMapperTrace). Off by default; redeploy to apply.": "Chaque message traité conserve les événements de cette étape et la finalisation des Bundles dans la map du connecteur (fhirMapperTrace). Désactivé par défaut ; redéployer pour appliquer.",
  "Edit as JSON": "Éditer en JSON",
  "Edit this step on the whole page (Esc to come back)": "Éditer cette étape sur toute la page (Échap pour revenir)",
  "Element": "Élément",
  "Element inspector": "Inspecteur d’élément",
  "Empties the map: the step then runs the map chosen in Properties.": "Vide la map : l’étape exécute alors celle choisie dans Propriétés.",
  "Empty or n/a: translate locally using Profile Packages. Otherwise, enter the terminology server URL as reached by OIE.": "Vide ou n/a : traduire localement avec les packages de profils. Sinon, renseigner l’URL du serveur terminologique accessible par OIE.",
  "Empty the map: the step then runs the map chosen in Properties": "Vider la map : l’étape exécutera celle choisie dans Propriétés",
  "Empty: the resource type or type/id": "Vide : type de ressource ou type/id",
  "Enable branch rules": "Activer les règles de la branche",
  "Enable {p0} rule for {p1}": "Activer la règle {p0} pour {p1}",
  "Enabled": "Activée",
  "Every required element below the mapped ones has a mapping or a fixed value.": "Chaque élément requis sous les éléments mappés possède un mapping ou une valeur fixe.",
  "Every rule needs a path.": "Chaque règle doit avoir un chemin.",
  "Example": "Exemple",
  "Execution trace: {p0} event(s){p1}": "Trace d’exécution : {p0} événement(s){p1}",
  "Exit full screen (Esc)": "Quitter le plein écran (Échap)",
  "Expand mapped": "Déplier les éléments mappés",
  "Expand the mapped elements": "Déplier les éléments mappés",
  "Expected a step JSON object.": "Un objet JSON d’étape est attendu.",
  "Explicitly include scalar values in the trace and its JSON export (256 characters per value).": "Inclure explicitement les valeurs scalaires dans la trace et son export JSON (256 caractères par valeur).",
  "Export CSV table": "Exporter un tableau CSV",
  "Export HTML documentation": "Exporter la documentation HTML",
  "Export Markdown documentation": "Exporter la documentation Markdown",
  "Export Markdown table": "Exporter un tableau Markdown",
  "Export trace JSON": "Exporter la trace JSON",
  "Expression": "Expression",
  "Expression / fixed value": "Expression / valeur fixe",
  "Extensions": "Extensions",
  "FHIR JSON in the channel map; use it from another destination.": "JSON FHIR dans la Channel Map ; à utiliser depuis une destination suivante.",
  "FHIR Mapper · {p0}": "FHIR Mapper · {p0}",
  "FHIR Mapper: the platform is not bound yet": "FHIR Mapper : la plateforme n’est pas encore liée",
  "FHIR Version": "Version FHIR",
  "FHIR context": "Contexte FHIR",
  "FHIR contexts saved. Redeploy the channels that use a changed context.": "Contextes FHIR enregistrés. Redéployer les canaux qui utilisent un contexte modifié.",
  "FHIR help for {p0}": "Aide FHIR pour {p0}",
  "FHIR mapper sections": "Sections du mappeur FHIR",
  "FHIR mapping trace": "Trace du mapping FHIR",
  "FHIR mapping trace of message {p0}": "Trace du mapping FHIR du message {p0}",
  "FHIR validation disabled.": "Validation FHIR désactivée.",
  "FHIR version": "Version FHIR",
  "Fields": "Champs",
  "Files and folders on the OIE server, separated by ';': FML files (.fml, .map), StructureMaps, profiles, ConceptMaps and packages (.tgz).": "Fichiers et dossiers du serveur OIE, séparés par « ; » : fichiers FML (.fml, .map), StructureMaps, profils, ConceptMaps et packages (.tgz).",
  "Filter fields and values…": "Filtrer les champs et valeurs…",
  "Filter sample fields": "Filtrer les champs de l’exemple",
  "Filters the tree and opens the branches that contain the text.": "Filtre l’arbre et ouvre les branches qui contiennent le texte.",
  "Finds a node of the message by its name, its position or its occurrence.": "Trouve un nœud par son nom, sa position ou son occurrence.",
  "First item of a list matching a condition.": "Premier élément d’une liste respectant une condition.",
  "Fixed value": "Valeur fixe",
  "Fixed values of required elements were added to the mappings.": "Les valeurs fixes des éléments requis ont été ajoutées aux mappings.",
  "Fixes the reference result of the sample. Later runs say whether the result matches, and show both side by side when it differs.": "Fixe le résultat de référence de l’exemple. Les exécutions suivantes le comparent et présentent les deux résultats côte à côte en cas d’écart.",
  "For the steps whose validation is “as the context says”.": "Pour les étapes dont la validation suit le contexte.",
  "Full screen": "Plein écran",
  "Function catalogue: {p0}": "Catalogue des fonctions : {p0}",
  "Generated script": "Script généré",
  "Give nothing when the source is missing, instead of a TypeError.": "Ne rien produire si la source manque, plutôt qu’une TypeError.",
  "Give the Bundle a name.": "Donner un nom au Bundle.",
  "Give the Channel Map variable a name.": "Donner un nom à la variable de Channel Map.",
  "Go to rule": "Aller à la règle",
  "HL7 v2 repetition guarded by its count.": "Répétition HL7 v2 protégée par son nombre d’occurrences.",
  "Help: FHIR contexts": "Aide : contextes FHIR",
  "Help: Map": "Aide : map FML",
  "Help: Mapper": "Aide : mappeur",
  "Help: Properties": "Aide : propriétés",
  "Help: Test": "Aide : test",
  "Hide the script": "Masquer le script",
  "How long answers of the server are reused; 0 for not at all.": "Durée de réutilisation des réponses ; 0 pour ne pas les réutiliser.",
  "How long to wait for the server.": "Délai d’attente du serveur.",
  "If-None-Exist": "If-None-Exist",
  "Import value table": "Importer un tableau de valeurs",
  "Imported {count} value edit(s).": "{count} modification(s) de valeur importée(s).",
  "In the inspector, Profile extension reveals a declared slice and its URL. List context extensions offers other URLs to add to an open extension collection; choose its value type in the tree afterwards.": "Dans l’inspecteur, Extension du profil révèle une slice et son URL. Lister les extensions du contexte propose d’autres URL à ajouter à une collection ouverte ; choisir ensuite son type de valeur dans l’arbre.",
  "Inspect element": "Inspecter l’élément",
  "Inspect {p0}": "Inspecter {p0}",
  "Inspector expression for {p0}": "Expression de l’inspecteur pour {p0}",
  "Internal name used by resource steps; separate from the FHIR id and profile URL.": "Nom interne utilisé par les étapes ressources ; distinct de l’id FHIR et de l’URL du profil.",
  "Invalid CSV quoting.": "Guillemets CSV invalides.",
  "Invalid or duplicate value target: {key}": "Cible de valeur invalide ou en double : {key}",
  "Invalid step property: {p0}": "Propriété d’étape invalide : {p0}",
  "Invalid table row {number}.": "Ligne de tableau {number} invalide.",
  "Items of a list matching a condition.": "Éléments d’une liste respectant une condition.",
  "Iteration": "Itération",
  "JavaScript expression": "Expression JavaScript",
  "JavaScript expression of the Authorization header; empty for none.": "Expression JavaScript de l’en-tête Authorization ; vide pour aucun.",
  "JavaScript with code and system (the source code and its system), e.g. a code template function; gives a code, system|code or {system, code, display}, or null for no value": "JavaScript avec code et system (code source et son système), par exemple une fonction de modèle ; produit un code, system|code, {system, code, display}, ou null.",
  "Keep this message in the step, so it is saved with the channel": "Conserver ce message dans l’étape pour l’enregistrer avec le canal",
  "Keeps the message in the step, so it is saved with the channel and shared by every user.": "Conserve le message dans l’étape, enregistré avec le canal et partagé entre utilisateurs.",
  "Keeps this step's events on each processed message; read them with the “FHIR mapping trace” action of Messages. Redeploy to apply.": "Conserve les événements de cette étape pour chaque message ; les lire avec l’action « Trace du mapping FHIR » de Messages. Redéployer pour appliquer.",
  "Letters, digits, '_', '.', '-'. Steps refer to this name.": "Lettres, chiffres, '_', '.', '-'. Les étapes utilisent ce nom.",
  "Line {p0}, column {p1}: {p2}": "Ligne {p0}, colonne {p1} : {p2}",
  "List context extensions": "Lister les extensions du contexte",
  "List profiles": "Lister les profils",
  "Load": "Charger",
  "Load a profile before importing a table.": "Charger un profil avant d’importer un tableau.",
  "Load a target profile in Properties to map its elements.": "Charger un profil cible dans Propriétés pour mapper ses éléments.",
  "Load a target profile in Properties to test this step.": "Charger un profil cible dans Propriétés pour tester cette étape.",
  "Load maps": "Charger les maps",
  "Load the maps first": "Charger d’abord les maps",
  "Load the target profile.": "Charger le profil cible.",
  "Loading another profile keeps the mappings of the elements it also has.": "Charger un autre profil conserve les mappings des éléments communs.",
  "Loading the target profile…": "Chargement du profil cible…",
  "Loading…": "Chargement…",
  "Locations: {p0} · validation policy of the context: {p1}.": "Emplacements : {p0} · politique de validation du contexte : {p1}.",
  "Map": "Map",
  "Map tab": "Onglet Map",
  "Map {p0} is not in the loaded list.": "La map {p0} n’est pas dans la liste chargée.",
  "Mapped only": "Éléments mappés seulement",
  "Mapper": "Mappeur",
  "Mapper functions": "Fonctions du mappeur",
  "Mapping": "Mapping",
  "Maps of the context": "Maps du contexte",
  "Maps the message onto a profile. The resource is the result of the step, or is added to one or several Bundles.": "Mappe le message sur un profil. La ressource devient le résultat de l’étape ou est ajoutée à des Bundles.",
  "Matches the expected result.": "Conforme au résultat attendu.",
  "Max events ": "Nombre maximal d’événements ",
  "Method": "Méthode",
  "Minimum and maximum. A red count on the tab is the number of required elements still unmapped.": "Minimum et maximum. Le badge rouge de l’onglet compte les éléments requis non mappés.",
  "Must Support": "Must Support",
  "Must Support and required": "Must Support et requis",
  "Must Support in the profile.": "Must Support dans le profil.",
  "Must Support, not mapped: {p0}": "Must Support non mappés : {p0}",
  "Name": "Nom",
  "New context": "Nouveau contexte",
  "Next or previous field; open or close the element.": "Champ suivant ou précédent ; déplier ou replier l’élément.",
  "No": "Non",
  "No diagnostic reported for this element.": "Aucun diagnostic pour cet élément.",
  "No extension in this context": "Aucune extension dans ce contexte",
  "No extension occurrence is available.": "Aucune occurrence d’extension disponible.",
  "No field: paste a sample message in the Test tab (HL7 v2 is read by the server).": "Aucun champ : coller un exemple dans Test (HL7 v2 est lu par le serveur).",
  "No map in these locations": "Aucune map dans ces emplacements",
  "No problem found{p0}{p1}.": "Aucun problème trouvé{p0}{p1}.",
  "No request for a {p0} Bundle.": "Pas de requête pour un Bundle {p0}.",
  "No saved rule for this element.": "Aucune règle enregistrée pour cet élément.",
  "Not in this profile, removed: {p0}.": "Absents de ce profil et retirés : {p0}.",
  "Not used: the step runs the map written in the Map tab.": "Non utilisée : l’étape exécute la map de l’onglet Map.",
  "Note": "Note",
  "Note for {p0} rule for {p1}": "Note de la règle {p0} pour {p1}",
  "OIE model": "Modèle OIE",
  "OIE model of the message": "Modèle OIE du message",
  "OIE model of the message (source of the map)": "Modèle OIE du message (source de la map)",
  "Of the mappings, while the step is open.": "Sur les mappings, pendant l’édition de l’étape.",
  "Official FHIR definition": "Définition FHIR officielle",
  "One entry for each item of a list (for each repetition)": "Une occurrence pour chaque élément d’une liste (chaque répétition)",
  "One entry of this element for each item": "Une occurrence de cet élément pour chaque item",
  "One entry per item of a list. Fields below use the item variable, e.g. n['PID.5.1'].": "Une occurrence par élément d’une liste. Les champs enfants utilisent sa variable, par exemple n['PID.5.1'].",
  "One path per line, on the OIE server: files, folders or .tgz packages (profiles, ConceptMaps, FML maps).": "Un chemin serveur par ligne : fichiers, dossiers ou packages .tgz (profils, ConceptMaps, maps FML).",
  "One resource for each item": "Une ressource pour chaque item",
  "One resource for each item needs a named Bundle target.": "Une ressource par item nécessite un Bundle cible nommé.",
  "One resource for each item of a list (e.g. each OBX)": "Une ressource par élément de liste (par exemple chaque OBX)",
  "One row per element of the profile: its name and cardinality, its type, its mapping.": "Une ligne par élément du profil : nom, cardinalité, type et mapping.",
  "One server path per line: files, folders or .tgz packages with profiles, ConceptMaps, value sets and FML maps.": "Un chemin serveur par ligne : fichiers, dossiers ou packages .tgz contenant profils, ConceptMaps, jeux de valeurs et maps FML.",
  "Only make the resource when a condition holds": "Créer la ressource seulement si la condition est vraie",
  "Only map this element (and what is below it) when a condition holds": "Mapper cet élément et ses descendants seulement si une condition est vraie",
  "Only map this element, and what is below it, when a condition holds.": "Mapper cet élément et ses descendants seulement si une condition est vraie.",
  "Opens the element an error or a trace event belongs to.": "Ouvre l’élément associé à une erreur ou un événement de trace.",
  "Options": "Options",
  "Otherwise, a StructureMap of the locations: .fml or .map files, StructureMap resources, packages.": "Sinon, une StructureMap des emplacements : fichiers .fml ou .map, ressources StructureMap et packages.",
  "Outbound message": "Message sortant",
  "Packages": "Packages",
  "Packages and profile files": "Packages et fichiers de profils",
  "Packages: {p0} · terminology: {p1} · validation: {p2}. Defined in Settings › FHIR Mapper.": "Packages : {p0} · terminologie : {p1} · validation : {p2}. Définis dans Settings › FHIR Mapper.",
  "Parses the map on the server. Errors are underlined at their line; unknown uses and imports are reported.": "Analyse la map sur le serveur. Les erreurs sont soulignées à leur ligne ; les uses et imports inconnus sont signalés.",
  "Pattern": "Motif",
  "Preview scope": "Périmètre de l’aperçu",
  "Preview scope chooses this step alone (stand-in references) or the enabled Profile Mapper steps of this transformer (real references and finalized Bundles). Other step types are excluded.": "Le périmètre permet de choisir cette étape seule (références de remplacement) ou les étapes Profile Mapper activées de ce transformeur (références réelles et Bundles finalisés). Les autres types d’étapes sont exclus.",
  "Produced resources by step": "Ressources produites par étape",
  "Profile Mapper steps of this transformer": "Étapes Profile Mapper de ce transformeur",
  "Profile Packages": "Packages de profils",
  "Profile extension": "Extension du profil",
  "Profile locations": "Emplacements des profils",
  "Properties": "Propriétés",
  "Published channel variables": "Variables du canal publiées",
  "Random identities (urn:uuid) and meta.lastUpdated are ignored when comparing": "Les identités aléatoires (urn:uuid) et meta.lastUpdated sont ignorées pour la comparaison",
  "Random identities (urn:uuid) and meta.lastUpdated are ignored when comparing.": "Les identités aléatoires (urn:uuid) et meta.lastUpdated sont ignorées pour la comparaison.",
  "Read current step": "Lire l’étape actuelle",
  "Read the map files again": "Relire les fichiers des maps",
  "Read the profile's definition, cardinality, binding, fixed value and examples. Edit expressions, existing conditions, iterations, translations, notes and activation in the same rules as the tree.": "Lire la définition, cardinalité, binding, valeur fixe et exemples du profil. Éditer expressions, conditions, itérations, traductions, notes et activation dans les mêmes règles que l’arbre.",
  "Reading the tree": "Lire l’arbre",
  "Records each rule: value, conversion, translation, condition, iteration. Include scalar values only when patient data may be shown.": "Observe chaque règle : valeur, conversion, traduction, condition, itération. Inclure les valeurs seulement si les données patient peuvent être affichées.",
  "Redo": "Rétablir",
  "Reference Name": "Nom de référence",
  "Reload": "Recharger",
  "Remove these mappings": "Retirer ces mappings",
  "Remove this entry and its mappings": "Retirer cette occurrence et ses mappings",
  "Remove this sample from the step": "Retirer cet exemple de l’étape",
  "Replace the expected result with this one": "Remplacer le résultat attendu par celui-ci",
  "Request URL": "URL de requête",
  "Required, not mapped: {p0}": "Éléments requis non mappés : {p0}",
  "Result": "Résultat",
  "Result destination": "Destination du résultat",
  "Results of the saved samples": "Résultats des exemples enregistrés",
  "Right-click a row, press Shift+F10 on its name, or use its ⋯ button to open the actions menu.": "Clic droit sur une ligne, Maj+F10 sur son nom ou bouton ⋯ pour ouvrir le menu d’actions.",
  "Rule": "Règle",
  "Rule details for {p0}": "Détails des règles pour {p0}",
  "Rule ids must be valid and unique within a step.": "Les identifiants de règles doivent être valides et uniques dans une étape.",
  "Rule note…": "Note de la règle…",
  "Rules": "Règles",
  "Rules (disabled)": "Règles (désactivées)",
  "Run": "Exécuter",
  "Run all": "Tout exécuter",
  "Run all ({p0})": "Tout exécuter ({p0})",
  "Run every saved sample and compare with its expected result": "Exécuter chaque exemple enregistré et comparer son résultat attendu",
  "Run test": "Exécuter le test",
  "Run test executes the map on the sample message, on the server, and validates the result.": "Exécuter le test lance la map sur le message exemple, sur le serveur, et valide le résultat.",
  "Running…": "Exécution…",
  "Runs enabled Profile Mapper steps in order, with real references and Bundle finalization. Other step types are excluded.": "Exécute les étapes Profile Mapper activées dans l’ordre, avec les références réelles et la finalisation des Bundles. Les autres types d’étapes sont exclus.",
  "Runs every saved sample: passed, or failed on an error, an invalid result or a difference.": "Exécute tous les exemples enregistrés : réussite, ou échec en cas d’erreur, de résultat invalide ou d’écart.",
  "Runs this step on the server and validates what it makes; fhirRef() of earlier steps gives stand-ins.": "Exécute cette étape sur le serveur et valide sa sortie ; fhirRef() simule les références des étapes précédentes.",
  "Runtime values not captured.": "Valeurs d’exécution non capturées.",
  "S": "S",
  "Sample": "Exemple",
  "Sample fields": "Champs de l’exemple",
  "Sample fields ({p0})": "Champs de l’exemple ({p0})",
  "Sample message": "Message exemple",
  "Sample {count}": "Exemple {count}",
  "Samples": "Exemples",
  "Samples saved with the step": "Exemples enregistrés avec l’étape",
  "Save as sample": "Enregistrer comme exemple",
  "Save contexts": "Enregistrer les contextes",
  "Save the sample with the step": "Enregistrer l’exemple avec l’étape",
  "Saving needs the permission “Manage FHIR mapper settings”.": "L’enregistrement nécessite la permission « Manage FHIR mapper settings ».",
  "Saving…": "Enregistrement…",
  "Scalar values included.": "Valeurs scalaires incluses.",
  "Search": "Rechercher",
  "Search elements": "Rechercher des éléments",
  "Search elements…": "Rechercher des éléments…",
  "Search is limited to part of the loaded tree. Select a branch or narrow the search.": "La recherche ne couvre qu’une partie de l’arbre chargé. Sélectionner une branche ou préciser la recherche.",
  "Select an element by its name, with a click or Enter, or focus one of its fields. The inspector follows the selection.": "Sélectionner un élément par son nom, au clic ou avec Entrée, ou entrer dans un de ses champs. L’inspecteur suit la sélection.",
  "Select an element in the tree to inspect its definition and rules.": "Sélectionner un élément dans l’arbre pour consulter sa définition et ses règles.",
  "Server-side profile files or folders, separated by ';'.": "Fichiers ou dossiers de profils sur le serveur, séparés par « ; ».",
  "Show": "Afficher",
  "Slice": "Slice",
  "Source path from the sample; guard optional values.": "Chemin source de l’exemple ; protéger les valeurs facultatives.",
  "Start from an example": "Partir d’un exemple",
  "Step mapping JSON": "JSON du mapping de l’étape",
  "Step {number}": "Étape {number}",
  "Steps: {steps}": "Étapes : {steps}",
  "Suggestions: iteration variables, codes of the value set, references of other steps, mapper functions, paths of the sample.": "Suggestions : variables d’itération, codes du jeu de valeurs, références d’autres étapes, fonctions du mappeur et chemins de l’exemple.",
  "Tables edit value expressions and notes only. Other rules remain in the step. Empty expressions remove their value mapping.": "Les tableaux modifient uniquement les expressions de valeur et leurs notes. Les autres règles restent dans l’étape. Une expression vide supprime son mapping de valeur.",
  "Target": "Cible",
  "Target Profile": "Profil cible",
  "Target: {p0}": "Cible : {p0}",
  "Terminology Server": "Serveur terminologique",
  "Terminology server": "Serveur terminologique",
  "Terminology server options": "Options du serveur terminologique",
  "Test": "Test",
  "Testing a step requires the permission “Test FHIR FML transforms”.": "Tester une étape nécessite la permission « Test FHIR FML transforms ».",
  "Testing a step runs its code on the server, like a deployed channel: it requires the permission “Test FHIR mapper steps”.": "Tester une étape exécute son code sur le serveur, comme un canal déployé : la permission « Test FHIR mapper steps » est nécessaire.",
  "Testing needs the permission “Test FHIR FML transforms”.": "Tester nécessite la permission « Test FHIR FML transforms ».",
  "Testing runs the step's code on the server and needs the permission “Test FHIR mapper steps”.": "Tester exécute le code de l’étape sur le serveur et nécessite la permission « Test FHIR mapper steps ».",
  "The JavaScript the server compiles from the mappings.": "Le JavaScript compilé par le serveur à partir des mappings.",
  "The Test tab shows the model the map receives for a message: use it to find the names and positions of the nodes.": "L’onglet Test montre le modèle reçu par la map : y repérer les noms et positions des nœuds.",
  "The completed Bundle is published here after the configured checks of all named Bundles.": "Le Bundle finalisé est publié ici après les contrôles configurés sur tous les Bundles nommés.",
  "The current transformer cannot be identified.": "Le transformeur courant ne peut pas être identifié.",
  "The editors use it at once. A deployed channel keeps the context it read when it was deployed: redeploy it.": "Les éditeurs utilisent le changement aussitôt. Un canal déployé conserve le contexte lu à son déploiement : le redéployer.",
  "The element takes its codes from a value set: they are offered while typing.": "L’élément prend ses codes dans un jeu de valeurs : ils sont proposés pendant la saisie.",
  "The element {p0} is not in the loaded profile.": "L’élément {p0} n’est pas dans le profil chargé.",
  "The fields of the sample message with their values. Click one to insert its path into the field being edited, or drag it onto a field.": "Les champs de l’exemple et leurs valeurs. Cliquer un champ pour insérer son chemin dans l’expression active, ou le glisser dans un champ.",
  "The last test failed": "Le dernier test a échoué",
  "The last test or the compilation reported this element; its message is in the tooltip.": "Le dernier test ou la compilation a signalé cet élément ; le message est dans l’infobulle.",
  "The map runs with the message as its source (OieMessage) and builds its target.": "La map reçoit le message comme source (OieMessage) et construit sa cible.",
  "The message is given to the map as the generic OieMessage model: nodes with a name, a position, an occurrence and a value.": "Le message est fourni selon le modèle générique OieMessage : des nœuds avec un nom, une position, une occurrence et une valeur.",
  "The name other steps give to fhirRef('name') to point at this resource inside the Bundles.": "Nom utilisé par les autres étapes dans fhirRef('name') pour référencer cette ressource dans les Bundles.",
  "The outbound message, or a channel map variable to use from another destination.": "Le message sortant, ou une variable de Channel Map à utiliser depuis une autre destination.",
  "The outbound message, or a channel map variable.": "Le message sortant ou une variable de Channel Map.",
  "The outbound template (tmp) if there is one, else msg.": "Le template sortant (tmp) s’il existe, sinon msg.",
  "The profile is now version {p0}; these mappings were made with version {p1}. Check them (elements no longer in the profile are listed).": "Le profil est maintenant en version {p0} ; ces mappings ont été créés avec la version {p1}. Les vérifier : les éléments absents sont listés.",
  "The resource the map built.": "La ressource construite par la map.",
  "The step on the whole page; Esc comes back.": "L’étape sur toute la page ; Échap pour revenir.",
  "The table contains no value edits.": "Le tableau ne contient aucune modification de valeur.",
  "The table must have key, expression and note columns.": "Le tableau doit contenir les colonnes key, expression et note.",
  "The translation of {p0} needs a {p1} for codes without a match.": "La traduction de {p0} nécessite {p1} pour les codes sans correspondance.",
  "The value for codes without a match: a code, or system|code": "Valeur des codes sans correspondance : un code, ou system|code",
  "The variable of the iteration on {p0} must be a JavaScript name.": "La variable d’itération de {p0} doit être un nom JavaScript.",
  "The whole step as text, to copy it elsewhere or paste a mapping written by hand or by an agent. It is compiled on the server before it is applied.": "L’étape entière en texte, à copier ou à modifier manuellement ou avec un agent. Le serveur compile avant l’application.",
  "The whole step — properties and rules — as text: copy it to another step or channel, paste a mapping written by hand or by an AI agent, or make bulk edits. Validate and apply compiles it on the server first.": "L’étape entière (propriétés et règles) en texte : copier vers une autre étape ou un autre canal, coller un mapping manuel ou généré par IA, ou modifier en masse. Valider et appliquer compile d’abord sur le serveur.",
  "This Bundle must be created earlier in the transformer.": "Ce Bundle doit être créé plus haut dans le transformeur.",
  "This diagnostic belongs to step {name}. Select that step to edit its rule.": "Ce diagnostic concerne l’étape {name}. Sélectionner cette étape pour modifier sa règle.",
  "This is not a FHIR Profile Mapper step.": "Ce n’est pas une étape FHIR Profile Mapper.",
  "This message has no FHIR mapping trace. Enable “Trace processed messages” on a FHIR Profile Mapper step, redeploy the channel, and check that its message storage keeps the maps.": "Ce message n’a pas de trace FHIR. Activer « Tracer les messages traités » sur une étape Profile Mapper, redéployer le canal et vérifier la conservation des maps des messages.",
  "This step only": "Cette étape uniquement",
  "Timeout (seconds)": "Délai (secondes)",
  "Toggle condition": "Ajouter/retirer la condition",
  "Toggle iteration": "Ajouter/retirer l’itération",
  "Toggle translation": "Ajouter/retirer la traduction",
  "Toolbar": "Barre d’outils",
  "Trace": "Trace",
  "Trace processed messages": "Tracer les messages traités",
  "Translate the value with ConceptMap/$translate": "Traduire la valeur avec ConceptMap/$translate",
  "Translate the value with a ConceptMap; choose what happens without a match.": "Traduire avec une ConceptMap ; choisir le comportement sans correspondance.",
  "Translates with a ConceptMap of the locations.": "Traduit avec une ConceptMap des emplacements.",
  "Translation": "Traduction",
  "Type": "Type",
  "Understanding a result": "Comprendre un résultat",
  "Undo / Redo": "Annuler / Rétablir",
  "Undo the last change of the mappings": "Annuler la dernière modification des mappings",
  "Unknown rule property: {p0}": "Propriété de règle inconnue : {p0}",
  "Unreadable files: ": "Fichiers illisibles : ",
  "Use this result as expected": "Utiliser ce résultat comme référence",
  "Uses the groups of another map of the locations.": "Utilise les groupes d’une autre map des emplacements.",
  "Valid.": "Valide.",
  "Validate FHIR output": "Valider la sortie FHIR",
  "Validate FHIR output ": "Valider la sortie FHIR ",
  "Validate and apply": "Valider et appliquer",
  "Validate this preview ": "Valider cet aperçu ",
  "Validation": "Validation",
  "Validation of results": "Validation des résultats",
  "Value": "Valeur",
  "Variable": "Variable",
  "Variable available in this scope.": "Variable disponible dans cette portée.",
  "Variable name": "Nom de la variable",
  "Variables of the OIE maps ($) copied to context.variable of the model, separated by commas.": "Variables des maps OIE ($) copiées dans context.variable du modèle, séparées par des virgules.",
  "Variables of the OIE maps copied into context.variable of the model.": "Variables des maps OIE copiées dans context.variable du modèle.",
  "Version of the resources the map produces.": "Version des ressources produites par la map.",
  "What a context is": "Définition d’un contexte",
  "What a test runs": "Portée d’un test",
  "What is below this element is only mapped when the condition holds": "Les éléments descendants ne sont mappés que si la condition est vraie",
  "What the map received as its source: the names, positions and values to use in its rules.": "Ce que la map reçoit comme source : noms, positions et valeurs à utiliser dans ses règles.",
  "What this step does": "Rôle de cette étape",
  "When $translate gives no match": "Lorsque $translate ne trouve aucune correspondance",
  "When a change applies": "Application des changements",
  "Where the profile comes from": "Origine du profil",
  "Which map runs": "Map exécutée",
  "Without a context: server paths of profile files, folders or .tgz packages, separated by ';'.": "Sans contexte : chemins serveur des fichiers, dossiers ou packages .tgz, séparés par « ; ».",
  "Write the map in the Map tab, or choose the map to run.": "Écrire la map dans l’onglet Map ou choisir celle à exécuter.",
  "Writing a mapping": "Écrire un mapping",
  "Writing the map": "Écrire la map",
  "Yes": "Oui",
  "a source code to try": "Code source à essayer",
  "always": "toujours",
  "always, off, or as the context says. An invalid result stops the message.": "toujours, désactivée ou selon le contexte. Un résultat invalide arrête le message.",
  "as": "comme",
  "as the context says{p0}": "selon le contexte{p0}",
  "below: {p0} (the item), {p1}Index (0, 1, …); fields dragged in are rewritten to {p2}[…]": "dessous : {p0} (l’item), {p1}Index (0, 1, …) ; les champs insérés sont réécrits vers {p2}[…]",
  "bundleDocument": "bundleDocument",
  "canonical URL of the ConceptMap": "URL canonique de la ConceptMap",
  "choose a type below": "choisir un type ci-dessous",
  "code": "code",
  "code of the {p0} binding{p1}": "code du binding {p0}{p1}",
  "code or system|code": "code ou system|code",
  "condition ? a : b": "condition ? a : b",
  "differs from the expected result": "différent du résultat attendu",
  "empty: translate with the packages": "vide : traduire avec les packages",
  "failed": "échec",
  "false, or an error on a missing segment: nothing below": "faux ou erreur sur un segment absent : rien en dessous",
  "fhirFilter(list, function)": "fhirFilter(list, function)",
  "fhirFind(list, function)": "fhirFind(list, function)",
  "fhirRef({p0})": "fhirRef({p0})",
  "fhirResource": "fhirResource",
  "fixed / pattern": "fixed / pattern",
  "guard optional (x != null ? x : undefined)": "protéger une valeur facultative (x != null ? x : undefined)",
  'imports "url"': 'imports "url"',
  "invalid FHIR result": "résultat FHIR invalide",
  "item {indices}": "élément {indices}",
  "iteration index (0, 1, …)": "index d’itération (0, 1, …)",
  "iteration item": "item d’itération",
  "labo": "labo",
  "line {number}": "ligne {number}",
  "local": "locale",
  'map "url" = "Name", then uses … as source / as target, then one or more groups of rules.': 'map "url" = "Name", puis uses … as source / as target, puis un ou plusieurs groupes de règles.',
  "matches the expected result": "conforme au résultat attendu",
  "myFunction(code, system)": "myFunction(code, system)",
  "n/a": "n/a",
  "no match: error": "sans correspondance : erreur",
  "no match: expression": "sans correspondance : expression",
  "no match: fixed value": "sans correspondance : valeur fixe",
  "no match: keep the source code": "sans correspondance : garder le code source",
  "no match: leave empty": "sans correspondance : ne rien produire",
  "no package": "aucun package",
  "none": "aucun",
  "not declared earlier": "non déclaré plus haut",
  "nth repetition if present": "répétition n si elle existe",
  "off": "désactivée",
  "passed": "réussite",
  "per item: keeps the items it holds for": "par item : conserver les items qui vérifient la condition",
  "red row": "ligne rouge",
  "reference · {p0} built by step “{p1}”": "référence · {p0} construite par l’étape « {p1} »",
  "rule {rule}, item {index}": "règle {rule}, élément {index}",
  "runs (no expected result)": "exécuté (sans résultat attendu)",
  "sample path": "chemin de l’exemple",
  "sample: {p0}": "exemple : {p0}",
  "site, sendingFacility": "site, sendingFacility",
  "snippet · {p0}": "modèle · {p0}",
  "source system (optional)": "système source (facultatif)",
  "src.node as pid where name = 'PID'": "src.node as pid where name = 'PID'",
  "system of the source code": "système du code source",
  "target system (optional)": "système cible (facultatif)",
  "targetsystem of $translate": "targetsystem de $translate",
  "values of the sample message of the Test tab — click to insert into the field being edited, or drag onto a field": "valeurs du message exemple de l’onglet Test — cliquer pour insérer dans l’expression active, ou glisser dans un champ",
  "{count} event(s){suffix}": "{count} événement(s){suffix}",
  "{count} item(s)": "{count} élément(s)",
  "{p0}\n\nExample: {p1}": "{p0}\n\nExemple : {p1}",
  "{p0} (JSON)": "{p0} (JSON)",
  "{p0} (not defined on this server)": "{p0} (non défini sur ce serveur)",
  "{p0} ({p1})": "{p0} ({p1})",
  "{p0} Example: {p1}. Available inside FHIR Profile Mapper expressions.": "{p0} Exemple : {p1}. Disponible dans les expressions FHIR Profile Mapper.",
  "{p0} item(s)": "{p0} item(s)",
  "{p0} must be a string containing a JSON array.": "{p0} doit être une chaîne contenant un tableau JSON.",
  "{p0} problem(s)": "{p0} problème(s)",
  "{p0} required element(s) not mapped": "{p0} élément(s) requis non mappé(s)",
  "{p0} validation issue(s):": "{p0} problème(s) de validation :",
  "{p0} {p1}": "{p0} {p1}",
  "{p0} {p1}: {p2}": "{p0} {p1}: {p2}",
  "{p0} · {p1}": "{p0} · {p1}",
  "{p0} — {p1}": "{p0} — {p1}",
  "{p0} — {p1}, {p2}": "{p0} — {p1}, {p2}",
  "{p0}..{p1}": "{p0}..{p1}",
  "{p0}: {p1}": "{p0}: {p1}",
  "{p0}['PID.3.5'].toString() == 'PI'": "{p0}['PID.3.5'].toString() == 'PI'",
  "{p0}{p1}. {p2}.": "{p0}{p1}. {p2}.",
  "{strength} binding: {valueSet}": "liaison {strength} : {valueSet}",
  "… binding": "… binding",
  "→ no match (then the rule chosen for no match)": "→ aucune correspondance (puis le repli configuré)",
  "→ {p0}{p1}": "→ {p0}{p1}",
  "↶ Undo": "↶ Annuler",
  "↷ Redo": "↷ Rétablir",
  "↻ For each": "↻ Pour chaque",
  "↻ One resource for each": "↻ Une ressource pour chaque",
  "⇄ ConceptMap": "⇄ ConceptMap",
  "⇄ ConceptMap (local)": "⇄ ConceptMap (locale)",
  "⌥Space": "⌥Space",
  "⌥Space (or ⌃Space) for suggestions": "⌥Espace (ou ⌃Espace) pour les suggestions",
  "── finalization": "── finalisation",
  "⤢ Full screen": "⤢ Plein écran"
};

// src/i18n/index.js
var catalogs = { en: en_default, fr: fr_default };
function resolveLocale(preferred = []) {
  for (const tag of preferred) {
    const language = String(tag || "").toLowerCase().split(/[-_]/)[0];
    if (Object.hasOwn(catalogs, language)) return language;
  }
  return "en";
}
var locale = resolveLocale(globalThis.navigator?.languages || [globalThis.navigator?.language]);
function t(message, params = {}) {
  const text = Object.hasOwn(catalogs[locale], message) ? catalogs[locale][message] : Object.hasOwn(catalogs.en, message) ? catalogs.en[message] : message;
  return String(text).replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(params, name) ? String(params[name]) : match);
}

// src/host/platform.js
var current = null;
function bindPlatform(platform2) {
  current = platform2;
}
function platform() {
  if (!current) throw new Error(t("FHIR Mapper: the platform is not bound yet"));
  return current;
}
function toast(message, type = "info") {
  current?.ui?.toast?.(message, type);
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

// src/host/context-menu.js
var CONTEXT_MENU_STYLES = `
body:has(.fhir-profile-mapper.mapper-fullscreen) [data-radix-popper-content-wrapper]:has([role=menu]),
body:has(.fhir-profile-mapper.mapper-fullscreen) .ctx-menu[role=menu] { z-index: 960 !important; }
`;
function showContextMenu(platform2, event, items) {
  if (!platform2.ui?.contextMenu) return false;
  event.preventDefault();
  event.stopPropagation();
  const rect = event.currentTarget.getBoundingClientRect();
  const keyboard = event.type === "keydown" || event.type === "click" && event.detail === 0;
  platform2.ui.contextMenu(keyboard ? rect.left : event.clientX, keyboard ? rect.bottom : event.clientY, items);
  return true;
}

// src/host/api.js
var MAPPER_API = "/extensions/fhir-profile-mapper";
var functionsPromise = null;
function mapperFunctions() {
  if (!functionsPromise) {
    functionsPromise = platform().api.get(`${MAPPER_API}/functions`, {}, { raw: true }).then((text) => JSON.parse(text)).catch((error) => {
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
  const functions2 = await mapperFunctions();
  p.registerReferences("FHIR Mapper", functions2.map((fn) => ({
    name: fn.signature,
    description: t("{p0} Example: {p1}. Available inside FHIR Profile Mapper expressions.", { p0: fn.description, p1: fn.example }),
    code: `function ${fn.name}(${(fn.parameters || []).map((x) => x.name).join(", ")}) {}`,
    type: "FUNCTION",
    contexts: CONTEXTS
  })));
}

// src/trace/message-trace.js
var TRACE_KEYS = ["fhirMapperTrace", "fhirMapperResponseTrace"];
function findTraces(message) {
  const found = [];
  const seen = /* @__PURE__ */ new Set();
  const take = (key, text) => {
    if (typeof text !== "string" || seen.has(text)) return;
    try {
      const trace = JSON.parse(text);
      if (trace && typeof trace === "object" && Array.isArray(trace.events)) {
        seen.add(text);
        found.push({ key, trace });
      }
    } catch {
    }
  };
  const walk = (value, depth) => {
    if (!value || typeof value !== "object" || depth > 14) return;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (TRACE_KEYS.includes(item)) take(item, value[i + 1]);
      });
      for (const item of value) walk(item, depth + 1);
      return;
    }
    for (const [name, item] of Object.entries(value)) {
      if (TRACE_KEYS.includes(name)) take(name, item);
      walk(item, depth + 1);
    }
  };
  walk(message, 0);
  return found;
}
var ms = (nanos) => `${(Number(nanos || 0) / 1e6).toFixed(2)} ms`;
function traceText(trace) {
  const lines = [];
  if (trace.channel) lines.push(t("Channel {name}, revision {revision}", { name: trace.channel.name || trace.channel.id, revision: trace.channel.revision }));
  if (trace.connector) lines.push(t("Connector {name} ({transformer})", { name: trace.connector.name, transformer: trace.connector.transformer }));
  const steps = new Map((trace.steps || []).map((s) => [s.sequenceNumber, s]));
  if (steps.size) lines.push(t("Steps: {steps}", { steps: [...steps.values()].map((s) => `${Number(s.sequenceNumber) + 1}. ${s.name} (${s.action === "createBundle" ? `Bundle ${s.bundleName}` : s.resourceType})`).join(", ") }));
  lines.push(t("{count} event(s){suffix}", { count: (trace.events || []).length, suffix: trace.truncated ? t(", truncated") : "" }), "");
  let current2;
  for (const e of trace.events || []) {
    if (e.step !== current2) {
      current2 = e.step;
      const step = steps.get(e.step);
      lines.push(step ? `── ${step.name}` : t("── finalization"));
    }
    const what = e.phase === "reference" ? `${e.name}[${e.index ?? 0}] ${e.fullUrl || ""}` : e.phase === "bundle-entry" ? `${e.resourceType} ${e.refName || ""} → ${(e.bundles || []).join(", ")}` : e.phase === "publication" ? `${e.target || ""}${e.variable ? ` ${e.variable}` : ""}` : e.key || (e.bundle ? `Bundle ${e.bundle}` : "");
    const extra = [
      e.count !== void 0 ? t("{count} item(s)", { count: e.count }) : "",
      e.reason || "",
      e.errorType || "",
      e.value?.text !== void 0 ? `= ${e.value.text}` : "",
      (e.iterations || []).length ? t("item {indices}", { indices: e.iterations.map((i) => i.index).join("/") }) : ""
    ].filter(Boolean).join(" · ");
    lines.push(`   ${String(e.phase).padEnd(12)} ${String(e.status).padEnd(9)} ${what}${extra ? `   (${extra})` : ""}   ${ms(e.durationNanos)}`);
  }
  return lines.join("\n");
}

// src/host/message-action.js
function registerTraceAction() {
  const p = platform();
  if (typeof p.registerMessageAction !== "function") return;
  p.registerMessageAction({
    id: "fhir-mapper-trace",
    label: t("FHIR mapping trace"),
    order: 50,
    onInvoke: async (message, ctx) => {
      let traces = findTraces(ctx?.connectorMessage || null);
      if (!traces.length) traces = findTraces(message);
      if (!traces.length && ctx?.channelId != null && message?.messageId != null) {
        try {
          traces = findTraces(await p.api.get(`/channels/${encodeURIComponent(ctx.channelId)}/messages/${encodeURIComponent(message.messageId)}`));
        } catch {
        }
      }
      if (!traces.length) {
        toast(t("This message has no FHIR mapping trace. Enable “Trace processed messages” on a FHIR Profile Mapper step, redeploy the channel, and check that its message storage keeps the maps."), "info");
        return;
      }
      p.ui.detailModal({
        title: t("FHIR mapping trace of message {p0}", { p0: message?.messageId ?? "" }),
        meta: traces.map((t2) => t2.key).join(", "),
        sections: traces.flatMap(({ key, trace }) => [{ label: key, text: traceText(trace) }, { label: t("{p0} (JSON)", { p0: key }), text: JSON.stringify(trace, null, 2) }])
      });
    }
  });
}

// src/host/settings.js
var cache = null;
var request = null;
var listeners = /* @__PURE__ */ new Set();
var cachedFhirSettings = () => cache;
function loadFhirSettings(force = false) {
  if (force) request = null;
  if (!request) {
    request = platform().api.get(`${MAPPER_API}/settings`, {}, { raw: true }).then((text) => {
      cache = JSON.parse(text);
      listeners.forEach((listener) => listener(cache));
      return cache;
    }).catch((error) => {
      request = null;
      throw error;
    });
  }
  return request;
}
async function saveFhirSettings(settings) {
  const text = await platform().api.post(`${MAPPER_API}/settings`, JSON.stringify(settings), { contentType: "text/plain", raw: true });
  cache = JSON.parse(text);
  request = Promise.resolve(cache);
  listeners.forEach((listener) => listener(cache));
  return cache;
}
function fhirContext(name) {
  const key = String(name || "").trim();
  return key && cache ? (cache.contexts || []).find((c) => c.name === key) || null : null;
}

// src/host/help.js
function HelpButton({ label, sections, note }) {
  const React3 = platform().React;
  const h3 = React3.createElement;
  const [open, setOpen] = React3.useState(false);
  const root = React3.useRef(null);
  React3.useEffect(() => {
    if (!open) return void 0;
    const onDown = (e) => {
      if (root.current && !root.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        root.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);
  return h3(
    "span",
    { ref: root, className: "fm-help" },
    h3("button", { type: "button", className: "fm-help__button" + (open ? " fm-help__button--open" : ""), "aria-label": t(label), title: t(label), "aria-expanded": open, onClick: () => setOpen(!open) }, "?"),
    open ? h3(
      "div",
      { className: "fm-help__panel", role: "dialog", "aria-label": t(label) },
      sections.map((section) => h3(
        "section",
        { key: section.title },
        h3("h4", null, t(section.title)),
        section.lines.map((line, i) => Array.isArray(line) ? h3("div", { key: i, className: "fm-help__row" }, h3("span", { className: "fm-help__key" }, t(line[0])), h3("span", null, t(line[1]))) : h3("p", { key: i }, t(line)))
      )),
      note ? h3("p", { className: "fm-help__note" }, t(note)) : null
    ) : null
  );
}

// src/host/help-texts.js
var MAPPER_HELP = {
  properties: {
    label: "Help: Properties",
    sections: [
      { title: "What this step does", lines: [
        "A FHIR Profile Mapper step builds one FHIR resource from the message, or creates a named Bundle that later steps fill.",
        ["Create a Bundle", "Declares a Bundle by name and type. Resource steps placed after it select it in “Add to Bundles”."],
        ["Build a resource", "Maps the message onto a profile. The resource is the result of the step, or is added to one or several Bundles."]
      ] },
      { title: "Where the profile comes from", lines: [
        ["FHIR context", "A named set of packages, terminology server and validation policy, defined once in Settings › FHIR Mapper and shared by every step that names it."],
        ["Profile Packages", "Without a context: server paths of profile files, folders or .tgz packages, separated by ';'."],
        ["Target Profile", "Canonical URL of the profile, or a resource type. Load reads its elements; mappings of elements it also has are kept."]
      ] },
      { title: "Result", lines: [
        ["Result destination", "The outbound message, or a channel map variable to use from another destination."],
        ["Reference Name", "The name other steps give to fhirRef('name') to point at this resource inside the Bundles."],
        ["Validate FHIR output", "always, off, or as the context says. An invalid result stops the message."],
        ["Trace processed messages", "Keeps this step's events on each processed message; read them with the “FHIR mapping trace” action of Messages. Redeploy to apply."]
      ] },
      { title: "Edit as JSON", lines: ["The whole step as text, to copy it elsewhere or paste a mapping written by hand or by an agent. It is compiled on the server before it is applied."] }
    ]
  },
  mapper: {
    label: "Help: Mapper",
    sections: [
      { title: "Reading the tree", lines: [
        "One row per element of the profile: its name and cardinality, its type, its mapping.",
        ["1..*", "Minimum and maximum. A red count on the tab is the number of required elements still unmapped."],
        ["S", "Must Support in the profile."],
        ["fixed / pattern", "A value the profile imposes: it is added by itself once its container gets a value."],
        ["… binding", "The element takes its codes from a value set: they are offered while typing."],
        ["red row", "The last test or the compilation reported this element; its message is in the tooltip."]
      ] },
      { title: "Writing a mapping", lines: [
        "Click a field to edit it. An expression is JavaScript, usually a path of the message; a constant is written 'final'.",
        ["⌥Space", "Suggestions: iteration variables, codes of the value set, references of other steps, mapper functions, paths of the sample."],
        ["Sample fields", "The fields of the sample message with their values. Click one to insert its path into the field being edited, or drag it onto a field."],
        ["Alt+↓ ↑ → ←", "Next or previous field; open or close the element."]
      ] },
      { title: "Element inspector", lines: [
        "Select an element by its name, with a click or Enter, or focus one of its fields. The inspector follows the selection.",
        "Read the profile's definition, cardinality, binding, fixed value and examples. Edit expressions, existing conditions, iterations, translations, notes and activation in the same rules as the tree.",
        "Diagnostics belong to the selected element. Go to rule reveals its field in the tree. On a narrow editor the inspector sits below the tree."
      ] },
      { title: "Buttons of a row", lines: [
        ["+ / −", "Add or remove an entry of a repeating element."],
        ["↻", "One entry per item of a list. Fields below use the item variable, e.g. n['PID.5.1']."],
        ["⇄", "Translate the value with a ConceptMap; choose what happens without a match."],
        ["?", "Only map this element, and what is below it, when a condition holds."]
      ] },
      { title: "Branch actions and extensions", lines: [
        "Right-click a row, press Shift+F10 on its name, or use its ⋯ button to open the actions menu.",
        "Duplicate branch copies a mapped repeating entry to a new occurrence, with new rule identities. Expressions and notes are kept. Iterated entries and entries at their maximum cardinality cannot be duplicated.",
        "In the inspector, Profile extension reveals a declared slice and its URL. List context extensions offers other URLs to add to an open extension collection; choose its value type in the tree afterwards.",
        "ConceptMaps are suggested by source/target systems and the target binding. All ConceptMaps restores the full list. A suggestion never replaces the current selection automatically."
      ] },
      { title: "Toolbar", lines: [
        ["Show", "All elements, Must Support and required, or mapped only."],
        ["Search", "Filters the tree and opens the branches that contain the text."],
        ["Undo / Redo", "Of the mappings, while the step is open."],
        ["Full screen", "The step on the whole page; Esc comes back."]
      ] }
    ],
    note: "A missing optional field must give nothing, not an error: guard it, e.g. x.length() > 1 ? x[1].toString() : undefined."
  },
  test: {
    label: "Help: Test",
    sections: [
      { title: "What a test runs", lines: [
        "Preview scope chooses this step alone (stand-in references) or the enabled Profile Mapper steps of this transformer (real references and finalized Bundles). Other step types are excluded.",
        "Testing runs the step's code on the server and needs the permission “Test FHIR mapper steps”."
      ] },
      { title: "Samples", lines: [
        ["Save as sample", "Keeps the message in the step, so it is saved with the channel and shared by every user."],
        ["Use this result as expected", "Fixes the reference result of the sample. Later runs say whether the result matches, and show both side by side when it differs."],
        ["Run all", "Runs every saved sample: passed, or failed on an error, an invalid result or a difference."],
        "Random identities (urn:uuid) and meta.lastUpdated are ignored when comparing."
      ] },
      { title: "Understanding a result", lines: [
        ["Go to rule", "Opens the element an error or a trace event belongs to."],
        ["Trace", "Records each rule: value, conversion, translation, condition, iteration. Include scalar values only when patient data may be shown."],
        ["Generated script", "The JavaScript the server compiles from the mappings."]
      ] }
    ]
  }
};
var FML_HELP = {
  settings: {
    label: "Help: Properties",
    sections: [
      { title: "What this step does", lines: [
        "A FHIR FML Transform step runs a map written in the FHIR Mapping Language on the message and publishes the resource it builds.",
        "The message is given to the map as the generic OieMessage model: nodes with a name, a position, an occurrence and a value."
      ] },
      { title: "Which map runs", lines: [
        ["Map tab", "A map written in the step is saved with the channel and runs first."],
        ["Map", "Otherwise, a StructureMap of the locations: .fml or .map files, StructureMap resources, packages."],
        ["FHIR context", "A named set of locations defined in Settings › FHIR Mapper, shared by the steps that name it."]
      ] },
      { title: "Result", lines: [
        ["Result destination", "The outbound message, or a channel map variable."],
        ["Context variables", "Variables of the OIE maps copied into context.variable of the model."],
        ["Validation", "Against the profiles of meta.profile, else the base definition. An invalid result stops the message."]
      ] }
    ]
  },
  map: {
    label: "Help: Map",
    sections: [
      { title: "Writing the map", lines: [
        'map "url" = "Name", then uses … as source / as target, then one or more groups of rules.',
        ["src.node as pid where name = 'PID'", "Finds a node of the message by its name, its position or its occurrence."],
        ["-> patient.gender = translate(v, 'url', 'code')", "Translates with a ConceptMap of the locations."],
        ['imports "url"', "Uses the groups of another map of the locations."]
      ] },
      { title: "Buttons", lines: [
        ["Check", "Parses the map on the server. Errors are underlined at their line; unknown uses and imports are reported."],
        ["Start from an example", "A small map to adapt."],
        ["Clear", "Empties the map: the step then runs the map chosen in Properties."]
      ] }
    ],
    note: "The Test tab shows the model the map receives for a message: use it to find the names and positions of the nodes."
  },
  test: {
    label: "Help: Test",
    sections: [
      { title: "What a test runs", lines: [
        "Run test executes the map on the sample message, on the server, and validates the result.",
        ["Result", "The resource the map built."],
        ["OIE model of the message", "What the map received as its source: the names, positions and values to use in its rules."],
        "Testing needs the permission “Test FHIR FML transforms”."
      ] }
    ]
  }
};
var SETTINGS_HELP = {
  label: "Help: FHIR contexts",
  sections: [
    { title: "What a context is", lines: [
      "A named set of profile packages, a terminology server and a validation policy, shared by the FHIR Profile Mapper and FHIR FML Transform steps that name it.",
      "A step without a context keeps its own packages and settings."
    ] },
    { title: "Fields", lines: [
      ["Packages", "One server path per line: files, folders or .tgz packages with profiles, ConceptMaps, value sets and FML maps."],
      ["Terminology server", "Base URL as OIE reaches it; empty to translate with the ConceptMaps of the packages."],
      ["Validation", "For the steps whose validation is “as the context says”."]
    ] },
    { title: "When a change applies", lines: [
      "The editors use it at once. A deployed channel keeps the context it read when it was deployed: redeploy it.",
      "Saving needs the permission “Manage FHIR mapper settings”."
    ] }
  ]
};

// src/settings/panel.js
var emptyContext = () => ({ name: "", fhirVersion: "R4", packages: [], terminologyServer: "", terminologyAuthorization: "", cacheSeconds: 300, timeoutSeconds: 10, validation: "always" });
function errorText(e) {
  const m = /<detailMessage>([\s\S]*?)<\/detailMessage>/.exec(e && e.body || "");
  return m ? m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&") : e && e.message || String(e);
}
function FhirSettingsPanel() {
  const React3 = platform().React;
  const h3 = React3.createElement;
  const [contexts, setContexts] = React3.useState(null);
  const [error, setError] = React3.useState("");
  const [saving, setSaving] = React3.useState(false);
  React3.useEffect(() => {
    loadFhirSettings(true).then((s) => setContexts((s.contexts || []).map((c) => ({ ...emptyContext(), ...c }))), (e) => {
      setContexts([]);
      setError(errorText(e));
    });
  }, []);
  if (!contexts) return h3("div", { className: "hint" }, t("Loading…"));
  const update = (index, patch) => setContexts(contexts.map((c, i) => i === index ? { ...c, ...patch } : c));
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const saved = await saveFhirSettings({ contexts });
      setContexts(saved.contexts.map((c) => ({ ...emptyContext(), ...c })));
      toast(t("FHIR contexts saved. Redeploy the channels that use a changed context."), "info");
    } catch (e) {
      setError(/Manage FHIR mapper settings|403/.test(errorText(e)) || e?.status === 403 ? t("Changing the FHIR contexts requires the permission “Manage FHIR mapper settings”.") : errorText(e));
    }
    setSaving(false);
  };
  const field = (label, control, hint) => h3("div", { className: "field" }, h3("label", null, label), control, hint ? h3("div", { className: "hint" }, hint) : null);
  return h3(
    "div",
    { className: "fhir-mapper-settings" },
    h3("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: "6px" } }, h3(HelpButton, SETTINGS_HELP)),
    h3("p", { className: "hint" }, t("A FHIR context is a named set of profile packages, a terminology server and a validation policy. FHIR Profile Mapper and FHIR FML Transform steps that name a context share them; a step without a context keeps its own. A deployed channel takes a change when it is redeployed.")),
    contexts.map((c, i) => h3(
      "div",
      { key: i, className: "panel", style: { marginBottom: "12px" }, "data-context": c.name },
      h3(
        "div",
        { className: "panel-header", style: { display: "flex", alignItems: "center", gap: "8px" } },
        c.name || t("New context"),
        h3("button", { type: "button", className: "btn btn-sm btn-danger", style: { marginLeft: "auto" }, onClick: () => setContexts(contexts.filter((_, n) => n !== i)) }, t("Delete"))
      ),
      h3(
        "div",
        { className: "panel-body form-grid" },
        field(t("Name"), h3("input", { type: "text", value: c.name, placeholder: "labo", "aria-label": t("Context name"), onChange: (e) => update(i, { name: e.target.value }) }), t("Letters, digits, '_', '.', '-'. Steps refer to this name.")),
        field(t("FHIR version"), h3("select", { value: c.fhirVersion, onChange: (e) => update(i, { fhirVersion: e.target.value }) }, ["R4", "R4B", "R5"].map((v) => h3("option", { key: v, value: v }, v)))),
        h3("div", { className: "span-2" }, field(
          t("Packages and profile files"),
          h3("textarea", {
            rows: 3,
            value: (c.packages || []).join("\n"),
            "aria-label": t("Packages"),
            style: { width: "100%", fontFamily: "monospace" },
            onChange: (e) => update(i, { packages: e.target.value.split("\n") })
          }),
          t("One path per line, on the OIE server: files, folders or .tgz packages (profiles, ConceptMaps, FML maps).")
        )),
        field(
          t("Terminology server"),
          h3("input", { type: "text", value: c.terminologyServer, placeholder: t("empty: translate with the packages"), onChange: (e) => update(i, { terminologyServer: e.target.value }) }),
          t("Base URL as the OIE server reaches it; empty to translate locally.")
        ),
        field(t("Authorization"), h3("input", {
          type: "text",
          value: c.terminologyAuthorization,
          placeholder: "'Bearer ' + $cfg('tx.token')",
          style: { fontFamily: "monospace" },
          onChange: (e) => update(i, { terminologyAuthorization: e.target.value })
        }), t("JavaScript expression of the Authorization header; empty for none.")),
        field(t("Cache (seconds)"), h3("input", { type: "number", min: 0, value: c.cacheSeconds, onChange: (e) => update(i, { cacheSeconds: Number(e.target.value) }) })),
        field(t("Timeout (seconds)"), h3("input", { type: "number", min: 1, value: c.timeoutSeconds, onChange: (e) => update(i, { timeoutSeconds: Number(e.target.value) }) })),
        field(t("Validation of results"), h3(
          "select",
          { value: c.validation, onChange: (e) => update(i, { validation: e.target.value }) },
          h3("option", { value: "always" }, t("always")),
          h3("option", { value: "off" }, t("off"))
        ), t("For the steps whose validation is “as the context says”."))
      )
    )),
    error ? h3("div", { className: "hint", role: "alert", style: { color: "var(--err, #b91c1c)", marginBottom: "8px" } }, error) : null,
    h3(
      "div",
      { style: { display: "flex", gap: "8px" } },
      h3("button", { type: "button", className: "btn", onClick: () => setContexts([...contexts, emptyContext()]) }, t("New context")),
      h3("button", { type: "button", className: "btn btn-primary", disabled: saving, onClick: save }, saving ? t("Saving…") : t("Save contexts"))
    )
  );
}

// src/styles/editor.css
var editor_default = `/* SPDX-License-Identifier: MPL-2.0
 * Styles shared by the two step editors: full screen, the one-line code editor
 * of an expression, and the elements a test or the compiler reported.
 * Colours come from the Web Admin variables, so both themes follow the host.
 */
.fhir-profile-mapper.mapper-fullscreen, .fhir-fml.mapper-fullscreen { position: fixed; inset: 0; z-index: 900; overflow: auto; padding: 14px 18px; background: var(--bg2, #fff); color: var(--text, #1f2c38); }

/* Monaco keeps <style> elements inside its lists; nothing may show them as text. */
.monaco-editor style, .monaco-list style, .suggest-widget style, .suggest-details style, .monaco-hover style, .overflowingContentWidgets style { display: none !important; }
.fm-code-box { border-radius: 4px; overflow: hidden; }
.fm-code-box .fm-code-editor--multi { width: 100%; }

/* An expression that is not being edited: its text with the editor's colours. */
.mapper-expression-view { display: block; box-sizing: border-box; width: 100%; height: 26px; padding: 3px 7px; border: 1px solid var(--line, #cdd7e0); border-radius: 4px; background: var(--bg2, #fff);
  font-family: var(--font-mono, ui-monospace, monospace); font-size: 12px; line-height: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: text; }
.mapper-expression-view:hover, .mapper-expression-view:focus { border-color: var(--accent, #2e6da4); outline: none; }
.mapper-expression-view br { display: none; }
.mapper-node-error .mapper-expression-view { border-color: var(--err, #cc3b3b); }

.fm-code-editor--line { width: 100%; height: 26px; min-height: 26px !important; border-radius: 4px; overflow: hidden; }
.fm-code-editor--line .ce-gutter { display: none; }
.fm-code-editor--line textarea.ce-area { height: 26px; min-height: 26px; padding: 3px 6px; resize: none; white-space: nowrap; overflow: hidden; }
.fm-code-editor--line .monaco-host { height: 26px; }
.fm-code-editor--invalid { outline: 1px solid var(--err, #cc3b3b); }
.mapper-expression-editing { flex: 1 1 auto; min-width: 160px; }

.fhir-profile-mapper .mapper-tree tr.mapper-node-error > td { background: color-mix(in srgb, var(--err, #cc3b3b) 10%, var(--bg2, #fff)); }
.fhir-profile-mapper .mapper-tree tr.mapper-node-error > td:first-child { border-left-color: var(--err, #cc3b3b); }
.fhir-profile-mapper .mapper-tree tr.mapper-node-error input[role=combobox] { border-color: var(--err, #cc3b3b); }

.mapper-workspace { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); gap: 12px; align-items: start; }
.mapper-inspector { min-width: 0; padding: 12px; border: 1px solid var(--line, #cdd7e0); border-radius: 6px; background: var(--bg2, #fff); overflow-wrap: anywhere; }
.mapper-inspector h3 { margin: 0 0 12px; font-size: 14px; }
.mapper-inspector h4 { margin: 14px 0 8px; }
.mapper-inspector dl { margin: 0; font-size: 12px; }
.mapper-inspector dl > div { margin-bottom: 8px; }
.mapper-inspector dt { font-weight: 600; }
.mapper-inspector dd { margin: 2px 0 0; white-space: pre-wrap; }
.mapper-inspector-fields { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 12px; }
.mapper-inspector-fields input, .mapper-inspector-fields select { max-width: 100%; min-width: 0; }
.fhir-profile-mapper .mapper-tree .mapper-select { background: none; border: 0; padding: 0; color: inherit; text-align: left; font: inherit; cursor: pointer; height: auto; }
.mapper-select:focus-visible { outline: 2px solid var(--accent, #2e6da4); outline-offset: 2px; }
.fhir-profile-mapper .mapper-tree tr.mapper-node-selected > td { background: color-mix(in srgb, var(--accent, #2e6da4) 12%, var(--bg2, #fff)); }
@container (max-width: 1100px) { .mapper-workspace { grid-template-columns: minmax(0, 1fr); } }

/* Contextual help: a "?" button and its panel. */
.fm-help { position: relative; display: inline-flex; align-self: center; }
.fm-help__button { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; padding: 0; border: 1px solid var(--line, #cdd7e0); border-radius: 6px; background: var(--bg2, #fff); color: var(--accent, #2e6da4); font: inherit; font-weight: 600; cursor: pointer; }
.fm-help__button:hover, .fm-help__button--open { border-color: var(--accent, #2e6da4); }
.fm-help__panel { position: absolute; z-index: 950; top: calc(100% + 6px); right: 0; width: min(520px, 80vw); max-height: 70vh; overflow: auto; padding: 14px 16px; border: 1px solid var(--line-strong, #aebbc8); border-radius: 10px;
  background: var(--bg2, #fff); color: var(--text, #1f2c38); box-shadow: 0 12px 30px -10px #0006; font-size: 12.5px; line-height: 1.45; font-weight: 400; text-align: left; white-space: normal; }
.fm-help__panel h4 { margin: 12px 0 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-dim, #4d6173); }
.fm-help__panel section:first-child h4 { margin-top: 0; }
.fm-help__panel p { margin: 0 0 6px; }
.fm-help__row { display: grid; grid-template-columns: minmax(96px, 34%) 1fr; gap: 10px; margin-bottom: 6px; }
.fm-help__key { font-family: var(--font-mono, ui-monospace, monospace); font-size: 11.5px; color: var(--accent, #2e6da4); overflow-wrap: anywhere; }
.fm-help__note { margin-top: 10px !important; color: var(--text-dim, #4d6173); font-size: 11.5px; }
`;

// src/styles/profile-mapper.css
var profile_mapper_default = "/* SPDX-License-Identifier: MPL-2.0 */\n\n.fhir-profile-mapper { container-type: inline-size; min-width: 0; }\n.fhir-profile-mapper .mapper-settings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; align-items: start; }\n.fhir-profile-mapper .mapper-settings > *, .fhir-profile-mapper .field { min-width: 0; }\n.fhir-profile-mapper .mapper-settings .field { margin-bottom: 0; }\n.fhir-profile-mapper .mapper-wide { grid-column: 1 / -1; }\n.fhir-profile-mapper .mapper-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }\n.fhir-profile-mapper .mapper-actions input[type=text] { flex: 1 1 240px; min-width: 0; width: auto; }\n.fhir-profile-mapper .mapper-actions select { flex: none; width: auto; }\n.fhir-profile-mapper .mapper-actions button { flex: none; white-space: nowrap; }\n.fhir-profile-mapper .mapper-checks { display: flex; flex-wrap: wrap; gap: 10px 20px; }\n.fhir-profile-mapper .check { white-space: nowrap; }\n.fhir-profile-mapper .mapper-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-bottom: 8px; }\n.fhir-profile-mapper .mapper-toolbar select { width: auto; max-width: 100%; }\n.fhir-profile-mapper .mapper-toolbar .hint { flex: 1 1 280px; }\n.fhir-profile-mapper .mapper-expression { display: inline-flex; width: 100%; min-width: 0; }\n.fhir-profile-mapper .mapper-functions { position: fixed; inset: auto; margin: 0; padding: 4px; border: 1px solid #94a3b8; border-radius: 6px; background: var(--bg, white); color: var(--text, #1e293b); box-shadow: 0 4px 16px #0003; overflow: auto; box-sizing: border-box; }\n.fhir-profile-mapper .mapper-functions [role=option] { padding: 6px 8px; cursor: pointer; border-radius: 4px; font-size: 12px; white-space: normal; }\n.fhir-profile-mapper .mapper-functions [aria-selected=true] { background: color-mix(in srgb, var(--accent, #2563eb) 18%, var(--bg2, white)); color: var(--text, #1e293b); }\n.fhir-profile-mapper .mapper-functions code { display: block; overflow-wrap: anywhere; }\n.fhir-profile-mapper table.mapper-tree td { padding: 3px 8px; }\n.fhir-profile-mapper .mapper-tree input:not([type=checkbox]), .fhir-profile-mapper .mapper-tree select { box-sizing: border-box; height: 26px; min-height: 26px; padding: 2px 6px; line-height: 20px; }\n.fhir-profile-mapper .mapper-tree .mapper-expression { padding: 0; min-height: 0; vertical-align: middle; }\n.fhir-profile-mapper .mapper-tree .btn { height: 22px; min-height: 22px; line-height: 18px; font-size: 11px; }\n.fhir-profile-mapper .mapper-help { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; flex: 0 0 16px; width: 16px; height: 16px; min-height: 0; padding: 0; margin: 0; border: 1px solid currentColor; border-radius: 50%; font-size: 11px; line-height: 1; text-decoration: none; }\n.fhir-profile-mapper .mapper-help:focus-visible { outline: 2px solid var(--accent, #2563eb); outline-offset: 2px; }\n.fhir-profile-mapper .mapper-tree tbody > tr > td:first-child { position: relative; border-left: 2px solid transparent; }\n.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr > td { background: color-mix(in srgb, var(--accent, #2563eb) 4%, var(--bg2, white)); }\n.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr > td:first-child { border-left-color: color-mix(in srgb, var(--accent, #2563eb) 40%, transparent); }\n.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr:first-child > td { border-top: 1px solid color-mix(in srgb, var(--accent, #2563eb) 25%, transparent); background: color-mix(in srgb, var(--accent, #2563eb) 8%, var(--bg2, white)); }\n.fhir-profile-mapper .mapper-tree .mapper-branch-open > tr:last-child > td { border-bottom: 1px solid color-mix(in srgb, var(--accent, #2563eb) 25%, transparent); }\n.fhir-profile-mapper .mapper-node-open .mapper-node-label { font-weight: 600; }\n.fhir-profile-mapper .mapper-tree tr:focus-within > td, .fhir-profile-mapper .mapper-tree .mapper-branch-open tr:focus-within > td { background: color-mix(in srgb, var(--accent, #2563eb) 12%, var(--bg2, white)); }\n.fhir-profile-mapper .mapper-tree-guides { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }\n.fhir-profile-mapper .mapper-tree-guides i { position: absolute; top: -1px; bottom: -1px; border-left: 1px solid color-mix(in srgb, var(--text-faint, #64748b) 45%, transparent); }\n.fhir-profile-mapper .mapper-tree-guides b { position: absolute; top: 50%; width: 20px; border-top: 1px solid color-mix(in srgb, var(--text-faint, #64748b) 45%, transparent); }\n.fhir-profile-mapper .bundle-routing { padding: 14px; border: 1px solid #93c5fd; border-radius: 8px; background: color-mix(in srgb, #3b82f6 7%, var(--bg, white)); }\n.fhir-profile-mapper .bundle-routing-title { margin-bottom: 4px; font-weight: 600; }\n.fhir-profile-mapper .bundle-target { margin-top: 10px; padding: 12px; border: 1px solid #bfdbfe; border-radius: 6px; background: var(--bg, white); }\n.fhir-profile-mapper .bundle-choice { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; text-transform: none; letter-spacing: normal; font-weight: 600; }\n.fhir-profile-mapper .bundle-choice input[type=checkbox] { width: 16px; height: 16px; margin: 0; flex: none; }\n.fhir-profile-mapper .bundle-request { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 10px; margin-top: 10px; }\n.fhir-profile-mapper .bundle-target .field { margin-top: 8px; }\n.fhir-profile-mapper .mapper-tabs { display: flex; gap: 2px; margin-bottom: 12px; border-bottom: 1px solid color-mix(in srgb, var(--text-faint, #64748b) 35%, transparent); }\n.fhir-profile-mapper .mapper-tabs [role=tab] { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; margin-bottom: -1px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--text-faint, #64748b); font: inherit; font-weight: 600; cursor: pointer; }\n.fhir-profile-mapper .mapper-tabs [role=tab]:hover { color: var(--text, #1e293b); }\n.fhir-profile-mapper .mapper-tabs [role=tab][aria-selected=true] { color: var(--text, #1e293b); border-bottom-color: var(--accent, #2563eb); }\n.fhir-profile-mapper .mapper-tabs [role=tab]:focus-visible { outline: 2px solid var(--accent, #2563eb); outline-offset: -2px; }\n.fhir-profile-mapper .mapper-tab-badge { min-width: 16px; padding: 0 5px; border-radius: 8px; background: #b91c1c; color: white; font-size: 11px; line-height: 16px; text-align: center; }\n.fhir-profile-mapper .mapper-tab-panel > details:first-child, .fhir-profile-mapper .mapper-tab-panel > .mapper-settings + details { margin-top: 14px; }\n@container (max-width: 640px) {\n  .fhir-profile-mapper .mapper-settings { grid-template-columns: minmax(0, 1fr); }\n}\n";

// src/styles/fml.css
var fml_default = "/* SPDX-License-Identifier: MPL-2.0 */\n\n.fhir-fml { container-type: inline-size; min-width: 0; }\n.fhir-fml .fml-settings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; align-items: start; }\n.fhir-fml .fml-settings > *, .fhir-fml .field { min-width: 0; }\n.fhir-fml .fml-wide { grid-column: 1 / -1; }\n.fhir-fml .fml-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }\n.fhir-fml .fml-row > select, .fhir-fml .fml-row > input[type=text] { flex: 1 1 240px; min-width: 0; width: auto; }\n.fhir-fml .fml-row > button { flex: none; white-space: nowrap; }\n.fhir-fml .fml-tabs { display: flex; gap: 2px; margin-bottom: 12px; border-bottom: 1px solid color-mix(in srgb, var(--text-faint, #64748b) 35%, transparent); }\n.fhir-fml .fml-tabs [role=tab] { padding: 6px 14px; margin-bottom: -1px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--text-faint, #64748b); font: inherit; font-weight: 600; cursor: pointer; }\n.fhir-fml .fml-tabs [role=tab]:hover { color: var(--text, #1e293b); }\n.fhir-fml .fml-tabs [role=tab][aria-selected=true] { color: var(--text, #1e293b); border-bottom-color: var(--accent, #2563eb); }\n.fhir-fml pre.fml-json { max-height: 420px; overflow: auto; padding: 8px; border: 1px solid var(--border, #cbd5e1); border-radius: 4px; font-size: 12px; white-space: pre; }\n.fhir-fml .fml-error { color: var(--err, #b91c1c); overflow-wrap: anywhere; }\n.fhir-fml .fml-issue-warning { color: var(--warn, #b45309); }\n.fhir-fml .fml-ok { color: var(--ok, #15803d); }\n@container (max-width: 640px) { .fhir-fml .fml-settings { grid-template-columns: minmax(0, 1fr); } }\n";

// src/fhir/mapping-table.js
var escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
var markdown = (value) => escapeHtml(value).replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
var unmarkdown = (value) => value.replace(/<br>/g, "\n").replace(/&(amp|lt|gt|quot|#39);/g, (_, entity) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[entity]);
function csvRows(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted || cell === "") {
        if (quoted && i + 1 < text.length && ![",", "\r", "\n"].includes(text[i + 1])) throw new Error(t("Invalid CSV quoting."));
        quoted = !quoted;
      } else throw new Error(t("Invalid CSV quoting."));
    } else if (!quoted && (char === "," || char === "\n")) {
      row.push(cell.replace(/\r$/, ""));
      cell = "";
      if (char === "\n") {
        rows.push(row);
        row = [];
      }
    } else cell += char;
  }
  if (quoted) throw new Error(t("Invalid CSV quoting."));
  if (cell || row.length) rows.push([...row, cell.replace(/\r$/, "")]);
  return rows;
}
function markdownRows(text) {
  return text.split(/\r?\n/).filter((line) => line.trim().startsWith("|")).map((line) => {
    const cells = [];
    let cell = "";
    const content = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    for (let i = 0; i < content.length; i++) {
      if (content[i] === "\\" && ["\\", "|"].includes(content[i + 1])) cell += content[++i];
      else if (content[i] === "|") {
        cells.push(unmarkdown(cell.trim()));
        cell = "";
      } else cell += content[i];
    }
    return [...cells, unmarkdown(cell.trim())];
  }).filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell)));
}
function importMappingTable(text, format, tree, element) {
  const rows = format === "csv" ? csvRows(text.replace(/^\uFEFF/, "")) : markdownRows(text);
  const header = rows.shift()?.map((cell) => cell.trim());
  if (!header || !["key", "expression", "note"].every((key) => header.includes(key)) || new Set(header).size !== header.length)
    throw new Error(t("The table must have key, expression and note columns."));
  const seen = /* @__PURE__ */ new Set();
  const edits = rows.filter((row) => row.some((cell) => cell.trim())).map((row, index) => {
    if (row.length !== header.length) throw new Error(t("Invalid table row {number}.", { number: index + 2 }));
    const data = Object.fromEntries(header.map((key2, i) => [key2, row[i]]));
    const key = data.key.trim();
    const chain = tree.chain(key);
    const node = chain?.at(-1);
    if (!node || node.choice || node.resourceRoot || element.action === "createBundle" && key === "Bundle.type" || seen.has(key) || data.kind && data.kind !== "value") throw new Error(t("Invalid or duplicate value target: {key}", { key }));
    seen.add(key);
    return { key, expression: data.expression, note: data.note };
  });
  if (!edits.length) throw new Error(t("The table contains no value edits."));
  return edits;
}
function mappingTable(rules, format = "csv") {
  const rows = [["key", "expression", "note"], ...rules.filter((rule) => "expression" in rule).map((rule) => [rule.key || rule.element, rule.expression, rule.note || ""])];
  return format === "csv" ? rows.map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(",")).join("\n") + "\n" : rows.map((row, i) => "| " + row.map(markdown).join(" | ") + " |" + (i === 0 ? "\n| --- | --- | --- |" : "")).join("\n") + "\n";
}
function mappingDocumentation(element, rules, format = "markdown") {
  const headings = [t("Target"), t("Rule"), t("Expression / fixed value"), t("Note"), t("Enabled"), t("Translation")];
  const rows = rules.map((rule) => [
    rule.key || rule.element,
    "each" in rule ? "each" : "condition" in rule ? "condition" : "fixed" in rule ? "fixed" : "value",
    "each" in rule ? `${rule.each} → ${rule.variable || "item"}` : rule.condition ?? rule.expression ?? JSON.stringify(rule.fixed),
    rule.note || "",
    rule.disabled ? t("No") : t("Yes"),
    rule.translate ? JSON.stringify(rule.translate) : ""
  ]);
  const title = element.name || element.resourceType;
  const metadata = [element.profileUrl || element.resourceType, element.context || "", element.fhirVersion || "R4"].filter(Boolean).join(" · ");
  if (format === "html") return '<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(title) + "</title><style>body{font:14px system-ui,sans-serif;margin:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #aaa;padding:8px;text-align:left;vertical-align:top}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-width:42ch;margin:0;font:12px monospace}</style></head><body><h1>" + escapeHtml(title) + "</h1><p>" + escapeHtml(metadata) + '</p><table border="1"><thead><tr>' + headings.map((value) => "<th>" + escapeHtml(value) + "</th>").join("") + "</tr></thead><tbody>" + rows.map((row) => "<tr>" + row.map((value) => "<td><pre>" + escapeHtml(value) + "</pre></td>").join("") + "</tr>").join("") + "</tbody></table></body></html>\n";
  return "# " + markdown(title) + "\n\n" + markdown(metadata) + "\n\n| " + headings.map(markdown).join(" | ") + " |\n| " + headings.map(() => "---").join(" | ") + " |\n" + rows.map((row) => "| " + row.map(markdown).join(" | ") + " |").join("\n") + "\n";
}

// src/host/react.js
var React = null;
var bindReact = (instance) => {
  React = instance;
};
var h = (...args) => React.createElement(...args);

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
  const provider = {
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
  };
  m.languages.registerCompletionItemProvider("javascript", provider);
  m.languages.registerCompletionItemProvider("fml", provider);
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
  const { value = "", onChange, onEnter, onFocus, onBlur, placeholder, ariaLabel, completionScope, multiline = false, language = "javascript", getItems, getDts, minHeight, readOnly = false } = options;
  const editor = platform().createCodeEditor({
    value,
    language,
    onChange,
    completionScope,
    ariaLabel,
    readOnly,
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
    const suggest = () => instance.trigger("keyboard", "editor.action.triggerSuggest", {});
    instance.addCommand(m.KeyMod.Alt | m.KeyCode.Space, suggest);
    instance.addCommand(m.KeyMod.WinCtrl | m.KeyCode.Space, suggest);
    instance.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Space, suggest);
    instance.updateOptions({ suggest: { showStatusBar: false, preview: false, showInlineDetails: true }, quickSuggestionsDelay: 80 });
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
    m.editor.setModelMarkers(model, OWNER, (messages || []).map((item) => typeof item === "string" ? { severity: m.MarkerSeverity.Error, message: item, startLineNumber: 1, startColumn: 1, endLineNumber: lines.length, endColumn: (lines[lines.length - 1]?.length || 0) + 1 } : {
      severity: m.MarkerSeverity.Error,
      message: item.message,
      startLineNumber: Math.min(item.line || 1, lines.length),
      startColumn: item.column || 1,
      endLineNumber: Math.min(item.line || 1, lines.length),
      endColumn: (lines[Math.min(item.line || 1, lines.length) - 1]?.length || 0) + 1
    }));
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
function registerLanguage(id, definition, host) {
  const p = host || platform();
  if (typeof p.registerEditorLanguage !== "function") return false;
  try {
    p.registerEditorLanguage(id, { load: () => definition, aliases: definition.aliases, extensions: definition.extensions });
    return true;
  } catch {
    return false;
  }
}
function createDiff(original, modified, language = "json") {
  const factory = platform().createDiffEditor;
  if (typeof factory === "function") return factory({ original, modified, language });
  const el = document.createElement("div");
  el.className = "fm-diff-fallback";
  for (const text of [original, modified]) {
    const pre = document.createElement("pre");
    pre.textContent = text;
    el.appendChild(pre);
  }
  return { el, setModels: () => {
  }, layout: () => {
  }, dispose: () => el.remove() };
}

// src/fhir/completion.js
function completionContext(node, iterationMap, paths, role = "value") {
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
  return { role, variables, iterations, paths: [.../* @__PURE__ */ new Set([...paths, ...aliases])], targetType: node?.code, targetKey: node?.key };
}
var SCOPE_VARIABLES = ["msg", "tmp", "channelMap", "sourceMap", "connectorMap", "configurationMap"];
function functionCompletion(functions2, value, caret, selectionEnd = caret, context = {}, forced = false) {
  const before = value.slice(0, caret).replace(/"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?|`(?:\\.|[^`\\])*`?|\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/g, (s) => " ".repeat(s.length));
  const token = /[A-Za-z_$][\w$]*$/.exec(before);
  if (caret && before[caret - 1] !== value[caret - 1]) return null;
  if ((!token || token[0].length < 3) && !forced) return null;
  const start = token ? token.index : caret;
  if (before.slice(0, start).trimEnd().endsWith(".")) return null;
  const symbols = completionSymbols(functions2, context);
  const prefix = token ? token[0] : "";
  const items = symbols.filter((fn) => fn.name.startsWith(prefix) || forced && `${fn.signature} ${fn.description}`.toLowerCase().includes(prefix.toLowerCase()));
  if (!items.length) return null;
  const end = selectionEnd > caret ? selectionEnd : caret + /^[\w$]*/.exec(value.slice(caret))[0].length;
  return { start, end, items };
}
function completionSymbols(functions2, context = {}) {
  return [
    ...functions2.filter((fn) => !context.role || fn.contexts.includes(context.role)),
    ...[.../* @__PURE__ */ new Set([...SCOPE_VARIABLES, ...context.variables || []])].map((name) => ({ name, signature: name, example: name, description: t("Variable available in this scope."), kind: "variable" })),
    ...(context.paths || []).map((name) => ({ name, signature: name, example: name, description: t("Source path from the sample; guard optional values."), kind: "path" }))
  ];
}
function completeFunction(value, completion, fn) {
  const tail = value.slice(completion.end);
  const text = !fn.kind && /^\s*\(/.test(tail) ? fn.name : fn.example;
  return { value: value.slice(0, completion.start) + text + tail, caret: completion.start + text.length };
}
var SNIPPETS = [
  { name: "guard", label: t("guard optional (x != null ? x : undefined)"), insert: "${1:value} != null ? ${1:value} : undefined", description: t("Give nothing when the source is missing, instead of a TypeError.") },
  { name: "repetition", label: t("nth repetition if present"), insert: "${1:msg['PID']['PID.3']}.length() > ${2:1} ? ${1:msg['PID']['PID.3']}[${2:1}]${3:['PID.3.1']}.toString() : undefined", description: t("HL7 v2 repetition guarded by its count.") },
  { name: "find", label: t("fhirFind(list, function)"), insert: "fhirFind(${1:list}, function (${2:item}) { return ${3:condition}; })", description: t("First item of a list matching a condition.") },
  { name: "filter", label: t("fhirFilter(list, function)"), insert: "fhirFilter(${1:list}, function (${2:item}) { return ${3:condition}; })", description: t("Items of a list matching a condition.") },
  { name: "ternary", label: t("condition ? a : b"), insert: "${1:condition} ? ${2:a} : ${3:b}", description: t("A choice between two values.") }
];
function monacoItems(functions2, context = {}, sampleValues = /* @__PURE__ */ new Map()) {
  const items = [];
  for (const fn of functions2) {
    if (context.role && !fn.contexts.includes(context.role)) continue;
    const params = (fn.parameters || []).map((p) => p.name);
    items.push({
      label: fn.signature,
      filterText: fn.name,
      kind: "function",
      insertText: params.length ? `${fn.name}(${params.map((p, i) => `\${${i + 1}:${p}}`).join(", ")})` : `${fn.name}()`,
      snippet: true,
      detail: t("FHIR Mapper · {p0}", { p0: fn.returnType || "" }),
      documentation: t("{p0}\n\nExample: {p1}", { p0: fn.description, p1: fn.example }),
      sortText: `2${fn.name}`
    });
  }
  for (const name of context.variables || []) {
    items.push({ label: name, kind: "variable", insertText: name, detail: name.endsWith("Index") ? t("iteration index (0, 1, …)") : t("iteration item"), sortText: `0${name}` });
  }
  if (context.role === "translation") {
  }
  const single = (path) => path.replace(/\["((?:[^"\\]|\\.)*)"\]/g, (_, key) => `['${key.replace(/'/g, "\\'")}']`);
  const variables = new Set(context.variables || []);
  const scoped = (path) => variables.has(path.split("[")[0]);
  const paths = [...new Set(context.paths || [])];
  const shown = [...paths.filter(scoped), ...paths.filter((path) => !scoped(path))].slice(0, 80);
  for (const path of shown) {
    const value = sampleValues.get(path) ?? (context.pathValues ? context.pathValues[path] : void 0);
    const text = single(path) + (context.e4x ? ".toString()" : "");
    items.push({
      label: text,
      filterText: text,
      kind: "path",
      insertText: text,
      detail: value == null || value === "" ? t("sample path") : t("sample: {p0}", { p0: String(value).slice(0, 60) }),
      sortText: `${scoped(path) ? "1" : "4"}${path}`
    });
  }
  for (const s of SNIPPETS) {
    items.push({ label: s.label, filterText: s.name, kind: "snippet", insertText: s.insert, snippet: true, detail: t("snippet · {p0}", { p0: s.description }), sortText: `5${s.name}` });
  }
  return items;
}
function scopeDts(functions2, context = {}) {
  const lines = ["// FHIR Profile Mapper: functions of the runtime and variables of this expression's scope."];
  for (const fn of functions2) {
    const params = (fn.parameters || []).map((p) => `${p.name}${p.optional ? "?" : ""}: any`).join(", ");
    lines.push(`/** ${fn.description} Example: ${fn.example} */`, `declare function ${fn.name}(${params}): ${tsType(fn.returnType)};`);
  }
  for (const name of context.variables || []) {
    lines.push(`/** ${name.endsWith("Index") ? "Index of the current item of the iteration (0, 1, …)." : "Current item of the iteration."} */`, `declare const ${name}: ${name.endsWith("Index") ? "number" : "any"};`);
  }
  return lines.join("\n") + "\n";
}
function tsType(returnType) {
  const t2 = String(returnType || "any");
  if (t2 === "string") return "string";
  if (t2 === "string[]") return "string[]";
  if (/undefined/.test(t2)) return "any";
  if (/\[\]$/.test(t2)) return "any[]";
  if (t2 === "number") return "number";
  return "any";
}

// src/profile-mapper/expression.js
var functions = [];
var setExpressionFunctions = (value) => {
  functions = value;
};
var functionCompletion2 = (...args) => functionCompletion(functions, ...args);
function isCompletionShortcut(e) {
  return (e.code === "Space" || e.key === " " || e.key === " ") && !e.metaKey && !e.shiftKey && e.ctrlKey !== e.altKey;
}
var COMPLETION_HINT = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "") ? t("⌥Space (or ⌃Space) for suggestions") : t("Ctrl+Space or Alt+Space for suggestions");
function MapperExpression({ style, onChange, completionContext: completionContext2 = {}, ...props }) {
  const input = React.useRef(null);
  const popup = React.useRef(null);
  const selection = React.useRef({});
  const caret = React.useRef(null);
  const id = React.useId();
  const [menu, setMenu] = React.useState(null);
  const [active, setActive] = React.useState(0);
  const update = (el, forced = false) => {
    const next = { value: el.value, start: el.selectionStart, end: el.selectionEnd };
    const previous = selection.current;
    if (!forced && previous.value === next.value && previous.start === next.start && previous.end === next.end) return;
    selection.current = next;
    setMenu(functionCompletion2(el.value, el.selectionStart, el.selectionEnd, completionContext2, forced));
    setActive(0);
  };
  const accept = (fn) => {
    const next = completeFunction(input.current.value, menu, fn);
    caret.current = next.caret;
    onChange({ target: { value: next.value } });
    setMenu(null);
  };
  React.useLayoutEffect(() => {
    if (caret.current !== null) {
      input.current.focus();
      input.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });
  React.useLayoutEffect(() => {
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
  return h(
    "span",
    { className: "mapper-expression", style },
    h("input", {
      ...props,
      ref: input,
      type: "text",
      autoComplete: "off",
      role: "combobox",
      "aria-label": props["aria-label"] || t("JavaScript expression"),
      title: props.title || t("{p0}{p1}. {p2}.", { p0: completionContext2.role || "value", p1: completionContext2.targetType ? ` → FHIR ${completionContext2.targetType}` : "", p2: COMPLETION_HINT }),
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
    h(
      "div",
      { ref: popup, id, popover: "manual", role: "listbox", "aria-label": t("Mapper functions"), className: "mapper-functions" },
      menu ? menu.items.map((fn, index) => h("div", {
        key: fn.name,
        id: `${id}-${index}`,
        role: "option",
        "aria-selected": index === active,
        onMouseDown: (e) => e.preventDefault(),
        onClick: () => accept(fn)
      }, h("code", null, fn.signature + (fn.returnType ? ` → ${fn.returnType}` : "")), h("div", null, fn.description), h("code", null, fn.example))) : null
    )
  );
}
var coloured = /* @__PURE__ */ new Map();
function ColouredExpression({ value, style, title, label, onActivate, onDropText }) {
  const [html, setHtml] = React.useState(coloured.get(value) || null);
  React.useEffect(() => {
    if (coloured.has(value)) {
      setHtml(coloured.get(value));
      return void 0;
    }
    const monaco2 = typeof window !== "undefined" ? window.monaco : null;
    if (!monaco2?.editor?.colorize) {
      setHtml(null);
      return void 0;
    }
    let active = true;
    monaco2.editor.colorize(value, "javascript", {}).then((text) => {
      if (coloured.size > 2e3) coloured.clear();
      coloured.set(value, text);
      if (active) setHtml(text);
    }, () => {
    });
    return () => {
      active = false;
    };
  }, [value]);
  return h("div", {
    className: "mapper-expression-view",
    role: "combobox",
    tabIndex: 0,
    "aria-label": label || t("JavaScript expression"),
    "aria-expanded": false,
    title,
    style: { ...style, fontFamily: void 0, fontSize: void 0 },
    "data-value": value,
    onFocus: onActivate,
    onClick: onActivate,
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDrop: (e) => {
      const text = e.dataTransfer.getData("application/x-oie-accessor") || e.dataTransfer.getData("text/plain");
      if (!text) return;
      e.preventDefault();
      e.stopPropagation();
      onDropText(text);
    }
  }, html ? h("span", { dangerouslySetInnerHTML: { __html: html } }) : value);
}
var activeExpressionEditor = null;
function ExpressionField(props) {
  const [editing, setEditing] = React.useState(false);
  const host = React.useRef(null);
  const editor = React.useRef(null);
  const latest = React.useRef(props);
  latest.current = props;
  const available = typeof createExpressionEditor === "function" && typeof document !== "undefined";
  React.useEffect(() => {
    if (!editing || !host.current) return void 0;
    const context = () => latest.current.completionContext || {};
    latest.current.onEdit?.();
    let ed;
    try {
      ed = createExpressionEditor({
        value: latest.current.value ?? "",
        ariaLabel: latest.current["aria-label"] || "JavaScript expression",
        onChange: (value) => latest.current.onChange({ target: { value } }),
        onEnter: () => setEditing(false),
        // Inside quotes only the codes of the element's value set make sense; elsewhere they come quoted.
        getItems: () => [
          // The functions themselves are offered once, by Web Admin's Reference entries (host/references.js).
          ...monacoItems([], context()),
          ...(context().codes || []).map((c) => ({
            label: t("'{p0}'{p1}", { p0: c.code, p1: c.display ? ` — ${c.display}` : "" }),
            filterText: `${c.code} ${c.display || ""}`,
            kind: "variable",
            insertText: `'${c.code}'`,
            detail: t("code of the {p0} binding{p1}", { p0: context().bindingStrength || "", p1: c.system ? ` · ${c.system}` : "" }),
            sortText: `0code${c.code}`
          })),
          ...(context().refs || []).map((ref) => ({
            label: t("fhirRef({p0})", { p0: ref.expression }),
            filterText: `fhirRef ${ref.expression}`,
            kind: "function",
            insertText: `fhirRef(${ref.expression})`,
            detail: t("reference · {p0} built by step “{p1}”", { p0: ref.resourceType || "", p1: ref.step }),
            sortText: `0ref${ref.expression}`
          }))
        ],
        getDts: () => scopeDts(functions, context())
      });
    } catch (error) {
      console.error("[fhir-mapper] expression editor:", error);
      setEditing(false);
      return void 0;
    }
    editor.current = ed;
    activeExpressionEditor = ed;
    ed.setMarkers(latest.current.errors || []);
    host.current.appendChild(ed.el);
    ed.focus();
    const focusElsewhere = (e) => {
      if (host.current && !host.current.contains(e.target) && !e.target.closest?.(".suggest-widget, .monaco-hover, .mapper-source-pane")) setEditing(false);
    };
    document.addEventListener("focusin", focusElsewhere, true);
    const focusWhenReady = setInterval(() => {
      if (ed.hasMonaco()) {
        clearInterval(focusWhenReady);
        ed.focus();
      }
    }, 60);
    const outside = (e) => {
      if (host.current && !host.current.contains(e.target) && !e.target.closest?.(".suggest-widget, .monaco-hover, .parameter-hints-widget, .mapper-source-pane")) setEditing(false);
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
      document.removeEventListener("focusin", focusElsewhere, true);
      if (activeExpressionEditor === ed) activeExpressionEditor = null;
      editor.current = null;
      ed.dispose();
    };
  }, [editing]);
  React.useEffect(() => {
    if (editor.current && (props.value ?? "") !== editor.current.getValue()) editor.current.setValue(props.value ?? "");
  }, [props.value]);
  React.useEffect(() => {
    editor.current?.setMarkers(props.errors || []);
  }, [(props.errors || []).join("\n")]);
  const { errors, onEdit, ...plain } = props;
  if (available && !editing && !props.disabled && (props.value ?? "") !== "" && window.monaco?.editor?.colorize) {
    return h(
      "span",
      { className: "mapper-expression", style: props.style },
      h(ColouredExpression, {
        value: props.value,
        title: props.title,
        label: props["aria-label"],
        style: props.style,
        onActivate: () => setEditing(true),
        onDropText: (text) => props.onChange({ target: { value: `${props.value}${text}` } })
      })
    );
  }
  if (!available || !editing || props.disabled) return h(MapperExpression, { ...plain, onFocus: () => {
    if (available && !props.disabled) setEditing(true);
  } });
  return h("span", { className: "mapper-expression mapper-expression-editing", style: props.style, ref: host });
}

// src/fhir/model.js
var FHIR_BASE = "http://hl7.org/fhir/StructureDefinition/";
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
  const untypedResource = (el.type || []).some((t2) => t2.code === "Resource" && !(t2.profile && t2.profile.length));
  if (showAll) return untypedResource;
  if ((name === "extension" || name === "modifierExtension") && !el.sliceName) return true;
  if (name === "id" && !parent.resourceRoot) return true;
  return untypedResource;
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
  const cache2 = /* @__PURE__ */ new Map();
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
      const sliced = sliceName ? types.filter((t2) => base + cap(t2.code) === sliceName) : [];
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
    if (!choice && code && !primitive && (!NOT_EXPANDED.has(code) || types[0].profile && types[0].profile.length)) {
      typeUrl = types[0].profile && types[0].profile[0] || FHIR_BASE + code;
    }
    let path = jsonName == null ? parent.path : parent.path.concat([segment]);
    if (parent.primitive && (name === "id" || name === "extension") && parent.path.length) {
      const metadata = [...parent.path[parent.path.length - 1]];
      metadata[0] = "_" + metadata[0];
      path = parent.path.slice(0, -1).concat([metadata, segment]);
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
      path,
      code,
      primitive,
      typeUrl,
      types,
      min: choiceType ? parent.min : el.min,
      max: choiceType ? parent.max : el.max,
      short: el.short || "",
      mustSupport: !!el.mustSupport || (choiceType ? parent.mustSupport : false),
      binding: el.binding && el.binding.valueSet ? { strength: el.binding.strength || "", valueSet: el.binding.valueSet } : null,
      fixed: choiceType ? null : fixedOf(el),
      depth: parent.depth + 1,
      parent
    };
  }
  function childElements(node) {
    if (node.choice) return node.types.map((t2) => ({ el: node.el, sdx: node.sdx, choiceType: t2 }));
    const own = node.choiceType ? [] : node.sdx.byParent.get(node.el.id) || [];
    if (own.length) return own.map((el) => ({ el, sdx: node.sdx }));
    if (!node.typeUrl) return [];
    const typeIndex = sdLoaded.get(sdKey(ctx.version, ctx.profiles, node.typeUrl));
    if (!typeIndex) return null;
    return (typeIndex.byParent.get(typeIndex.root.id) || []).map((el) => ({ el, sdx: typeIndex }));
  }
  function children(node) {
    if (cache2.has(node.key)) return cache2.get(node.key);
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
    cache2.set(node.key, list);
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
    const colon = node.el.id.lastIndexOf(":");
    const prefix = colon < 0 ? node.el.id : node.el.id.slice(0, colon);
    let slice = colon < 0 ? "" : node.el.id.slice(colon + 1);
    let base = null;
    while (slice.includes("/") && !base) {
      slice = slice.slice(0, slice.lastIndexOf("/"));
      const candidate = node.sdx.byId.get(`${prefix}:${slice}`);
      if (candidate && candidate.slicing) base = candidate;
    }
    if (!base) base = node.sdx.byId.get(prefix);
    return (base && base.slicing && base.slicing.discriminator || []).filter((d) => d.path).map((d) => ({ type: d.type || "value", path: d.path }));
  }
  function resourceType(node) {
    if (node.code !== "Resource" || !node.typeUrl) return null;
    return sdLoaded.get(sdKey(ctx.version, ctx.profiles, node.typeUrl))?.sd.type || null;
  }
  return { root, children, expandable, chain, discriminators, resourceType };
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
  const checkedSlices = /* @__PURE__ */ new Set();
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
    const t2 = translations.get(key);
    if (t2 && t2.conceptMap && t2.conceptMap.trim()) {
      entry.translate = { conceptMap: t2.conceptMap.trim(), source: (t2.source || "").trim(), target: (t2.target || "").trim(), unmapped: t2.unmapped || "none", keepSource: !!t2.keepSource };
      if (entry.translate.unmapped === "fixed" || entry.translate.unmapped === "function") entry.translate.value = (t2.value || "").trim();
    }
    entries.push(entry);
    const onChain = new Set(nodes.map((n) => n.key));
    for (const container of nodes.slice(0, -1)) {
      const when = container.path.length;
      if (container !== tree.root && container.fixed && container.jsonName != null && !fixed.has(container.key)) {
        fixed.set(container.key, { key: container.key, element: container.key, fixed: container.fixed.value, when, path: container.path });
      }
      const resourceType = tree.resourceType(container);
      if (resourceType) {
        const typeKey = `${container.key}.resourceType`;
        if (!fixed.has(typeKey)) fixed.set(typeKey, { key: typeKey, element: typeKey, fixed: resourceType, when, path: container.path.concat([["resourceType"]]) });
      }
      if (container.sliceName && !checkedSlices.has(container.key)) {
        checkedSlices.add(container.key);
        for (const discriminator of tree.discriminators(container)) {
          if (discriminator.type === "value" || discriminator.type === "pattern") continue;
          if (discriminator.type === "type" && discriminator.path === "$this" && container.code && lastSegment(container.el.id).split(":")[0].endsWith("[x]")) continue;
          if (discriminator.type === "profile" && discriminator.path === "$this" && resourceType) continue;
          if (discriminator.type === "exists") {
            let target = container;
            for (const part of discriminator.path.split(".")) target = target && (tree.children(target) || []).find((child) => child.instance === 0 && (child.jsonName === part || lastSegment(child.el.id).split(":")[0] === part));
            let raw = container.el;
            for (const part of discriminator.path.split(".")) raw = raw && (container.sdx.byParent.get(raw.id) || []).find((child) => lastSegment(child.id).split(":")[0] === part);
            if ((target || raw) && ((target || raw).max === "0" || target?.fixed || target && [...mapped].some((mappedKey) => mappedKey === target.key || mappedKey.startsWith(target.key + ".")))) continue;
          }
          throw new Error(`Slice ${container.key}: discriminator ${discriminator.type}(${discriminator.path}) cannot be generated automatically; map the discriminator explicitly or use a concrete contained resource profile.`);
        }
      }
      const discriminators = tree.discriminators(container).filter((d) => d.type === "value" || d.type === "pattern").map((d) => d.path).filter((p) => p !== "$this");
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

// src/fhir/step.js
var MAPPER_TYPE = "org.oie.fhir.mapper.FhirProfileMapperStep";
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
  if (!patch || Array.isArray(patch) || typeof patch !== "object") throw new Error(t("Expected a step JSON object."));
  for (const key of ["__proto__", "constructor", "prototype"]) if (Object.prototype.hasOwnProperty.call(patch, key)) throw new Error(t("Invalid step property: {p0}", { p0: key }));
  if (patch.__type && patch.__type !== MAPPER_TYPE) throw new Error(t("This is not a FHIR Profile Mapper step."));
  const merged = {
    ...element,
    ...patch,
    __type: element.__type || MAPPER_TYPE,
    sequenceNumber: element.sequenceNumber,
    enabled: element.enabled
  };
  if (!["resource", "createBundle"].includes(merged.action) || !merged.resourceType) throw new Error(t("An action and resourceType are required."));
  for (const field of ["mappings", "bundleTargets"]) {
    if (typeof (merged[field] ?? "[]") !== "string" || !Array.isArray(JSON.parse(merged[field] || "[]")))
      throw new Error(t("{p0} must be a string containing a JSON array.", { p0: field }));
  }
  const allowed = /* @__PURE__ */ new Set(["id", "key", "element", "type", "expression", "path", "each", "variable", "condition", "fixed", "when", "translate", "note", "disabled"]);
  for (const rule of JSON.parse(merged.mappings || "[]")) {
    if (!rule || typeof rule !== "object" || !Array.isArray(rule.path)) throw new Error(t("Every rule needs a path."));
    for (const key of Object.keys(rule)) if (!allowed.has(key)) throw new Error(t("Unknown rule property: {p0}", { p0: key }));
  }
  merged.mappings = JSON.stringify(mapperRuleIds(JSON.parse(merged.mappings || "[]"), parseMappings(element.mappings)));
  return merged;
}
function mapperRuleKey(rule) {
  return `${"each" in rule ? "each" : "condition" in rule ? "condition" : "fixed" in rule ? "fixed" : "value"}:${rule.key || rule.element}`;
}
function mapperRuleIds(entries, previous = [], createId = () => crypto.randomUUID()) {
  const identity = mapperRuleKey;
  const known = new Map(previous.filter((rule) => rule.id).map((rule) => [identity(rule), rule.id]));
  const used = /* @__PURE__ */ new Set();
  return entries.map((rule) => {
    const id = rule.id === void 0 ? known.get(identity(rule)) || createId() : rule.id;
    if (typeof id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(id) || used.has(id)) throw new Error(t("Rule ids must be valid and unique within a step."));
    used.add(id);
    return { ...rule, id };
  });
}

// src/fhir/expressions.js
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

// src/host/catalog.js
var MAPPER_API2 = "/extensions/fhir-profile-mapper";
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
function fetchElements(platform2, version, profiles, url) {
  const key = sdKey(version, profiles, url);
  if (sdPromises.has(key)) return sdPromises.get(key);
  const promise = platform2.api.get(`${MAPPER_API2}/catalog/elements`, { url, fhirVersion: version, profiles }, { raw: true }).then((text) => {
    const answer = JSON.parse(text);
    const index = indexSd(answer.root);
    sdLoaded.set(key, index);
    for (const [typeUrl, sd] of Object.entries(answer.types || {})) {
      const typeKey = sdKey(version, profiles, typeUrl);
      if (sdLoaded.has(typeKey)) continue;
      const typeIndex = indexSd(sd);
      sdLoaded.set(typeKey, typeIndex);
      sdPromises.set(typeKey, Promise.resolve(typeIndex));
    }
    return index;
  }).catch(() => {
    sdPromises.delete(key);
    return fetchSd(platform2, version, profiles, url);
  });
  sdPromises.set(key, promise);
  return promise;
}

// src/host/channel-context.js
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
function mapperPreviewSteps(platform2, element) {
  const ctx = mapperContext(platform2, element);
  if (!ctx) return null;
  return ctx.steps.map((step, index) => index === ctx.index ? element : step).filter((step) => step.__type === MAPPER_TYPE && asBool(step.enabled, true)).map((step) => ({ ...step, samples: "[]" }));
}

// src/fhir/diagnostics.js
function mapperDiagnostic(error) {
  const step = error.step || {};
  const label = [
    step.name || (step.sequenceNumber ? t("Step {number}", { number: step.sequenceNumber }) : ""),
    error.phase,
    error.errorType,
    error.key,
    error.line ? t("line {number}", { number: error.line }) : ""
  ].filter(Boolean).join(" · ");
  const target = Array.isArray(error.path) ? [step.resourceType || "", ...error.path.map(([name, instance]) => name + (instance === void 0 ? "" : `[${instance}]`))].filter(Boolean).join(".") : "";
  const kind = error.operation === "iteration" ? "each" : error.operation === "condition" ? "condition" : error.phase === "translation" ? "translate" : "value";
  return { label, target, kind };
}
function traceRows(trace) {
  return trace.events.map((event) => ({
    event,
    label: mapperDiagnostic({ ...event, step: trace.steps?.find((step) => String(step.sequenceNumber) === String(event.step)) || trace.step }).label,
    duration: `${(Number(event.durationNanos) / 1e6).toFixed(3)} ms`,
    iterations: (event.iterations || []).map((item) => t("rule {rule}, item {index}", { rule: item.ruleIndex, index: item.index })).join(" / ")
  }));
}
var traceExport = (trace) => JSON.stringify(trace, null, 2);
function normalizeResult(text) {
  if (text == null) return "";
  let json;
  try {
    json = JSON.stringify(JSON.parse(text), (_, value) => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : value, 2);
  } catch {
    json = String(text);
  }
  const identities = /* @__PURE__ */ new Map();
  return json.replace(/urn:uuid:[0-9a-f-]{36}/gi, (value) => {
    const key = value.toLowerCase();
    if (!identities.has(key)) identities.set(key, `urn:uuid:<uuid-${identities.size}>`);
    return identities.get(key);
  }).replace(/"lastUpdated"\s*:\s*"[^"]*"/g, '"lastUpdated": "<time>"');
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
    instances: [...state.instances || []],
    ruleIds: [...state.ruleIds || []]
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
  state.ruleIds = new Map(snap.ruleIds || []);
}

// src/host/code-box.js
function languageOf(dataType) {
  return dataType === "HL7V2" ? "hl7v2" : dataType === "XML" ? "xml" : dataType === "JSON" ? "json" : "text";
}
function CodeBox({ value, language, readOnly = false, onChange, height = "220px", label }) {
  const React3 = platform().React;
  const host = React3.useRef(null);
  const editor = React3.useRef(null);
  const latest = React3.useRef(onChange);
  latest.current = onChange;
  React3.useEffect(() => {
    const ed = createExpressionEditor({
      value: value ?? "",
      language,
      multiline: true,
      readOnly,
      minHeight: height,
      ariaLabel: label,
      onChange: (text) => latest.current?.(text)
    });
    ed.el.style.height = height;
    editor.current = ed;
    host.current.appendChild(ed.el);
    return () => {
      editor.current = null;
      ed.dispose();
    };
  }, [language, readOnly]);
  React3.useEffect(() => {
    if (editor.current && editor.current.getValue() !== (value ?? "")) editor.current.setValue(value ?? "");
  }, [value]);
  return React3.createElement("div", { ref: host, className: "fm-code-box", "data-language": language });
}

// src/fhir/source.js
var esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
function xmlNode(element, accessor) {
  const children = [];
  for (const attr of element.attributes) {
    children.push({ name: `@${attr.name}`, accessor: `${accessor}['@${esc(attr.name)}'].toString()`, value: attr.value, children: [] });
  }
  const counts = {};
  for (const child of element.children) counts[child.tagName] = (counts[child.tagName] || 0) + 1;
  const seen = {};
  for (const child of element.children) {
    const index = seen[child.tagName] || 0;
    seen[child.tagName] = index + 1;
    let childAccessor = `${accessor}['${esc(child.tagName)}']`;
    const repeated = counts[child.tagName] > 1;
    if (repeated) childAccessor += `[${index}]`;
    const node = xmlNode(child, childAccessor);
    if (repeated) {
      node.repeated = true;
      node.index = index;
      node.listAccessor = `${accessor}['${esc(child.tagName)}']`;
    }
    children.push(node);
  }
  const value = element.children.length ? null : element.textContent ?? "";
  return { name: element.tagName, accessor: `${accessor}.toString()`, pathAccessor: accessor, value, children };
}
function jsonNode(name, value, accessor) {
  if (Array.isArray(value)) {
    return { name, accessor, pathAccessor: accessor, value: null, children: value.map((item, i) => ({ ...jsonNode(`[${i}]`, item, `${accessor}[${i}]`), repeated: true, index: i, listAccessor: accessor })) };
  }
  if (value && typeof value === "object") {
    return { name, accessor, pathAccessor: accessor, value: null, children: Object.entries(value).map(([key, item]) => jsonNode(key, item, `${accessor}['${esc(key)}']`)) };
  }
  return { name, accessor, pathAccessor: accessor, value: value === null ? "null" : String(value), children: [] };
}
function sourceTree(sample, variable = "msg") {
  const message = sample?.message || "";
  if (!message.trim()) return [];
  try {
    if (sample.dataType === "JSON") return [jsonNode(variable, JSON.parse(message), variable)];
    if (sample.dataType === "RAW") return [{ name: variable, accessor: variable, pathAccessor: variable, value: message.slice(0, 200), children: [] }];
    const doc = new DOMParser().parseFromString(message, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) return [];
    const root = xmlNode(doc.documentElement, variable);
    root.name = `${variable} (${doc.documentElement.tagName})`;
    return [root];
  } catch {
    return [];
  }
}
function sourcePaths(tree, limit = 2e3) {
  const paths = [];
  const walk = (node) => {
    if (paths.length >= limit) return;
    paths.push({ path: node.pathAccessor || node.accessor, value: node.value, name: node.name, repeated: !!node.repeated, listAccessor: node.listAccessor });
    for (const child of node.children) walk(child);
  };
  for (const node of tree) walk(node);
  return paths;
}

// src/profile-mapper/inspector.js
function Inspector({ h: h3, node, helpUrl, children, diagnostics, extensions }) {
  if (!node) return h3(
    "aside",
    { className: "mapper-inspector", "aria-label": t("Element inspector") },
    h3("h3", null, t("Element inspector")),
    h3("p", null, t("Select an element in the tree to inspect its definition and rules."))
  );
  const el = node.el || {};
  const item = (label, value) => value == null || value === "" ? null : h3("div", { key: label }, h3("dt", null, label), h3("dd", null, value));
  return h3(
    "aside",
    { className: "mapper-inspector", "aria-label": t("Element inspector") },
    h3("h3", null, node.key),
    h3(
      "dl",
      null,
      item(t("Type"), (node.types || el.type || []).map((type) => type.code).join(" | ") || node.code),
      item(t("Cardinality"), `${node.min ?? el.min ?? 0}..${node.max ?? el.max ?? "*"}`),
      item(t("Must Support"), node.mustSupport || el.mustSupport ? t("Yes") : t("No")),
      item(t("Slice"), node.sliceName || el.sliceName),
      item(t("Description"), node.short || el.short),
      item(t("Definition"), el.definition),
      item(t("Binding"), node.binding ? `${node.binding.strength}: ${node.binding.valueSet}` : null),
      item(node.fixed?.kind === "pattern" ? t("Pattern") : t("Fixed value"), node.fixed ? JSON.stringify(node.fixed.value) : null)
    ),
    (el.example || []).map((example, index) => h3(
      "p",
      { key: index },
      h3("strong", null, example.label || t("Example")),
      ": ",
      JSON.stringify(Object.entries(example).find(([key]) => key.startsWith("value"))?.[1])
    )),
    h3("a", { href: helpUrl, target: "_blank", rel: "noopener noreferrer" }, t("Official FHIR definition")),
    extensions,
    h3("h4", null, t("Rules")),
    children,
    h3("h4", null, t("Diagnostics")),
    diagnostics.length ? diagnostics : h3("p", { className: "hint" }, t("No diagnostic reported for this element."))
  );
}

// src/fhir/branch.js
var inBranch = (key, root) => key === root || key.startsWith(root + ".");
function duplicateBranch(state, source, target) {
  const replace = (key) => target + key.slice(source.length);
  for (const name of ["values", "iterations", "conditions", "translations", "instances"]) {
    for (const key of state[name].keys()) if (inBranch(key, target)) state[name].delete(key);
    for (const [key, value] of [...state[name]]) {
      if (name === "instances" && key === source) continue;
      if (inBranch(key, source)) state[name].set(replace(key), value && typeof value === "object" ? { ...value } : value);
    }
  }
  const metadataKey = (key) => {
    const colon = key.indexOf(":");
    const path = key.slice(colon + 1);
    return inBranch(path, source) ? key.slice(0, colon + 1) + replace(path) : null;
  };
  for (const name of ["notes", "disabled", "ruleIds"]) {
    for (const key of state[name]?.keys() || []) if (inBranch(key.slice(key.indexOf(":") + 1), target)) state[name].delete(key);
  }
  for (const [key, note] of [...state.notes]) {
    const next = metadataKey(key);
    if (next) state.notes.set(next, note);
  }
  for (const key of [...state.disabled]) {
    const next = metadataKey(key);
    if (next) state.disabled.add(next);
  }
}

// src/fhir/assistance.js
var canonical = (value) => String(value || "").split("|")[0];
function matchingConceptMaps(maps, { source = "", target = "", valueSet = "", systems = [] } = {}) {
  return maps.filter((map) => {
    const groups = map.groups || [];
    if (source && !groups.some((group) => canonical(group.source) === canonical(source)) && canonical(map.source) !== canonical(source)) return false;
    if (target) return groups.some((group) => (!source || canonical(group.source) === canonical(source)) && canonical(group.target) === canonical(target)) || canonical(map.target) === canonical(target);
    if (!valueSet && !systems.length) return true;
    return valueSet && canonical(map.target) === canonical(valueSet) || groups.some((group) => (!source || canonical(group.source) === canonical(source)) && systems.some((system) => canonical(group.target) === canonical(system)));
  });
}
function profileExtensions(tree, node) {
  return (tree.children(node) || []).filter((child) => ["extension", "modifierExtension"].includes(child.jsonName) && child.sliceName).map((child) => ({ key: child.key, label: child.label, url: child.types?.[0]?.profile?.[0] || "" }));
}

// src/profile-mapper/editor.js
var MAPPER_API3 = "/extensions/fhir-profile-mapper";
var mapperFunctionsRequest = null;
function ResultDiff({ expected, actual }) {
  const host = React.useRef(null);
  React.useEffect(() => {
    const diff = createDiff(expected, actual, "json");
    diff.el.style.height = "320px";
    host.current.appendChild(diff.el);
    diff.layout?.();
    return () => {
      try {
        diff.dispose();
      } catch {
      }
      diff.el.remove();
    };
  }, [expected, actual]);
  return h("div", { ref: host, className: "mapper-result-diff", style: { height: "320px", border: "1px solid #cbd5e1", borderRadius: "4px", overflow: "hidden" } });
}
function stepSamples(element) {
  return parseMappings(element.samples).filter((s) => s && typeof s === "object" && s.id);
}
function sampleVerdict(sample, result) {
  if (!sample || sample.expected == null || sample.expected === "") return null;
  return !result.errors.length && normalizeResult(result.output) === normalizeResult(sample.expected);
}
function errorText2(e) {
  const body = e && e.body || "";
  const m = /<detailMessage>([\s\S]*?)<\/detailMessage>/.exec(body);
  if (m) return m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  return e && e.message || String(e);
}
function downloadMapperTrace(trace) {
  const url = URL.createObjectURL(new Blob([traceExport(trace)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `fhir-mapper-trace-${trace.id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function ProfileMapperEditor({ element, onChange, platform: platform2 }) {
  const [, rerender] = React.useReducer((x) => x + 1, 0);
  const tabId = React.useId();
  const state = React.useRef(null);
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
    const savedSamples = stepSamples(element);
    if (savedSamples.length) sample = { message: savedSamples[0].message, dataType: savedSamples[0].dataType || "HL7V2" };
    state.current = {
      values,
      iterations,
      translations,
      conditions,
      notes: new Map(saved.filter((rule) => rule.note).map((rule) => [mapperRuleKey(rule), rule.note])),
      disabled: new Set(saved.filter((rule) => rule.disabled).map(mapperRuleKey)),
      ruleIds: new Map(saved.filter((rule) => rule.id).map((rule) => [mapperRuleKey(rule), rule.id])),
      // shown when something below an extension, modifierExtension or id (that "extensions & ids" shows) is mapped
      showAll: [...values.keys(), ...iterations.keys(), ...conditions.keys()].some((k) => /\.(extension|modifierExtension|id)(\[\d+\])?(\.|$)/.test(k)),
      sample,
      activeSample: savedSamples.length ? savedSamples[0].id : null,
      sampleKey: initial.key,
      previewScope: savedSamples[0]?.scope || "step",
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
      settingsReady: !!cachedFhirSettings(),
      tab: saved.length ? "mapper" : "properties"
    };
  }
  const st = state.current;
  React.useEffect(() => {
    let active = true;
    if (!mapperFunctionsRequest) mapperFunctionsRequest = platform2.api.get(`${MAPPER_API3}/functions`, {}, { raw: true }).then((text2) => {
      setExpressionFunctions(JSON.parse(text2));
    }).catch((error) => {
      mapperFunctionsRequest = null;
      throw error;
    });
    mapperFunctionsRequest.then(() => {
      if (active) rerender();
    }).catch((error) => {
      if (active) {
        st.error = t("Function catalogue: {p0}", { p0: errorText2(error) });
        rerender();
      }
    });
    return () => {
      active = false;
    };
  }, []);
  React.useEffect(() => {
    let active = true;
    const sample = { ...st.sample };
    st.sourcePaths = mapperSourcePaths(sample);
    rerender();
    const timer = setTimeout(async () => {
      if (sample.dataType !== "HL7V2" || !sample.message.trim()) return;
      try {
        const text2 = await platform2.api.post(`${MAPPER_API3}/source`, JSON.stringify(sample), { contentType: "text/plain", raw: true });
        if (active) {
          st.serialized = JSON.parse(text2);
          st.sourcePaths = mapperSourcePaths(st.serialized);
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
  React.useEffect(() => {
    let active = true;
    const done = () => {
      if (active && !st.settingsReady) {
        st.settingsReady = true;
        rerender();
      }
    };
    loadFhirSettings().then(done, done);
    return () => {
      active = false;
    };
  }, [st]);
  const shared = fhirContext(element.context);
  const version = shared ? shared.fhirVersion : element.fhirVersion || "R4";
  const profiles = shared ? (shared.packages || []).join(";") : element.profiles || "";
  const txServer = shared ? shared.terminologyServer || "" : element.terminologyServer || "";
  const setContext = (name) => {
    element.context = name;
    element.formatVersion = 2;
    if (name && !element.validation) element.validation = "inherit";
    if (!name && element.validation === "inherit") element.validation = asBool(element.validateOutput, true) ? "always" : "off";
    onChange();
    state.current = null;
    rerender();
  };
  const ctx = { version, profiles, instances: st.instances, showAll: st.showAll };
  const tree = st.rootIndex ? makeTree(st.rootIndex, ctx) : null;
  const diagnosticHere = (error) => !error.step || String(error.step.sequenceNumber) === String(element.sequenceNumber);
  const revealDiagnostic = (error) => {
    if (!diagnosticHere(error)) return;
    const chain = st.rootIndex && makeTree(st.rootIndex, { ...ctx, showAll: true }).chain(error.key);
    if (!chain) {
      st.notice = t("The element {p0} is not in the loaded profile.", { p0: error.key });
    } else {
      st.showAll = true;
      st.filter = "all";
      st.search = "";
      for (const node of chain.slice(0, -1)) st.expanded.add(node.key);
      st.pendingDiagnostic = { key: error.key, kind: mapperDiagnostic(error).kind };
      st.selectedKey = error.key;
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
    return h(
      "div",
      { key: id, style: { color: "var(--err, #b91c1c)", fontSize: "12px", marginBottom: "6px" } },
      h("strong", null, display.label),
      error.key && tree && diagnosticHere(error) ? h("button", { type: "button", className: "btn btn-sm", style: { marginLeft: "6px" }, onClick: () => revealDiagnostic(error) }, t("Go to rule")) : null,
      h("div", null, error.message),
      !diagnosticHere(error) ? h("div", null, t("This diagnostic belongs to step {name}. Select that step to edit its rule.", { name: error.step.name || error.step.sequenceNumber })) : null,
      display.target ? h("div", { style: { fontFamily: "monospace" } }, t("Target: {p0}", { p0: display.target })) : null,
      error.expression ? h("pre", { style: { whiteSpace: "pre-wrap", margin: "4px 0" } }, error.expression) : null
    );
  };
  const allKeys = () => /* @__PURE__ */ new Set([...st.values.keys(), ...st.iterations.keys(), ...st.translations.keys(), ...st.conditions.keys()]);
  const forget = (key) => {
    st.values.delete(key);
    st.iterations.delete(key);
    st.translations.delete(key);
    st.conditions.delete(key);
  };
  const compiled = (index, local) => {
    const previous = parseMappings(element.mappings);
    const ids = st.ruleIds ||= /* @__PURE__ */ new Map();
    const rules = mapperRuleIds(compile(makeTree(index, { ...local, showAll: true }), st.values, st.iterations, st.translations, st.conditions).map((rule) => ids.has(mapperRuleKey(rule)) ? { ...rule, id: ids.get(mapperRuleKey(rule)) } : rule), previous);
    for (const rule of rules) ids.set(mapperRuleKey(rule), rule.id);
    return JSON.stringify(rules.map((rule) => {
      const key = mapperRuleKey(rule);
      return { ...rule, ...st.notes.get(key) ? { note: st.notes.get(key) } : {}, ...st.disabled.has(key) ? { disabled: true } : {} };
    }));
  };
  const save = () => {
    if (!tree) return;
    try {
      element.mappings = compiled(st.rootIndex, ctx);
      st.error = "";
    } catch (error) {
      st.error = errorText2(error);
      rerender();
      return;
    }
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
  const importTable = async () => {
    try {
      if (!tree) throw new Error(t("Load a profile before importing a table."));
      const file = await platform2.ui.pickFile(".csv,.md");
      if (!file) return;
      const edits = importMappingTable(
        file.content,
        file.name.toLowerCase().endsWith(".csv") ? "csv" : "markdown",
        makeTree(st.rootIndex, { ...ctx, showAll: true }),
        element
      );
      for (const edit of edits) {
        st.values.set(edit.key, edit.expression);
        if (edit.note) st.notes.set(`value:${edit.key}`, edit.note);
        else st.notes.delete(`value:${edit.key}`);
      }
      st.lastPush = 0;
      save();
      st.lastPush = 0;
      st.notice = t("Imported {count} value edit(s).", { count: edits.length });
      rerender();
    } catch (error) {
      st.notice = errorText2(error);
      rerender();
    }
  };
  const exportTable = async (format, documentation = false) => {
    try {
      const rules = parseMappings(element.mappings);
      const extension = format === "markdown" ? "md" : format;
      await platform2.ui.saveFile(
        `fhir-mapping.${extension}`,
        format === "html" ? "text/html" : format === "csv" ? "text/csv" : "text/markdown",
        async () => documentation ? mappingDocumentation(element, rules, format) : mappingTable(rules, format)
      );
    } catch (error) {
      st.notice = errorText2(error);
      rerender();
    }
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
  React.useEffect(() => {
    if (!st.fullScreen) return void 0;
    const onKey = (e) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector(".suggest-widget.visible, .mapper-expression-editing, [role=menu]")) return;
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
      const index = await fetchElements(platform2, version, profiles, url);
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
          let t2 = makeTree(index, local);
          let nodes = t2.chain(prefix);
          if (!nodes) {
            const parentNodes = t2.chain(parts.slice(0, i - 1).join("."));
            const parent = parentNodes && parentNodes[parentNodes.length - 1];
            if (parent && parent.typeUrl) {
              await fetchSd(platform2, version, profiles, parent.typeUrl);
              t2 = makeTree(index, local);
              nodes = t2.chain(prefix);
            }
          }
          if (!nodes) found = false;
          else if (i < parts.length) st.expanded.add(prefix);
        }
        if (!found) unresolved.push(key);
      }
      for (let round = 0; round < 4; round++) {
        const t2 = makeTree(index, local);
        const urls = /* @__PURE__ */ new Set();
        const walk = (node, depth) => {
          for (const d of t2.children(node) || []) {
            if (Number(d.min) < 1 || d.instance) continue;
            const kids = t2.children(d);
            if (kids === null && d.typeUrl) urls.add(d.typeUrl);
            else if (kids && depth < 6) walk(d, depth + 1);
          }
        };
        for (const key of allKeys()) {
          const nodes = t2.chain(key);
          if (nodes) for (const n of nodes.slice(0, -1)) walk(n, 0);
        }
        if (!urls.size) break;
        await Promise.all([...urls].map((u) => fetchSd(platform2, version, profiles, u).catch(() => null)));
      }
      const sdVersion = index.sd.version || "";
      if (sameProfile && element.profileVersion && sdVersion && element.profileVersion !== sdVersion) {
        st.versionNotice = t("The profile is now version {p0}; these mappings were made with version {p1}. Check them (elements no longer in the profile are listed).", { p0: sdVersion, p1: element.profileVersion });
      }
      if (sameProfile) {
        st.unresolved = unresolved;
        const before = parseMappings(element.mappings).filter((e) => "fixed" in e).length;
        const now = compiled(index, local);
        if (!unresolved.length && JSON.parse(now).filter((e) => "fixed" in e).length > before) {
          element.mappings = now;
          st.notice = t("Fixed values of required elements were added to the mappings.");
          onChange();
        }
      } else {
        for (const key of unresolved) forget(key);
        if (unresolved.length) st.notice = t("Not in this profile, removed: {p0}.", { p0: unresolved.join(", ") });
      }
      if (!sameProfile) {
        element.profileUrl = url;
        element.profileVersion = index.sd.version || "";
        element.resourceType = index.sd.type;
        element.mappings = compiled(index, local);
        onChange();
      }
    } catch (e) {
      st.error = errorText2(e);
    } finally {
      st.loading = false;
      st.current = snapshot(st);
      rerender();
    }
  };
  React.useEffect(() => {
    if (element.profileUrl && (!element.context || st.settingsReady)) load(element.profileUrl);
  }, [st, element.context ? st.settingsReady : true]);
  const scriptFor = React.useRef({ source: null, timer: null });
  React.useEffect(() => {
    const source = JSON.stringify(element);
    if (source === scriptFor.current.source) return void 0;
    clearTimeout(scriptFor.current.timer);
    scriptFor.current.timer = setTimeout(async () => {
      try {
        const text2 = await platform2.api.post(`${MAPPER_API3}/script`, source, { contentType: "text/plain", raw: true });
        const result = JSON.parse(text2);
        const errors = (result.errors || []).map((e) => `// ${e.key ? `${e.key}: ` : ""}${e.message}`).join("\n");
        Object.defineProperty(element, "script", { value: (errors ? errors + "\n" : "") + (result.script || ""), enumerable: false, writable: true, configurable: true });
        scriptFor.current.source = source;
      } catch {
      }
    }, 800);
    return void 0;
  });
  React.useEffect(() => () => clearTimeout(scriptFor.current.timer), []);
  const loadProfileList = async () => {
    try {
      const text2 = await platform2.api.get(`${MAPPER_API3}/profiles`, { fhirVersion: version, profiles }, { raw: true });
      st.profileList = JSON.parse(text2);
      st.error = "";
    } catch (e) {
      st.error = errorText2(e);
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
        st.error = t("{p0}: {p1}", { p0: node.typeUrl, p1: errorText2(e) });
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
  const duplicate = (node) => {
    const count = tree.children(node.parent).filter((sibling) => sibling.keyBase === node.keyBase).length;
    if (!node.repeats || st.iterations.has(node.key) || node.max !== "*" && count >= Number(node.max)) return;
    const target = `${node.keyBase}[${count}]`;
    duplicateBranch(st, node.key, target);
    st.instances.set(node.keyBase, count + 1);
    st.expanded.add(target);
    st.selectedKey = target;
    st.lastPush = 0;
    save();
    st.lastPush = 0;
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
  const previewSelection = (scope) => {
    if (scope !== "transformer") return { step: { ...element, samples: "[]" } };
    const steps = mapperPreviewSteps(platform2, element);
    if (!steps) throw new Error(t("The current transformer cannot be identified."));
    return { steps };
  };
  const testOn = async (sample, trace, scope = sample.scope || st.previewScope) => {
    try {
      const text2 = await platform2.api.post(`${MAPPER_API3}/test`, JSON.stringify({ ...previewSelection(scope), message: sample.message, dataType: sample.dataType || "HL7V2", trace }), {
        contentType: "text/plain",
        raw: true,
        timeoutMs: 6e4
      });
      return JSON.parse(text2);
    } catch (e) {
      const message = errorText2(e);
      return { output: null, issues: [], errors: [{ key: null, line: null, message: e?.status === 403 || /Test FHIR mapper steps/.test(message) ? t("Testing a step runs its code on the server, like a deployed channel: it requires the permission “Test FHIR mapper steps”.") : message }] };
    }
  };
  const runTest = async () => {
    st.testing = true;
    st.testResult = null;
    st.suite = null;
    rerender();
    st.testResult = await testOn(st.sample, st.traceOptions, st.previewScope);
    st.testing = false;
    rerender();
  };
  const samples = stepSamples(element);
  const activeSample = samples.find((s) => s.id === st.activeSample) || null;
  const writeSamples = (next) => {
    element.samples = JSON.stringify(next);
    onChange();
    rerender();
  };
  const updateActive = (patch) => {
    if (activeSample) writeSamples(samples.map((s) => s.id === activeSample.id ? { ...s, ...patch } : s));
  };
  const selectSample = (id) => {
    st.activeSample = id || null;
    const chosen = samples.find((s) => s.id === id);
    if (chosen) {
      st.sample = { message: chosen.message, dataType: chosen.dataType || "HL7V2" };
      st.previewScope = chosen.scope || "step";
    }
    st.testResult = null;
    rerender();
  };
  const saveAsSample = async () => {
    const ask = platform2.ui?.promptDialog;
    const name = ask ? await ask(t("Save the sample with the step"), t("Name"), t("Sample {count}", { count: samples.length + 1 })) : t("Sample {count}", { count: samples.length + 1 });
    if (!name || !String(name).trim()) return;
    const id = crypto.randomUUID();
    st.activeSample = id;
    writeSamples([...samples, { id, name: String(name).trim(), dataType: st.sample.dataType, message: st.sample.message, scope: st.previewScope, expected: null }]);
  };
  const runAllSamples = async () => {
    st.testing = true;
    st.suite = [];
    st.testResult = null;
    rerender();
    for (const sample of samples) {
      const result = await testOn(sample, { enabled: false }, sample.scope || "step");
      const verdict = sampleVerdict(sample, result);
      const invalid = result.issues.some((i) => i.severity === "error" || i.severity === "fatal");
      st.suite.push({
        id: sample.id,
        name: sample.name,
        ok: !result.errors.length && !invalid && verdict !== false,
        detail: result.errors.length ? result.errors[0].message : invalid ? t("invalid FHIR result") : verdict === false ? t("differs from the expected result") : verdict === true ? t("matches the expected result") : t("runs (no expected result)")
      });
      rerender();
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
      const text2 = await platform2.api.post(`${MAPPER_API3}/script`, JSON.stringify(element), { contentType: "text/plain", raw: true });
      st.scriptResult = JSON.parse(text2);
    } catch (e) {
      st.scriptResult = { script: "", errors: [{ key: null, line: null, message: errorText2(e) }] };
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
    const server = txServer.trim();
    const source = `${server}|${profiles}|${version}`;
    if (st.conceptMaps && st.conceptMaps.source === source) return;
    try {
      const text2 = await platform2.api.get(`${MAPPER_API3}/conceptMaps`, { server, profiles, fhirVersion: version }, { raw: true });
      st.conceptMaps = { source, list: JSON.parse(text2) };
      st.error = "";
    } catch (e) {
      st.conceptMaps = { source, list: [] };
      st.error = errorText2(e);
    }
    rerender();
  };
  const testTranslation = async (node) => {
    const t2 = st.translations.get(node.key);
    const test = st.tests.get(node.key) || {};
    test.result = "…";
    st.tests.set(node.key, test);
    rerender();
    try {
      const text2 = await platform2.api.get(
        `${MAPPER_API3}/translate`,
        { server: txServer, profiles, conceptMap: t2.conceptMap, system: t2.source || "", code: test.code || "", targetSystem: t2.target || "", fhirVersion: version },
        { raw: true }
      );
      const match = JSON.parse(text2);
      test.result = match ? t("→ {p0}{p1}", { p0: [match.system, match.code].filter(Boolean).join("|"), p1: match.display ? ` (${match.display})` : "" }) : t("→ no match (then the rule chosen for no match)");
    } catch (e) {
      test.result = errorText2(e);
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
  const stepRefs = (() => {
    const found = mapperContext(platform2, element);
    return found ? found.steps.filter((s, i) => i !== found.index && s.__type === MAPPER_TYPE && String(s.refName || "").trim()).map((s) => ({ step: s.name, expression: String(s.refName).trim(), resourceType: s.resourceType })) : [];
  })();
  const bindingCodes = (node) => node?.binding && (st.codes ||= /* @__PURE__ */ new Map()).get(node.binding.valueSet)?.codes || [];
  const ensureCodes = (node) => {
    if (!node?.binding) return;
    const known = st.codes ||= /* @__PURE__ */ new Map();
    if (known.has(node.binding.valueSet)) return;
    known.set(node.binding.valueSet, { codes: [] });
    platform2.api.get(`${MAPPER_API3}/catalog/expand`, { valueSet: node.binding.valueSet, filter: "", fhirVersion: version, profiles }, { raw: true }).then((text2) => {
      known.set(node.binding.valueSet, JSON.parse(text2));
      rerender();
    }).catch(() => {
    });
  };
  const valuedPaths = (() => {
    const serialized = st.sample.dataType === "HL7V2" ? st.serialized : st.sample;
    const values = {};
    if (serialized) {
      for (const f of sourcePaths(sourceTree(serialized))) {
        if (f.value !== null && f.value !== "" && f.path !== "msg") values[f.path.replace(/\['((?:[^'\\]|\\.)*)'\]/g, (_, key) => `[${JSON.stringify(key)}]`)] = f.value;
      }
    }
    return values;
  })();
  const completionFor = (node, role = "value") => ({
    ...completionContext(node, st.iterations, Object.keys(valuedPaths), role),
    pathValues: valuedPaths,
    e4x: st.sample.dataType !== "JSON",
    refs: stepRefs,
    codes: role === "value" ? bindingCodes(node) : [],
    bindingStrength: node?.binding?.strength
  });
  const errorsByKey = /* @__PURE__ */ new Map();
  for (const error of [...st.testResult?.errors || [], ...st.scriptResult?.errors || []]) {
    if (error.key && diagnosticHere(error)) errorsByKey.set(error.key, [...errorsByKey.get(error.key) || [], error.message]);
  }
  const field = (label, control, hint) => h("div", { className: "field" }, h("label", null, label), control, hint ? h("div", { className: "hint" }, hint) : null);
  const number = (prop, fallback) => h("input", {
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
  const text = (prop, placeholder, code) => h(code ? ExpressionField : "input", {
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
  let searchBudget = 2e3;
  let searchTruncated = false;
  const searchCache = /* @__PURE__ */ new Map();
  const matches = (node, depth = 0) => {
    if (node.key.toLowerCase().includes(term)) return true;
    if (depth >= 4) return false;
    const cacheKey = `${depth}:${node.key}`;
    if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);
    const children = tree.children(node) || [];
    if (children.some((child) => child.key.toLowerCase().includes(term))) {
      searchCache.set(cacheKey, true);
      return true;
    }
    if (searchBudget-- <= 0) {
      searchTruncated = true;
      return false;
    }
    for (let parent = node.parent; parent; parent = parent.parent) if (node.typeUrl && parent.typeUrl === node.typeUrl) return false;
    const found = children.some((child) => matches(child, depth + 1));
    searchCache.set(cacheKey, found);
    return found;
  };
  if (term && st.selectedKey && tree) for (const node of (tree.chain(st.selectedKey) || []).slice(1).reverse()) matches(node);
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
    return h(
      "span",
      { className: "mapper-tree-guides", "aria-hidden": true },
      levels.map((depth) => h("i", { key: depth, style: { left: `${depth * 20 + 11}px` } })),
      levels.length ? h("b", { style: { left: `${(auxiliary ? node.depth + 1 : node.depth) * 20 - 9}px` } }) : null
    );
  };
  const blocked = st.loading || st.unresolved.length > 0;
  const addNode = (child, list) => {
    if (!visible(child)) return;
    rows.push(row(child, list));
    if (st.iterations.has(child.key)) rows.push(iterationRow(child));
    if (st.conditions.has(child.key)) rows.push(conditionRow(child));
    if (st.translations.has(child.key)) rows.push(translationRow(child));
    if (st.ruleDetails === child.key) rows.push(ruleDetailsRow(child));
    if (opened(child)) addRows(child);
  };
  const addRows = (node) => {
    const list = tree.children(node);
    if (list === null) {
      rows.push(h("tr", { key: node.key + "/loading" }, h("td", { colSpan: 3, style: { paddingLeft: `${(node.depth + 1) * 20 + 26}px` } }, guides(node, true), h("span", { className: "text-text-faint" }, t("Loading…")))));
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
    const types = node.types.map((t2) => shortType(t2.code) + (t2.profile ? ` (${t2.profile.map((p) => p.slice(p.lastIndexOf("/") + 1)).join(", ")})` : "")).join(" | ");
    const placeholder = node.fixed ? `${node.fixed.kind}: ${fixedText(node.fixed)}` : node.choice ? t("choose a type below") : node.binding ? t("{strength} binding: {valueSet}", { strength: node.binding.strength, valueSet: node.binding.valueSet.replace(/\|.*$/, "").split("/").pop() }) : "";
    const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
    const tool = (label, title, onClick, active) => h("button", { type: "button", className: "btn btn-sm", style: { flex: "none", padding: "0 6px", fontWeight: active ? 700 : 400, borderColor: active ? "var(--accent, #2563eb)" : void 0 }, title, disabled: blocked, onClick }, label);
    return h(
      "tr",
      {
        key: node.key,
        className: [open ? "mapper-node-open" : "", errorsByKey.has(node.key) ? "mapper-node-error" : "", st.selectedKey === node.key ? "mapper-node-selected" : ""].filter(Boolean).join(" ") || void 0,
        "data-depth": node.depth,
        ref: diagnosticRef(node.key, "value"),
        onFocus: () => selectNode(node),
        onClick: () => selectNode(node),
        onContextMenu: (event) => nodeMenu(event, node),
        onKeyDown: (event) => {
          if (event.key === "ContextMenu" || event.shiftKey && event.key === "F10") nodeMenu(event, node);
        },
        title: errorsByKey.has(node.key) ? t("{p0}: {p1}", { p0: node.key, p1: errorsByKey.get(node.key).join(" · ") }) : node.short ? t("{p0}: {p1}", { p0: node.key, p1: node.short }) : node.key
      },
      h(
        "td",
        { style: { paddingLeft: `${node.depth * 20}px` } },
        guides(node),
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "4px", minWidth: 0 } },
          h(
            "button",
            {
              type: "button",
              className: "btn btn-sm",
              "aria-expanded": canExpand ? open : void 0,
              "aria-label": t("{p0} {p1}", { p0: open ? "Collapse" : "Expand", p1: node.key }),
              style: { flex: "none", visibility: canExpand ? "visible" : "hidden", minWidth: "22px", padding: "0 4px" },
              onClick: () => toggle(node)
            },
            open ? "▾" : "▸"
          ),
          h("button", {
            type: "button",
            className: "mapper-node-label mapper-select",
            "aria-label": t("Inspect {p0}", { p0: node.key }),
            "aria-pressed": st.selectedKey === node.key,
            style: { ...ellipsis, minWidth: 0, fontWeight: node.mustSupport || open ? 600 : 400 },
            onClick: () => selectNode(node)
          }, node.label + (node.instance ? ` [${node.instance}]` : "")),
          h("span", { className: "text-text-faint", style: { flex: "none", fontSize: "11px" } }, t("{p0}..{p1}", { p0: node.min ?? 0, p1: node.max ?? "*" })),
          node.mustSupport ? h("span", { title: t("Must Support"), style: { flex: "none", color: "var(--warn, #c2410c)", fontSize: "11px" } }, t("S")) : null,
          h("a", {
            className: "mapper-help",
            href: mapperHelpUrl(version, element.resourceType, node.key),
            target: "_blank",
            rel: "noopener noreferrer",
            title: t("Official FHIR definition"),
            "aria-label": t("FHIR help for {p0}", { p0: node.key })
          }, "?")
        )
      ),
      h("td", { className: "text-text-faint", style: { ...ellipsis, fontSize: "11px" }, title: types }, types),
      h(
        "td",
        null,
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "4px", minWidth: 0 } },
          node.choice ? h("span", { className: "text-text-faint", style: { ...ellipsis, flex: "1 1 auto", fontSize: "11px" } }, placeholder) : h(ExpressionField, {
            errors: errorsByKey.get(node.key),
            onEdit: () => ensureCodes(node),
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
          canAdd ? tool("+", t("Add an entry"), () => addInstance(node), false) : null,
          node.instance && node.instance === count - 1 ? tool("−", t("Remove this entry and its mappings"), () => removeInstance(node), false) : null,
          canIterate ? tool("↻", t("One entry for each item of a list (for each repetition)"), () => toggleIteration(node), iterated) : null,
          canTranslate ? tool("⇄", t("Translate the value with ConceptMap/$translate"), () => toggleTranslation(node), st.translations.has(node.key)) : null,
          node.choice ? null : tool("?", t("Only map this element (and what is below it) when a condition holds"), () => toggleCondition(node), st.conditions.has(node.key)),
          ruleDetailsButton(node),
          menuButton(node)
        )
      )
    );
  };
  const subRow = (node, suffix, children) => h("tr", { key: `${node.key}/${suffix}`, ref: diagnosticRef(node.key, suffix), "data-owner": node.key }, h("td", { colSpan: 3, style: { paddingLeft: `${node.depth * 20 + 34}px` } }, guides(node, true), h("div", { style: { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" } }, children)));
  const mono = { fontFamily: "monospace", fontSize: "12px" };
  const rulesAt = (node) => parseMappings(element.mappings).filter((rule) => (rule.key || rule.element) === node.key);
  const selectNode = (node) => {
    if (st.selectedKey !== node.key) {
      st.selectedKey = node.key;
      rerender();
    }
  };
  const ruleDetailsButton = (node) => rulesAt(node).length ? h("button", {
    type: "button",
    className: "btn btn-sm",
    disabled: blocked,
    "aria-label": t("Rule details for {p0}", { p0: node.key }),
    "aria-expanded": st.ruleDetails === node.key,
    onClick: () => {
      st.ruleDetails = st.ruleDetails === node.key ? null : node.key;
      rerender();
    }
  }, st.disabled.size && rulesAt(node).some((rule) => st.disabled.has(mapperRuleKey(rule))) ? t("Rules (disabled)") : t("Rules")) : null;
  const ruleDetailsFields = (node) => rulesAt(node).map((rule) => {
    const key = mapperRuleKey(rule);
    const kind = "each" in rule ? t("Iteration") : "condition" in rule ? t("Condition") : "fixed" in rule ? t("Fixed value") : t("Value");
    return h(
      "div",
      { key, style: { flex: "1 1 100%", padding: "4px 0" } },
      h("label", null, h("input", {
        type: "checkbox",
        checked: !st.disabled.has(key),
        disabled: blocked,
        "aria-label": t("Enable {p0} rule for {p1}", { p0: kind.toLowerCase(), p1: node.key }),
        onChange: (e) => {
          if (e.target.checked) st.disabled.delete(key);
          else st.disabled.add(key);
          st.lastPush = 0;
          save();
          st.lastPush = 0;
          rerender();
        }
      }), t(" {p0} rule", { p0: kind }), st.disabled.has(key) ? t(" — disabled (kept, not executed)") : ""),
      h("textarea", {
        value: st.notes.get(key) || "",
        disabled: blocked,
        rows: 2,
        placeholder: t("Rule note…"),
        "aria-label": t("Note for {p0} rule for {p1}", { p0: kind.toLowerCase(), p1: node.key }),
        style: { display: "block", width: "100%", marginTop: "4px" },
        onChange: (e) => {
          if (e.target.value) st.notes.set(key, e.target.value);
          else st.notes.delete(key);
          save();
          rerender();
        }
      })
    );
  });
  const ruleDetailsRow = (node) => subRow(node, "rules", ruleDetailsFields(node));
  const iterationFields = (node) => {
    const it = st.iterations.get(node.key);
    const variable = (it.variable || "item").trim() || "item";
    return [
      h("span", { key: "l", title: node === tree.root ? t("One resource for each item") : t("One entry of this element for each item") }, node === tree.root ? t("↻ One resource for each") : t("↻ For each")),
      h(ExpressionField, { key: "e", completionContext: completionFor(node, "iteration"), value: it.expression, disabled: blocked, placeholder: "msg['PID']['PID.3']", style: { ...mono, flex: "1 1 240px" }, onChange: (e) => setIteration(node, "expression", e.target.value) }),
      h("span", { key: "a" }, t("as")),
      h("input", { key: "v", type: "text", value: it.variable, disabled: blocked, style: { ...mono, width: "90px" }, onChange: (e) => setIteration(node, "variable", e.target.value) }),
      h("span", { key: "h", className: "text-text-faint", style: { fontSize: "11px" } }, t("below: {p0} (the item), {p1}Index (0, 1, …); fields dragged in are rewritten to {p2}[…]", { p0: variable, p1: variable, p2: variable }))
    ];
  };
  const iterationRow = (node) => subRow(node, "each", iterationFields(node));
  const conditionFields = (node) => [
    h("span", { key: "l", title: t("What is below this element is only mapped when the condition holds") }, node === tree.root ? t("? Only make the resource if") : t("? Only if")),
    h(ExpressionField, {
      completionContext: completionFor(node, "condition"),
      key: "c",
      type: "text",
      value: st.conditions.get(node.key) || "",
      disabled: blocked,
      placeholder: st.iterations.has(node.key) ? t("{p0}['PID.3.5'].toString() == 'PI'", { p0: (st.iterations.get(node.key).variable || "item").trim() }) : "msg['PID']['PID.8']['PID.8.1'].toString() != ''",
      style: { ...mono, flex: "1 1 300px" },
      onChange: (e) => setCondition(node, withSubstitution(node, st.conditions.get(node.key) || "", e.target.value))
    }),
    h("span", { key: "h", className: "text-text-faint", style: { fontSize: "11px" } }, st.iterations.has(node.key) ? t("per item: keeps the items it holds for") : t("false, or an error on a missing segment: nothing below"))
  ];
  const conditionRow = (node) => subRow(node, "condition", conditionFields(node));
  const translationFields = (node, listId = "fhir-profile-mapper-conceptmaps") => {
    const t2 = st.translations.get(node.key);
    const test = st.tests.get(node.key) || {};
    const allMaps = st.conceptMaps?.list || [];
    const recommended = matchingConceptMaps(allMaps, {
      source: t2.source,
      target: t2.target,
      valueSet: node.binding?.valueSet,
      systems: bindingCodes(node).map((code) => code.system).filter(Boolean)
    });
    const maps = st.allConceptMaps ? allMaps : recommended;
    const localTx = isLocalServer(txServer);
    const needsValue = t2.unmapped === "fixed" || t2.unmapped === "function";
    return [
      h("span", { key: "l", title: localTx ? t("ConceptMap/$translate locally, on the ConceptMaps of the Profile Packages") : t("ConceptMap/$translate on the terminology server") }, localTx ? t("⇄ ConceptMap (local)") : t("⇄ ConceptMap")),
      h("input", {
        key: "m",
        type: "text",
        list: listId,
        value: t2.conceptMap,
        disabled: blocked,
        placeholder: t("canonical URL of the ConceptMap"),
        style: { ...mono, flex: "1 1 220px" },
        "aria-label": t("ConceptMap for {p0}", { p0: node.key }),
        onFocus: () => {
          loadConceptMaps();
          ensureCodes(node);
        },
        onChange: (e) => setTranslation(node, "conceptMap", e.target.value)
      }),
      h("datalist", { key: "d", id: listId }, maps.map((m) => h("option", { key: m.url, value: m.url }, m.title || m.name || m.url))),
      h("label", { key: "all", className: "hint" }, h("input", {
        type: "checkbox",
        checked: !!st.allConceptMaps,
        onChange: (event) => {
          st.allConceptMaps = event.target.checked;
          loadConceptMaps();
          rerender();
        }
      }), t(" All ConceptMaps ({p0} matching)", { p0: recommended.length })),
      h("input", { key: "s", type: "text", value: t2.source, disabled: blocked, placeholder: t("source system (optional)"), title: t("system of the source code"), style: { ...mono, flex: "1 1 160px" }, onChange: (e) => setTranslation(node, "source", e.target.value) }),
      h("input", { key: "t", type: "text", value: t2.target, disabled: blocked, placeholder: t("target system (optional)"), title: t("targetsystem of $translate"), style: { ...mono, flex: "1 1 140px" }, onChange: (e) => setTranslation(node, "target", e.target.value) }),
      h(
        "select",
        { key: "u", value: t2.unmapped || "none", disabled: blocked, title: t("When $translate gives no match"), onChange: (e) => setTranslation(node, "unmapped", e.target.value) },
        h("option", { value: "none" }, t("no match: leave empty")),
        h("option", { value: "source" }, t("no match: keep the source code")),
        h("option", { value: "fixed" }, t("no match: fixed value")),
        h("option", { value: "function" }, t("no match: expression")),
        h("option", { value: "error" }, t("no match: error"))
      ),
      node.code === "CodeableConcept" ? h(
        "label",
        { key: "k", className: "check", title: t("Add the source code as a second coding") },
        h("input", { type: "checkbox", checked: !!t2.keepSource, disabled: blocked, onChange: (e) => setTranslation(node, "keepSource", e.target.checked) }),
        t(" + source coding")
      ) : null,
      needsValue ? h(t2.unmapped === "function" ? ExpressionField : "input", {
        completionContext: t2.unmapped === "function" ? completionFor(node, "translation") : void 0,
        key: "f",
        type: "text",
        value: t2.value || "",
        disabled: blocked,
        placeholder: t2.unmapped === "fixed" ? t("code or system|code") : "myFunction(code, system)",
        title: t2.unmapped === "fixed" ? t("The value for codes without a match: a code, or system|code") : t("JavaScript with code and system (the source code and its system), e.g. a code template function; gives a code, system|code or {system, code, display}, or null for no value"),
        style: { ...mono, flex: "1 1 180px" },
        onChange: (e) => setTranslation(node, "value", e.target.value)
      }) : null,
      h("input", {
        key: "c",
        type: "text",
        value: test.code || "",
        placeholder: t("code"),
        title: t("a source code to try"),
        style: { ...mono, width: "70px" },
        onChange: (e) => {
          st.tests.set(node.key, { ...test, code: e.target.value });
          rerender();
        }
      }),
      h("button", { key: "b", type: "button", className: "btn btn-sm", disabled: !t2.conceptMap || !test.code, onClick: () => testTranslation(node) }, t("Test")),
      test.result ? h("span", { key: "r", className: "text-text-faint", style: { fontSize: "11px" } }, test.result) : null
    ];
  };
  const translationRow = (node) => subRow(node, "translate", translationFields(node));
  const branchRules = (node) => parseMappings(element.mappings).filter((rule) => inBranch(rule.key || rule.element || "", node.key));
  const nodeMenu = (event, node) => {
    selectNode(node);
    const rules = branchRules(node);
    const enable = rules.length > 0 && rules.every((rule) => st.disabled.has(mapperRuleKey(rule)));
    const count = node.parent ? tree.children(node.parent)?.filter((sibling) => sibling.keyBase === node.keyBase).length : 0;
    const action = (label, onClick, disabled = false) => ({ label, onClick, disabled: blocked || disabled });
    showContextMenu(platform2, event, [
      action(t("Inspect element"), () => {
        st.selectedKey = node.key;
        rerender();
      }),
      action(t("Add an entry"), () => addInstance(node), !node.repeats || st.iterations.has(node.key) || node.max !== "*" && count >= Number(node.max)),
      action(t("Duplicate branch"), () => duplicate(node), !node.repeats || st.iterations.has(node.key) || !rules.length || node.max !== "*" && count >= Number(node.max)),
      action(t("Toggle iteration"), () => toggleIteration(node), !(node.repeats && !node.choice) && !(node.resourceRoot && !createBundle && bundle)),
      action(t("Toggle condition"), () => toggleCondition(node), !!node.choice),
      action(t("Toggle translation"), () => toggleTranslation(node), !TRANSLATABLE.has(node.code)),
      action(enable ? t("Enable branch rules") : t("Disable branch rules"), () => {
        for (const rule of rules) {
          const key = mapperRuleKey(rule);
          if (enable) st.disabled.delete(key);
          else st.disabled.add(key);
        }
        st.lastPush = 0;
        save();
        st.lastPush = 0;
        rerender();
      }, !rules.length),
      action(t("Copy branch as JSON"), async () => {
        try {
          await navigator.clipboard.writeText(JSON.stringify(rules, null, 2));
        } catch (error) {
          st.error = errorText2(error);
          rerender();
        }
      }, !rules.length)
    ]);
  };
  const menuButton = (node) => h("button", {
    type: "button",
    className: "btn btn-sm",
    "aria-label": t("Actions for {p0}", { p0: node.key }),
    "aria-haspopup": "menu",
    disabled: blocked || !platform2.ui?.contextMenu,
    onClick: (event) => nodeMenu(event, node)
  }, "⋯");
  const createBundle = element.action === "createBundle";
  const declarations = mapperBundleDeclarations(platform2, element);
  const targets = parseMappings(element.bundleTargets);
  const bundle = createBundle || targets.length > 0;
  const updateTarget = (name, change) => {
    const next = change === null ? targets.filter((t2) => t2.name !== name) : targets.some((t2) => t2.name === name) ? targets.map((t2) => t2.name === name ? { ...t2, ...change } : t2) : [...targets, { name, ...change }];
    element.bundleTargets = JSON.stringify(next);
    onChange();
    rerender();
  };
  if (tree) {
    const rootTool = (label, title, onClick, active) => h("button", { type: "button", className: "btn btn-sm", style: { marginLeft: "6px", padding: "0 6px", fontWeight: active ? 700 : 400, borderColor: active ? "var(--accent, #2563eb)" : void 0 }, title, disabled: blocked, onClick }, label);
    rows.push(
      h(
        "tr",
        {
          key: tree.root.key,
          ref: diagnosticRef(tree.root.key, "value"),
          onFocus: () => selectNode(tree.root),
          onClick: () => selectNode(tree.root),
          onContextMenu: (event) => nodeMenu(event, tree.root),
          onKeyDown: (event) => {
            if (event.key === "ContextMenu" || event.shiftKey && event.key === "F10") nodeMenu(event, tree.root);
          }
        },
        h(
          "td",
          { colSpan: 3 },
          h("button", { type: "button", className: "mapper-node-label mapper-select", "aria-label": t("Inspect {p0}", { p0: tree.root.key }), "aria-pressed": st.selectedKey === tree.root.key, onClick: () => selectNode(tree.root) }, tree.root.label),
          h("span", { className: "text-text-faint", style: { marginLeft: "8px" } }, st.rootIndex.sd.url + (st.rootIndex.sd.version ? ` | ${st.rootIndex.sd.version}` : "")),
          bundle && !createBundle ? rootTool("↻", t("One resource for each item of a list (e.g. each OBX)"), () => toggleIteration(tree.root), st.iterations.has(tree.root.key)) : null,
          rootTool("?", t("Only make the resource when a condition holds"), () => toggleCondition(tree.root), st.conditions.has(tree.root.key)),
          ruleDetailsButton(tree.root),
          menuButton(tree.root)
        )
      )
    );
    if (st.iterations.has(tree.root.key)) rows.push(iterationRow(tree.root));
    if (st.conditions.has(tree.root.key)) rows.push(conditionRow(tree.root));
    if (st.ruleDetails === tree.root.key) rows.push(ruleDetailsRow(tree.root));
    rowGroups.push(h("tbody", { key: "root" }, rows.splice(0)));
    const children = tree.children(tree.root);
    if (children) for (const child of children) {
      if (!visible(child)) continue;
      addNode(child, children);
      const grouped = st.expanded.has(child.key) || st.iterations.has(child.key) || st.conditions.has(child.key) || st.translations.has(child.key);
      rowGroups.push(h("tbody", { key: child.key, className: grouped ? "mapper-branch-open" : void 0, "aria-label": child.key }, rows.splice(0)));
    }
  }
  const treeKeys = (e) => {
    if (!e.altKey || !["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const row2 = e.target.closest?.("tr");
    if (!row2) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const toggleButton = row2.querySelector("button[aria-label^='Expand '], button[aria-label^='Collapse ']");
      if (toggleButton && toggleButton.getAttribute("aria-expanded") === "true" === (e.key === "ArrowLeft")) toggleButton.click();
      return;
    }
    const rows2 = [...row2.closest("table").querySelectorAll("tbody tr")].filter((r) => r.querySelector("[role=combobox], .mapper-expression-editing"));
    const next = rows2[rows2.indexOf(row2) + (e.key === "ArrowDown" ? 1 : -1)];
    next?.querySelector("[role=combobox]")?.focus();
  };
  const sourcePane = () => {
    const serialized = st.sample.dataType === "HL7V2" ? st.serialized : st.sample;
    const fields = serialized ? sourcePaths(sourceTree(serialized)).filter((f) => f.value !== null && f.value !== "" && f.path !== "msg") : [];
    const filter = (st.sourceFilter || "").toLowerCase();
    const shown = fields.filter((f) => !filter || `${f.path} ${f.value}`.toLowerCase().includes(filter)).slice(0, 300);
    const accessor = (f) => st.sample.dataType === "JSON" ? f.path : `${f.path}.toString()`;
    return h(
      "details",
      { className: "mapper-source-pane", open: !!st.sourceOpen, onToggle: (e) => {
        if (st.sourceOpen !== e.currentTarget.open) {
          st.sourceOpen = e.currentTarget.open;
          rerender();
        }
      }, style: { marginBottom: "8px" } },
      h(
        "summary",
        { style: { cursor: "pointer" } },
        t("Sample fields ({p0})", { p0: fields.length }),
        h("span", { className: "hint text-text-faint", style: { marginLeft: "8px", fontSize: "11px" } }, t("values of the sample message of the Test tab — click to insert into the field being edited, or drag onto a field"))
      ),
      st.sourceOpen ? h(
        "div",
        null,
        h("input", {
          type: "search",
          value: st.sourceFilter || "",
          placeholder: t("Filter fields and values…"),
          "aria-label": t("Filter sample fields"),
          style: { width: "260px", margin: "6px 0", height: "26px", minHeight: "26px", padding: "2px 8px" },
          onChange: (e) => {
            st.sourceFilter = e.target.value;
            rerender();
          }
        }),
        fields.length ? h(
          "div",
          { className: "border border-line rounded", style: { maxHeight: "220px", overflow: "auto" } },
          h("table", { className: "dt", style: { width: "100%", tableLayout: "fixed" } }, h("tbody", null, shown.map((f) => h(
            "tr",
            {
              key: f.path,
              draggable: true,
              style: { cursor: "grab" },
              title: accessor(f),
              onDragStart: (e) => {
                e.dataTransfer.effectAllowed = "copy";
                e.dataTransfer.setData("text/plain", accessor(f));
                e.dataTransfer.setData("application/x-oie-accessor", accessor(f));
              },
              onMouseDown: (e) => {
                if (activeExpressionEditor) e.preventDefault();
              },
              onClick: () => {
                if (activeExpressionEditor) activeExpressionEditor.insert(accessor(f));
                else navigator.clipboard?.writeText(accessor(f)).then(() => platform2.ui?.toast?.("Path copied: click a field first to insert it directly.", "info"), () => {
                });
              }
            },
            h("td", { style: { fontFamily: "monospace", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "60%" } }, f.path.replace(/^msg/, "")),
            h("td", { style: { fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, f.value)
          ))))
        ) : h("div", { className: "hint" }, t("No field: paste a sample message in the Test tab (HL7 v2 is read by the server)."))
      ) : null
    );
  };
  const check = tree ? completeness(tree, parseMappings(element.mappings)) : { required: [], mustSupport: [] };
  const entryKey = (k) => k === "Bundle.entry" || k.startsWith("Bundle.entry.") || k.startsWith("Bundle.entry:");
  if (createBundle) {
    check.required = check.required.filter((k) => k !== "Bundle.type" && !entryKey(k));
    check.mustSupport = check.mustSupport.filter((k) => !entryKey(k));
  }
  const entryNote = createBundle && tree ? h("div", { className: "hint", style: { marginTop: "6px" } }, t("Bundle.entry is filled by the resource steps that select this Bundle in “Add to Bundles”.")) : null;
  const testResult = st.testResult;
  const profileOptions = (st.profileList || []).map((p) => h("option", { key: p.url, value: p.url }, t("{p0} ({p1})", { p0: p.title || p.name || p.url, p1: p.type })));
  const propertiesPanel = h(
    React.Fragment,
    null,
    h(
      "div",
      { className: "mapper-settings" },
      field(
        t("Action"),
        h(
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
          h("option", { value: "createBundle" }, t("Create a Bundle")),
          h("option", { value: "resource" }, t("Build a resource"))
        ),
        t("Bundles are named and created explicitly; results are completed after the last FHIR mapper.")
      ),
      createBundle ? field(t("Bundle Name"), text("bundleName", "labo"), t("Internal name used by resource steps; separate from the FHIR id and profile URL.")) : null,
      h("div", { className: "mapper-wide" }, field(
        t("FHIR context"),
        h(
          "select",
          { value: element.context || "", "aria-label": t("FHIR context"), onChange: (e) => setContext(e.target.value) },
          h("option", { value: "" }, t("(none: this step's own packages and terminology server)")),
          (cachedFhirSettings()?.contexts || []).map((c) => h("option", { key: c.name, value: c.name }, t("{p0} — {p1}, {p2}", { p0: c.name, p1: c.fhirVersion, p2: (c.packages || []).join("; ") || t("no package") }))),
          element.context && !shared && st.settingsReady ? h("option", { value: element.context }, t("{p0} (not defined on this server)", { p0: element.context })) : null
        ),
        shared ? t("Packages: {p0} · terminology: {p1} · validation: {p2}. Defined in Settings › FHIR Mapper.", { p0: (shared.packages || []).join("; ") || t("none"), p1: shared.terminologyServer || t("local"), p2: shared.validation }) : t("A context of Settings › FHIR Mapper gives the packages, the terminology server and the validation policy to every step that names it.")
      )),
      field(
        t("FHIR Version"),
        h(
          "select",
          {
            disabled: !!shared,
            value: version,
            onChange: (e) => {
              element.fhirVersion = e.target.value;
              onChange();
              rerender();
            }
          },
          ["R4", "R4B", "R5"].map((v) => h("option", { key: v, value: v }, v))
        )
      ),
      shared ? null : field(t("Profile Packages"), text("profiles", "/profiles"), t("Server-side profile files or folders, separated by ';'.")),
      h(
        "div",
        { className: "mapper-wide" },
        field(
          t("Target Profile"),
          h(
            "div",
            { className: "mapper-actions" },
            h("input", {
              type: "text",
              list: "fhir-profile-mapper-profiles",
              placeholder: t("Canonical URL of the profile, or a resource type (Patient)"),
              value: element.profileUrl ?? "",
              onFocus: () => {
                if (st.profileList === null && profiles) loadProfileList();
              },
              onChange: (e) => {
                element.profileUrl = e.target.value;
                rerender();
              }
            }),
            h("datalist", { id: "fhir-profile-mapper-profiles" }, profileOptions),
            h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !element.profileUrl, onClick: () => load(element.profileUrl.trim()) }, st.loading ? t("Loading…") : t("Load")),
            h("button", { type: "button", className: "btn btn-sm", disabled: !profiles, onClick: loadProfileList }, t("List profiles"))
          ),
          t("Loading another profile keeps the mappings of the elements it also has.")
        )
      ),
      shared ? null : h(
        "div",
        { className: "mapper-wide" },
        field(
          t("Terminology Server"),
          text("terminologyServer", t("n/a")),
          t("Empty or n/a: translate locally using Profile Packages. Otherwise, enter the terminology server URL as reached by OIE.")
        )
      ),
      shared ? null : h(
        "details",
        { className: "mapper-wide" },
        h("summary", { className: "text-text-faint", style: { cursor: "pointer", fontSize: "12px" } }, t("Terminology server options")),
        h(
          "div",
          { className: "mapper-settings", style: { marginTop: "8px" } },
          h("div", { className: "mapper-wide" }, field(t("Authorization"), text("terminologyAuthorization", "'Bearer ' + $cfg('tx.token')", true), t("JavaScript expression of the Authorization header; empty for none."))),
          field(t("Cache (seconds)"), number("terminologyCacheSeconds", 300), t("How long answers of the server are reused; 0 for not at all.")),
          field(t("Timeout (seconds)"), number("terminologyTimeoutSeconds", 10), t("How long to wait for the server."))
        )
      ),
      h(
        React.Fragment,
        null,
        createBundle ? field(
          t("Bundle Type"),
          h("select", {
            value: element.bundleType || "transaction",
            disabled: !!st.rootIndex?.byId.get("Bundle.type")?.fixedCode,
            onChange: (e) => {
              element.bundleType = e.target.value;
              onChange();
              rerender();
            }
          }, ["transaction", "batch", "collection", "document", "message"].map((v) => h("option", { key: v, value: v }, v))),
          t("Defines the Bundle and its entry rules. A fixed type in the target profile takes precedence.")
        ) : null,
        createBundle || !bundle ? field(
          t("Result destination"),
          h("select", {
            value: element.variable ? "variable" : "message",
            onChange: (e) => {
              element.variable = e.target.value === "variable" ? element.bundleName ? `bundle_${element.bundleName}` : "resourceResult" : "";
              onChange();
              rerender();
            }
          }, h("option", { value: "message" }, t("Outbound message")), h("option", { value: "variable" }, t("Channel map variable"))),
          createBundle ? t("The completed Bundle is published here after the configured checks of all named Bundles.") : t("Destination of this standalone resource.")
        ) : null,
        (createBundle || !bundle) && element.variable ? field(t("Variable name"), text("variable", "bundleDocument"), t("FHIR JSON in the channel map; use it from another destination.")) : null,
        !createBundle ? h(
          "section",
          { className: "mapper-wide bundle-routing", "aria-label": t("Add to Bundles") },
          h("div", { className: "bundle-routing-title" }, t("Add to Bundles")),
          h("div", { className: "hint" }, t("Build this resource once, then add the same resource to each selected Bundle. Leave all unchecked for a standalone result.")),
          targets.length ? field(t("Reference Name"), text("refName", "'patient'", true), t("Common to the selected Bundles. fhirRef(name) must resolve to the same resource in these Bundles.")) : null,
          !declarations.length && !targets.length ? h("div", { className: "hint", style: { marginTop: "8px" } }, t("Create a Bundle earlier in this transformer to select it here.")) : null,
          [...declarations, ...targets.filter((t2) => !declarations.some((b) => b.bundleName === t2.name)).map((t2) => ({ bundleName: t2.name }))].map((b) => {
            const target = targets.find((t2) => t2.name === b.bundleName);
            const request2 = target && ["transaction", "batch"].includes(b.bundleType);
            return h(
              "div",
              { key: b.bundleName, className: "bundle-target", "data-bundle": b.bundleName },
              h(
                "label",
                { className: "bundle-choice" },
                h("input", { type: "checkbox", checked: !!target, onChange: (e) => updateTarget(b.bundleName, e.target.checked ? { requestMethod: "POST", requestUrl: "", ifNoneExist: "" } : null) }),
                b.bundleName,
                h("span", { className: "hint" }, b.bundleType || t("not declared earlier"))
              ),
              b.name ? h("div", { className: "hint" }, t("Created by step “{p0}”.", { p0: b.name })) : null,
              request2 ? h(
                "div",
                { className: "bundle-request" },
                field(t("Method"), h(
                  "select",
                  { value: target.requestMethod || "POST", onChange: (e) => updateTarget(b.bundleName, { requestMethod: e.target.value }) },
                  ["POST", "PUT", "PATCH", "DELETE", "GET", "HEAD"].map((v) => h("option", { key: v, value: v }, v))
                )),
                field(t("Request URL"), h(ExpressionField, { completionContext: completionFor(tree?.root, "reference"), value: target.requestUrl || "", placeholder: t("Empty: the resource type or type/id"), onChange: (e) => updateTarget(b.bundleName, { requestUrl: e.target.value }), style: mono }))
              ) : null,
              request2 && (!target.requestMethod || target.requestMethod === "POST") ? field(t("If-None-Exist"), h(ExpressionField, { completionContext: completionFor(tree?.root, "reference"), value: target.ifNoneExist || "", placeholder: "'identifier=' + ...", onChange: (e) => updateTarget(b.bundleName, { ifNoneExist: e.target.value }), style: mono }), t("Conditional creation for this Bundle entry.")) : null,
              target && !request2 ? h("div", { className: "hint", style: { marginTop: "8px" } }, b.bundleType ? t("No request for a {p0} Bundle.", { p0: b.bundleType }) : t("This Bundle must be created earlier in the transformer.")) : null
            );
          })
        ) : null
      ),
      h(
        "div",
        { className: "mapper-wide" },
        field(
          t("Options"),
          h(
            "div",
            { className: "mapper-checks" },
            h(
              "label",
              { className: "check" },
              h("input", {
                type: "checkbox",
                checked: asBool(element.addMetaProfile, true),
                onChange: (e) => {
                  element.addMetaProfile = e.target.checked;
                  onChange();
                  rerender();
                }
              }),
              t(" Add the profile to meta.profile")
            ),
            h(
              "label",
              { className: "check" },
              bundle && !createBundle ? t("Validate this preview ") : t("Validate FHIR output "),
              h(
                "select",
                {
                  "aria-label": t("Validation"),
                  style: { width: "auto" },
                  value: element.validation || (asBool(element.validateOutput, true) ? "always" : "off"),
                  onChange: (e) => {
                    element.validation = e.target.value;
                    element.validateOutput = e.target.value !== "off";
                    element.formatVersion = 2;
                    onChange();
                    rerender();
                  }
                },
                element.context ? h("option", { value: "inherit" }, t("as the context says{p0}", { p0: shared ? ` (${shared.validation})` : "" })) : null,
                h("option", { value: "always" }, t("always")),
                h("option", { value: "off" }, t("off"))
              ),
              bundle && !createBundle ? t(" (final validation is set on each Bundle)") : null
            ),
            h(
              "label",
              { className: "check" },
              h("input", {
                type: "checkbox",
                checked: asBool(element.setLastUpdated, false),
                onChange: (e) => {
                  element.setLastUpdated = e.target.checked;
                  onChange();
                  rerender();
                }
              }),
              t(" Set meta.lastUpdated")
            )
          )
        )
      ),
      h(
        "div",
        { className: "mapper-wide" },
        field(
          t("Trace"),
          h(
            "div",
            { className: "mapper-checks" },
            h(
              "label",
              { className: "check" },
              h("input", {
                type: "checkbox",
                checked: asBool(element.traceMessages, false),
                onChange: (e) => {
                  element.traceMessages = e.target.checked;
                  if (!e.target.checked) element.traceCaptureValues = false;
                  onChange();
                  rerender();
                }
              }),
              t(" Trace processed messages")
            ),
            h(
              "label",
              { className: "check", title: t("Also record the scalar values of this step's rules (256 characters per value). They may contain patient data.") },
              h("input", {
                type: "checkbox",
                checked: asBool(element.traceCaptureValues, false),
                disabled: !asBool(element.traceMessages, false),
                onChange: (e) => {
                  element.traceCaptureValues = e.target.checked;
                  onChange();
                  rerender();
                }
              }),
              t(" Include scalar values")
            )
          ),
          t("Each message processed by the deployed channel keeps this step's events, and the finalization of its Bundles, in the connector map (fhirMapperTrace). Off by default; redeploy to apply.")
        )
      )
    ),
    h(
      "div",
      { className: "mapper-wide" },
      h(
        "div",
        { className: "mapper-actions" },
        h("button", { type: "button", className: "btn btn-sm", disabled: !tree, onClick: importTable }, t("Import value table")),
        h("button", { type: "button", className: "btn btn-sm", onClick: () => exportTable("csv") }, t("Export CSV table")),
        h("button", { type: "button", className: "btn btn-sm", onClick: () => exportTable("markdown") }, t("Export Markdown table")),
        h("button", { type: "button", className: "btn btn-sm", onClick: () => exportTable("markdown", true) }, t("Export Markdown documentation")),
        h("button", { type: "button", className: "btn btn-sm", onClick: () => exportTable("html", true) }, t("Export HTML documentation"))
      ),
      h("p", { className: "hint" }, t("Tables edit value expressions and notes only. Other rules remain in the step. Empty expressions remove their value mapping."))
    ),
    h(
      "details",
      { style: { marginTop: "10px" } },
      h("summary", { style: { cursor: "pointer" } }, t("Edit as JSON")),
      h("div", { className: "hint", style: { margin: "6px 0" } }, t("The whole step — properties and rules — as text: copy it to another step or channel, paste a mapping written by hand or by an AI agent, or make bulk edits. Validate and apply compiles it on the server first.")),
      h(
        "div",
        { className: "mapper-actions" },
        h("button", { type: "button", className: "btn btn-sm", onClick: () => {
          st.jsonDraft = JSON.stringify(element, null, 2);
          rerender();
        } }, t("Read current step")),
        h("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !st.jsonDraft.trim(), onClick: async () => {
          try {
            const next = mapperJsonImport(element, st.jsonDraft);
            const result = JSON.parse(await platform2.api.post(`${MAPPER_API3}/script`, JSON.stringify(next), { contentType: "text/plain", raw: true }));
            if (result.errors?.length) throw new Error(result.errors.map((e) => e.message).join("\n"));
            Object.assign(element, next);
            state.current = null;
            onChange();
            rerender();
          } catch (error) {
            st.error = errorText2(error);
            rerender();
          }
        } }, t("Validate and apply"))
      ),
      h(CodeBox, {
        value: st.jsonDraft,
        language: "json",
        height: "260px",
        label: t("Step mapping JSON"),
        onChange: (text2) => {
          if (text2 !== st.jsonDraft) {
            st.jsonDraft = text2;
            rerender();
          }
        }
      }),
      h("div", { className: "hint" }, t("Applies to this step only; its OIE sequence and enabled state are preserved. Save the channel to persist changes."))
    )
  );
  const messages = h(
    React.Fragment,
    null,
    st.error ? h("div", { className: "hint", style: { color: "var(--err, #b91c1c)", marginTop: "6px" } }, st.error) : null,
    st.notice ? h("div", { className: "hint", style: { color: "var(--warn, #b45309)", marginTop: "6px" } }, st.notice) : null,
    st.versionNotice ? h(
      "div",
      { className: "hint", style: { color: "var(--warn, #b45309)", marginTop: "6px" } },
      st.versionNotice + " ",
      h(
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
        t("Checked")
      )
    ) : null,
    st.unresolved.length ? h(
      "div",
      { className: "hint", style: { color: "var(--warn, #b45309)", marginTop: "6px" } },
      t("Cannot find these mapped elements in the profile (editing is blocked so they are not lost): {p0}. ", { p0: st.unresolved.join(", ") }),
      h("button", { type: "button", className: "btn btn-sm", onClick: removeUnresolved }, t("Remove these mappings"))
    ) : null
  );
  const fullTree = tree ? makeTree(st.rootIndex, { ...ctx, showAll: true }) : null;
  const loadExtensions = async () => {
    if (st.extensions) return;
    try {
      const text2 = await platform2.api.get(`${MAPPER_API3}/catalog`, { kind: "extension", context: element.context || "", fhirVersion: version, profiles }, { raw: true });
      if (state.current !== st) return;
      st.extensions = JSON.parse(text2);
    } catch (error) {
      st.error = errorText2(error);
    }
    rerender();
  };
  const addCatalogExtension = async (container, url) => {
    if (!url || blocked) return;
    try {
      const nodes = (fullTree.children(container) || []).filter((node2) => node2.jsonName === "extension" && !node2.sliceName && node2.max !== "0");
      if (!nodes.length || nodes[0].el.slicing?.rules === "closed") return;
      let node = nodes.find((candidate) => ![...allKeys()].some((key2) => inBranch(key2, candidate.key)));
      if (!node && nodes[0].max !== "*" && nodes.length >= Number(nodes[0].max)) throw new Error(t("No extension occurrence is available."));
      if (!sdLoaded.has(sdKey(version, profiles, nodes[0].typeUrl))) await fetchSd(platform2, version, profiles, nodes[0].typeUrl);
      if (state.current !== st) return;
      const key = node ? node.key : `${nodes[0].keyBase}[${nodes.length}]`;
      if (!node) st.instances.set(nodes[0].keyBase, nodes.length + 1);
      st.values.set(`${key}.url`, JSON.stringify(url));
      st.showAll = true;
      st.search = "";
      st.filter = "all";
      st.expanded.add(container.key);
      st.expanded.add(key);
      st.selectedKey = key;
      st.lastPush = 0;
      save();
      st.lastPush = 0;
      rerender();
    } catch (error) {
      st.error = errorText2(error);
      rerender();
    }
  };
  const extensionPanel = (node) => {
    const declared = profileExtensions(fullTree, node);
    const generic = (fullTree.children(node) || []).find((child) => child.jsonName === "extension" && !child.sliceName && child.max !== "0");
    if (!declared.length && !generic) return null;
    const open = generic && generic.el.slicing?.rules !== "closed";
    return h(
      "section",
      { "aria-label": t("Extensions") },
      h("h4", null, t("Extensions")),
      declared.length ? h(
        "select",
        {
          "aria-label": t("Profile extension"),
          value: "",
          disabled: blocked,
          onChange: (event) => {
            const key = event.target.value;
            if (key) {
              revealDiagnostic({ key });
              st.expanded.add(key);
              rerender();
            }
          }
        },
        h("option", { value: "" }, t("Choose an extension of the profile…")),
        declared.map((item) => h("option", { key: item.key, value: item.key }, t("{p0} — {p1}", { p0: item.label, p1: item.url })))
      ) : null,
      open ? h(
        "div",
        null,
        h("button", { type: "button", className: "btn btn-sm", disabled: blocked, onClick: loadExtensions }, t("List context extensions")),
        st.extensions ? h(
          "select",
          {
            "aria-label": t("Add context extension"),
            value: "",
            disabled: blocked,
            onChange: (event) => addCatalogExtension(node, event.target.value)
          },
          h("option", { value: "" }, st.extensions.length ? t("Add an extension by URL…") : t("No extension in this context")),
          st.extensions.map((item) => h("option", { key: item.url, value: item.url }, t("{p0} — {p1}", { p0: item.title || item.name || item.url, p1: item.url })))
        ) : null
      ) : null
    );
  };
  const selectedChain = fullTree && st.selectedKey ? fullTree.chain(st.selectedKey) : null;
  const selected = selectedChain?.[selectedChain.length - 1];
  const inspector = () => h(
    Inspector,
    {
      key: selected?.key || "empty",
      h,
      node: selected,
      extensions: selected ? extensionPanel(selected) : null,
      helpUrl: selected ? mapperHelpUrl(version, element.resourceType, selected.key) : "",
      diagnostics: selected ? [...st.testResult?.errors || [], ...st.scriptResult?.errors || []].filter((error) => error.key === selected.key).map((error, index) => diagnosticView(error, index)) : []
    },
    selected ? h(
      "div",
      { className: "mapper-inspector-rules" },
      !selected.resourceRoot && !selected.choice ? field(t("Expression"), h(ExpressionField, {
        "aria-label": t("Inspector expression for {p0}", { p0: selected.key }),
        value: st.values.get(selected.key) || "",
        completionContext: completionFor(selected),
        errors: errorsByKey.get(selected.key),
        onEdit: () => ensureCodes(selected),
        disabled: blocked || createBundle && selected.key === "Bundle.type",
        onChange: (e) => setValue(selected, withSubstitution(selected, st.values.get(selected.key) || "", e.target.value))
      })) : null,
      st.iterations.has(selected.key) ? h("div", { className: "mapper-inspector-fields" }, iterationFields(selected)) : null,
      st.conditions.has(selected.key) ? h("div", { className: "mapper-inspector-fields" }, conditionFields(selected)) : null,
      st.translations.has(selected.key) ? h("div", { className: "mapper-inspector-fields" }, translationFields(selected, "fhir-inspector-conceptmaps")) : null,
      ruleDetailsFields(selected),
      !rulesAt(selected).length ? h("p", { className: "hint" }, t("No saved rule for this element.")) : null
    ) : null
  );
  const mapperPanel = tree ? h(
    "div",
    null,
    h(
      "div",
      { className: "mapper-toolbar" },
      h("span", { className: "text-text-faint" }, t("Show")),
      h(
        "select",
        {
          value: st.filter,
          onChange: (e) => {
            st.filter = e.target.value;
            rerender();
          }
        },
        h("option", { value: "all" }, t("All elements")),
        h("option", { value: "mustSupport" }, t("Must Support and required")),
        h("option", { value: "mapped" }, t("Mapped only"))
      ),
      h(
        "label",
        { className: "check", title: t("Also show extension, modifierExtension and id of every element (to add an extension the profile does not have)") },
        h("input", {
          type: "checkbox",
          checked: st.showAll,
          onChange: (e) => {
            st.showAll = e.target.checked;
            rerender();
          }
        }),
        t(" extensions & ids")
      ),
      h("input", {
        type: "search",
        value: st.search || "",
        placeholder: t("Search elements…"),
        "aria-label": t("Search elements"),
        style: { width: "180px", flex: "none", height: "26px", minHeight: "26px", padding: "2px 8px" },
        onChange: (e) => {
          st.search = e.target.value;
          rerender();
        }
      }),
      h("button", { type: "button", className: "btn btn-sm", title: t("Expand the mapped elements"), onClick: () => {
        for (const key of allKeys()) {
          const parts = key.split(".");
          for (let i = 1; i < parts.length; i++) st.expanded.add(parts.slice(0, i).join("."));
        }
        rerender();
      } }, t("Expand mapped")),
      h("button", { type: "button", className: "btn btn-sm", title: t("Collapse every element"), onClick: () => {
        st.expanded = /* @__PURE__ */ new Set([tree.root.key]);
        rerender();
      } }, t("Collapse all")),
      h("button", { type: "button", className: "btn btn-sm", title: t("Undo the last change of the mappings"), disabled: !(st.undo || []).length || blocked, onClick: () => travel(st.undo, st.redo) }, t("↶ Undo")),
      h("button", { type: "button", className: "btn btn-sm", title: t("Redo"), disabled: !(st.redo || []).length || blocked, onClick: () => travel(st.redo, st.undo) }, t("↷ Redo")),
      h("span", { className: "hint text-text-faint", style: { fontSize: "11px" } }, t("Click a field to edit it with completion. {p0}: functions, scoped variables and sample paths. ↑/↓ to choose, Enter/Tab to insert, Esc to close. Guard optional values.", { p0: COMPLETION_HINT }))
    ),
    sourcePane(),
    searchTruncated ? h("p", { className: "hint" }, t("Search is limited to part of the loaded tree. Select a branch or narrow the search.")) : null,
    h(
      "div",
      { className: "mapper-workspace" },
      h(
        "div",
        { className: "dt-wrap border border-line rounded", style: { maxHeight: "none", overflowX: "auto", overflowY: "visible" }, onKeyDownCapture: treeKeys },
        h(
          "table",
          { className: "dt mapper-tree", style: { tableLayout: "fixed", width: "100%", minWidth: "720px" } },
          h("colgroup", null, h("col", { style: { width: "36%" } }), h("col", { style: { width: "14%" } }), h("col", { style: { width: "50%" } })),
          h("thead", null, h("tr", null, h("th", null, t("Element")), h("th", null, t("Type")), h("th", null, t("Mapping")))),
          rowGroups
        )
      ),
      inspector()
    ),
    check.required.length || check.mustSupport.length ? h(
      "div",
      { className: "hint", style: { marginTop: "6px" } },
      check.required.length ? h("div", { style: { color: "var(--err, #b91c1c)" } }, t("Required, not mapped: {p0}", { p0: check.required.join(", ") })) : null,
      check.mustSupport.length ? h("div", { style: { color: "var(--warn, #b45309)" } }, t("Must Support, not mapped: {p0}", { p0: check.mustSupport.join(", ") })) : null
    ) : h("div", { className: "hint", style: { marginTop: "6px", color: "var(--ok, #15803d)" } }, t("Every required element below the mapped ones has a mapping or a fixed value.")),
    entryNote
  ) : h("div", { className: "hint" }, st.loading ? t("Loading the target profile…") : t("Load a target profile in Properties to map its elements."));
  const testPanel = tree ? h(
    "div",
    null,
    h(
      "div",
      { style: { display: "flex", gap: "6px", alignItems: "center", margin: "6px 0" } },
      h(
        "select",
        {
          style: { width: "auto", flex: "none" },
          value: st.sample.dataType,
          onChange: (e) => {
            st.sample.dataType = e.target.value;
            if (activeSample) updateActive({ dataType: e.target.value });
            else saveSample();
            rerender();
          }
        },
        ["HL7V2", "XML", "JSON", "RAW"].map((v) => h("option", { key: v, value: v }, v))
      ),
      h(
        "select",
        {
          style: { width: "auto", flex: "none", maxWidth: "260px" },
          value: activeSample ? activeSample.id : "",
          "aria-label": t("Sample"),
          title: t("Samples saved with the step"),
          onChange: (e) => selectSample(e.target.value)
        },
        h("option", { value: "" }, t("(unsaved sample, this browser)")),
        samples.map((s) => h("option", { key: s.id, value: s.id }, s.name + (s.expected ? " ✓" : "")))
      ),
      h(
        "select",
        {
          value: st.previewScope,
          "aria-label": t("Preview scope"),
          style: { width: "auto", flex: "none" },
          disabled: st.testing,
          onChange: (e) => {
            st.previewScope = e.target.value;
            st.testResult = null;
            if (activeSample) updateActive({ scope: st.previewScope });
            rerender();
          }
        },
        h("option", { value: "step" }, t("This step only")),
        h("option", { value: "transformer", disabled: !mapperContext(platform2, element) }, t("Profile Mapper steps of this transformer"))
      ),
      h("button", { type: "button", className: "btn btn-sm", disabled: st.testing || !st.sample.message.trim(), onClick: runTest }, st.testing ? t("Running…") : t("Run")),
      !activeSample ? h("button", { type: "button", className: "btn btn-sm", disabled: !st.sample.message.trim(), title: t("Keep this message in the step, so it is saved with the channel"), onClick: saveAsSample }, t("Save as sample")) : null,
      activeSample ? h("button", { type: "button", className: "btn btn-sm", title: t("Remove this sample from the step"), onClick: () => {
        st.activeSample = null;
        writeSamples(samples.filter((s) => s.id !== activeSample.id));
      } }, t("Delete sample")) : null,
      samples.length ? h("button", { type: "button", className: "btn btn-sm", disabled: st.testing, title: t("Run every saved sample and compare with its expected result"), onClick: runAllSamples }, t("Run all ({p0})", { p0: samples.length })) : null,
      h("button", { type: "button", className: "btn btn-sm", onClick: showScript }, st.scriptResult ? t("Hide the script") : t("Generated script")),
      h("span", { className: "text-text-faint", style: { fontSize: "11px" } }, st.previewScope === "transformer" ? t("Runs enabled Profile Mapper steps in order, with real references and Bundle finalization. Other step types are excluded.") : t("Runs this step on the server and validates what it makes; fhirRef() of earlier steps gives stand-ins."))
    ),
    h(
      "div",
      { style: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "6px" } },
      h("label", null, h("input", {
        type: "checkbox",
        checked: st.traceOptions.enabled,
        onChange: (e) => {
          st.traceOptions.enabled = e.target.checked;
          if (!e.target.checked) st.traceOptions.captureValues = false;
          rerender();
        }
      }), t(" Trace")),
      h(
        "label",
        { title: t("Explicitly include scalar values in the trace and its JSON export (256 characters per value).") },
        h("input", {
          type: "checkbox",
          checked: st.traceOptions.captureValues,
          disabled: !st.traceOptions.enabled,
          onChange: (e) => {
            st.traceOptions.captureValues = e.target.checked;
            rerender();
          }
        }),
        t(" Include scalar values")
      ),
      h("label", null, t("Max events "), h("input", {
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
    h(CodeBox, {
      value: st.sample.message,
      language: languageOf(st.sample.dataType),
      height: "170px",
      label: t("Sample message"),
      onChange: (text2) => {
        if (text2 === st.sample.message) return;
        st.sample.message = text2;
        if (activeSample) updateActive({ message: text2 });
        else saveSample();
        rerender();
      }
    }),
    st.suite ? h(
      "table",
      { className: "dt", style: { margin: "8px 0", width: "100%" }, "aria-label": t("Results of the saved samples") },
      h("tbody", null, st.suite.map((r) => h(
        "tr",
        { key: r.id, style: { cursor: "pointer" }, onClick: () => selectSample(r.id) },
        h("td", { style: { width: "70px", color: r.ok ? "var(--ok, #15803d)" : "var(--err, #b91c1c)", fontWeight: 600 } }, r.ok ? t("passed") : t("failed")),
        h("td", null, r.name),
        h("td", { className: "text-text-faint" }, r.detail)
      )))
    ) : null,
    testResult ? h(
      "div",
      { style: { marginTop: "6px" } },
      testResult.errors.map((e, i) => diagnosticView(e, `e${i}`)),
      testResult.steps ? h(
        "details",
        { open: true },
        h("summary", null, t("Produced resources by step")),
        testResult.steps.map((result, i) => h(
          "details",
          { key: i },
          h("summary", null, `${result.step.sequenceNumber} · ${result.step.name || result.step.resourceType} (${result.resources.length})`),
          result.resources.map((resource, j) => h("pre", { key: j, style: { maxHeight: "300px", overflow: "auto", whiteSpace: "pre-wrap" } }, prettyJson(resource)))
        ))
      ) : null,
      Object.keys(testResult.variables || {}).length ? h(
        "details",
        { open: true },
        h("summary", null, t("Published channel variables")),
        Object.entries(testResult.variables).map(([name, value]) => h(
          "details",
          { key: name },
          h("summary", null, name),
          h("pre", { style: { maxHeight: "360px", overflow: "auto", whiteSpace: "pre-wrap" } }, prettyJson(value))
        ))
      ) : null,
      testResult.trace ? h(
        "details",
        { style: { marginTop: "8px" } },
        h(
          "summary",
          { style: { cursor: "pointer" } },
          t("Execution trace: {p0} event(s){p1}", { p0: testResult.trace.events.length, p1: testResult.trace.truncated ? " — truncated" : "" })
        ),
        h("button", { type: "button", className: "btn btn-sm", onClick: () => downloadMapperTrace(testResult.trace) }, t("Export trace JSON")),
        h("div", { className: "hint" }, testResult.trace.captureValues ? t("Scalar values included.") : t("Runtime values not captured.")),
        h(
          "ol",
          { style: { maxHeight: "360px", overflow: "auto", fontSize: "12px" } },
          traceRows(testResult.trace).map(({ event, label, duration, iterations }, index) => h(
            "li",
            { key: index, style: { margin: "6px 0" } },
            h("strong", null, t("{p0} · {p1}", { p0: label, p1: event.status })),
            h("span", { style: { marginLeft: "6px" } }, duration),
            event.key && tree && diagnosticHere({ step: testResult.trace.steps?.find((step) => String(step.sequenceNumber) === String(event.step)) || testResult.trace.step }) ? h("button", { type: "button", className: "btn btn-sm", onClick: () => revealDiagnostic({ ...event, step: testResult.trace.steps?.find((step) => String(step.sequenceNumber) === String(event.step)) || testResult.trace.step }) }, t("Go to rule")) : null,
            iterations ? h("div", null, iterations) : null,
            event.reason ? h("div", null, event.reason) : null,
            event.count !== void 0 ? h("div", null, t("{p0} item(s)", { p0: event.count })) : null,
            event.value ? h("pre", { style: { whiteSpace: "pre-wrap", margin: "4px 0" } }, JSON.stringify(event.value)) : null
          ))
        )
      ) : null,
      testResult.output !== null && testResult.output !== void 0 ? h(
        "div",
        null,
        h(
          "div",
          { style: { fontSize: "12px", margin: "4px 0", color: testResult.issues.some((i) => i.severity === "error" || i.severity === "fatal") ? "var(--err, #b91c1c)" : "var(--ok, #15803d)" } },
          testResult.validationPerformed === false ? t("FHIR validation disabled.") : testResult.issues.length ? t("{p0} validation issue(s):", { p0: testResult.issues.length }) : t("Valid.")
        ),
        testResult.issues.map((i, n) => h("div", { key: `i${n}`, style: { fontSize: "11px", fontFamily: "monospace" } }, t("{p0} {p1}: {p2}", { p0: i.severity, p1: i.location, p2: i.message }))),
        activeSample ? h(
          "div",
          { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", margin: "6px 0" } },
          sampleVerdict(activeSample, testResult) === true ? h("strong", { style: { color: "var(--ok, #15803d)" } }, t("Matches the expected result.")) : null,
          sampleVerdict(activeSample, testResult) === false ? h("strong", { style: { color: "var(--err, #b91c1c)" } }, t("Differs from the expected result.")) : null,
          h(
            "button",
            { type: "button", className: "btn btn-sm", title: t("Random identities (urn:uuid) and meta.lastUpdated are ignored when comparing"), onClick: () => updateActive({ expected: testResult.output }) },
            activeSample.expected ? t("Replace the expected result with this one") : t("Use this result as expected")
          ),
          activeSample.expected ? h("button", { type: "button", className: "btn btn-sm", onClick: () => updateActive({ expected: null }) }, t("Clear the expected result")) : null
        ) : null,
        activeSample && sampleVerdict(activeSample, testResult) === false ? h(ResultDiff, { expected: normalizeResult(activeSample.expected), actual: normalizeResult(testResult.output) }) : null,
        h(CodeBox, { value: prettyJson(testResult.output), language: String(testResult.output).trim().startsWith("<") ? "xml" : "json", readOnly: true, height: "360px", label: t("Result") })
      ) : null
    ) : null,
    st.scriptResult ? h(
      "div",
      { style: { marginTop: "6px" } },
      st.scriptResult.errors.map((e, i) => diagnosticView(e, `s${i}`)),
      h(CodeBox, { value: st.scriptResult.script || "", language: "javascript", readOnly: true, height: "360px", label: t("Generated script") })
    ) : null
  ) : h("div", { className: "hint" }, st.loading ? t("Loading the target profile…") : t("Load a target profile in Properties to test this step."));
  const tabs = [
    { id: "properties", label: t("Properties"), panel: propertiesPanel },
    {
      id: "mapper",
      label: t("Mapper"),
      panel: mapperPanel,
      badge: check.required.length ? { text: String(check.required.length), title: t("{p0} required element(s) not mapped", { p0: check.required.length }) } : null
    },
    {
      id: "test",
      label: t("Test"),
      panel: testPanel,
      badge: testResult?.errors?.length ? { text: "!", title: t("The last test failed") } : null
    }
  ];
  const current2 = tabs.find((t2) => t2.id === st.tab) || tabs[0];
  const tabKeys = (e) => {
    const index = tabs.indexOf(current2);
    const next = e.key === "ArrowRight" ? (index + 1) % tabs.length : e.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    st.tab = tabs[next].id;
    rerender();
    e.currentTarget.querySelectorAll("[role=tab]")[next]?.focus();
  };
  return h(
    "div",
    { className: "fhir-profile-mapper" + (st.fullScreen ? " mapper-fullscreen" : "") },
    h(
      "div",
      { className: "mapper-tabs", role: "tablist", "aria-label": t("FHIR mapper sections"), onKeyDown: tabKeys },
      tabs.map((t2) => h("button", {
        key: t2.id,
        id: `${tabId}-${t2.id}`,
        type: "button",
        role: "tab",
        "aria-selected": t2 === current2,
        "aria-controls": `${tabId}-panel`,
        tabIndex: t2 === current2 ? 0 : -1,
        onClick: () => {
          st.tab = t2.id;
          rerender();
        }
      }, t2.label, t2.badge ? h("span", { className: "mapper-tab-badge", title: t2.badge.title }, t2.badge.text) : null)),
      h("span", { style: { marginLeft: "auto", alignSelf: "center", marginRight: "6px", display: "inline-flex" } }, h(HelpButton, { key: current2.id, ...MAPPER_HELP[current2.id] || MAPPER_HELP.mapper })),
      h(
        "button",
        { type: "button", className: "btn btn-sm", style: { alignSelf: "center" }, title: t("Edit this step on the whole page (Esc to come back)"), onClick: toggleFullScreen },
        st.fullScreen ? t("Exit full screen (Esc)") : t("⤢ Full screen")
      )
    ),
    messages,
    h("div", { className: "mapper-tab-panel", id: `${tabId}-panel`, role: "tabpanel", "aria-labelledby": `${tabId}-${current2.id}` }, current2.panel)
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
  bindReact(platform2.React);
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
      formatVersion: 2,
      context: "",
      validation: "always",
      mappings: "[]",
      samples: "[]",
      traceMessages: false,
      traceCaptureValues: false
    }),
    validate: (el) => {
      if (!["createBundle", "resource"].includes(el.action)) return t("Choose the action: create a Bundle or build a resource.");
      if (!el.profileUrl || !String(el.profileUrl).trim()) return t("Choose the target profile.");
      if (!el.resourceType) return t("Load the target profile.");
      if (el.action === "createBundle" && !String(el.bundleName || "").trim()) return t("Give the Bundle a name.");
      if (el.action === "createBundle" && el.resourceType !== "Bundle") return t("Create a Bundle needs a Bundle target profile.");
      const entries = parseMappings(el.mappings);
      const noValue = entries.find((e) => e.translate && (e.translate.unmapped === "fixed" || e.translate.unmapped === "function") && !String(e.translate.value || "").trim());
      if (noValue) return t("The translation of {p0} needs a {p1} for codes without a match.", { p0: noValue.key, p1: noValue.translate.unmapped === "fixed" ? "fixed value" : "expression" });
      const bad = entries.find((e) => typeof e.each === "string" && !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e.variable || ""));
      if (bad) return t("The variable of the iteration on {p0} must be a JavaScript name.", { p0: bad.key });
      if (!(el.action === "createBundle" || parseMappings(el.bundleTargets).length) && entries.some((e) => typeof e.each === "string" && Array.isArray(e.path) && !e.path.length))
        return t("One resource for each item needs a named Bundle target.");
      return "";
    },
    component: ProfileMapperEditor
  });
}
function register(platform2) {
  registerProfileMapper(platform2);
}

// src/fml/language.js
var KEYWORDS = [
  "map",
  "uses",
  "alias",
  "as",
  "imports",
  "group",
  "extends",
  "source",
  "target",
  "queried",
  "produced",
  "where",
  "check",
  "then",
  "default",
  "first",
  "not_first",
  "last",
  "not_last",
  "only_one",
  "share",
  "collate",
  "log",
  "types",
  "type+",
  "conceptmap",
  "prefix",
  "let"
];
var TRANSFORMS = [
  "create",
  "copy",
  "truncate",
  "escape",
  "cast",
  "append",
  "translate",
  "reference",
  "dateOp",
  "uuid",
  "pointer",
  "evaluate",
  "cc",
  "c",
  "qty",
  "id",
  "cp"
];
var FML_LANGUAGE = {
  aliases: ["FHIR Mapping Language", "fml"],
  extensions: [".fml", ".map"],
  configuration: {
    comments: { lineComment: "//", blockComment: ["/*", "*/"] },
    brackets: [["{", "}"], ["(", ")"], ["[", "]"]],
    autoClosingPairs: [{ open: "{", close: "}" }, { open: "(", close: ")" }, { open: "'", close: "'", notIn: ["string"] }, { open: '"', close: '"', notIn: ["string"] }],
    surroundingPairs: [{ open: "{", close: "}" }, { open: "(", close: ")" }, { open: "'", close: "'" }, { open: '"', close: '"' }]
  },
  tokensProvider: {
    keywords: KEYWORDS,
    transforms: TRANSFORMS,
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/\/\*/, "comment", "@comment"],
        [/<<[a-z+]+>>/, "keyword"],
        [/"([^"\\]|\\.)*"\s*;/, "type.identifier"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/'([^'\\]|\\.)*'/, "string"],
        [/->/, "keyword.operator"],
        [/[a-zA-Z_][\w]*(?=\s*\()/, { cases: { "@transforms": "predefined", "@keywords": "keyword", "@default": "identifier" } }],
        [/[a-zA-Z_][\w]*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
        [/\d+(\.\d+)?/, "number"],
        [/[{}()\[\]]/, "@brackets"],
        [/[;,.:=]/, "delimiter"]
      ],
      comment: [[/[^/*]+/, "comment"], [/\*\//, "comment", "@pop"], [/[/*]/, "comment"]]
    }
  }
};
var FML_TEMPLATE = `map "http://example.org/fhir/StructureMap/MyMap" = "MyMap"

uses "http://oie.org/fhir/StructureDefinition/OieMessage" alias OieMessage as source
uses "http://hl7.org/fhir/StructureDefinition/Patient" alias Patient as target

group MyMap(source src : OieMessage, target patient : Patient) {
  src.node as pid where name = 'PID' then {
    pid.node as birth where name = 'PID.7' then {
      birth.node as ts where position = 1 then { ts.value as v -> patient.birthDate = (v.substring(0, 4) & '-' & v.substring(4, 2) & '-' & v.substring(6, 2)) "birthDate"; } "birth-ts";
    } "birth";
  } "pid";
}
`;

// src/fml/completion.js
var KEYWORDS2 = ["map", "uses", "alias", "as", "imports", "group", "extends", "source", "target", "where", "check", "then", "default", "first", "last", "share", "collate", "log"];
var TRANSFORMS2 = ["create", "copy", "truncate", "escape", "cast", "append", "translate", "reference", "dateOp", "uuid", "pointer", "evaluate", "cc", "c", "qty", "id", "cp"];
var FHIRPATH = ["exists", "empty", "first", "last", "where", "select", "all", "count", "toString", "toDecimal", "substring", "length", "startsWith", "contains"];
function fmlCompletions(source, paths = []) {
  const text = String(source || "");
  const items = /* @__PURE__ */ new Map();
  const add = (label, kind, detail, insertText = label) => items.set(`${kind}:${label}`, { label, kind, detail, insertText, sortText: `${kind === "variable" ? "1" : kind === "path" ? "2" : "3"}-${label}` });
  for (const word of KEYWORDS2) add(word, "keyword", "FML keyword");
  for (const word of TRANSFORMS2) add(word, "function", "FML transform", `${word}()`);
  for (const word of FHIRPATH) add(word, "function", "FHIRPath function", `${word}()`);
  for (const match of text.matchAll(/\buses\s+"[^"]+"\s+alias\s+([A-Za-z_]\w*)/g)) add(match[1], "variable", "Structure alias");
  for (const match of text.matchAll(/\bgroup\s+([A-Za-z_]\w*)/g)) add(match[1], "function", "FML group", `${match[1]}()`);
  for (const match of text.matchAll(/\b(?:source|target)\s+([A-Za-z_]\w*)|\bas\s+([A-Za-z_]\w*)/g)) add(match[1] || match[2], "variable", "Map variable");
  for (const path of paths) add(path, "path", "StructureDefinition path", path.split(".").pop());
  return [...items.values()];
}
function fmlSkeleton({ sourceUrl, targetUrl, required = [] }) {
  const source = sourceUrl || "http://oie.org/fhir/StructureDefinition/OieMessage";
  const target = targetUrl || "http://hl7.org/fhir/StructureDefinition/Patient";
  const name = (target.split("/").pop() || "Target").replace(/[^A-Za-z0-9_]/g, "_");
  const reminders = required.length ? required.map((path) => `  // TODO required: ${path}`).join("\n") : "  // Add source -> target rules here.";
  return `map "http://example.org/fhir/StructureMap/${name}Map" = "${name}Map"

uses "${source}" alias Source as source
uses "${target}" alias Target as target

group ${name}Map(source src : Source, target tgt : Target) {
${reminders}
}
`;
}

// src/fml/editor.js
var FML_TYPE = "org.oie.fhir.fml.FhirFmlTransformStep";
var FML_API = "/extensions/fhir-fml";
var DATA_TYPES = ["HL7V2", "XML", "JSON", "RAW", "DELIMITED"];
var React2;
var h2 = (...args) => React2.createElement(...args);
function errorText3(e) {
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
function FmlMapEditor({ value, onChange, problems, completionPaths }) {
  const host = React2.useRef(null);
  const editor = React2.useRef(null);
  const latest = React2.useRef({ onChange, completionPaths, value });
  latest.current = { onChange, completionPaths, value };
  React2.useEffect(() => {
    const ed = createExpressionEditor({
      value,
      language: "fml",
      multiline: true,
      minHeight: "360px",
      ariaLabel: "FML map",
      getItems: () => fmlCompletions(editor.current?.getValue() || latest.current.value, latest.current.completionPaths),
      onChange: (text) => latest.current.onChange(text)
    });
    editor.current = ed;
    host.current.appendChild(ed.el);
    return () => {
      editor.current = null;
      ed.dispose();
    };
  }, []);
  React2.useEffect(() => {
    if (editor.current && editor.current.getValue() !== (value || "")) editor.current.setValue(value || "");
  }, [value]);
  React2.useEffect(() => {
    editor.current?.setMarkers(problems || []);
  }, [problems]);
  return h2("div", { ref: host, className: "fml-map-editor" });
}
function FmlTransformEditor({ element, onChange, platform: platform2 }) {
  const [, rerender] = React2.useReducer((x) => x + 1, 0);
  const state = React2.useRef(null);
  if (state.current === null) {
    const initial = fmlSample(platform2, element);
    let sample = initial.sample;
    try {
      sample = JSON.parse(localStorage.getItem(initial.key) || "null") || sample;
    } catch {
    }
    state.current = {
      tab: "settings",
      maps: null,
      mapErrors: {},
      loading: false,
      loadError: "",
      sampleKey: initial.key,
      sample,
      testing: false,
      result: null,
      skeletonTarget: "http://hl7.org/fhir/StructureDefinition/Patient",
      completionPaths: []
    };
  }
  const st = state.current;
  const set = (prop, value) => {
    element[prop] = value;
    onChange();
    rerender();
  };
  const field = (label, control, hint, wide) => h2("div", { className: wide ? "field fml-wide" : "field" }, h2("label", null, label), control, hint ? h2("div", { className: "hint" }, hint) : null);
  const text = (prop, placeholder) => h2("input", { type: "text", placeholder, value: element[prop] ?? "", onChange: (e) => set(prop, e.target.value) });
  const shared = fhirContext(element.context);
  const version = shared ? shared.fhirVersion : element.fhirVersion || "R4";
  const locations = shared ? (shared.packages || []).join(";") : element.profiles || "";
  React2.useEffect(() => {
    let active = true;
    const done = () => {
      if (active) {
        st.settingsReady = true;
        rerender();
        if (element.context && fhirContext(element.context)) loadMaps(false);
      }
    };
    loadFhirSettings().then(done, done);
    return () => {
      active = false;
    };
  }, []);
  const loadMaps = async (reload) => {
    st.loading = true;
    st.loadError = "";
    rerender();
    try {
      if (reload) await platform2.api.post(`${FML_API}/reload`, "", { contentType: "text/plain", raw: true });
      const answer = JSON.parse(await platform2.api.get(`${FML_API}/maps`, { fhirVersion: version, profiles: locations }, { raw: true }));
      st.maps = answer.maps || [];
      st.mapErrors = answer.errors || {};
    } catch (e) {
      st.maps = null;
      st.loadError = errorText3(e);
    }
    st.loading = false;
    rerender();
  };
  React2.useEffect(() => {
    if (!element.context && (element.profiles || "").trim()) loadMaps(false);
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
      const message = errorText3(e);
      st.result = { model: null, output: null, issues: [], errors: [{ phase: "request", message: e?.status === 403 || /Test FHIR FML transforms/.test(message) ? t("Testing a step requires the permission “Test FHIR FML transforms”.") : message }] };
    }
    st.testing = false;
    rerender();
  };
  const checkMap = async () => {
    st.checking = true;
    rerender();
    try {
      const text2 = await platform2.api.post(
        `${FML_API}/check`,
        JSON.stringify({ mapSource: element.mapSource || "", fhirVersion: version, profiles: locations }),
        { contentType: "text/plain", raw: true, timeoutMs: 12e4 }
      );
      st.check = JSON.parse(text2);
    } catch (e) {
      st.check = { errors: [{ line: 1, column: 1, message: errorText3(e) }] };
    }
    st.checking = false;
    rerender();
  };
  const generateSkeleton = async () => {
    st.generating = true;
    st.skeletonError = "";
    rerender();
    try {
      const target = st.skeletonTarget.trim();
      if (!target) throw new Error(t("Choose the target profile."));
      const text2 = await platform2.api.get(
        "/extensions/fhir-profile-mapper/catalog/elements",
        { url: target, fhirVersion: version, profiles: locations },
        { raw: true }
      );
      const root = JSON.parse(text2).root || {};
      const elements = root.snapshot?.element || root.differential?.element || [];
      st.completionPaths = elements.map((item) => item.path).filter(Boolean);
      const required = elements.filter((item) => Number(item.min || 0) > 0 && item.path && item.path.includes(".")).map((item) => item.path);
      const model = element.sourceModel || "oie-message";
      const sourceUrl = model === "oie-message" ? "http://oie.org/fhir/StructureDefinition/OieMessage" : String(element.sourceModelUrl || "").trim() || "http://hl7.org/fhir/StructureDefinition/Resource";
      st.check = null;
      set("mapSource", fmlSkeleton({ sourceUrl, targetUrl: target, required }));
    } catch (e) {
      st.skeletonError = errorText3(e);
    }
    st.generating = false;
    rerender();
  };
  const inline = !!String(element.mapSource || "").trim();
  const mapPanel = h2(
    "div",
    null,
    h2("div", { className: "hint", style: { marginBottom: "8px" } }, t("A map written here is saved with the channel and runs instead of the map chosen in Properties. It may import the maps and use the profiles and ConceptMaps of the profile locations.")),
    h2(
      "div",
      { className: "fml-row", style: { marginBottom: "8px" } },
      h2("button", { type: "button", className: "btn btn-sm", disabled: st.checking || !inline, onClick: checkMap }, st.checking ? t("Checking…") : t("Check")),
      !inline ? h2("button", { type: "button", className: "btn btn-sm", onClick: () => {
        st.check = null;
        set("mapSource", FML_TEMPLATE);
      } }, t("Start from an example")) : null,
      h2("input", {
        type: "text",
        value: st.skeletonTarget,
        "aria-label": t("Target profile for the skeleton"),
        placeholder: t("Target profile for the skeleton"),
        style: { flex: "1 1 300px" },
        onChange: (e) => {
          st.skeletonTarget = e.target.value;
          rerender();
        }
      }),
      h2(
        "button",
        { type: "button", className: "btn btn-sm", disabled: st.generating, onClick: generateSkeleton },
        st.generating ? t("Generating…") : t("Generate skeleton")
      ),
      inline ? h2("button", { type: "button", className: "btn btn-sm", title: t("Empty the map: the step then runs the map chosen in Properties"), onClick: () => {
        st.check = null;
        set("mapSource", "");
      } }, t("Clear")) : null,
      st.check && !st.check.errors.length ? h2("span", { className: "fml-ok" }, t("No problem found{p0}{p1}.", { p0: st.check.name ? t(" in {name}", { name: st.check.name }) : "", p1: st.check.groups?.length ? t(" (groups: {groups})", { groups: st.check.groups.join(", ") }) : "" })) : null,
      st.check && st.check.errors.length ? h2("span", { className: "fml-error" }, t("{p0} problem(s)", { p0: st.check.errors.length })) : null
    ),
    st.skeletonError ? h2("div", { className: "fml-error", style: { marginBottom: "6px" } }, st.skeletonError) : null,
    h2(FmlMapEditor, {
      value: element.mapSource || "",
      problems: st.check?.errors || [],
      completionPaths: st.completionPaths,
      onChange: (text2) => {
        element.mapSource = text2;
        onChange();
        if (!!text2.trim() !== inline) rerender();
      }
    }),
    (st.check?.errors || []).map((e, i) => h2("div", { key: i, className: "fml-error", style: { marginTop: "4px" } }, t("Line {p0}, column {p1}: {p2}", { p0: e.line, p1: e.column, p2: e.message })))
  );
  const mapOptions = st.maps || [];
  const knownMap = mapOptions.some((m) => m.url === element.mapUrl);
  const settings = h2(
    "div",
    { className: "fml-settings" },
    field(
      t("FHIR context"),
      h2(
        "select",
        { value: element.context || "", "aria-label": t("FHIR context"), onChange: (e) => {
          set("context", e.target.value);
          setTimeout(() => loadMaps(false), 0);
        } },
        h2("option", { value: "" }, t("(none: this step's own version and locations)")),
        (cachedFhirSettings()?.contexts || []).map((c) => h2("option", { key: c.name, value: c.name }, t("{p0} — {p1}, {p2}", { p0: c.name, p1: c.fhirVersion, p2: (c.packages || []).join("; ") || t("no package") }))),
        element.context && !shared && st.settingsReady ? h2("option", { value: element.context }, t("{p0} (not defined on this server)", { p0: element.context })) : null
      ),
      shared ? t("Locations: {p0} · validation policy of the context: {p1}.", { p0: (shared.packages || []).join("; ") || t("none"), p1: shared.validation }) : t("A context of Settings › FHIR Mapper gives the version and the locations to every step that names it."),
      true
    ),
    field(t("FHIR version"), h2(
      "select",
      { disabled: !!shared, value: version, onChange: (e) => set("fhirVersion", e.target.value) },
      ["R4", "R4B", "R5"].map((v) => h2("option", { key: v, value: v }, v))
    ), t("Version of the resources the map produces.")),
    field(
      t("Source model"),
      h2(
        "select",
        { value: element.sourceModel || "oie-message", onChange: (e) => set("sourceModel", e.target.value) },
        h2("option", { value: "oie-message" }, t("Generic OIE message")),
        h2("option", { value: "hl7v2-logical" }, t("Typed HL7 v2 logical model")),
        h2("option", { value: "fhir" }, t("FHIR resource"))
      ),
      t("The typed HL7 v2 model reads the XML produced by OIE's Strict Parser.")
    ),
    (element.sourceModel || "oie-message") !== "oie-message" ? field(
      t("Source model canonical URL"),
      text("sourceModelUrl", "http://example.org/StructureDefinition/ORU__R01"),
      element.sourceModel === "hl7v2-logical" ? t("Required. Dots become underscores and existing underscores are doubled.") : t("Used by the map skeleton; the FHIR resource itself declares its type.")
    ) : null,
    field(
      t("Result destination"),
      h2("select", {
        value: element.variable ? "variable" : "message",
        onChange: (e) => set("variable", e.target.value === "variable" ? element.variable || "fhirResource" : "")
      }, h2("option", { value: "message" }, t("Outbound message")), h2("option", { value: "variable" }, t("Channel Map variable"))),
      t("The outbound template (tmp) if there is one, else msg.")
    ),
    element.variable ? field(t("Variable"), text("variable", "fhirResource")) : null,
    field(
      shared ? t("Maps of the context") : t("Profile locations"),
      h2(
        "div",
        { className: "fml-row" },
        shared ? null : text("profiles", "/opt/fhir/ig;/opt/fhir/maps"),
        h2("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !locations.trim(), onClick: () => loadMaps(false) }, st.loading ? t("Loading…") : t("Load maps")),
        h2("button", { type: "button", className: "btn btn-sm", disabled: st.loading || !locations.trim(), title: t("Read the map files again"), onClick: () => loadMaps(true) }, t("Reload"))
      ),
      t("Files and folders on the OIE server, separated by ';': FML files (.fml, .map), StructureMaps, profiles, ConceptMaps and packages (.tgz)."),
      true
    ),
    field(
      t("Map"),
      h2(
        "div",
        { className: "fml-row" },
        h2(
          "select",
          { value: knownMap ? element.mapUrl : "", onChange: (e) => set("mapUrl", e.target.value) },
          h2("option", { value: "" }, st.maps ? mapOptions.length ? t("Choose a map…") : t("No map in these locations") : t("Load the maps first")),
          mapOptions.map((m) => h2("option", { key: m.url, value: m.url }, t("{p0} — {p1}", { p0: m.title || m.name, p1: m.url })))
        )
      ),
      inline ? t("Not used: the step runs the map written in the Map tab.") : knownMap || !element.mapUrl ? t("The map runs with the message as its source (OieMessage) and builds its target.") : t("Map {p0} is not in the loaded list.", { p0: element.mapUrl }),
      true
    ),
    st.loadError ? h2("div", { className: "fml-wide fml-error" }, st.loadError) : null,
    Object.keys(st.mapErrors).length ? h2(
      "div",
      { className: "fml-wide fml-error" },
      t("Unreadable files: "),
      Object.entries(st.mapErrors).map(([file, message]) => h2("div", { key: file }, t("{p0}: {p1}", { p0: file, p1: message })))
    ) : null,
    field(
      t("Context variables"),
      text("contextVariables", "site, sendingFacility"),
      t("Variables of the OIE maps ($) copied to context.variable of the model, separated by commas.")
    ),
    field(t("Validation"), h2(
      "label",
      { className: "check" },
      h2("input", { type: "checkbox", checked: element.validateOutput !== false && element.validateOutput !== "false", onChange: (e) => set("validateOutput", e.target.checked) }),
      t(" Validate the result")
    ), t("Against the profiles in meta.profile, else the base definition. An invalid result stops the message."))
  );
  const result = st.result;
  const test = h2(
    "div",
    null,
    h2(
      "div",
      { className: "fml-settings" },
      field(t("Data type"), h2(
        "select",
        { value: st.sample.dataType, onChange: (e) => {
          st.sample.dataType = e.target.value;
          saveSample();
          rerender();
        } },
        DATA_TYPES.map((v) => h2("option", { key: v, value: v }, v))
      )),
      h2(
        "div",
        { className: "field" },
        h2("label", null, " "),
        h2("button", { type: "button", className: "btn btn-primary", disabled: st.testing || !(element.mapUrl || inline), onClick: runTest }, st.testing ? t("Running…") : t("Run test"))
      ),
      field(t("Sample message"), h2(CodeBox, {
        value: st.sample.message,
        language: languageOf(st.sample.dataType),
        height: "190px",
        label: t("Sample message"),
        onChange: (text2) => {
          if (text2 !== st.sample.message) {
            st.sample.message = text2;
            saveSample();
            rerender();
          }
        }
      }), null, true)
    ),
    result ? h2(
      "div",
      null,
      (result.errors || []).map((e, i) => h2("div", { key: `e${i}`, className: "fml-error" }, t("{p0}: {p1}", { p0: e.phase, p1: e.message }))),
      result.validationPerformed && !(result.issues || []).some((i) => ["error", "fatal"].includes(i.severity)) && !(result.errors || []).length ? h2("div", { className: "fml-ok" }, t("Valid.")) : null,
      (result.issues || []).filter((i) => i.severity !== "information").map((i, n) => h2("div", { key: `i${n}`, className: i.severity === "warning" ? "fml-issue-warning" : "fml-error" }, t("{p0} {p1}: {p2}", { p0: i.severity, p1: i.location || "", p2: i.message }))),
      result.output ? h2("div", null, h2("h4", null, t("Result")), h2(CodeBox, { value: pretty(result.output), language: "json", readOnly: true, height: "360px", label: t("Result") })) : null,
      result.model ? h2("details", null, h2("summary", null, t("Source instance received by the map")), h2(CodeBox, { value: pretty(result.model), language: "json", readOnly: true, height: "360px", label: t("Source instance") })) : null
    ) : null
  );
  React2.useEffect(() => {
    if (!st.fullScreen) return void 0;
    const onKey = (e) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        st.fullScreen = false;
        rerender();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [st.fullScreen]);
  const tabs = [{ id: "settings", label: t("Properties"), panel: settings }, { id: "map", label: t("Map"), panel: mapPanel }, { id: "test", label: t("Test"), panel: test }];
  const current2 = tabs.find((t2) => t2.id === st.tab) || tabs[0];
  return h2(
    "div",
    { className: "fhir-fml" + (st.fullScreen ? " mapper-fullscreen" : "") },
    h2(
      "div",
      { className: "fml-tabs", role: "tablist" },
      tabs.map((t2) => h2("button", { key: t2.id, type: "button", role: "tab", "aria-selected": t2.id === current2.id, onClick: () => {
        st.tab = t2.id;
        rerender();
      } }, t2.label)),
      h2("span", { style: { marginLeft: "auto", alignSelf: "center", marginRight: "6px", display: "inline-flex" } }, h2(HelpButton, { key: current2.id, ...FML_HELP[current2.id] || FML_HELP.settings })),
      h2("button", {
        type: "button",
        className: "btn btn-sm",
        style: { alignSelf: "center" },
        title: t("Edit this step on the whole page (Esc to come back)"),
        onClick: () => {
          st.fullScreen = !st.fullScreen;
          rerender();
        }
      }, st.fullScreen ? t("Exit full screen (Esc)") : t("⤢ Full screen"))
    ),
    h2("div", { role: "tabpanel" }, current2.panel)
  );
}
function register2(platform2) {
  React2 = platform2.React;
  registerLanguage("fml", FML_LANGUAGE, platform2);
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
      mapSource: "",
      sourceModel: "oie-message",
      sourceModelUrl: "",
      context: "",
      variable: "",
      validateOutput: true,
      contextVariables: ""
    }),
    validate: (el) => {
      if (!String(el.mapUrl || "").trim() && !String(el.mapSource || "").trim()) return t("Write the map in the Map tab, or choose the map to run.");
      if (el.sourceModel === "hl7v2-logical" && !String(el.sourceModelUrl || "").trim()) return t("The typed HL7 v2 source model requires its canonical URL.");
      if (el.variable !== void 0 && el.variable !== "" && !String(el.variable).trim()) return t("Give the Channel Map variable a name.");
      return "";
    },
    component: FmlTransformEditor
  });
}

// src/index.js
function register3(platform2) {
  bindPlatform(platform2);
  installStyles([editor_default, profile_mapper_default, fml_default, CONTEXT_MENU_STYLES]);
  register(platform2);
  register2(platform2);
  platform2.registerSettingsPanel?.({ label: "FHIR Mapper", component: FhirSettingsPanel });
  registerTraceAction();
  registerMapperReferences().catch((error) => console.warn("[fhir-mapper] references unavailable:", error));
}
export {
  register3 as register
};
