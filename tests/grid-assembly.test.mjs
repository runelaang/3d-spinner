import test from "node:test";
import assert from "node:assert/strict";

import { GridAssemblyAnimation } from "../dist/animations/grid-assembly.js";
import { gridAssembly } from "../dist/prefabs/prefabs.js";

test("gridAssembly returns progress spinner options with an intro-ready progress", () => {
  const options = gridAssembly();
  assert.equal(options.type, "progress");
  assert.equal(options.progress, 0.001);
  assert.ok(options.animation instanceof GridAssemblyAnimation);
});

test("gridAssembly forwards progress, timeout, and until", () => {
  const until = new Date(Date.now() + 5000);
  const options = gridAssembly({ progress: 0.25, timeout: 4000, until });
  assert.equal(options.progress, 0.25);
  assert.equal(options.timeout, 4000);
  assert.equal(options.until, until);
});

test("GridAssemblyAnimation lifecycle is safe before mount", () => {
  const animation = new GridAssemblyAnimation();
  assert.equal(animation.isFinished(), false);
  animation.enter(1000);
  animation.exit(2000);
  animation.render(3000, { progress: 1, targetProgress: 1, indeterminate: false });
  assert.equal(animation.isFinished(), false);
  animation.destroy();
});
