// SPDX-License-Identifier: MPL-2.0
// The contextual help of the editors: one entry per tab or panel.

export const MAPPER_HELP = {
  properties: {
    label: "Help: Properties",
    sections: [
      { title: "What this step does", lines: [
        "A FHIR Profile Mapper step builds one FHIR resource from the message, or creates a named Bundle that later steps fill.",
        ["Create a Bundle", "Declares a Bundle by name and type. Resource steps placed after it select it in “Add to Bundles”."],
        ["Build a resource", "Maps the message onto a profile. The resource is the result of the step, or is added to one or several Bundles."]] },
      { title: "Where the profile comes from", lines: [
        ["FHIR context", "A named set of packages, terminology server and validation policy, defined once in Settings › FHIR Mapper and shared by every step that names it."],
        ["Profile Packages", "Without a context: server paths of profile files, folders or .tgz packages, separated by ';'."],
        ["Target Profile", "Canonical URL of the profile, or a resource type. Load reads its elements; mappings of elements it also has are kept."]] },
      { title: "Result", lines: [
        ["Result destination", "The outbound message, or a channel map variable to use from another destination."],
        ["Reference Name", "The name other steps give to fhirRef('name') to point at this resource inside the Bundles."],
        ["Validate FHIR output", "always, off, or as the context says. An invalid result stops the message."],
        ["Trace processed messages", "Keeps this step's events on each processed message; read them with the “FHIR mapping trace” action of Messages. Redeploy to apply."]] },
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
        ["red row", "The last test or the compilation reported this element; its message is in the tooltip."]] },
      { title: "Writing a mapping", lines: [
        "Click a field to edit it. An expression is JavaScript, usually a path of the message; a constant is written 'final'.",
        ["⌥Space", "Suggestions: iteration variables, codes of the value set, references of other steps, mapper functions, paths of the sample."],
        ["Sample fields", "The fields of the sample message with their values. Click one to insert its path into the field being edited, or drag it onto a field."],
        ["Alt+↓ ↑ → ←", "Next or previous field; open or close the element."]] },
      { title: "Element inspector", lines: [
        "Select an element by its name, with a click or Enter, or focus one of its fields. The inspector follows the selection.",
        "Read the profile's definition, cardinality, binding, fixed value and examples. Edit expressions, existing conditions, iterations, translations, notes and activation in the same rules as the tree.",
        "Diagnostics belong to the selected element. Go to rule reveals its field in the tree. On a narrow editor the inspector sits below the tree."] },
      { title: "Buttons of a row", lines: [
        ["+ / −", "Add or remove an entry of a repeating element."],
        ["↻", "One entry per item of a list. Fields below use the item variable, e.g. n['PID.5.1']."],
        ["⇄", "Translate the value with a ConceptMap; choose what happens without a match."],
        ["?", "Only map this element, and what is below it, when a condition holds."]] },
      { title: "Branch actions and extensions", lines: [
        "Right-click a row, press Shift+F10 on its name, or use its ⋯ button to open the actions menu.",
        "Duplicate branch copies a mapped repeating entry to a new occurrence, with new rule identities. Expressions and notes are kept. Iterated entries and entries at their maximum cardinality cannot be duplicated.",
        "In the inspector, Profile extension reveals a declared slice and its URL. List context extensions offers other URLs to add to an open extension collection; choose its value type in the tree afterwards.",
        "ConceptMaps are suggested by source/target systems and the target binding. All ConceptMaps restores the full list. A suggestion never replaces the current selection automatically."] },
      { title: "Toolbar", lines: [
        ["Show", "All elements, Must Support and required, or mapped only."],
        ["Search", "Filters the tree and opens the branches that contain the text."],
        ["Undo / Redo", "Of the mappings, while the step is open."],
        ["Full screen", "The step on the whole page; Esc comes back."]] }
    ],
    note: "A missing optional field must give nothing, not an error: guard it, e.g. x.length() > 1 ? x[1].toString() : undefined."
  },
  test: {
    label: "Help: Test",
    sections: [
      { title: "What a test runs", lines: [
        "Preview scope chooses this step alone (stand-in references) or the enabled Profile Mapper steps of this transformer (real references and finalized Bundles). Other step types are excluded.",
        "Testing runs the step's code on the server and needs the permission “Test FHIR mapper steps”."] },
      { title: "Samples", lines: [
        ["Save as sample", "Keeps the message in the step, so it is saved with the channel and shared by every user."],
        ["Use this result as expected", "Fixes the reference result of the sample. Later runs say whether the result matches, and show both side by side when it differs."],
        ["Run all", "Runs every saved sample: passed, or failed on an error, an invalid result or a difference."],
        "Random identities (urn:uuid) and meta.lastUpdated are ignored when comparing."] },
      { title: "Understanding a result", lines: [
        ["Go to rule", "Opens the element an error or a trace event belongs to."],
        ["Trace", "Records each rule: value, conversion, translation, condition, iteration. Include scalar values only when patient data may be shown."],
        ["Generated script", "The JavaScript the server compiles from the mappings."]] }
    ]
  }
};

export const FML_HELP = {
  settings: {
    label: "Help: Properties",
    sections: [
      { title: "What this step does", lines: [
        "A FHIR FML Transform step runs a map written in the FHIR Mapping Language on the message and publishes the resource it builds.",
        "The message is given to the map as the generic OieMessage model: nodes with a name, a position, an occurrence and a value."] },
      { title: "Which map runs", lines: [
        ["Map tab", "A map written in the step is saved with the channel and runs first."],
        ["Map", "Otherwise, a StructureMap of the locations: .fml or .map files, StructureMap resources, packages."],
        ["FHIR context", "A named set of locations defined in Settings › FHIR Mapper, shared by the steps that name it."]] },
      { title: "Result", lines: [
        ["Result destination", "The outbound message, or a channel map variable."],
        ["Context variables", "Variables of the OIE maps copied into context.variable of the model."],
        ["Validation", "Against the profiles of meta.profile, else the base definition. An invalid result stops the message."]] }
    ]
  },
  map: {
    label: "Help: Map",
    sections: [
      { title: "Writing the map", lines: [
        "map \"url\" = \"Name\", then uses … as source / as target, then one or more groups of rules.",
        ["src.node as pid where name = 'PID'", "Finds a node of the message by its name, its position or its occurrence."],
        ["-> patient.gender = translate(v, 'url', 'code')", "Translates with a ConceptMap of the locations."],
        ["imports \"url\"", "Uses the groups of another map of the locations."]] },
      { title: "Buttons", lines: [
        ["Check", "Parses the map on the server. Errors are underlined at their line; unknown uses and imports are reported."],
        ["Start from an example", "A small map to adapt."],
        ["Clear", "Empties the map: the step then runs the map chosen in Properties."]] }
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
        "Testing needs the permission “Test FHIR FML transforms”."] }
    ]
  }
};

export const SETTINGS_HELP = {
  label: "Help: FHIR contexts",
  sections: [
    { title: "What a context is", lines: [
      "A named set of profile packages, a terminology server and a validation policy, shared by the FHIR Profile Mapper and FHIR FML Transform steps that name it.",
      "A step without a context keeps its own packages and settings."] },
    { title: "Fields", lines: [
      ["Packages", "One server path per line: files, folders or .tgz packages with profiles, ConceptMaps, value sets and FML maps."],
      ["Terminology server", "Base URL as OIE reaches it; empty to translate with the ConceptMaps of the packages."],
      ["Validation", "For the steps whose validation is “as the context says”."]] },
    { title: "When a change applies", lines: [
      "The editors use it at once. A deployed channel keeps the context it read when it was deployed: redeploy it.",
      "Saving needs the permission “Manage FHIR mapper settings”."] }
  ]
};
