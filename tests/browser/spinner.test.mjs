import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { startBrowser } from "./harness.mjs";

// Real mounting and drawing in headless Chromium, which the DOM-free unit tests
// cannot cover. Run with `npm run test:browser` after `npx playwright install chromium`.

let browser;
before(async () => {
  browser = await startBrowser();
});
after(async () => {
  await browser?.close();
});

/** Init script: WebGPU looks available but cannot create a device. */
function failingWebGPU() {
  Object.defineProperty(navigator, "gpu", {
    configurable: true,
    value: {
      requestAdapter: async () => ({
        requestDevice: async () => {
          throw new Error("device lost");
        },
      }),
      getPreferredCanvasFormat: () => "bgra8unorm",
    },
  });
}

/** Init script: WebGPU never finishes creating a device. */
function hangingWebGPU() {
  Object.defineProperty(navigator, "gpu", {
    configurable: true,
    value: {
      requestAdapter: async () => ({ requestDevice: () => new Promise(() => {}) }),
      getPreferredCanvasFormat: () => "bgra8unorm",
    },
  });
}

/**
 * Init script: no backend can start (WebGPU fails and every canvas refuses a
 * context). Init scripts run in the page, so this cannot call the helpers above.
 */
function nothingWorks() {
  Object.defineProperty(navigator, "gpu", {
    configurable: true,
    value: {
      requestAdapter: async () => ({
        requestDevice: async () => {
          throw new Error("device lost");
        },
      }),
      getPreferredCanvasFormat: () => "bgra8unorm",
    },
  });
  HTMLCanvasElement.prototype.getContext = () => null;
}

/** Page check: can this browser create a WebGL2 context at all? (CI machines may lack one.) */
async function hasWebGL2(page) {
  return page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")));
}

test("Canvas 2D and WebGL draw the scene", async (t) => {
  const { page, messages } = await browser.open();
  const backends = (await hasWebGL2(page)) ? ["canvas2d", "webgl"] : ["canvas2d"];
  if (backends.length === 1) t.diagnostic("no WebGL2 in this browser; only Canvas 2D checked");
  const lit = await page.evaluate(async (backends) => {
    const { Little3dEngine, cube } =
      await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    const out = {};
    for (const backend of backends) {
      const host = document.createElement("div");
      host.style.cssText = "width:160px;height:160px";
      document.body.appendChild(host);
      const engine = new Little3dEngine({ backend });
      engine.add(cube(1)).transform.rotation.y = 0.6;
      await engine.mount(host);
      engine.render();
      out[backend] = litPixels(host.querySelector("canvas"));
      engine.destroy();
      host.remove();
    }
    return out;
  }, backends);
  for (const backend of backends) {
    assert.ok(lit[backend] > 500, `${backend} drew ${lit[backend]} pixels`);
  }
  assert.deepEqual(messages, []);
});

test("WebGPU draws the scene when the browser has an adapter", async (t) => {
  const { page, messages } = await browser.open();
  const lit = await page.evaluate(async () => {
    if (!(await navigator.gpu?.requestAdapter())) return null;
    const { Little3dEngine, cube } =
      await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    const host = document.createElement("div");
    host.style.cssText = "width:160px;height:160px";
    document.body.appendChild(host);
    const engine = new Little3dEngine({ backend: "webgpu" });
    engine.add(cube(1)).transform.rotation.y = 0.6;
    await engine.mount(host);
    engine.render();
    const count = litPixels(host.querySelector("canvas"));
    engine.destroy();
    return count;
  });
  if (lit === null) {
    t.skip("no WebGPU adapter in this browser");
    return;
  }
  assert.ok(lit > 500, `webgpu drew ${lit} pixels`);
  assert.deepEqual(messages, []);
});

test("auto falls back and still draws when WebGPU fails to start", async () => {
  const { page, messages } = await browser.open(failingWebGPU);
  const result = await page.evaluate(async () => {
    const { Little3dEngine, cube } =
      await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    const host = document.createElement("div");
    host.style.cssText = "width:160px;height:160px";
    document.body.appendChild(host);
    const engine = new Little3dEngine();
    engine.add(cube(1)).transform.rotation.y = 0.6;
    await engine.mount(host);
    engine.render();
    return {
      canvases: host.querySelectorAll("canvas").length,
      lit: litPixels(host.querySelector("canvas")),
    };
  });
  assert.equal(result.canvases, 1);
  assert.ok(result.lit > 500, `fallback drew ${result.lit} pixels`);
  assert.deepEqual(messages, []);
});

test("when no backend starts, ready rejects and the host content is untouched", async () => {
  const { page } = await browser.open(nothingWorks);
  const result = await page.evaluate(async () => {
    const { createSpinner } = await import("/dist/index.js");
    const { SpinAnimation } = await import("/dist/animations/spin.js");
    const host = document.createElement("div");
    host.innerHTML = "<p id='keep'>Your content</p>";
    document.body.appendChild(host);
    const spinner = createSpinner(host, { type: "indeterminate", animation: new SpinAnimation() });
    const error = await spinner.ready.then(
      () => "resolved",
      (reason) => reason.message,
    );
    const during = {
      keep: host.querySelector("#keep")?.textContent,
      canvases: host.querySelectorAll("canvas").length,
    };
    spinner.destroy();
    return { error, during, after: [...host.children].map((child) => child.id) };
  });
  assert.match(result.error, /no renderer could start/);
  assert.deepEqual(result.during, { keep: "Your content", canvases: 0 });
  assert.deepEqual(result.after, ["keep"]);
});

test("destroy during renderer setup leaves only the host's own content", async () => {
  const { page } = await browser.open(hangingWebGPU);
  const children = await page.evaluate(async () => {
    const { createSpinner } = await import("/dist/index.js");
    const { SpinAnimation } = await import("/dist/animations/spin.js");
    const host = document.createElement("div");
    host.innerHTML = "<p id='keep'>Your content</p>";
    document.body.appendChild(host);
    const spinner = createSpinner(host, {
      type: "indeterminate",
      animation: new SpinAnimation({ backend: "webgpu" }),
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    spinner.destroy();
    return [...host.children].map((child) => child.id || child.tagName);
  });
  assert.deepEqual(children, ["keep"]);
});

test("a positioned host keeps its position and its children", async () => {
  const { page } = await browser.open();
  const result = await page.evaluate(async () => {
    const { createSpinner } = await import("/dist/index.js");
    const { planeStarTrail } = await import("/dist/prefabs/prefabs.js");
    const style = document.createElement("style");
    style.textContent = ".overlay { position: fixed; inset: 0; }";
    document.head.appendChild(style);
    const fixed = document.createElement("div");
    fixed.className = "overlay";
    fixed.innerHTML = "<p id='keep'>Your content</p>";
    const plain = document.createElement("div");
    plain.style.cssText = "width:120px;height:120px";
    document.body.append(fixed, plain);
    const spinners = [
      createSpinner(fixed, planeStarTrail()),
      createSpinner(plain, planeStarTrail()),
    ];
    await Promise.all(spinners.map((spinner) => spinner.ready));
    const out = {
      fixedPosition: getComputedStyle(fixed).position,
      fixedInline: fixed.style.position,
      plainPosition: getComputedStyle(plain).position,
      kept: Boolean(fixed.querySelector("#keep")),
    };
    spinners.forEach((spinner) => spinner.destroy());
    out.afterDestroy = [...fixed.children].map((child) => child.id);
    return out;
  });
  assert.deepEqual(result, {
    fixedPosition: "fixed",
    fixedInline: "",
    plainPosition: "relative",
    kept: true,
    afterDestroy: ["keep"],
  });
});

test("repeated mount and destroy releases every WebGL context", async (t) => {
  const { page, messages } = await browser.open();
  if (!(await hasWebGL2(page))) {
    t.skip("no WebGL2 in this browser");
    return;
  }
  const leftover = await page.evaluate(async () => {
    const { createSpinner } = await import("/dist/index.js");
    const { SpinAnimation } = await import("/dist/animations/spin.js");
    const host = document.createElement("div");
    host.style.cssText = "width:120px;height:120px";
    document.body.appendChild(host);
    for (let i = 0; i < 24; i++) {
      const spinner = createSpinner(host, {
        type: "indeterminate",
        animation: new SpinAnimation({ backend: "webgl" }),
      });
      await spinner.ready;
      spinner.destroy();
    }
    return document.querySelectorAll("canvas").length;
  });
  assert.equal(leftover, 0);
  assert.deepEqual(
    messages.filter((text) => /WebGL/i.test(text)),
    [],
  );
});

test("the progress bar reports progress once, even when layers stack labels", async () => {
  const { page } = await browser.open();
  const result = await page.evaluate(async () => {
    const { createSpinner } = await import("/dist/index.js");
    const { ghostTrain } = await import("/dist/prefabs/prefabs.js");
    const host = document.createElement("div");
    host.style.cssText = "width:160px;height:160px";
    document.body.appendChild(host);
    const spinner = createSpinner(host, ghostTrain({ ariaLabel: "Syncing" }));
    await spinner.ready;
    spinner.setProgress(0.5);
    const bar = host.querySelector("[role=progressbar]");
    await new Promise((resolve) => {
      const poll = () =>
        bar.getAttribute("aria-valuenow") === "50" ? resolve() : setTimeout(poll, 20);
      poll();
    });
    const out = {
      bars: host.querySelectorAll("[role=progressbar]").length,
      name: bar.getAttribute("aria-label"),
      liveRegions: host.querySelectorAll("[role=status], [aria-live]").length,
    };
    spinner.destroy();
    out.barsAfterDestroy = host.querySelectorAll("[role=progressbar]").length;
    return out;
  });
  assert.deepEqual(result, { bars: 1, name: "Syncing", liveRegions: 0, barsAfterDestroy: 0 });
});

test("a textured particle layer falls back and still draws when WebGPU fails to start", async () => {
  const { page, messages } = await browser.open(failingWebGPU);
  const result = await page.evaluate(async () => {
    const { ParticlesAnimation } = await import("/dist/animations/particles.js");
    const { starTexture } = await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    const host = document.createElement("div");
    host.style.cssText = "width:160px;height:160px";
    document.body.appendChild(host);
    const particles = new ParticlesAnimation({ texture: starTexture(), size: 0.4, seed: 3 });
    await particles.mount(host);
    particles.enter(0);
    particles.render(1000, { progress: 0, targetProgress: 0, indeterminate: true });
    const out = {
      canvases: host.querySelectorAll("canvas").length,
      lit: litPixels(host.querySelector("canvas")),
    };
    particles.destroy();
    return out;
  });
  assert.equal(result.canvases, 1);
  assert.ok(result.lit > 200, `fallback drew ${result.lit} pixels`);
  assert.deepEqual(messages, []);
});

test("ready settles when the spinner is destroyed during a setup that never finishes", async () => {
  const { page } = await browser.open(hangingWebGPU);
  const results = await page.evaluate(async () => {
    const { createSpinner } = await import("/dist/index.js");
    const { SpinAnimation } = await import("/dist/animations/spin.js");
    const { planeStarTrail } = await import("/dist/prefabs/prefabs.js");
    const out = {};
    const cases = {
      spin: () => ({ type: "indeterminate", animation: new SpinAnimation({ backend: "webgpu" }) }),
      planeStarTrail: () => planeStarTrail({ backend: "webgpu" }),
    };
    for (const [name, options] of Object.entries(cases)) {
      const host = document.createElement("div");
      host.innerHTML = "<p id='keep'>Your content</p>";
      document.body.appendChild(host);
      const spinner = createSpinner(host, options());
      await new Promise((resolve) => setTimeout(resolve, 100));
      spinner.destroy();
      const settled = await Promise.race([
        spinner.ready.then(
          () => "resolved",
          () => "rejected",
        ),
        new Promise((resolve) => setTimeout(() => resolve("still pending"), 1000)),
      ]);
      out[name] = { settled, children: [...host.children].map((child) => child.id) };
    }
    return out;
  });
  for (const name of ["spin", "planeStarTrail"]) {
    assert.deepEqual(results[name], { settled: "resolved", children: ["keep"] }, name);
  }
});

test("WebGL keeps a half-transparent surface half transparent on a clear canvas", async (t) => {
  const { page, messages } = await browser.open();
  if (!(await hasWebGL2(page))) {
    t.skip("no WebGL2 in this browser");
    return;
  }
  const alpha = await page.evaluate(async () => {
    const { Little3dEngine, quad } =
      await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    const host = document.createElement("div");
    host.style.cssText = "width:160px;height:160px";
    document.body.appendChild(host);
    const engine = new Little3dEngine({ backend: "webgl" });
    engine.add(quad(2, ["#ffffff"]), { transparency: { mode: "one-sided", opacity: 0.5 } });
    await engine.mount(host);
    engine.render();
    const canvas = host.querySelector("canvas");
    const probe = document.createElement("canvas");
    probe.width = canvas.width;
    probe.height = canvas.height;
    const context = probe.getContext("2d");
    context.drawImage(canvas, 0, 0);
    const [, , , a] = context.getImageData(probe.width / 2, probe.height / 2, 1, 1).data;
    engine.destroy();
    return a;
  });
  assert.ok(Math.abs(alpha - 128) <= 3, `alpha was ${alpha}, expected about 128`);
  assert.deepEqual(messages, []);
});

test("setTexture replaces a texture that is already on screen", async (t) => {
  const { page, messages } = await browser.open();
  const results = await page.evaluate(async () => {
    const { Little3dEngine, quad } =
      await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    const backends = {};
    if (document.createElement("canvas").getContext("webgl2")) {
      const { WebGLTexturedRenderer } =
        await import("/dist/engines/little-3d-engine/renderers/webgl-textured.js");
      backends.webgl = WebGLTexturedRenderer;
    }
    if (await navigator.gpu?.requestAdapter()) {
      const { WebGPUTexturedRenderer } =
        await import("/dist/engines/little-3d-engine/renderers/webgpu-textured.js");
      backends.webgpu = WebGPUTexturedRenderer;
    }
    const solid = (color) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 4;
      const context = canvas.getContext("2d");
      context.fillStyle = color;
      context.fillRect(0, 0, 4, 4);
      return canvas;
    };
    const centerColor = (canvas) => {
      const probe = document.createElement("canvas");
      probe.width = canvas.width;
      probe.height = canvas.height;
      const context = probe.getContext("2d");
      context.drawImage(canvas, 0, 0);
      const [r, g, b] = context.getImageData(probe.width / 2, probe.height / 2, 1, 1).data;
      return r > 200 && g < 50 && b < 50 ? "red" : b > 200 && r < 50 && g < 50 ? "blue" : "other";
    };
    const out = {};
    for (const [name, TexturedRenderer] of Object.entries(backends)) {
      const host = document.createElement("div");
      host.style.cssText = "width:160px;height:160px";
      document.body.appendChild(host);
      const mesh = quad(2, ["#ffffff"]);
      let renderer;
      const engine = new Little3dEngine({
        backend: (options) => {
          renderer = new TexturedRenderer(options);
          renderer.setTexture(mesh, solid("#ff0000"));
          return renderer;
        },
      });
      engine.add(mesh);
      await engine.mount(host);
      const canvas = host.querySelector("canvas");
      engine.render();
      const before = centerColor(canvas);
      renderer.setTexture(mesh, solid("#0000ff"));
      engine.render();
      out[name] = [before, centerColor(canvas)];
      engine.destroy();
      host.remove();
    }
    return out;
  });
  if (Object.keys(results).length === 0) {
    t.skip("neither WebGL2 nor WebGPU in this browser");
    return;
  }
  for (const [name, colors] of Object.entries(results)) {
    assert.deepEqual(colors, ["red", "blue"], name);
  }
  assert.deepEqual(messages, []);
});

test("a plane stopped during its intro keeps its trail emitting until its fly-out ends", async () => {
  const { page } = await browser.open();
  const done = await page.evaluate(async () => {
    const { planeStarTrail } = await import("/dist/prefabs/prefabs.js");
    const host = document.createElement("div");
    host.style.cssText = "width:160px;height:160px";
    document.body.appendChild(host);
    const { animation } = planeStarTrail();
    // The prefab's layers: the particle trail first, then the plane.
    const [trail, plane] = animation.layers.map((layer) => layer.animation);
    await animation.mount(host);
    animation.enter(0);
    animation.exit(100);
    const out = {};
    for (let now = 0; now <= 12000 && !(out.trail && out.plane); now += 20) {
      animation.render(now, { progress: 0, targetProgress: 0, indeterminate: true });
      if (!out.plane && plane.isFinished()) out.plane = now;
      if (!out.trail && trail.isFinished()) out.trail = now;
    }
    animation.destroy();
    return out;
  });
  // The trail finishes one particle lifetime (1900 ms in this prefab) after its last emission,
  // so the last emission lines up with the end of the plane's fly-out.
  assert.ok(done.plane > 0 && done.trail > 0, JSON.stringify(done));
  assert.ok(Math.abs(done.trail - done.plane - 1900) <= 20, JSON.stringify(done));
});

/** Init script: no WebGPU, so "auto" starts on WebGL. */
function noWebGPU() {
  Object.defineProperty(navigator, "gpu", { configurable: true, value: undefined });
}

test("a lost WebGL context switches to Canvas 2D and keeps drawing", async (t) => {
  const { page } = await browser.open(noWebGPU);
  if (!(await hasWebGL2(page))) {
    t.skip("no WebGL2 in this browser");
    return;
  }
  const result = await page.evaluate(async () => {
    const { Little3dEngine, cube } =
      await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    const host = document.createElement("div");
    host.style.cssText = "width:160px;height:160px";
    document.body.appendChild(host);
    const engine = new Little3dEngine();
    engine.add(cube(1)).transform.rotation.y = 0.6;
    await engine.mount(host);
    const first = host.querySelector("canvas");
    first.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext();
    const deadline = performance.now() + 3000;
    let lit = 0;
    while (performance.now() < deadline) {
      const canvas = host.querySelector("canvas");
      if (canvas && canvas !== first) {
        engine.render();
        lit = litPixels(canvas);
        if (lit > 0) break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    const out = {
      replaced: host.querySelector("canvas") !== first,
      canvases: host.querySelectorAll("canvas").length,
      lit,
    };
    engine.destroy();
    return out;
  });
  assert.equal(result.replaced, true);
  assert.equal(result.canvases, 1);
  assert.ok(result.lit > 500, `Canvas 2D drew ${result.lit} pixels`);
});
