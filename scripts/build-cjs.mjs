import { build } from "esbuild";

// One bundle per public entry point (mirrors the subpaths in package.json
// "exports"). Each bundle is self-contained so `require()` never needs to
// resolve a relative specifier across the ESM/CJS split.
const entryPoints = [
  "src/index.ts",
  "src/animations/spin.ts",
  "src/animations/object-motion.ts",
  "src/motion/motion.ts",
  "src/motion/transitions.ts",
  "src/engines/little-3d-engine/little-3d-engine.ts",
  "src/engines/little-3d-engine/loaders/obj.ts",
  "src/engines/little-tween-engine/little-tween-engine.ts",
];

await build({
  entryPoints,
  outdir: "dist/cjs",
  outbase: "src",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "neutral",
  format: "cjs",
  target: "es2020",
});
