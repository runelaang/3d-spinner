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
