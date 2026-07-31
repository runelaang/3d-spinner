import { test } from "node:test";
import assert from "node:assert/strict";
import { expandToTriangles, parseColor } from "../dist/engines/little-3d-engine/core/geometry.js";

const tri = (material) => ({
  vertices: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  ],
  faces: [{ indices: [0, 1, 2], color: "#000000", ...(material ? { material } : {}) }],
});

test("expandToTriangles duplicates a face emissive across all its vertices", () => {
  // Values exactly representable in Float32 so deepEqual holds after storage.
  const data = expandToTriangles(tri({ emissive: [0.25, 0.5, 0.75] }));
  assert.equal(data.emissives.length, 9);
  assert.deepEqual(
    [...data.emissives],
    [0.25, 0.5, 0.75, 0.25, 0.5, 0.75, 0.25, 0.5, 0.75],
  );
});

test("expandToTriangles emits zero emissive for a face with no material", () => {
  const data = expandToTriangles(tri());
  assert.deepEqual([...data.emissives], [0, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test("expandToTriangles emits zero emissive for a material without Ke", () => {
  const data = expandToTriangles(tri({ specular: [1, 1, 1], shininess: 32 }));
  assert.deepEqual([...data.emissives], [0, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test("expandToTriangles fans an emissive n-gon across every triangle vertex", () => {
  const quad = {
    vertices: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 1, z: 0 },
    ],
    faces: [{ indices: [0, 1, 2, 3], color: "#000000", material: { emissive: [1, 0, 0] } }],
  };
  const data = expandToTriangles(quad);
  // A quad fans into 2 triangles = 6 vertices.
  assert.equal(data.count, 6);
  assert.equal(data.emissives.length, 18);
  for (let i = 0; i < 18; i += 3) {
    assert.deepEqual([data.emissives[i], data.emissives[i + 1], data.emissives[i + 2]], [1, 0, 0]);
  }
});

test("expandToTriangles emissive array stays parallel to positions and colors", () => {
  const data = expandToTriangles(tri({ emissive: [0.1, 0.2, 0.3] }));
  assert.equal(data.emissives.length, data.positions.length);
  assert.equal(data.emissives.length, data.colors.length);
});

test("expandToTriangles packs specular as (Ks.rgb, Ns) per vertex", () => {
  const data = expandToTriangles(tri({ specular: [1, 0.5, 0.25], shininess: 200 }));
  assert.equal(data.speculars.length, 12); // 3 vertices * 4 floats
  assert.deepEqual(
    [...data.speculars],
    [1, 0.5, 0.25, 200, 1, 0.5, 0.25, 200, 1, 0.5, 0.25, 200],
  );
});

test("expandToTriangles defaults specular to (0,0,0,1) with no material", () => {
  const data = expandToTriangles(tri());
  assert.deepEqual([...data.speculars], [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]);
});

test("expandToTriangles defaults the Ns exponent to 32 when specular has no shininess", () => {
  const data = expandToTriangles(tri({ specular: [1, 1, 1] }));
  // Ns lands in the w slot; check the first vertex.
  assert.deepEqual([data.speculars[0], data.speculars[1], data.speculars[2], data.speculars[3]], [1, 1, 1, 32]);
});

test("expandToTriangles specular array has 4 floats per vertex", () => {
  const data = expandToTriangles(tri({ specular: [1, 1, 1], shininess: 8 }));
  assert.equal(data.speculars.length, (data.positions.length / 3) * 4);
});

test("parseColor parses 6-digit hex into 0..255 RGB", () => {
  assert.deepEqual(parseColor("#3b82f6"), [0x3b, 0x82, 0xf6]);
  assert.deepEqual(parseColor("#000000"), [0, 0, 0]);
  assert.deepEqual(parseColor("#ffffff"), [255, 255, 255]);
});

test("parseColor expands 3-digit shorthand hex", () => {
  assert.deepEqual(parseColor("#fff"), [255, 255, 255]);
  assert.deepEqual(parseColor("#f80"), [0xff, 0x88, 0x00]);
});

test("parseColor accepts surrounding whitespace and a missing #", () => {
  assert.deepEqual(parseColor("  #38bdf8  "), [0x38, 0xbd, 0xf8]);
  assert.deepEqual(parseColor("38bdf8"), [0x38, 0xbd, 0xf8]);
});
