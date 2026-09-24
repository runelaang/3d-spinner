import { test } from "node:test";
import assert from "node:assert/strict";
import { animationLabelOpacity } from "../dist/animation-label.js";

test("animation labels fade over intro and outro durations", () => {
  assert.equal(animationLabelOpacity(0, Infinity, 100, Infinity, 200), 0);
  assert.equal(animationLabelOpacity(100, 100, 100, Infinity, 200), 0);
  assert.equal(animationLabelOpacity(150, 100, 100, Infinity, 200), 0.5);
  assert.equal(animationLabelOpacity(200, 100, 100, Infinity, 200), 1);
  assert.equal(animationLabelOpacity(350, 100, 100, 300, 200), 0.75);
  assert.equal(animationLabelOpacity(500, 100, 100, 300, 200), 0);
});

test("zero-duration label transitions complete immediately", () => {
  assert.equal(animationLabelOpacity(100, 100, 0, Infinity, 0), 1);
  assert.equal(animationLabelOpacity(100, 100, 0, 100, 0), 0);
});

test("text labels are hidden from assistive technology and only rewritten on change", async () => {
  const { mountAnimationLabel } = await import("../dist/animation-label.js");
  const saved = globalThis.document;
  globalThis.document = {
    createElement: () => {
      const element = { style: {}, attributes: {}, writes: 0, children: [] };
      element.setAttribute = (name, value) => (element.attributes[name] = value);
      element.appendChild = (child) => element.children.push(child);
      let text = "";
      Object.defineProperty(element, "textContent", {
        get: () => text,
        set: (value) => {
          element.writes++;
          text = value;
        },
      });
      return element;
    },
  };
  try {
    const target = { appendChild() {} };
    const text = mountAnimationLabel(target, "Loading");
    assert.equal(text.container.attributes["aria-hidden"], "true");
    assert.equal(text.container.attributes.role, undefined);
    text.setText("Loading");
    text.setText("42%");
    text.setText("42%");
    assert.equal(text.container.textContent, "42%");
    assert.equal(text.container.writes, 2, "initial text plus one change");

    const custom = { style: {} };
    const markup = mountAnimationLabel(target, custom);
    assert.equal(markup.container.attributes["aria-hidden"], undefined, "consumer markup keeps its semantics");
    markup.setText("42%");
    assert.equal(markup.container.writes, 0);
  } finally {
    if (saved === undefined) delete globalThis.document;
    else globalThis.document = saved;
  }
});
