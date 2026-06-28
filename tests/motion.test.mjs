import { test } from "node:test";
import assert from "node:assert/strict";
import {
  figureEightMotion,
  circleMotion,
  squareMotion,
  wanderMotion,
} from "../dist/motion/motion.js";
import { approx, dist, mag, sample } from "./helpers.mjs";

test("figureEightMotion: the loop is seamless (periodic and continuous at the wrap)", () => {
  const period = 3600;
  const motion = figureEightMotion({ periodMs: period });

  // Periodic: t and t + period land on the same point.
  for (const t of [0, 250, 900, 1800, 3000]) {
    assert.ok(dist(motion.positionAt(t), motion.positionAt(t + period)) < 1e-9);
  }

  // Seamless means no kink: velocity is continuous across the wrap. (Position
  // continuity is already implied by periodicity above; a pieced, non-periodic
  // path would betray itself as a velocity discontinuity here.) The figure-8
  // moves fastest at the center crossing, which is the seam, so we compare the
  // one-sided velocities rather than asserting a small step.
  const h = 0.5; // ms
  const vBefore = velocity(motion, period, h, -1); // approaching the seam
  const vAfter = velocity(motion, period, h, +1); // leaving the seam
  assert.ok(dist(vBefore, vAfter) < 1e-5, "velocity kink at the phase 1 -> 0 wrap");
});

/** One-sided finite-difference velocity at `t`; `side` is -1 (incoming) or +1 (outgoing). */
function velocity(motion, t, h, side) {
  const a = motion.positionAt(t);
  const b = motion.positionAt(t + side * h);
  const dt = side * h; // signed step, so the velocity always points forward in time
  return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt, z: (b.z - a.z) / dt };
}

test("figureEightMotion: size scales the amplitude linearly", () => {
  // At a quarter lap, a = PI/2, so x = size * LOOP_X * sin(PI/2) = size * 1.5.
  const quarter = 3600 / 4;
  approx(figureEightMotion({ size: 1 }).positionAt(quarter).x, 1.5, 1e-9);
  approx(figureEightMotion({ size: 2 }).positionAt(quarter).x, 3.0, 1e-9);
});

test("circleMotion: every point sits exactly on the sphere of radius `radius`", () => {
  // With the tilt decomposition, |position| collapses to the radius for all t.
  const radius = 1.3;
  const motion = circleMotion({ radius, tilt: 0.5 });
  for (const p of sample((t) => motion.positionAt(t), 3000, 64)) {
    approx(mag(p), radius, 1e-9, "point off the circle");
  }
});

test("circleMotion: direction flips the travel sense", () => {
  const t = 200;
  const cw = circleMotion({ direction: -1 }).positionAt(t);
  const ccw = circleMotion({ direction: 1 }).positionAt(t);
  approx(cw.y, -ccw.y, 1e-9, "y mirrors when direction flips");
});

test("squareMotion: stays on the square perimeter (bounded by the half-extent)", () => {
  const size = 2.4;
  const half = size / 2;
  const motion = squareMotion({ size, tilt: 0 });
  for (const p of sample((t) => motion.positionAt(t), 4000, 200)) {
    assert.ok(Math.abs(p.x) <= half + 1e-9 && Math.abs(p.y) <= half + 1e-9);
  }
});

test("wanderMotion: never leaves its bounds (the in-frame guarantee)", () => {
  const bounds = { x: 1.4, y: 1.0, z: 0.6 };
  const motion = wanderMotion({ bounds, seed: 42 });
  // Sample densely over many periods; the sum-of-sines is bounded by construction.
  for (const p of sample((t) => motion.positionAt(t), 9000 * 5, 2000)) {
    assert.ok(Math.abs(p.x) <= bounds.x + 1e-9, `x out of bounds: ${p.x}`);
    assert.ok(Math.abs(p.y) <= bounds.y + 1e-9, `y out of bounds: ${p.y}`);
    assert.ok(Math.abs(p.z) <= bounds.z + 1e-9, `z out of bounds: ${p.z}`);
  }
});

test("wanderMotion: a seed makes the path reproducible; different seeds differ", () => {
  const a = wanderMotion({ seed: 7 });
  const b = wanderMotion({ seed: 7 });
  const c = wanderMotion({ seed: 8 });
  for (const t of [0, 100, 1234, 5000]) {
    assert.deepEqual(a.positionAt(t), b.positionAt(t));
  }
  // A different seed produces a different path at some sampled time.
  const differs = [0, 100, 1234, 5000].some(
    (t) => dist(a.positionAt(t), c.positionAt(t)) > 1e-6,
  );
  assert.ok(differs, "different seeds should produce different paths");
});

test("MotionController.positionAt is pure (same input -> same output)", () => {
  const motion = figureEightMotion();
  assert.deepEqual(motion.positionAt(1234.5), motion.positionAt(1234.5));
});
