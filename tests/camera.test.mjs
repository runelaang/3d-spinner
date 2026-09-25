import { test } from "node:test";
import assert from "node:assert/strict";
import { Camera } from "../dist/engines/little-3d-engine/core/camera.js";

test("cameras never share a position object", () => {
  const first = new Camera();
  const second = new Camera();
  first.options.position.x = 123;
  assert.equal(second.options.position.x, 0, "an existing camera is unaffected");
  assert.equal(new Camera().options.position.x, 0, "a later camera still gets the default");

  const given = { x: 1, y: 2, z: 3 };
  const third = new Camera({ position: given });
  given.x = 9;
  assert.equal(third.options.position.x, 1, "the caller's object is copied");
});
