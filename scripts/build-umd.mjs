import { build } from "esbuild";

// Browser <script>-tag build: a single global-exposing bundle of the whole
// public API surface (every subpath in package.json "exports"), so
// window.Spinner3D is usable standalone without an import map. esbuild has
// no "umd" format, so this is IIFE-only — there's no AMD/CJS interop shim.
// Node consumers should use the "require"/"import" exports conditions instead.
const entry = {
  contents: `
    export * from "../src/index.ts";
    export * from "../src/animations/spin.ts";
    export * from "../src/animations/object-motion.ts";
    export * from "../src/animations/particles.ts";
    export * from "../src/animations/charged-orb.ts";
    export * from "../src/animations/grid-assembly.ts";
    export * from "../src/composite-animation.ts";
    export * from "../src/prefabs/prefabs.ts";
    export * from "../src/motion/motion.ts";
    export * from "../src/motion/transitions.ts";
    export * from "../src/engines/little-3d-engine/little-3d-engine.ts";
    export * from "../src/engines/little-3d-engine/renderers/webgl-textured.ts";
    export * from "../src/engines/little-3d-engine/renderers/canvas2d-textured.ts";
    export * from "../src/engines/little-3d-engine/renderers/webgpu-textured.ts";
    export * from "../src/engines/little-3d-engine/loaders/obj.ts";
    export * from "../src/engines/little-tween-engine/little-tween-engine.ts";
  `,
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

await build({
  ...shared,
  outfile: "dist/umd/spinner.global.js",
});

await build({
  ...shared,
  outfile: "dist/umd/spinner.global.min.js",
  minify: true,
});
