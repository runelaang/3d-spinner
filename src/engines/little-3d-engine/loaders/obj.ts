import type { Mesh, Face, Material } from "../core/mesh.js";

const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

/** Options for {@link parseObj}. */
export interface ObjOptions {
  /**
   * CSS colors assigned to faces in order, cycling when there are more faces
   * than colors. Defaults to a built-in palette. Pass a single-entry array for
   * a uniform color.
   */
  colors?: string[];
  /** Contents of an `.mtl` file referenced by the OBJ. */
  mtl?: string;
  /**
   * Use MTL material values for faces with matching `usemtl` statements: the
   * diffuse color (`Kd`) becomes the face color, and specular (`Ks`/`Ns`) and
   * emissive (`Ke`) become the face {@link Material}. Default `false`.
   */
  useMtlColors?: boolean;
}

/** One material parsed from MTL text: a face color plus its surface material. */
interface ParsedMaterial {
  /** Diffuse color (`Kd`) as a CSS hex string, if present. */
  color?: string;
  /** Specular, shininess, and emissive gathered from `Ks`/`Ns`/`Ke`. */
  material?: Material;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function channelToHex(value: string): string | undefined {
  const channel = Number.parseFloat(value);
  if (!Number.isFinite(channel)) return undefined;
  return Math.round(clamp01(channel) * 255)
    .toString(16)
    .padStart(2, "0");
}

/** Parse an `Ks`/`Ke`-style RGB triple into clamped `0..1` channels. */
function parseRgb(parts: string[]): [number, number, number] | undefined {
  const channels = parts.slice(1, 4).map(Number.parseFloat);
  if (channels.length !== 3 || !channels.every(Number.isFinite)) return undefined;
  return [clamp01(channels[0]), clamp01(channels[1]), clamp01(channels[2])];
}

/** Fold specular/shininess/emissive into a {@link Material}, or `undefined`. */
function toMaterial(surface: {
  specular?: [number, number, number];
  shininess?: number;
  emissive?: [number, number, number];
}): Material | undefined {
  const material: Material = {};
  if (surface.specular) material.specular = surface.specular;
  if (surface.shininess !== undefined) material.shininess = surface.shininess;
  if (surface.emissive) material.emissive = surface.emissive;
  return Object.keys(material).length > 0 ? material : undefined;
}

/**
 * Parse MTL text into a map of material name to its color and surface material.
 * Reads `Kd` (diffuse color), `Ks` (specular), `Ns` (shininess), and `Ke`
 * (emissive); other statements are ignored.
 */
function parseMtl(text: string): Map<string, ParsedMaterial> {
  const materials = new Map<string, ParsedMaterial>();
  const surfaces = new Map<
    string,
    { specular?: [number, number, number]; shininess?: number; emissive?: [number, number, number] }
  >();
  let name: string | undefined;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    const keyword = parts[0];

    if (keyword === "newmtl") {
      name = parts.slice(1).join(" ");
      if (name && !materials.has(name)) {
        materials.set(name, {});
        surfaces.set(name, {});
      }
      continue;
    }
    if (!name) continue;
    const entry = materials.get(name)!;
    const surface = surfaces.get(name)!;

    if (keyword === "Kd") {
      const channels = parts.slice(1, 4).map(channelToHex);
      if (channels.length === 3 && channels.every((channel) => channel !== undefined)) {
        entry.color = `#${channels.join("")}`;
      }
    } else if (keyword === "Ks") {
      surface.specular = parseRgb(parts);
    } else if (keyword === "Ns") {
      const ns = Number.parseFloat(parts[1]);
      if (Number.isFinite(ns)) surface.shininess = Math.max(0, ns);
    } else if (keyword === "Ke") {
      surface.emissive = parseRgb(parts);
    }
  }

  for (const [key, surface] of surfaces) {
    materials.get(key)!.material = toMaterial(surface);
  }
  return materials;
}

function resolveIndex(token: string, vertexCount: number): number {
  const n = parseInt(token, 10);
  return n < 0 ? vertexCount + n : n - 1;
}

/**
 * Parse Wavefront OBJ text into a {@link Mesh}.
 *
 * Reads `v` vertex positions and `f` faces (triangles, quads, or n-gons, in
 * `v`, `v/vt`, `v/vt/vn`, or `v//vn` form, with 1-based or negative indices).
 * Normals (`vn`) and texture coordinates (`vt`) are ignored - the engine
 * computes a flat normal per face. Material names can select the diffuse color
 * (`Kd`) and surface material (specular `Ks`/`Ns`, emissive `Ke`) from supplied
 * MTL text; groups and other statements are ignored. Face winding is preserved
 * as-is; the engine expects CCW winding as seen from outside.
 *
 * @param text Contents of an `.obj` file.
 * @param options Face palette and optional MTL materials.
 */
export function parseObj(text: string, options: ObjOptions = {}): Mesh {
  const colors = options.colors ?? DEFAULT_COLORS;
  const materials = options.useMtlColors && options.mtl
    ? parseMtl(options.mtl)
    : undefined;
  const vertices: Mesh["vertices"] = [];
  const faces: Face[] = [];
  let material: string | undefined;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const parts = trimmed.split(/\s+/);
    const keyword = parts[0];

    if (keyword === "v") {
      vertices.push({
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3]),
      });
    } else if (keyword === "usemtl") {
      material = parts.slice(1).join(" ");
    } else if (keyword === "f") {
      const indices: number[] = [];
      for (let i = 1; i < parts.length; i++) {
        const vertexToken = parts[i].split("/")[0];
        indices.push(resolveIndex(vertexToken, vertices.length));
      }
      if (indices.length >= 3) {
        const entry = material ? materials?.get(material) : undefined;
        const color = entry?.color
          ?? (materials ? (colors[0] ?? "#888888") : colors[faces.length % colors.length]);
        const face: Face = { indices, color };
        if (entry?.material) face.material = entry.material;
        faces.push(face);
      }
    }
  }

  return { vertices, faces };
}
