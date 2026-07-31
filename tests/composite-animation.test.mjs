import test from "node:test";
import assert from "node:assert/strict";
import { CompositeAnimation } from "../dist/composite-animation.js";

function fakeAnimation() {
  const calls = [];
  let finished = false;
  return {
    calls,
    animation: {
      mount() { calls.push("mount"); },
      enter() { calls.push("enter"); },
      exit() { calls.push("exit"); finished = true; },
      render() { calls.push("render"); },
      isFinished() { return finished; },
      destroy() { calls.push("destroy"); },
    },
  };
}

test("CompositeAnimation delegates lifecycle and waits for every layer", () => {
  const first = fakeAnimation();
  const second = fakeAnimation();
  const composite = new CompositeAnimation([first.animation, second.animation]);

  composite.enter(0);
  composite.render(10, { progress: 0.5, targetProgress: 0.5, indeterminate: true });
  assert.equal(composite.isFinished(), false);
  composite.exit(20);
  assert.equal(composite.isFinished(), true);
  composite.destroy();

  assert.deepEqual(first.calls, ["enter", "render", "exit", "destroy"]);
  assert.deepEqual(second.calls, ["enter", "render", "exit", "destroy"]);
});

test("CompositeAnimation exposes adjustable settings from its layers", () => {
  const layer = fakeAnimation().animation;
  layer.getQualitySettings = () => [{ name: "trails", requested: 8, minimum: 1, current: 8, set() {} }];
  const composite = new CompositeAnimation([layer]);
  assert.equal(composite.getQualitySettings()[0].name, "trails");
});
