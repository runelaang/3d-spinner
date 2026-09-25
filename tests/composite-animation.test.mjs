import test from "node:test";
import assert from "node:assert/strict";
import { CompositeAnimation } from "../dist/composite-animation.js";

function fakeAnimation() {
  const calls = [];
  let finished = false;
  return {
    calls,
    animation: {
      mount() {
        calls.push("mount");
      },
      enter() {
        calls.push("enter");
      },
      exit() {
        calls.push("exit");
        finished = true;
      },
      render() {
        calls.push("render");
      },
      isFinished() {
        return finished;
      },
      destroy() {
        calls.push("destroy");
      },
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

test("CompositeAnimation mount resolves after every layer and keeps a positioned host", async () => {
  const saved = { document: globalThis.document, getComputedStyle: globalThis.getComputedStyle };
  globalThis.document = { createElement: () => ({ style: {}, remove() {} }) };
  globalThis.getComputedStyle = (element) => ({ position: element.computedPosition });
  try {
    const release = [];
    const layer = () => ({
      mount: () => new Promise((resolve) => release.push(resolve)),
      enter() {},
      exit() {},
      render() {},
      isFinished: () => true,
      destroy() {},
    });
    const host = (computedPosition) => ({
      style: {},
      computedPosition,
      children: [],
      appendChild(child) {
        this.children.push(child);
      },
    });

    const fixed = host("fixed");
    let done = false;
    const mounting = new CompositeAnimation([layer(), layer()]).mount(fixed).then(() => {
      done = true;
    });
    assert.equal(fixed.style.position, undefined, "a fixed host keeps its position");
    assert.equal(fixed.children.length, 2);
    release[0]();
    await Promise.resolve();
    assert.equal(done, false, "waits for the second layer");
    release[1]();
    await mounting;
    assert.equal(done, true);

    const plain = host("static");
    new CompositeAnimation([]).mount(plain);
    assert.equal(plain.style.position, "relative", "a static host becomes a positioning context");
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete globalThis[name];
      else globalThis[name] = value;
    }
  }
});

test("CompositeAnimation rejects when a layer's mount throws at once, after mounting the others", async () => {
  const saved = { document: globalThis.document, getComputedStyle: globalThis.getComputedStyle };
  globalThis.document = { createElement: () => ({ style: {}, remove() {} }) };
  globalThis.getComputedStyle = () => ({ position: "relative" });
  try {
    const first = fakeAnimation();
    const broken = fakeAnimation();
    broken.animation.mount = () => {
      throw new Error("broken layer");
    };
    const host = { style: {}, children: [], appendChild: (child) => host.children.push(child) };
    const mounting = new CompositeAnimation([first.animation, broken.animation]).mount(host);
    await assert.rejects(mounting, /broken layer/);
    assert.deepEqual(first.calls, ["mount"]);
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete globalThis[name];
      else globalThis[name] = value;
    }
  }
});

test("CompositeAnimation destroys every layer when one throws, then rethrows", () => {
  const broken = fakeAnimation();
  broken.animation.destroy = () => {
    throw new Error("broken destroy");
  };
  const second = fakeAnimation();
  const third = fakeAnimation();
  const composite = new CompositeAnimation([broken.animation, second.animation, third.animation]);
  assert.throws(() => composite.destroy(), /broken destroy/);
  assert.deepEqual(second.calls, ["destroy"]);
  assert.deepEqual(third.calls, ["destroy"]);
});
