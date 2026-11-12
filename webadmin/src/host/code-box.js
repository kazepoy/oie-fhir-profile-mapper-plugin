// SPDX-License-Identifier: MPL-2.0
// A block of code in the host's code editor, with the highlighting of its
// language: a sample message (hl7v2, xml, json), a FHIR result, a generated
// script. Editable or read-only; a textarea when the host has no Monaco.
import { platform } from "./platform.js";
import { createExpressionEditor } from "./code-editor.js";

/** The editor language of an OIE data type. */
export function languageOf(dataType) {
  return dataType === "HL7V2" ? "hl7v2" : dataType === "XML" ? "xml" : dataType === "JSON" ? "json" : "text";
}

/** @param {{ value: string, language: string, readOnly?: boolean, onChange?: (text: string) => void, height?: string, label?: string }} props */
export function CodeBox({ value, language, readOnly = false, onChange, height = "220px", label }) {
  const React = platform().React;
  const host = React.useRef(null);
  const editor = React.useRef(null);
  const latest = React.useRef(onChange);
  latest.current = onChange;
  // A new editor for another language: the host fixes it when the editor is made.
  React.useEffect(() => {
    const ed = createExpressionEditor({ value: value ?? "", language, multiline: true, readOnly, minHeight: height, ariaLabel: label,
      onChange: text => latest.current?.(text) });
    ed.el.style.height = height;
    editor.current = ed;
    host.current.appendChild(ed.el);
    return () => { editor.current = null; ed.dispose(); };
  }, [language, readOnly]);
  React.useEffect(() => {
    if (editor.current && editor.current.getValue() !== (value ?? "")) editor.current.setValue(value ?? "");
  }, [value]);
  return React.createElement("div", { ref: host, className: "fm-code-box", "data-language": language });
}
