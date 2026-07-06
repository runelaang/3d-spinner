import { test } from "node:test";
import assert from "node:assert/strict";
import { expandToTriangles } from "../dist/engines/little-3d-engine/core/geometry.js";

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
