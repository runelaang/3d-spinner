import { after, test } from "node:test";
import assert from "node:assert/strict";

const saved = {};
for (const name of ["document", "window", "ResizeObserver", "navigator"]) {
  saved[name] = Object.getOwnPropertyDescriptor(globalThis, name);
}

let observers = [];
let requestDevice;
let canvas2dAvailable = true;

const fake2dContext = { setTransform() {} };

class FakeCanvas {
  style = {};
  clientWidth = 100;
  clientHeight = 100;
  parent = undefined;
  getContext(type) {
    return type === "2d" && canvas2dAvailable ? fake2dContext : null;
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

test("auto rejects with every backend's error when none can start", async () => {
  observers = [];
  requestDevice = async () => {
    throw new Error("device lost");
  };
  canvas2dAvailable = false;
  try {
    const target = new FakeTarget();
    await assert.rejects(
      new Little3dEngine().mount(target),
      /no renderer could start \(webgpu: .*device lost; canvas2d: .*Canvas 2D/,
    );
    assert.equal(target.children.length, 0);
    assert.equal(liveObservers(), 0);
  } finally {
    canvas2dAvailable = true;
  }
});

test("a WebGPU init failure after the device is acquired destroys the device", async () => {
  observers = [];
  const device = {
    destroyed: false,
    destroy() {
      this.destroyed = true;
    },
  };
  requestDevice = async () => device;
  const target = new FakeTarget();
  await new Little3dEngine().mount(target);
  assert.equal(device.destroyed, true);
  assert.equal(target.children.length, 1, "fell back to Canvas 2D");
});

test("mounting again while mounting or mounted rejects", async () => {
  observers = [];
  requestDevice = async () => {
    throw new Error("device lost");
  };
  const target = new FakeTarget();
  const engine = new Little3dEngine();
  const first = engine.mount(target);
  await assert.rejects(engine.mount(target), /already mounted/);
  await first;
  await assert.rejects(engine.mount(target), /already mounted/);
  assert.equal(target.children.length, 1);
  assert.equal(liveObservers(), 1);
  engine.destroy();
});

test("a destroyed engine can be mounted again", async () => {
  observers = [];
  requestDevice = async () => {
    throw new Error("device lost");
  };
  const first = new FakeTarget();
  const second = new FakeTarget();
  const engine = new Little3dEngine();
  await engine.mount(first);
  engine.destroy();
  await engine.mount(second);
  assert.equal(first.children.length, 0);
  assert.equal(second.children.length, 1);
  assert.equal(liveObservers(), 1);
  engine.destroy();
});

test("removing the last instance of a mesh releases it from the renderer", async () => {
  observers = [];
  const released = [];
  const renderer = {
    init() {},
    resize() {},
    render() {},
    destroy() {},
    releaseMesh(mesh) {
      released.push(mesh);
    },
  };
  const engine = new Little3dEngine({ backend: () => renderer });
  const shared = { vertices: [], faces: [] };
  const other = { vertices: [], faces: [] };
  const first = engine.add(shared);
  const second = engine.add(shared);
  const third = engine.add(other);
  await engine.mount(new FakeTarget());
  first.remove();
  assert.deepEqual(released, [], "another instance still uses the mesh");
  second.remove();
  second.remove();
  third.remove();
  assert.deepEqual(released, [shared, other]);
  engine.destroy();
});
