import test from "node:test";
import assert from "node:assert/strict";
import { FrameRateMonitor } from "../dist/index.js";

test("FrameRateMonitor reports rolling frames per second", () => {
  const monitor = new FrameRateMonitor();
  for (let frame = 0; frame <= 60; frame++) monitor.record(frame * (1000 / 60));
  assert.ok(Math.abs(monitor.getFrameRate() - 60) < 0.001);
});

test("FrameRateMonitor reports zero before an interval exists", () => {
  const monitor = new FrameRateMonitor();
  assert.equal(monitor.getFrameRate(), 0);
  monitor.record(100);
  assert.equal(monitor.getFrameRate(), 0);
});
