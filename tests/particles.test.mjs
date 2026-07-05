import { test } from "node:test";
import assert from "node:assert/strict";
import { particleField } from "../dist/animations/particles.js";

const mag = (v) => Math.hypot(v.x, v.y, v.z);

test("particleField: a particle exists only between its spawn and its death", () => {
  const field = particleField({ rate: 10, lifeMs: 1000 });
  // Particle 3 spawns at 300ms and lives 1000ms.
  assert.equal(field.sample(3, 299), undefined);
  assert.ok(field.sample(3, 300));
  assert.ok(field.sample(3, 1299));
  assert.equal(field.sample(3, 1300), undefined);
  assert.equal(field.sample(-1, 500), undefined);
});

test("particleField: the stream is a pure function of time (seeded, replayable)", () => {
  const a = particleField({ seed: 7 });
  const b = particleField({ seed: 7 });
  const c = particleField({ seed: 8 });
  for (const t of [120, 700, 1500]) {
    assert.deepEqual(a.sample(2, t), b.sample(2, t));
    assert.deepEqual(a.sample(2, t), a.sample(2, t));
  }
  const differs = [120, 700, 1500].some(
    (t) => mag(a.sample(2, t).position) !== mag(c.sample(2, t).position),
  );
  assert.ok(differs, "different seeds should produce different particles");
});

test("particleField: opacity stays within 0..peak and fades in and out", () => {
  const peak = 0.8;
  const field = particleField({ rate: 10, lifeMs: 1000, opacity: peak });
  for (let age = 0; age < 1000; age += 25) {
    const { opacity } = field.sample(0, age);
    assert.ok(opacity >= 0 && opacity <= peak + 1e-9, `opacity out of range at ${age}ms`);
  }
  assert.equal(field.sample(0, 0).opacity, 0, "born invisible");
  assert.ok(field.sample(0, 999).opacity < 0.01, "dies invisible");
  assert.ok(field.sample(0, 500).opacity > 0.5 * peak, "visible mid-life");
});

test("particleField: live particles never exceed maxLive and never share a slot", () => {
  const field = particleField({ rate: 24, lifeMs: 1300 });
  for (const t of [0, 650, 1500, 4321, 9000]) {
    const live = [];
    const first = Math.max(0, Math.ceil((t - field.lifeMs) / field.spawnGapMs));
    for (let i = first; i * field.spawnGapMs <= t; i++) {
      if (field.sample(i, t)) live.push(i % field.maxLive);
    }
    assert.ok(live.length <= field.maxLive, `too many live particles at ${t}ms`);
    assert.equal(new Set(live).size, live.length, `slot collision at ${t}ms`);
  }
});

test("particleField: gravity accelerates; without it motion is straight", () => {
  const straight = particleField({ seed: 3, speed: 1 });
  const falling = particleField({ seed: 3, speed: 1, gravity: { x: 0, y: -2, z: 0 } });
  const early = straight.sample(0, 200).position;
  const late = straight.sample(0, 1600).position;
  // Straight: position is proportional to age, so direction never changes.
  assert.ok(Math.abs(late.x / late.y - early.x / early.y) < 1e-9);
  // Gravity only ever displaces by 0.5 * g * t^2.
  const drop = falling.sample(0, 1600).position;
  assert.ok(Math.abs(drop.y - (late.y - 2 * 0.5 * 1.6 * 1.6)) < 1e-9);
  assert.equal(drop.x, late.x);
});

test("particleField: direction and spread confine emission to the cone", () => {
  const direction = { x: 0, y: 1, z: 0 };
  const spread = 0.4;
  const field = particleField({ direction, spread, speed: 1 });
  for (let i = 0; i < 50; i++) {
    const p = field.sample(i, i * field.spawnGapMs + 100).position;
    const cos = p.y / mag(p);
    assert.ok(cos >= Math.cos(spread) - 1e-9, `particle ${i} left the cone`);
  }
});

test("particleField: alignToMotion follows velocity as gravity turns a particle", () => {
  const field = particleField({
    direction: { x: 1, y: 1, z: 0 },
    spread: 0,
    speed: 1,
    gravity: { x: 0, y: -2, z: 0 },
    alignToMotion: true,
  });
  const upward = field.sample(0, 100).roll;
  const downward = field.sample(0, 1000).roll;
  assert.ok(upward > 0, "starts angled upward");
  assert.ok(downward < 0, "turns downward under gravity");
});

test("particleField: invalid rate or lifeMs throws RangeError", () => {
  assert.throws(() => particleField({ rate: 0 }), RangeError);
  assert.throws(() => particleField({ rate: Infinity }), RangeError);
  assert.throws(() => particleField({ lifeMs: -5 }), RangeError);
});
