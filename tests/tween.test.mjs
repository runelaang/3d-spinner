import { test } from "node:test";
import assert from "node:assert/strict";
import { LittleTweenEngine } from "../dist/engines/little-tween-engine/little-tween-engine.js";

test("evaluate maps through the ease and clamps unless extrapolation is allowed", () => {
  const clamped = new LittleTweenEngine({ type: "easeInQuad" });
  assert.equal(clamped.evaluate(0.5), 0.25);
  assert.equal(clamped.evaluate(2), 1);
  const free = new LittleTweenEngine({ type: "linear", allowExtrapolation: true });
  assert.equal(free.evaluate(2), 2);
});
