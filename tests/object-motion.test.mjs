import { test } from "node:test";
import assert from "node:assert/strict";
import { ObjectMotionAnimation } from "../dist/animations/object-motion.js";
import { cube } from "../dist/engines/little-3d-engine/little-3d-engine.js";
import { circleMotion } from "../dist/motion/motion.js";

test("a tail count that is not finite throws a RangeError", () => {
  for (const count of [Infinity, -Infinity, NaN]) {
    assert.throws(
      () => new ObjectMotionAnimation({ mesh: cube(1), motion: circleMotion(), tail: { count } }),
      RangeError,
    );
  }
  assert.doesNotThrow(
    () => new ObjectMotionAnimation({ mesh: cube(1), motion: circleMotion(), tail: { count: 3 } }),
  );
});
