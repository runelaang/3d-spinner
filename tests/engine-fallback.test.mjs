import { after, test } from "node:test";
import assert from "node:assert/strict";

const saved = {};
for (const name of ["document", "window", "ResizeObserver", "navigator"]) {
  saved[name] = Object.getOwnPropertyDescriptor(globalThis, name);
}

let observers = [];
let requestDevice;

class FakeCanvas {
  style = {};
  clientWidth = 100;
  clientHeight = 100;
  parent = undefined;
  getContext() {
    return null;
  }
  remove() {
    this.parent?.children.splice(this.parent.children.indexOf(this), 1);
    this.parent = undefined;
  }
}

class FakeTarget {
  children = [];
  appendChild(child) {
    child.parent = this;
    this.children.push(child);
  }
}

class FakeResizeObserver {
  connected = false;
  constructor() {
    observers.push(this);
  }
  observe() {
    this.connected = true;
  }
  disconnect() {
    this.connected = false;
  }
}

function define(name, value) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

define("document", { createElement: () => new FakeCanvas() });
define("window", { devicePixelRatio: 1 });
define("ResizeObserver", FakeResizeObserver);
define("navigator", {
  gpu: { requestAdapter: async () => ({ requestDevice: () => requestDevice() }) },
});

const { Little3dEngine } = await import("../dist/engines/little-3d-engine/little-3d-engine.js");

after(() => {
  for (const [name, descriptor] of Object.entries(saved)) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

function liveObservers() {
  return observers.filter((observer) => observer.connected).length;
}

test("auto falls back to Canvas 2D when WebGPU fails to initialize", async () => {
  observers = [];
  requestDevice = async () => {
    throw new Error("device lost");
  };
  const target = new FakeTarget();
  await new Little3dEngine().mount(target);
  assert.equal(target.children.length, 1);
  assert.equal(liveObservers(), 1);
});

test("an explicit backend does not fall back", async () => {
  observers = [];
  requestDevice = async () => {
    throw new Error("device lost");
  };
  const target = new FakeTarget();
  await assert.rejects(new Little3dEngine({ backend: "webgpu" }).mount(target), /device lost/);
  assert.equal(target.children.length, 0);
  assert.equal(liveObservers(), 0);
});

test("destroy during initialization stops retries and leaves nothing behind", async () => {
  observers = [];
  let fail;
  requestDevice = () =>
    new Promise((_, reject) => {
      fail = reject;
    });
  const target = new FakeTarget();
  const engine = new Little3dEngine();
  const mounting = engine.mount(target);
  while (!fail) await new Promise((resolve) => setImmediate(resolve));
  engine.destroy();
  fail(new Error("device lost"));
  await mounting;
  assert.equal(target.children.length, 0);
  assert.equal(liveObservers(), 0);
});
