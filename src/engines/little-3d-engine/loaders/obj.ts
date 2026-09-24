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
   * diffuse color (`Kd`) becomes the face color, and ambient (`Ka`), specular
   * (`Ks`/`Ns`), emissive (`Ke`), and dissolve (`d`/`Tr`) become the face
   * {@link Material}. Default `false`.
   */
  useMtlColors?: boolean;
}

/** One material parsed from MTL text: a face color plus its surface material. */
interface ParsedMaterial {
  /** Diffuse color (`Kd`) as a CSS hex string, if present. */
  color?: string;
  /** Ambient, specular, shininess, emissive, and dissolve gathered from MTL. */
  material?: Material;
}

interface SurfaceProps {
  ambient?: [number, number, number];
  specular?: [number, number, number];
  shininess?: number;
  emissive?: [number, number, number];
  opacity?: number;
}

/** True when `Ka` is the engine identity (full scene ambient). */
function isFullAmbient(rgb: [number, number, number]): boolean {
  return rgb[0] === 1 && rgb[1] === 1 && rgb[2] === 1;
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

/**
 * Fold ambient/specular/shininess/emissive/opacity into a {@link Material}, or
 * `undefined` when nothing remains. Identity ambient (`Ka 1 1 1`) and opaque
 * dissolve (`d 1` / `Tr 0`) are dropped so a Kd-only material with those
 * defaults still leaves `Face.material` undefined.
 */
function toMaterial(surface: SurfaceProps): Material | undefined {
  const material: Material = {};
  if (surface.ambient && !isFullAmbient(surface.ambient)) {
    material.ambient = surface.ambient;
  }
  if (surface.specular) material.specular = surface.specular;
  if (surface.shininess !== undefined) material.shininess = surface.shininess;
  if (surface.emissive) material.emissive = surface.emissive;
  if (surface.opacity != null && surface.opacity != 1) material.opacity = surface.opacity;
  return Object.keys(material).length > 0 ? material : undefined;
}

/**
 * Parse MTL text into a map of material name to its color and surface material.
 * Reads `Kd` (diffuse color), `Ka` (ambient), `Ks` (specular), `Ns` (shininess),
 * `Ke` (emissive), and `d`/`Tr` (dissolve); other statements are ignored.
 */
function parseMtl(text: string): Map<string, ParsedMaterial> {
  const materials = new Map<string, ParsedMaterial>();
  const surfaces = new Map<string, SurfaceProps>();
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
    } else if (keyword === "Ka") {
      surface.ambient = parseRgb(parts);
    } else if (keyword === "Ks") {
      surface.specular = parseRgb(parts);
    } else if (keyword === "Ns") {
      const ns = Number.parseFloat(parts[1]);
      if (Number.isFinite(ns)) surface.shininess = Math.max(0, ns);
    } else if (keyword === "Ke") {
      surface.emissive = parseRgb(parts);
    } else if (keyword === "d") {
      const d = Number.parseFloat(parts[1]);
      if (Number.isFinite(d)) surface.opacity = clamp01(d);
    } else if (keyword === "Tr") {
      const tr = Number.parseFloat(parts[1]);
      if (Number.isFinite(tr)) surface.opacity = clamp01(1 - tr);
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
 * (`Kd`) and surface material (ambient `Ka`, specular `Ks`/`Ns`, emissive `Ke`,
 * dissolve `d`/`Tr`) from supplied MTL text; groups and other statements are
 * ignored. Face winding
 * is preserved as-is; the engine expects CCW winding as seen from outside.
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
