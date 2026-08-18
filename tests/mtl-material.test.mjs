import { test } from "node:test";
import assert from "node:assert/strict";
import { parseObj } from "../dist/engines/little-3d-engine/loaders/obj.js";

const obj = `
v 0 0 0
v 1 0 0
v 0 1 0
usemtl Shiny
f 1 2 3
usemtl Matte
f 1 3 2
`;

const mtl = `
newmtl Shiny
Kd 0.1 0.5 1.0
Ks 1 1 1
Ns 200
Ke 0.2 0 0

newmtl Matte
Kd 0.5 0.5 0.5
`;

test("parseObj attaches specular, shininess, and emissive from MTL", () => {
  const mesh = parseObj(obj, { mtl, useMtlColors: true });
  assert.deepEqual(mesh.faces[0].material, {
    specular: [1, 1, 1],
    shininess: 200,
    emissive: [0.2, 0, 0],
  });
});

test("parseObj attaches a non-identity Ka as ambient", () => {
  const kaMtl = `
newmtl Dim
Kd 1 1 1
Ka 0.25 0.5 0.75
`;
  const single = "v 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl Dim\nf 1 2 3\n";
  const mesh = parseObj(single, { mtl: kaMtl, useMtlColors: true });
  assert.deepEqual(mesh.faces[0].material, { ambient: [0.25, 0.5, 0.75] });
});

test("parseObj drops identity Ka so a Kd+Ka 1 1 1 material stays material-less", () => {
  const whiteKa = `
newmtl WhiteKa
Kd 0.5 0.5 0.5
Ka 1 1 1
`;
  const single = "v 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl WhiteKa\nf 1 2 3\n";
  const mesh = parseObj(single, { mtl: whiteKa, useMtlColors: true });
  assert.equal(mesh.faces[0].material, undefined);
  assert.equal(mesh.faces[0].color, "#808080");
});

test("parseObj leaves material undefined for a Kd-only material", () => {
  const mesh = parseObj(obj, { mtl, useMtlColors: true });
  assert.equal(mesh.faces[1].material, undefined);
  assert.equal(mesh.faces[1].color, "#808080");
});

test("parseObj clamps Ka/Ks/Ke channels into 0..1", () => {
  const clampMtl = `
newmtl Over
Kd 1 1 1
Ka 2 -1 0.5
Ks 2 -1 0.5
Ke -0.5 3 0.25
`;
  const single = "v 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl Over\nf 1 2 3\n";
  const mesh = parseObj(single, { mtl: clampMtl, useMtlColors: true });
  assert.deepEqual(mesh.faces[0].material, {
    ambient: [1, 0, 0.5],
    specular: [1, 0, 0.5],
    emissive: [0, 1, 0.25],
  });
});

test("parseObj ignores materials entirely when useMtlColors is off", () => {
  const mesh = parseObj(obj, { mtl });
  assert.equal(mesh.faces[0].material, undefined);
  assert.equal(mesh.faces[1].material, undefined);
});

test("parseObj attaches d as opacity, including d-only materials", () => {
  const glass = `
newmtl Glass
Kd 1 1 1
d 0.4
`;
  const single = "v 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl Glass\nf 1 2 3\n";
  const mesh = parseObj(single, { mtl: glass, useMtlColors: true });
  assert.deepEqual(mesh.faces[0].material, { opacity: 0.4 });
});

test("parseObj converts Tr to opacity and lets the last of d/Tr win", () => {
  const dissolveMtl = `
newmtl FromTr
Kd 1 1 1
Tr 0.25

newmtl LastTr
Kd 1 1 1
d 0.2
Tr 0.6

newmtl LastD
Kd 1 1 1
Tr 0.6
d 0.2
`;
  const dissolveObj = `
v 0 0 0
v 1 0 0
v 0 1 0
usemtl FromTr
f 1 2 3
usemtl LastTr
f 1 3 2
usemtl LastD
f 1 2 3
`;
  const mesh = parseObj(dissolveObj, { mtl: dissolveMtl, useMtlColors: true });
  assert.deepEqual(mesh.faces[0].material, { opacity: 0.75 });
  assert.deepEqual(mesh.faces[1].material, { opacity: 0.4 });
  assert.deepEqual(mesh.faces[2].material, { opacity: 0.2 });
});

test("parseObj drops opaque d 1 and Tr 0 so a Kd-only material stays material-less", () => {
  const opaqueMtl = `
newmtl SolidD
Kd 0.5 0.5 0.5
d 1

newmtl SolidTr
Kd 0.5 0.5 0.5
Tr 0
`;
  const opaqueObj = `
v 0 0 0
v 1 0 0
v 0 1 0
usemtl SolidD
f 1 2 3
usemtl SolidTr
f 1 3 2
`;
  const mesh = parseObj(opaqueObj, { mtl: opaqueMtl, useMtlColors: true });
  assert.equal(mesh.faces[0].material, undefined);
  assert.equal(mesh.faces[1].material, undefined);
});

test("parseObj clamps d and Tr into 0..1", () => {
  const clampMtl = `
newmtl Under
Kd 1 1 1
d -0.5

newmtl OverTr
Kd 1 1 1
Tr 1.5
`;
  const clampObj = `
v 0 0 0
v 1 0 0
v 0 1 0
usemtl Under
f 1 2 3
usemtl OverTr
f 1 3 2
`;
  const mesh = parseObj(clampObj, { mtl: clampMtl, useMtlColors: true });
  assert.deepEqual(mesh.faces[0].material, { opacity: 0 });
  assert.deepEqual(mesh.faces[1].material, { opacity: 0 });
});
