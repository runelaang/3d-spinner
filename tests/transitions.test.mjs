import { test } from "node:test";
import assert from "node:assert/strict";
import {
  enterFromObjectDirection,
  leaveInObjectDirection,
} from "../dist/motion/transitions.js";
import { approx, dist } from "./helpers.mjs";

const HANDOFF = { x: 0, y: 0, z: 0 };

/** A transition input with sensible defaults for an intro at the given elapsed time. */
function introInput(overrides = {}) {
  const durationMs = overrides.durationMs ?? 450;
  const elapsedMs = overrides.elapsedMs ?? 0;
  return {
    delta: elapsedMs / durationMs,
    position: HANDOFF,
    direction: { x: 1, y: 0, z: 0 },
    velocity: { x: 0.01, y: 0, z: 0 },
    size: 1,
    durationMs,
    elapsedMs,
    phase: "intro",
    ...overrides,
  };
}

test("enterFromObjectDirection: the fly-in ends exactly at the handoff point", () => {
  const enter = enterFromObjectDirection();
  const end = enter(introInput({ elapsedMs: 450 }));
  assert.ok(dist(end.position, HANDOFF) < 1e-12, "intro must land on the path");
});

test("enterFromObjectDirection: matches the path velocity at the handoff when fast enough", () => {
  // velocity 0.01 > minSpeed (distance/duration = 3.5/450), so the approach
  // should travel at exactly the path velocity - no speed jump at the join.
  const enter = enterFromObjectDirection();
  const a = enter(introInput({ elapsedMs: 200 }));
  const b = enter(introInput({ elapsedMs: 201 }));
  approx(b.position.x - a.position.x, 0.01, 1e-9, "approach vx");
  approx(b.position.y - a.position.y, 0, 1e-12);
});

test("enterFromObjectDirection: falls back to `distance` when no useful velocity is supplied", () => {
  // velocity ~0 carries no usable direction or speed, so it starts `distance`
  // behind along the resolved direction instead of matching the (absent) path.
  const enter = enterFromObjectDirection({ distance: 3.5 });
  const start = enter(introInput({ elapsedMs: 0, velocity: { x: 0, y: 0, z: 0 } }));
  approx(start.position.x, -3.5, 1e-9, "should start one `distance` behind");
  approx(dist(start.position, HANDOFF), 3.5, 1e-9);
});

test("enterFromObjectDirection: honors a slow path velocity instead of the `distance` floor", () => {
  // A slow-but-real velocity (0.001) is a useful velocity, so the approach
  // matches it for a smooth join rather than overriding it with `distance`.
  const enter = enterFromObjectDirection({ distance: 3.5 });
  const a = enter(introInput({ elapsedMs: 200, velocity: { x: 0.001, y: 0, z: 0 } }));
  const b = enter(introInput({ elapsedMs: 201, velocity: { x: 0.001, y: 0, z: 0 } }));
  approx(b.position.x - a.position.x, 0.001, 1e-9, "approach matches the slow path speed");
});

test("leaveInObjectDirection: starts at the handoff and flies off along the velocity", () => {
  const leave = leaveInObjectDirection();
  const base = {
    delta: 0,
    position: HANDOFF,
    direction: { x: 1, y: 0, z: 0 },
    velocity: { x: 0.01, y: 0, z: 0 },
    size: 1,
    durationMs: 450,
    elapsedMs: 0,
    phase: "outro",
  };
  const start = leave({ ...base });
  const later = leave({ ...base, elapsedMs: 100, delta: 100 / 450 });
  assert.ok(dist(start.position, HANDOFF) < 1e-12, "outro must begin at the path");
  approx(later.position.x, 1.0, 1e-9, "should fly off in +x");
});
