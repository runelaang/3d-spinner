import { test } from "node:test";
import assert from "node:assert/strict";
import { ObjectMotionAnimation } from "../dist/animations/object-motion.js";
import { GridAssemblyAnimation } from "../dist/animations/grid-assembly.js";
import { ChargedOrbAnimation } from "../dist/animations/charged-orb.js";
import { ParticlesAnimation } from "../dist/animations/particles.js";
import { ProgressAnimation } from "../dist/progress-animation.js";
import { cube } from "../dist/engines/little-3d-engine/little-3d-engine.js";
import {
  circleMotion,
  figureEightMotion,
  squareMotion,
  wanderMotion,
} from "../dist/motion/motion.js";
import { grow } from "../dist/motion/transitions.js";

// Time options that are NaN or infinite used to make an object vanish (NaN positions)
// or keep a stopped spinner running forever (a finish time that is never reached).

const notFinite = [NaN, Infinity, -Infinity];

test("motion paths reject a period that is not finite or is zero", () => {
  for (const motion of [circleMotion, squareMotion, figureEightMotion, wanderMotion]) {
    for (const periodMs of [...notFinite, 0]) {
      assert.throws(() => motion({ periodMs }), RangeError, `${motion.name} ${periodMs}`);
    }
    const reversed = motion({ periodMs: -2000 }).positionAt(500);
    assert.ok(Number.isFinite(reversed.x), `${motion.name} still runs with a negative period`);
  }
});

test("object motion rejects a tail gap or transition duration that is not finite", () => {
  const base = { mesh: cube(1), motion: circleMotion() };
  for (const value of notFinite) {
    assert.throws(
      () => new ObjectMotionAnimation({ ...base, tail: { count: 2, gapMs: value } }),
      RangeError,
    );
    assert.throws(
      () =>
        new ObjectMotionAnimation({ ...base, intro: { transition: grow(), durationMs: value } }),
      RangeError,
    );
    assert.throws(
      () =>
        new ObjectMotionAnimation({ ...base, outro: { transition: grow(), durationMs: value } }),
      RangeError,
    );
  }
  assert.doesNotThrow(
    () =>
      new ObjectMotionAnimation({
        ...base,
        tail: { count: 2, gapMs: 0 },
        intro: { transition: grow(), durationMs: 0 },
      }),
  );
});

test("orbit periods must be finite and not zero; docking time must be above zero", () => {
  for (const value of [...notFinite, 0]) {
    assert.throws(() => new GridAssemblyAnimation({ orbitPeriodMs: value }), RangeError);
    assert.throws(() => new ChargedOrbAnimation({ orbitPeriodMs: value }), RangeError);
    assert.throws(() => new GridAssemblyAnimation({ dockMs: value }), RangeError);
  }
  assert.throws(() => new GridAssemblyAnimation({ dockMs: -100 }), RangeError);
  assert.doesNotThrow(() => new GridAssemblyAnimation({ orbitPeriodMs: -9000, dockMs: 1 }));
  assert.doesNotThrow(() => new ChargedOrbAnimation({ orbitPeriodMs: -6000 }));
});

test("progress animation durations must be finite", () => {
  for (const value of notFinite) {
    assert.throws(() => new ProgressAnimation({ popDurationMs: value }), RangeError);
    assert.throws(() => new ProgressAnimation({ doneFadeDurationMs: value }), RangeError);
  }
  assert.doesNotThrow(() => new ProgressAnimation({ popDurationMs: 0, doneFadeDurationMs: 0 }));
});

test("a particle outro given as a number must be finite", () => {
  for (const value of notFinite) {
    assert.throws(() => new ParticlesAnimation({ outroMs: value }), RangeError);
  }
  assert.doesNotThrow(() => new ParticlesAnimation({ outroMs: () => NaN }));
});
