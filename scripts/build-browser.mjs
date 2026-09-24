import { build } from "esbuild";
import { publicEntries } from "./entries.mjs";

// Browser <script>-tag build: a single global-exposing bundle of the whole
// public API surface (every subpath in package.json "exports"), so
// window.Spinner3D is usable standalone without an import map. esbuild has
// no "umd" format, so this is IIFE-only - there's no AMD/CJS interop shim.
// Node consumers should use the "require"/"import" exports conditions instead.
const entry = {
  contents: publicEntries()
    .map((item) => `export * from "../${item.source}";`)
    .join("\n"),
  resolveDir: "scripts",
  loader: "ts",
};

const shared = {
  stdin: entry,
  bundle: true,
  format: "iife",
  globalName: "Spinner3D",
  platform: "browser",
  target: "es2020",
};

// The output folder keeps its historical "umd" name: published CDN URLs
// (unpkg/jsDelivr, package.json "browser") point at these exact paths.
await build({
  ...shared,
  outfile: "dist/umd/spinner.global.js",
});

await build({
  ...shared,
  outfile: "dist/umd/spinner.global.min.js",
  minify: true,
});
