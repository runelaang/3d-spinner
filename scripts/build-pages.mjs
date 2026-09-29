import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Assemble the GitHub Pages site in _site/ (run `npm run build` first).
//
// Pages serves the site at the project path /3d-spinner/, while the example pages use
// root-absolute URLs (/examples/..., /dist/..., /meshes/...) so they work under the local dev
// server. Copy the three folders and rewrite those references to /3d-spinner/... in the HTML.
// The site root gets a rewritten copy of examples/index.html.

const publicDir = fileURLToPath(new URL("..", import.meta.url));
const siteDir = join(publicDir, "_site");
const BASE = "/3d-spinner";
const FOLDERS = ["dist", "examples", "meshes"];

/** Point root-absolute asset URLs at the project path Pages serves the site from. */
const rewrite = (text) => text.replace(/(?<![\w/])\/(dist|examples|meshes)\//g, `${BASE}/$1/`);

/** Every .html file below `dir`. */
async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith(".html")) found.push(path);
  }
  return found;
}

await rm(siteDir, { recursive: true, force: true });
for (const folder of FOLDERS) {
  await cp(join(publicDir, folder), join(siteDir, folder), { recursive: true });
}

const pages = await htmlFiles(join(siteDir, "examples"));
for (const path of pages) {
  await writeFile(path, rewrite(await readFile(path, "utf8")), "utf8");
}
const index = await readFile(join(publicDir, "examples", "index.html"), "utf8");
await writeFile(join(siteDir, "index.html"), rewrite(index), "utf8");

console.log(`_site/ built: ${FOLDERS.join(", ")}, ${pages.length} HTML pages rewritten`);
