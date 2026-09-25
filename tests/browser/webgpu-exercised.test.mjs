import { test } from "node:test";
import assert from "node:assert/strict";
import { startBrowser } from "./harness.mjs";

// The WebGPU browser tests skip when the browser has no adapter, which would let a
// run pass without exercising WebGPU at all. CI sets REQUIRE_WEBGPU=1 so that case
// fails instead; elsewhere this only reports which adapter the tests ran on.

test("the browser tests have a WebGPU adapter", async (t) => {
  const browser = await startBrowser();
  try {
    const { page } = await browser.open();
    const adapter = await page.evaluate(async () => {
      const found = await navigator.gpu?.requestAdapter();
      if (!found) return null;
      const { vendor, architecture, description } = found.info ?? {};
      return [vendor, architecture, description].filter(Boolean).join(" / ") || "unnamed";
    });
    if (adapter === null && !process.env.REQUIRE_WEBGPU) {
      t.skip("no WebGPU adapter, so the WebGPU tests were skipped (REQUIRE_WEBGPU=1 fails here)");
      return;
    }
    assert.ok(adapter !== null, "no WebGPU adapter, so the WebGPU tests were skipped");
    t.diagnostic(`WebGPU adapter: ${adapter}`);
  } finally {
    await browser.close();
  }
});
