// SPDX-License-Identifier: MPL-2.0
// Bundles src/ into one module, web/plugin.js, that Maven packages under
// webadmin/web/plugin.js of the extension. Web Admin imports a WAR plugin entry
// from a blob: URL, so relative imports cannot work there: everything is bundled,
// except the @oie/* packages of the page import map.
import { build } from "esbuild";
import { mkdir, readFile, rm } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const version = process.env.MAPPER_VERSION || pkg.version;

await rm("web", { recursive: true, force: true });
await mkdir("web", { recursive: true });

await build({
  entryPoints: ["src/index.js"],
  outfile: "web/plugin.js",
  bundle: true,
  format: "esm",
  target: "es2022",
  charset: "utf8",
  external: ["@oie/*"],
  // CSS files are injected by the plugin itself (src/host/styles.js).
  loader: { ".css": "text" },
  define: { __MAPPER_VERSION__: JSON.stringify(version) },
  banner: { js: `// OIE FHIR Mapper ${version} · MPL-2.0 · generated from webadmin/src by build.mjs: do not edit` },
  legalComments: "none",
  minify: false,
  logLevel: "info"
});
