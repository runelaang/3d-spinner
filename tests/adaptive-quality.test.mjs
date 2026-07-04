import test from "node:test";
import assert from "node:assert/strict";
import { adaptiveQuality } from "../dist/plugins/adaptive-quality.js";

function setup(fps) {
  let current = 100;
  const setting = {
    name: "particles",
    requested: 100,
    minimum: 10,
    get current() { return current; },
    set(value) { current = value; },
  };
  const animation = { getQualitySettings: () => [setting] };
  const plugin = adaptiveQuality();
  plugin.start({ animation, getFrameRate: () => fps.value });
  return { plugin, setting };
}

test("adaptiveQuality gradually reduces and restores the selected setting", () => {
  const fps = { value: 40 };
  const { plugin, setting } = setup(fps);
  plugin.update(0);
  plugin.update(1000);
  assert.equal(setting.current, 90);

  fps.value = 60;
  plugin.update(2000);
  assert.equal(setting.current, 90);
  plugin.update(3000);
  assert.equal(setting.current, 95);
  plugin.update(4000);
  plugin.update(5000);
  assert.equal(setting.current, 100);
});

test("adaptiveQuality respects the setting minimum", () => {
  const fps = { value: 20 };
  const { plugin, setting } = setup(fps);
  for (let second = 0; second < 30; second++) plugin.update(second * 1000);
  assert.equal(setting.current, 10);
});
