import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { build } from "esbuild";
import { publicEntries } from "./entries.mjs";

// One bundle per public entry point. Each bundle is self-contained so
// `require()` never needs to resolve a relative specifier across the ESM/CJS split.
await build({
  entryPoints: publicEntries().map((entry) => entry.source),
  outdir: "dist/cjs",
  outbase: "src",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "neutral",
  format: "cjs",
  target: "es2020",
});

/** Every `.d.ts` file under `dir`, skipping the CommonJS and browser build folders. */
function declarationFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "cjs" || entry.name === "umd" ? [] : declarationFiles(path);
    return entry.name.endsWith(".d.ts") ? [path] : [];
  });
}

// The package is "type": "module", so TypeScript reads dist/**/*.d.ts as ESM. CommonJS
// consumers need declarations of their own module kind: copy the tree as .d.cts next to the
// .cjs bundles, pointing relative imports at .cjs so they resolve to the sibling .d.cts files.
for (const file of declarationFiles("dist")) {
  const target = join("dist/cjs", relative("dist", file)).replace(/\.d\.ts$/, ".d.cts");
  const source = readFileSync(file, "utf8").replace(/(["'])(\.{1,2}\/[^"']*?)\.js\1/g, "$1$2.cjs$1");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, source);
}
