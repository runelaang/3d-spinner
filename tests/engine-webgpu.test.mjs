import { after, test } from "node:test";
import assert from "node:assert/strict";

// A fake WebGPU complete enough for the WebGPU renderer to start, so a device lost
// after mounting can be simulated. There is no WebGL2 here, so "auto" tries
// WebGPU and then Canvas 2D, which gets a stub context.

const saved = {};
const globals = [
  "document",
  "window",
  "ResizeObserver",
  "navigator",
  "GPUShaderStage",
  "GPUBufferUsage",
  "GPUTextureUsage",
];
for (const name of globals) saved[name] = Object.getOwnPropertyDescriptor(globalThis, name);

let devices = [];
let observers = [];

function fakeDevice() {
  let resolveLost;
  const device = {
    destroyed: false,
    lost: new Promise((resolve) => {
      resolveLost = resolve;
    }),
    queue: { writeBuffer() {}, writeTexture() {}, copyExternalImageToTexture() {}, submit() {} },
    createShaderModule: () => ({}),
    createBindGroupLayout: () => ({}),
    createPipelineLayout: () => ({}),
    createRenderPipelineAsync: async () => ({ getBindGroupLayout: () => ({}) }),
    createTexture: () => ({ createView: () => ({}), destroy() {} }),
    createBuffer: () => ({ destroy() {} }),
    createSampler: () => ({}),
    createBindGroup: () => ({}),
    pushErrorScope() {},
    popErrorScope: async () => null,
    destroy() {
      this.destroyed = true;
      resolveLost({ reason: "destroyed", message: "" });
    },
    /** Test hook: the GPU stops working, as after a driver reset. */
    lose(message) {
      resolveLost({ reason: "unknown", message });
    },
  };
  devices.push(device);
  return device;
}

class FakeCanvas {
  style = {};
  clientWidth = 100;
  clientHeight = 100;
  parent = undefined;
  getContext(type) {
    if (type === "webgpu") {
      return { configure() {}, getCurrentTexture: () => ({ createView: () => ({}) }) };
    }
    return type === "2d" ? { setTransform() {} } : null;
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
  gpu: {
    requestAdapter: async () => ({ requestDevice: async () => fakeDevice() }),
    getPreferredCanvasFormat: () => "bgra8unorm",
  },
});
define("GPUShaderStage", { VERTEX: 1, FRAGMENT: 2 });
define("GPUBufferUsage", { VERTEX: 32, UNIFORM: 64, COPY_DST: 8 });
define("GPUTextureUsage", { COPY_DST: 2, TEXTURE_BINDING: 4, RENDER_ATTACHMENT: 16 });

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

/** Let pending promises and dynamic imports run until `condition` holds. */
async function until(condition) {
  for (let i = 0; i < 200 && !condition(); i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.ok(condition(), "condition was not reached");
}

test("auto switches to the next backend when the WebGPU device is lost after mounting", async () => {
  devices = [];
  observers = [];
  const target = new FakeTarget();
  const engine = new Little3dEngine();
  await engine.mount(target);
  const [device] = devices;
  const first = target.children[0];
  assert.equal(devices.length, 1, "WebGPU started");

  device.lose("gpu reset");
  await until(() => target.children.length === 1 && target.children[0] !== first);
  assert.equal(device.destroyed, true, "the lost renderer was released");
  assert.equal(liveObservers(), 1);

  engine.destroy();
  assert.equal(target.children.length, 0);
  assert.equal(liveObservers(), 0);
});

test("a pinned backend whose device is lost removes its canvas and warns", async (t) => {
  devices = [];
  observers = [];
  const warnings = [];
  t.mock.method(console, "warn", (message) => warnings.push(message));
  const target = new FakeTarget();
  const engine = new Little3dEngine({ backend: "webgpu" });
  await engine.mount(target);

  devices[0].lose("gpu reset");
  await until(() => target.children.length === 0);
  assert.equal(liveObservers(), 0);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /stopped working \(gpu reset\); no other backend is left/);
  engine.destroy();
});

test("destroying the engine is not reported as a lost device", async (t) => {
  devices = [];
  observers = [];
  const warnings = [];
  t.mock.method(console, "warn", (message) => warnings.push(message));
  const target = new FakeTarget();
  const engine = new Little3dEngine();
  await engine.mount(target);
  engine.destroy();
  await until(() => devices[0].destroyed);
  for (let i = 0; i < 20; i++) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(target.children.length, 0, "no replacement canvas appeared");
  assert.deepEqual(warnings, []);
});

test("a validation error during WebGPU setup counts as a failed start", async () => {
  devices = [];
  observers = [];
  const gpu = globalThis.navigator.gpu;
  const requestAdapter = gpu.requestAdapter;
  gpu.requestAdapter = async () => ({
    requestDevice: async () => {
      const device = fakeDevice();
      device.popErrorScope = async () => ({ message: "bad shader" });
      return device;
    },
  });
  try {
    const target = new FakeTarget();
    await new Little3dEngine().mount(target);
    assert.equal(devices[0].destroyed, true, "the broken device was released");
    assert.equal(target.children.length, 1, "auto fell back");
    assert.equal(liveObservers(), 1);

    await assert.rejects(
      new Little3dEngine({ backend: "webgpu" }).mount(new FakeTarget()),
      /WebGPU setup failed: bad shader/,
    );
  } finally {
    gpu.requestAdapter = requestAdapter;
  }
});
