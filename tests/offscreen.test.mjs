import { test } from "node:test";
import assert from "node:assert/strict";
import { Camera, planeMesh } from "../dist/engines/little-3d-engine/little-3d-engine.js";
import { enterFromObjectDirection, leaveInObjectDirection } from "../dist/motion/transitions.js";
import { ObjectMotionAnimation } from "../dist/animations/object-motion.js";
import { figureEightMotion } from "../dist/motion/motion.js";
import { approx, dist } from "./helpers.mjs";

const FOV = (55 * Math.PI) / 180;
const CAMERA_Z = 3;

/**
 * Independent visibility check for a camera at (0, 0, CAMERA_Z) looking down -Z:
 * is any part of a sphere at `p` with radius `r` inside the view?
 */
function partlyVisible(p, r, aspect = 1) {
  const depth = CAMERA_Z - p.z;
  const tanY = Math.tan(FOV / 2);
  const tanX = tanY * aspect;
  const outside = [
    (p.x - depth * tanX) / Math.hypot(1, tanX),
    (-p.x - depth * tanX) / Math.hypot(1, tanX),
    (p.y - depth * tanY) / Math.hypot(1, tanY),
    (-p.y - depth * tanY) / Math.hypot(1, tanY),
    0.1 - depth, // in front of the near plane
    depth - 100, // beyond the far plane
  ];
  return outside.every((distance) => distance < r);
}

function along(p, d, s) {
  return { x: p.x + d.x * s, y: p.y + d.y * s, z: p.z + d.z * s };
}

const camera = new Camera({ position: { x: 0, y: 0, z: CAMERA_Z }, fov: FOV });

test("Camera.distanceToLeaveView: a sphere leaving sideways clears the side plane exactly", () => {
  const tanX = Math.tan(FOV / 2);
  const origin = { x: 0, y: 0, z: 0 };
  approx(camera.distanceToLeaveView(origin, { x: 1, y: 0, z: 0 }, 0, 1), CAMERA_Z * tanX, 1e-9);
  approx(
    camera.distanceToLeaveView(origin, { x: 1, y: 0, z: 0 }, 0.2, 1),
    CAMERA_Z * tanX + 0.2 * Math.hypot(1, tanX),
    1e-9,
  );
  approx(
    camera.distanceToLeaveView(origin, { x: -1, y: 0, z: 0 }, 0, 2),
    CAMERA_Z * tanX * 2,
    1e-9,
  );
});

test("Camera.distanceToLeaveView: in every direction, the returned distance is the first fully hidden one", () => {
  const starts = [
    { x: 0, y: 0, z: 0 },
    { x: 0.8, y: -0.3, z: 0.5 },
    { x: -1, y: 0.6, z: -1.5 },
  ];
  for (const start of starts) {
    for (let i = 0; i < 40; i++) {
      // Spread directions over the sphere (golden-angle spiral), including toward and away from the camera.
      const z = 1 - (2 * (i + 0.5)) / 40;
      const ring = Math.sqrt(1 - z * z);
      const angle = i * 2.399963;
      const direction = { x: ring * Math.cos(angle), y: ring * Math.sin(angle), z };
      for (const aspect of [0.6, 1, 2.2]) {
        const s = camera.distanceToLeaveView(start, direction, 0.25, aspect);
        assert.ok(Number.isFinite(s) && s > 0, `finite distance for ${JSON.stringify(direction)}`);
        assert.equal(partlyVisible(along(start, direction, s + 1e-6), 0.25, aspect), false);
        assert.equal(partlyVisible(along(start, direction, s - 1e-3), 0.25, aspect), true);
      }
    }
  }
});

test("leaveInObjectDirection: joins at path speed, then speeds up just enough to leave the view", () => {
  const seen = [];
  const leave = leaveInObjectDirection();
  const input = (elapsedMs) => ({
    delta: elapsedMs / 1000,
    position: { x: 0, y: 0, z: 0 },
    direction: { x: 1, y: 0, z: 0 },
    velocity: { x: 0.001, y: 0, z: 0 },
    durationMs: 1000,
    elapsedMs,
    phase: "outro",
    distanceToLeaveView: (direction) => {
      seen.push(direction);
      return 5;
    },
  });
  approx(leave(input(1)).position.x - leave(input(0)).position.x, 0.001, 1e-5, "join speed");
  approx(leave(input(1000)).position.x, 5, 1e-9, "out of view when the time ends");
  assert.deepEqual(seen[0], { x: 1, y: 0, z: 0 });
});

test("leaveInObjectDirection: a path already fast enough keeps its constant speed", () => {
  const leave = leaveInObjectDirection();
  const end = leave({
    delta: 1,
    position: { x: 0, y: 0, z: 0 },
    direction: { x: 1, y: 0, z: 0 },
    velocity: { x: 0.01, y: 0, z: 0 },
    durationMs: 1000,
    elapsedMs: 1000,
    phase: "outro",
    distanceToLeaveView: () => 5,
  });
  approx(end.position.x, 10, 1e-9);
});

test("enterFromObjectDirection: starts out of view and slows to path speed at the handoff", () => {
  const seen = [];
  const enter = enterFromObjectDirection();
  const input = (elapsedMs) => ({
    delta: elapsedMs / 1000,
    position: { x: 0, y: 0, z: 0 },
    direction: { x: 1, y: 0, z: 0 },
    velocity: { x: 0.001, y: 0, z: 0 },
    durationMs: 1000,
    elapsedMs,
    phase: "intro",
    distanceToLeaveView: (direction) => {
      seen.push(direction);
      return 4;
    },
  });
  approx(enter(input(0)).position.x, -4, 1e-9, "starts out of view");
  approx(enter(input(1000)).position.x, 0, 1e-12, "lands on the handoff");
  approx(enter(input(1000)).position.x - enter(input(999)).position.x, 0.001, 1e-5, "join speed");
  assert.deepEqual(seen[0], { x: -1, y: -0, z: -0 });
});

const PLANE_SIZE = 0.48;

/** The plane star trail's object layer, entered at 0 and stopped at `stopAt`. */
function stoppedPlane(stopAt) {
  const motion = figureEightMotion({ size: 0.72, periodMs: 6200 });
  const object = new ObjectMotionAnimation({ mesh: planeMesh, motion, size: PLANE_SIZE });
  object.enter(0);
  object.exit(stopAt);
  return { motion, emitter: object.trailEmitter(), outroMs: object.outroDurationMs };
}

test("a stopped object is out of view when its fly-out ends, wherever it was on the path", () => {
  for (let i = 0; i < 48; i++) {
    const stopAt = 2100 + (i * 6200) / 48;
    const { emitter, outroMs } = stoppedPlane(stopAt);
    const end = emitter.positionAt(stopAt + outroMs);
    assert.equal(
      partlyVisible(end, PLANE_SIZE / 2),
      false,
      `stopped at ${stopAt} ms, ended at ${JSON.stringify(end)}`,
    );
  }
});

test("stopping during the fly-in finishes it, then flies out from where the object is", () => {
  const { motion, emitter, outroMs } = stoppedPlane(500);
  const arrive = emitter.positionAt(2100);
  assert.ok(dist(arrive, motion.positionAt(2100)) < 1e-9, "lands on the path");
  assert.ok(dist(emitter.positionAt(2101), arrive) < 0.01, "no jump after the handoff");
  assert.equal(partlyVisible(emitter.positionAt(2100 + outroMs), PLANE_SIZE / 2), false);
});
