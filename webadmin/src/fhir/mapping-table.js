// SPDX-License-Identifier: MPL-2.0
import { t as tr } from "../i18n/index.js";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const markdown = value => escapeHtml(value).replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
const unmarkdown = value => value.replace(/<br>/g, "\n").replace(/&(amp|lt|gt|quot|#39);/g, (_, entity) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[entity]));
function csvRows(text) {
  const rows = []; let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted || cell === "") {
        if (quoted && i + 1 < text.length && ![",", "\r", "\n"].includes(text[i + 1])) throw new Error(tr("Invalid CSV quoting."));
        quoted = !quoted;
      }
      else throw new Error(tr("Invalid CSV quoting."));
    } else if (!quoted && (char === "," || char === "\n")) {
      row.push(cell.replace(/\r$/, "")); cell = "";
      if (char === "\n") { rows.push(row); row = []; }
    } else cell += char;
  }
  if (quoted) throw new Error(tr("Invalid CSV quoting."));
  if (cell || row.length) rows.push([...row, cell.replace(/\r$/, "")]);
  return rows;
}
function markdownRows(text) {
  return text.split(/\r?\n/).filter(line => line.trim().startsWith("|")).map(line => {
    const cells = []; let cell = "";
    const content = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    for (let i = 0; i < content.length; i++) {
      if (content[i] === "\\" && ["\\", "|"].includes(content[i + 1])) cell += content[++i];
      else if (content[i] === "|") { cells.push(unmarkdown(cell.trim())); cell = ""; }
      else cell += content[i];
    }
    return [...cells, unmarkdown(cell.trim())];
  }).filter(row => !row.every(cell => /^:?-{3,}:?$/.test(cell)));
}

/** Value-expression edits only. Everything is checked before the caller mutates the editor. */
export function importMappingTable(text, format, tree, element) {
  const rows = format === "csv" ? csvRows(text.replace(/^\uFEFF/, "")) : markdownRows(text);
  const header = rows.shift()?.map(cell => cell.trim());
  if (!header || !["key", "expression", "note"].every(key => header.includes(key)) || new Set(header).size !== header.length)
    throw new Error(tr("The table must have key, expression and note columns."));
  const seen = new Set();
  const edits = rows.filter(row => row.some(cell => cell.trim())).map((row, index) => {
    if (row.length !== header.length) throw new Error(tr("Invalid table row {number}.", { number: index + 2 }));
    const data = Object.fromEntries(header.map((key, i) => [key, row[i]]));
    const key = data.key.trim();
    const chain = tree.chain(key);
    const node = chain?.at(-1);
    if (!node || node.choice || node.resourceRoot || (element.action === "createBundle" && key === "Bundle.type") || seen.has(key)
        || (data.kind && data.kind !== "value")) throw new Error(tr("Invalid or duplicate value target: {key}", { key }));
    seen.add(key);
    return { key, expression: data.expression, note: data.note };
  });
  if (!edits.length) throw new Error(tr("The table contains no value edits."));
  return edits;
}

export function mappingTable(rules, format = "csv") {
  const rows = [["key", "expression", "note"], ...rules.filter(rule => "expression" in rule).map(rule => [rule.key || rule.element, rule.expression, rule.note || ""])];
  return format === "csv" ? rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(",")).join("\n") + "\n"
    : rows.map((row, i) => "| " + row.map(markdown).join(" | ") + " |" + (i === 0 ? "\n| --- | --- | --- |" : "")).join("\n") + "\n";
}

export function mappingDocumentation(element, rules, format = "markdown") {
  const headings = [tr("Target"), tr("Rule"), tr("Expression / fixed value"), tr("Note"), tr("Enabled"), tr("Translation")];
  const rows = rules.map(rule => [rule.key || rule.element, "each" in rule ? "each" : "condition" in rule ? "condition" : "fixed" in rule ? "fixed" : "value",
    ("each" in rule ? `${rule.each} → ${rule.variable || "item"}` : rule.condition ?? rule.expression ?? JSON.stringify(rule.fixed)), rule.note || "", rule.disabled ? tr("No") : tr("Yes"), rule.translate ? JSON.stringify(rule.translate) : ""]);
  const title = element.name || element.resourceType;
  const metadata = [element.profileUrl || element.resourceType, element.context || "", element.fhirVersion || "R4"].filter(Boolean).join(" · ");
  if (format === "html") return '<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title><style>body{font:14px system-ui,sans-serif;margin:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #aaa;padding:8px;text-align:left;vertical-align:top}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-width:42ch;margin:0;font:12px monospace}</style></head><body><h1>' + escapeHtml(title)
    + '</h1><p>' + escapeHtml(metadata) + '</p><table border="1"><thead><tr>' + headings.map(value => '<th>' + escapeHtml(value) + '</th>').join("")
    + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(value => '<td><pre>' + escapeHtml(value) + '</pre></td>').join("") + '</tr>').join("") + '</tbody></table></body></html>\n';
  return "# " + markdown(title) + "\n\n" + markdown(metadata) + "\n\n| " + headings.map(markdown).join(" | ") + " |\n| " + headings.map(() => "---").join(" | ") + " |\n"
    + rows.map(row => "| " + row.map(markdown).join(" | ") + " |").join("\n") + "\n";
}
