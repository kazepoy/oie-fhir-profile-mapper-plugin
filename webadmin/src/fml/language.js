// SPDX-License-Identifier: MPL-2.0
// The FHIR Mapping Language for Web Admin's code editor: a Monarch tokenizer
// (keywords, strings, comments, rule names) and the bracket configuration.
const KEYWORDS = ["map", "uses", "alias", "as", "imports", "group", "extends", "source", "target", "queried", "produced",
  "where", "check", "then", "default", "first", "not_first", "last", "not_last", "only_one", "share", "collate", "log",
  "types", "type+", "conceptmap", "prefix", "let"];
const TRANSFORMS = ["create", "copy", "truncate", "escape", "cast", "append", "translate", "reference", "dateOp", "uuid", "pointer",
  "evaluate", "cc", "c", "qty", "id", "cp"];

export const FML_LANGUAGE = {
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

/** A map to start from: the generic OIE model as source, a resource as target. */
export const FML_TEMPLATE = `map "http://example.org/fhir/StructureMap/MyMap" = "MyMap"

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
