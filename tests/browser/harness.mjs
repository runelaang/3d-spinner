import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";

const root = fileURLToPath(new URL("../..", import.meta.url));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

/**
 * Serve the package folder over HTTP (ES modules do not load from file://). `/`
 * is an empty page the tests script against; everything else is a file. A
 * `?cors` query adds `Access-Control-Allow-Origin: *`; the page is served from
 * 127.0.0.1, so `localhost` on the same port is another origin.
 */
function startServer() {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    const path = decodeURIComponent(url.pathname);
    const cors = url.searchParams.has("cors") ? { "access-control-allow-origin": "*" } : {};
    if (path === "/") {
      response.writeHead(200, { "content-type": "text/html" });
      response.end(
        '<!doctype html><html><head><title>test</title><link rel="icon" href="data:,"></head><body></body></html>',
      );
      return;
    }
    const file = normalize(join(root, path));
    if (!file.startsWith(normalize(root))) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, {
        "content-type": types[extname(file)] ?? "application/octet-stream",
        ...cors,
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

/**
 * Page helper `litPixels(canvas)`: how many pixels of `canvas` are not fully
 * transparent. Call it in the same task that rendered, since WebGL and WebGPU
 * canvases are cleared once the frame is presented.
 */
function countLitPixels() {
  window.litPixels = (canvas) => {
    const probe = document.createElement("canvas");
    probe.width = canvas.width;
    probe.height = canvas.height;
    const context = probe.getContext("2d");
    context.drawImage(canvas, 0, 0);
    const data = context.getImageData(0, 0, probe.width, probe.height).data;
    let lit = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) lit++;
    return lit;
  };
}

/** Headless Chromium with WebGPU enabled where the machine supports it. */
function launchChromium() {
  // Headless Chromium on Linux (CI) loses its WebGPU device right after creating it unless
  // WebGPU, Vulkan, and ANGLE all run on SwiftShader. On Windows these flags leave no WebGPU
  // adapter at all, so they apply to Linux only.
  const linuxSoftwareGpu =
    process.platform === "linux"
      ? [
          "--enable-features=Vulkan",
          "--use-vulkan=swiftshader",
          "--use-angle=swiftshader",
          "--use-webgpu-adapter=swiftshader",
        ]
      : [];
  return chromium.launch({
    channel: "chromium",
    args: [
      "--enable-unsafe-webgpu",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
      ...linuxSoftwareGpu,
    ],
  });
}

/**
 * Warnings a browser logs about its own setup when a context is requested and it
 * has none to give (Firefox without WebGL2 or with WebGPU blocklisted). The
 * backend probe asks on purpose, so these say nothing about the library.
 */
const browserSetupNoise = /Failed to create WebGL context|WebGPU is disabled by blocklist/;

const launchers = {
  chromium: launchChromium,
  firefox: () => firefox.launch(),
  webkit: () => webkit.launch(),
};

/** The browser the tests run in: `TEST_BROWSER` (`chromium`, `firefox`, `webkit`), default Chromium. */
export const browserName = process.env.TEST_BROWSER || "chromium";

/**
 * Start the file server and the headless {@link browserName} browser. Returns
 * `open()` for a fresh page on the empty test page (collecting console
 * warnings/errors) and `close()`.
 */
export async function startBrowser() {
  const launch = launchers[browserName];
  if (!launch) throw new Error(`TEST_BROWSER must be one of ${Object.keys(launchers).join(", ")}`);
  const server = await startServer();
  const browser = await launch();
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    async open(initScript) {
      const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
      const messages = [];
      page.on("console", (message) => {
        const relevant = message.type() === "error" || message.type() === "warning";
        if (relevant && !browserSetupNoise.test(message.text())) messages.push(message.text());
      });
      page.on("pageerror", (error) => messages.push(error.message));
      await page.addInitScript(countLitPixels);
      if (initScript) await page.addInitScript(initScript);
      await page.goto(`${origin}/`);
      return { page, messages };
    },
    async close() {
      await browser.close();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
