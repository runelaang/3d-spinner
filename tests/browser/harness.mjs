import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../..", import.meta.url));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

/**
 * Serve the package folder over HTTP (ES modules do not load from file://). `/`
 * is an empty page the tests script against; everything else is a file.
 */
function startServer() {
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
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

/**
 * Start the file server and a headless Chromium with WebGPU enabled where the
 * machine supports it. Returns `open()` for a fresh page on the empty test page
 * (collecting console warnings/errors) and `close()`.
 */
export async function startBrowser() {
  const server = await startServer();
  const browser = await chromium.launch({
    channel: "chromium",
    args: ["--enable-unsafe-webgpu", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    async open(initScript) {
      const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
      const messages = [];
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning")
          messages.push(message.text());
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
