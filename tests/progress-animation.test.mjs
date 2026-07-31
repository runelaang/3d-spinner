import { test } from "node:test";
import assert from "node:assert/strict";
import { ProgressAnimation } from "../dist/progress-animation.js";

test("ProgressAnimation advances through every observable lifecycle stage", () => {
  const animation = new ProgressAnimation({
    popDurationMs: 100,
    doneFadeDurationMs: 200,
    removeOnComplete: true,
  });

  const idle = animation.update(0, 0, 0);
  assert.equal(idle.scale, 0);
  assert.equal(idle.text, null);
  assert.equal(animation.isFinished(), false);

  animation.enter(0);
  const startPop = animation.update(0, 0.5, 0.5);
  assert.equal(startPop.scale, 0);
  assert.equal(startPop.text, "loading");

  const active = animation.update(100, 0.5, 0.5);
  assert.equal(active.scale, 0.5);
  assert.equal(active.text, "loading");

  animation.exit(100);
  const endPop = animation.update(150, 1, 1);
  assert.ok(endPop.scale > 1);
  assert.equal(endPop.text, "done");
  assert.equal(animation.isFinished(), false);

  const done = animation.update(200, 1, 1);
  assert.equal(done.scale, 0);
  assert.equal(done.text, "done");
  assert.equal(done.textOpacity, 0.65);
  assert.equal(animation.isFinished(), false);

  const fading = animation.update(300, 1, 1);
  assert.equal(fading.text, "done");
  assert.equal(fading.textOpacity, 0.325);
  assert.equal(animation.isFinished(), false);

  const finished = animation.update(400, 1, 1);
  assert.equal(finished.text, null);
  assert.equal(finished.hidden, true);
  assert.equal(animation.isFinished(), true);
});

test("ProgressAnimation can finish immediately when the done fade is disabled", () => {
  const animation = new ProgressAnimation({ popDurationMs: 0, doneFadeDurationMs: 0 });

  animation.enter(0);
  animation.update(0, 1, 1);
  animation.exit(0);
  const finished = animation.update(0, 1, 1);

  assert.equal(finished.text, null);
  assert.equal(finished.hidden, false);
  assert.equal(animation.isFinished(), true);
});
