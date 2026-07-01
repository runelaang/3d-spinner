import { build } from "esbuild";

// Browser <script>-tag build: a single global-exposing bundle of the main
// entry point. esbuild has no "umd" format, so this is IIFE-only — there's
// no AMD/CJS interop shim. Node consumers should use the "require"/"import"
// conditions in package.json instead.
const shared = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "iife",
  globalName: "Spinner3D",
  platform: "browser",
  target: "es2020",
};

await build({
  ...shared,
  outfile: "dist/umd/spinner.global.js",
});

await build({
  ...shared,
  outfile: "dist/umd/spinner.global.min.js",
  minify: true,
});
