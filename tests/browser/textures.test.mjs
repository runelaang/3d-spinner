import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { startBrowser } from "./harness.mjs";

// Texture loading and texture lifetime in the textured renderers.

let browser;
before(async () => {
  browser = await startBrowser();
});
after(async () => {
  await browser?.close();
});

/**
 * Init script with page helpers. Init scripts run in the page, so everything
 * they use is defined inside.
 * - `texturedRenderers()`: the textured renderer classes this browser can run.
 * - `texturedEngine(Renderer, mesh, source)`: an engine drawing `mesh` with that texture.
 * - `centerColor(canvas)`: "clear", "red", "blue", "white", or "other" at the canvas center.
 * - `waitFor(check)`: poll `check` until it returns true (up to 3 s).
 */
function textureHelpers() {
  window.texturedRenderers = async () => {
    // Absolute URLs: WebKit cannot resolve a root-relative import() made from an init script.
    const base = `${location.origin}/dist/engines/little-3d-engine/renderers/`;
    const out = {
      canvas2d: (await import(`${base}canvas2d-textured.js`)).Canvas2DTexturedRenderer,
    };
    if (document.createElement("canvas").getContext("webgl2")) {
      out.webgl = (await import(`${base}webgl-textured.js`)).WebGLTexturedRenderer;
    }
    if (await navigator.gpu?.requestAdapter()) {
      out.webgpu = (await import(`${base}webgpu-textured.js`)).WebGPUTexturedRenderer;
    }
    return out;
  };
  window.texturedEngine = async (Renderer, mesh, source) => {
    const { Little3dEngine } = await import(
      `${location.origin}/dist/engines/little-3d-engine/little-3d-engine.js`
    );
    const host = document.createElement("div");
    host.style.cssText = "width:160px;height:160px";
    document.body.appendChild(host);
    let renderer;
    // Unlit, like the particles, so an untextured white face reads as pure white.
    const engine = new Little3dEngine({
      backend: (options) => {
        renderer = new Renderer(options);
        renderer.setTexture(mesh, source);
        return renderer;
      },
      light: { intensity: 0, ambient: 1 },
    });
    engine.add(mesh);
    await engine.mount(host);
    const canvas = host.querySelector("canvas");
    return {
      engine,
      renderer,
      canvas,
      done: () => {
        engine.destroy();
        host.remove();
      },
    };
  };
  window.centerColor = (canvas) => {
    const probe = document.createElement("canvas");
    probe.width = canvas.width;
    probe.height = canvas.height;
    const context = probe.getContext("2d");
    context.drawImage(canvas, 0, 0);
    const [r, g, b, a] = context.getImageData(probe.width / 2, probe.height / 2, 1, 1).data;
    if (a < 10) return "clear";
    if (r > 200 && g > 200 && b > 200) return "white";
    if (r > 200 && g < 50 && b < 50) return "red";
    if (b > 200 && r < 50 && g < 50) return "blue";
    return "other";
  };
  window.waitFor = async (check) => {
    const deadline = performance.now() + 3000;
    while (performance.now() < deadline) {
      if (await check()) return true;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return false;
  };
}

/** Browser messages other than the browser's own log lines for failed or blocked requests. */
const withoutNetworkErrors = (messages) =>
  messages.filter(
    (text) =>
      !/Failed to load resource|blocked by CORS policy|not allowed by Access-Control-Allow-Origin|due to access control checks/.test(
        text,
      ),
  );

test("texture URLs load from this origin and from a CORS-enabled other origin", async () => {
  const { page, messages } = await browser.open(textureHelpers);
  const results = await page.evaluate(async () => {
    const { quad } = await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    const urls = {
      sameOrigin: "/tests/browser/frame.svg",
      otherOrigin: `http://localhost:${location.port}/tests/browser/frame.svg?cors`,
    };
    const out = {};
    for (const [name, Renderer] of Object.entries(await texturedRenderers())) {
      for (const [kind, url] of Object.entries(urls)) {
        // Canvas 2D loads without CORS, so its canvas cannot be read back; the next test covers it.
        if (name === "canvas2d" && kind === "otherOrigin") continue;
        const mesh = quad(2, ["#ffffff"]);
        const scene = await texturedEngine(Renderer, mesh, url);
        let color = "none";
        await waitFor(() => {
          scene.engine.render();
          color = centerColor(scene.canvas);
          return color === "clear";
        });
        out[`${name} ${kind}`] = color;
        scene.done();
      }
    }
    return out;
  });
  // frame.svg is a red frame around a transparent center; untextured, the quad is white there.
  for (const [name, color] of Object.entries(results)) assert.equal(color, "clear", name);
  assert.deepEqual(messages, []);
});

test("Canvas 2D draws a texture from another origin that sends no CORS headers", async () => {
  const { page, messages } = await browser.open(textureHelpers);
  const tainted = await page.evaluate(async () => {
    const { quad } = await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    const { Canvas2DTexturedRenderer } =
      await import("/dist/engines/little-3d-engine/renderers/canvas2d-textured.js");
    const url = `http://localhost:${location.port}/tests/browser/frame.svg`;
    const scene = await texturedEngine(Canvas2DTexturedRenderer, quad(2, ["#ffffff"]), url);
    // Drawing a cross-origin image without CORS taints the canvas, so a readback
    // failing is how the page can tell the image was drawn.
    const drawn = await waitFor(() => {
      scene.engine.render();
      try {
        scene.canvas.toDataURL();
        return false;
      } catch {
        return true;
      }
    });
    scene.done();
    return drawn;
  });
  assert.equal(tainted, true);
  assert.deepEqual(messages, []);
});

test("a texture that fails to load warns once and the mesh keeps its plain color", async () => {
  const { page, messages } = await browser.open(textureHelpers);
  const results = await page.evaluate(async () => {
    const { quad } = await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    const sources = {
      missing: "/tests/browser/missing.svg",
      notAnImage: "/package.json",
      otherOriginWithoutCors: `http://localhost:${location.port}/tests/browser/frame.svg`,
    };
    const out = {};
    for (const [name, Renderer] of Object.entries(await texturedRenderers())) {
      for (const [kind, source] of Object.entries(sources)) {
        // Canvas 2D draws the cross-origin image; the test above covers that.
        if (name === "canvas2d" && kind === "otherOriginWithoutCors") continue;
        const scene = await texturedEngine(Renderer, quad(2, ["#ffffff"]), source);
        scene.engine.render();
        await new Promise((resolve) => setTimeout(resolve, 300));
        scene.engine.render();
        out[`${name} ${kind}`] = centerColor(scene.canvas);
        scene.done();
      }
    }
    return out;
  });
  for (const [name, color] of Object.entries(results)) assert.equal(color, "white", name);
  const warnings = withoutNetworkErrors(messages);
  assert.equal(warnings.length, Object.keys(results).length, warnings.join("\n"));
  for (const warning of warnings)
    assert.match(warning, /^3d-spinner: texture .* could not be used/);
});

test("WebGPU warns instead of an unhandled rejection when an image cannot be decoded", async (t) => {
  const { page, messages } = await browser.open(textureHelpers);
  const result = await page.evaluate(async () => {
    const renderers = await texturedRenderers();
    if (!renderers.webgpu) return "no WebGPU";
    const { quad } = await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    // An image element that never loaded: createImageBitmap rejects it.
    const scene = await texturedEngine(renderers.webgpu, quad(2, ["#ffffff"]), new Image());
    scene.engine.render();
    await new Promise((resolve) => setTimeout(resolve, 300));
    scene.done();
    return "ran";
  });
  if (result === "no WebGPU") {
    t.skip("no WebGPU adapter in this browser");
    return;
  }
  assert.equal(messages.length, 1, messages.join("\n"));
  assert.match(messages[0], /^3d-spinner: texture image could not be used/);
});

test("destroying a renderer while its texture loads leaves nothing behind", async () => {
  const { page, messages } = await browser.open(textureHelpers);
  await page.evaluate(async () => {
    const { quad } = await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    for (const Renderer of Object.values(await texturedRenderers())) {
      for (const source of ["/tests/browser/frame.svg", "/tests/browser/missing.svg"]) {
        const scene = await texturedEngine(Renderer, quad(2, ["#ffffff"]), source);
        scene.engine.render();
        scene.done();
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
  assert.deepEqual(withoutNetworkErrors(messages), []);
});

test("WebGPU frees replaced textures instead of keeping them until destroy", async (t) => {
  const { page, messages } = await browser.open(textureHelpers);
  const result = await page.evaluate(async () => {
    const renderers = await texturedRenderers();
    if (!renderers.webgpu) return undefined;
    const { quad } = await import("/dist/engines/little-3d-engine/little-3d-engine.js");
    const solid = (color) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 4;
      const context = canvas.getContext("2d");
      context.fillStyle = color;
      context.fillRect(0, 0, 4, 4);
      return canvas;
    };
    const mesh = quad(2, ["#ffffff"]);
    const scene = await texturedEngine(renderers.webgpu, mesh, solid("#ff0000"));
    // Count the rgba8unorm textures (the texture uploads and their placeholders)
    // that are created and not yet destroyed.
    const device = scene.renderer.device;
    let alive = 0;
    const createTexture = device.createTexture.bind(device);
    device.createTexture = (descriptor) => {
      const texture = createTexture(descriptor);
      if (descriptor.format !== "rgba8unorm") return texture;
      alive++;
      const destroy = texture.destroy.bind(texture);
      let destroyed = false;
      texture.destroy = () => {
        if (!destroyed) alive--;
        destroyed = true;
        destroy();
      };
      return texture;
    };
    const frame = async () => {
      scene.engine.render();
      await device.queue.onSubmittedWorkDone();
    };
    // Completed frames: one replacement per frame.
    for (let i = 0; i < 50; i++) {
      scene.renderer.setTexture(mesh, solid(i % 2 ? "#0000ff" : "#ff0000"));
      await frame();
    }
    await frame();
    await frame();
    const afterFrames = alive;
    // Several replacements between two frames, while the last frame may still be in flight.
    scene.engine.render();
    scene.renderer.setTexture(mesh, solid("#ff0000"));
    scene.renderer.setTexture(mesh, solid("#00ff00"));
    scene.renderer.setTexture(mesh, solid("#0000ff"));
    scene.engine.render();
    const color = centerColor(scene.canvas);
    await frame();
    await frame();
    const out = { afterFrames, afterBurst: alive, color };
    scene.done();
    return out;
  });
  if (!result) {
    t.skip("no WebGPU adapter in this browser");
    return;
  }
  assert.ok(result.afterFrames <= 2, `${result.afterFrames} textures alive after 50 replacements`);
  assert.ok(result.afterBurst <= 2, `${result.afterBurst} textures alive after a burst`);
  assert.equal(result.color, "blue");
  assert.deepEqual(messages, []);
});
