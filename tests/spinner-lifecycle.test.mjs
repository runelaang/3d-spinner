import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createSpinner } from "../dist/index.js";

const originalHTMLElement = globalThis.HTMLElement;
const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

class FakeHTMLElement {}

let frames;
let nextFrameId;
let frameTime;

function resetFrameScheduler() {
  frames = new Map();
  nextFrameId = 1;
  frameTime = performance.now() + 16;
  globalThis.HTMLElement = FakeHTMLElement;
  globalThis.requestAnimationFrame = (callback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => {
    frames.delete(id);
  };
}

function restoreGlobal(name, value) {
  if (value === undefined) delete globalThis[name];
  else globalThis[name] = value;
}

function runNextFrame() {
  assert.equal(frames.size, 1, "expected exactly one scheduled animation frame");
  const [id, callback] = frames.entries().next().value;
  frames.delete(id);
  callback(frameTime);
  frameTime += 16;
}

function runUntil(predicate, maximumFrames = 100) {
  for (let i = 0; i < maximumFrames; i++) {
    runNextFrame();
    if (predicate()) return;
  }
  assert.fail(`condition was not reached within ${maximumFrames} animation frames`);
}

function fakeAnimation() {
  return {
    mounts: [],
    enters: [],
    exits: [],
    renders: [],
    destroyCalls: 0,
    finished: false,
    mount(target) {
      this.mounts.push(target);
    },
    enter(now) {
      this.enters.push(now);
    },
    exit(now) {
      this.exits.push(now);
    },
    render(now, frame) {
      this.renders.push({ now, frame });
    },
    isFinished() {
      return this.finished;
    },
    destroy() {
      this.destroyCalls++;
    },
  };
}

beforeEach(resetFrameScheduler);

after(() => {
  restoreGlobal("HTMLElement", originalHTMLElement);
  restoreGlobal("requestAnimationFrame", originalRequestAnimationFrame);
  restoreGlobal("cancelAnimationFrame", originalCancelAnimationFrame);
});

test("createSpinner mounts once and completes reported progress after the outro", () => {
  const target = new FakeHTMLElement();
  const animation = fakeAnimation();
  const spinner = createSpinner(target, { animation });

  assert.deepEqual(animation.mounts, [target]);
  assert.equal(frames.size, 1);

  spinner.setProgress(1);
  runUntil(() => animation.exits.length === 1);

  assert.equal(animation.enters.length, 1);
  assert.equal(animation.exits.length, 1);
  assert.equal(animation.renders.at(-1).frame.progress, 1);
  assert.equal(frames.size, 1);

  animation.finished = true;
  runNextFrame();
  assert.equal(frames.size, 0);
});

test("timeout and until complete a progress spinner", async (t) => {
  for (const [name, deadline] of [
    ["timeout", { timeout: 0 }],
    ["until", { until: new Date(0) }],
  ]) {
    await t.test(name, () => {
      resetFrameScheduler();
      const animation = fakeAnimation();
      createSpinner(new FakeHTMLElement(), { animation, ...deadline });

      runUntil(() => animation.exits.length === 1);

      assert.equal(animation.enters.length, 1);
      assert.equal(animation.exits.length, 1);
      assert.equal(animation.renders.at(-1).frame.targetProgress, 1);
    });
  }
});

test("indeterminate stop plays one outro and keeps the animation mounted", () => {
  const animation = fakeAnimation();
  const spinner = createSpinner(new FakeHTMLElement(), {
    type: "indeterminate",
    animation,
  });

  runNextFrame();
  spinner.stop();
  spinner.stop();

  assert.equal(animation.enters.length, 1);
  assert.equal(animation.exits.length, 1);
  assert.equal(animation.destroyCalls, 0);

  animation.finished = true;
  runNextFrame();
  assert.equal(frames.size, 0);
  assert.equal(animation.destroyCalls, 0);
});

test("destroy immediately cancels rendering and is idempotent", () => {
  const animation = fakeAnimation();
  const spinner = createSpinner(new FakeHTMLElement(), {
    type: "indeterminate",
    animation,
  });

  spinner.destroy();
  spinner.destroy();

  assert.equal(frames.size, 0);
  assert.equal(animation.enters.length, 0);
  assert.equal(animation.renders.length, 0);
  assert.equal(animation.destroyCalls, 1);
});

test("invalid indeterminate periods fail before mounting", () => {
  for (const periodMs of [0, -1, NaN, Infinity, -Infinity]) {
    const animation = fakeAnimation();
    assert.throws(
      () =>
        createSpinner(new FakeHTMLElement(), {
          type: "indeterminate",
          animation,
          periodMs,
        }),
      { name: "RangeError", message: /periodMs/ },
    );
    assert.equal(animation.mounts.length, 0);
    assert.equal(frames.size, 0);
  }
});

test("until uses wall-clock time and the earlier of timeout and until wins", async (t) => {
  await t.test("future until completes at its deadline, not before", () => {
    const animation = fakeAnimation();
    createSpinner(new FakeHTMLElement(), {
      animation,
      until: new Date(Date.now() + 200),
    });
    const firstFrame = frameTime;
    runNextFrame();
    assert.equal(animation.renders.at(-1).frame.targetProgress, 0);
    runUntil(() => animation.renders.at(-1).frame.targetProgress === 1, 30);
    assert.ok(animation.renders.at(-1).now >= firstFrame + 150, "deadline fired too early");
  });

  await t.test("past until completes on the first frame", () => {
    resetFrameScheduler();
    const animation = fakeAnimation();
    createSpinner(new FakeHTMLElement(), {
      animation,
      until: new Date(Date.now() - 1000),
    });
    runNextFrame();
    assert.equal(animation.renders.at(-1).frame.targetProgress, 1);
  });

  await t.test("earlier timeout beats later until", () => {
    resetFrameScheduler();
    const animation = fakeAnimation();
    createSpinner(new FakeHTMLElement(), {
      animation,
      timeout: 0,
      until: new Date(Date.now() + 60_000),
    });
    runNextFrame();
    assert.equal(animation.renders.at(-1).frame.targetProgress, 1);
  });

  await t.test("earlier until beats later timeout", () => {
    resetFrameScheduler();
    const animation = fakeAnimation();
    createSpinner(new FakeHTMLElement(), {
      animation,
      timeout: 60_000,
      until: new Date(Date.now() - 1000),
    });
    runNextFrame();
    assert.equal(animation.renders.at(-1).frame.targetProgress, 1);
  });
});

test("an invalid until Date fails before mounting", () => {
  const animation = fakeAnimation();
  assert.throws(
    () => createSpinner(new FakeHTMLElement(), { animation, until: new Date(NaN) }),
    { name: "RangeError", message: /until/ },
  );
  assert.equal(animation.mounts.length, 0);
  assert.equal(frames.size, 0);
});

/** Run frames at `stepMs` intervals for `durationMs` after the first frame and return the progress. */
function progressAfter(stepMs, durationMs) {
  resetFrameScheduler();
  const animation = fakeAnimation();
  const spinner = createSpinner(new FakeHTMLElement(), { animation, progress: 0.001 });
  runNextFrame();
  spinner.setProgress(1);
  const end = frameTime - 16 + durationMs;
  while (frameTime - 16 + stepMs <= end) {
    frameTime = frameTime - 16 + stepMs;
    runNextFrame();
  }
  return animation.renders.at(-1).frame.progress;
}

test("progress smoothing does not depend on the frame rate", () => {
  const at60 = progressAfter(1000 / 60, 250);
  for (const fps of [30, 144]) {
    const value = progressAfter(1000 / fps, 250);
    assert.ok(Math.abs(value - at60) < 0.03, `${fps} fps gave ${value}, 60 fps gave ${at60}`);
  }
  assert.ok(at60 > 0.8 && at60 < 1, `unexpected 60 fps progress ${at60}`);
});

test("progress smoothing stays finite across irregular frames and long gaps", () => {
  const animation = fakeAnimation();
  const spinner = createSpinner(new FakeHTMLElement(), { animation, progress: 0.001 });
  runNextFrame();
  spinner.setProgress(1);
  for (const gap of [3, 40, 7, 5000, 0, 11]) {
    frameTime = frameTime - 16 + gap;
    if (frames.size) runNextFrame();
    const { progress } = animation.renders.at(-1).frame;
    assert.ok(Number.isFinite(progress) && progress >= 0 && progress <= 1);
  }
  assert.equal(animation.renders.at(-1).frame.progress, 1);
  assert.equal(animation.exits.length, 1);
});
