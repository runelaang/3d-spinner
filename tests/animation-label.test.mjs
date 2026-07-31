import { test } from "node:test";
import assert from "node:assert/strict";
import { animationLabelOpacity } from "../dist/animation-label.js";

test("animation labels fade over intro and outro durations", () => {
  assert.equal(animationLabelOpacity(0, Infinity, 100, Infinity, 200), 0);
  assert.equal(animationLabelOpacity(100, 100, 100, Infinity, 200), 0);
  assert.equal(animationLabelOpacity(150, 100, 100, Infinity, 200), 0.5);
  assert.equal(animationLabelOpacity(200, 100, 100, Infinity, 200), 1);
  assert.equal(animationLabelOpacity(350, 100, 100, 300, 200), 0.75);
  assert.equal(animationLabelOpacity(500, 100, 100, 300, 200), 0);
});

test("zero-duration label transitions complete immediately", () => {
  assert.equal(animationLabelOpacity(100, 100, 0, Infinity, 0), 1);
  assert.equal(animationLabelOpacity(100, 100, 0, 100, 0), 0);
});
