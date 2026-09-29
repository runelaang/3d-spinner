import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Little3dEngine,
  cube,
  cubeSphere,
  icosphere,
  octaSphere,
  octahedron,
  pyramid,
  quad,
  tetrahedron,
  uvSphere,
} from "../dist/engines/little-3d-engine/little-3d-engine.js";

const faceColors = (mesh) => mesh.faces.map((face) => face.color);

/** A one-triangle mesh with the given face color. */
const triangle = (color) => ({
  vertices: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  ],
  faces: [{ indices: [0, 1, 2], color }],
});

test("shape builders fall back to their default palette for an empty color list", () => {
  const builders = {
    cube: (colors) => cube(1, colors),
    tetrahedron: (colors) => tetrahedron(1, colors),
    octahedron: (colors) => octahedron(1, colors),
    pyramid: (colors) => pyramid(1, colors),
    quad: (colors) => quad(1, colors),
    uvSphere: (colors) => uvSphere(1, 1, colors),
    icosphere: (colors) => icosphere(1, 1, colors),
    octaSphere: (colors) => octaSphere(1, 1, colors),
    cubeSphere: (colors) => cubeSphere(1, 1, colors),
  };
  for (const [name, build] of Object.entries(builders)) {
    const colors = faceColors(build([]));
    assert.ok(
      colors.every((color) => typeof color === "string"),
      `${name}: every face has a color`,
    );
    assert.deepEqual(colors, faceColors(build(undefined)), `${name}: same as the default`);
  }
});

test("engine.add accepts hex face colors", () => {
  const engine = new Little3dEngine();
  for (const color of ["#abc", "#AABBCC", " #3b82f6 ", "3b82f6"]) {
    assert.doesNotThrow(() => engine.add(triangle(color)), color);
  }
});

test("engine.add rejects face colors that are not hex", () => {
  const engine = new Little3dEngine();
  for (const color of ["red", "rgba(255,0,0,1)", "#ggg", "#ff000080", "", undefined]) {
    assert.throws(() => engine.add(triangle(color)), RangeError, String(color));
  }
});

test("a rejected mesh stays rejected when added again", () => {
  const engine = new Little3dEngine();
  const mesh = triangle("blue");
  assert.throws(() => engine.add(mesh), RangeError);
  assert.throws(() => engine.add(mesh), RangeError);
});

test("the engine background must be a hex color", () => {
  assert.doesNotThrow(() => new Little3dEngine({ background: "#101820" }));
  assert.throws(() => new Little3dEngine({ background: "white" }), RangeError);
});
