/** Shared assertion helpers for the node:test suites. Zero dependencies. */

/** Asserts two numbers are within `eps` of each other. */
export function approx(actual, expected, eps = 1e-9, message = "") {
  if (Math.abs(actual - expected) > eps) {
    throw new Error(
      `${message ? message + ": " : ""}expected ${actual} to be within ${eps} of ${expected}`,
    );
  }
}

/** Distance between two {x,y,z} points. */
export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Length of a {x,y,z} vector from the origin. */
export function mag(v) {
  return Math.hypot(v.x, v.y, v.z);
}

/** Samples `fn` at `count` evenly spaced times across `[0, span)`. */
export function sample(fn, span, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(fn((i / count) * span));
  return out;
}
