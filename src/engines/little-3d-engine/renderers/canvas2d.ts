import { shadeColor, type Surface } from "../core/light.js";
import { dot, cross, normalize, subtract, transformAffine, transformPoint } from "../core/math.js";
import {
  DEFAULT_ONE_SIDED_OPACITY,
  opacity,
  resolveTwoSidedOpacity,
  type Renderer,
  type RenderFrame,
  type RendererOptions,
} from "../renderer.js";

interface Polygon {
  points: { x: number; y: number }[];
  color: string;
  depth: number;
  opacity: number;
}

/** Software renderer: projects geometry on the CPU and fills 2D polygons. */
export class Canvas2DRenderer implements Renderer {
  private ctx?: CanvasRenderingContext2D;
  private dpr = 1;

  constructor(private readonly options: RendererOptions = {}) {}

  init(canvas: HTMLCanvasElement): void {
    this.ctx = canvas.getContext("2d") ?? undefined;
  }

  resize(_cssWidth: number, _cssHeight: number, dpr: number): void {
    this.dpr = dpr;
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render(frame: RenderFrame): void {
    const ctx = this.ctx;
    if (!ctx) return;

    if (this.options.background) {
      ctx.fillStyle = this.options.background;
      ctx.fillRect(0, 0, frame.width, frame.height);
    } else {
      ctx.clearRect(0, 0, frame.width, frame.height);
    }

    const polygons: Polygon[] = [];
    for (const item of frame.items) {
      const world = item.mesh.vertices.map((v) => transformAffine(item.model, v));
      const twoSidedOpacity = item.transparency?.mode === "two-sided"
        ? resolveTwoSidedOpacity(item.transparency)
        : undefined;
      for (const face of item.mesh.faces) {
        const a = world[face.indices[0]];
        const b = world[face.indices[1]];
        const c = world[face.indices[2]];
        const normal = normalize(cross(subtract(b, a), subtract(c, a)));
        const frontFacing = dot(normal, subtract(frame.eye, a)) > 0;
        const transparency = item.transparency;
        if (!frontFacing && transparency?.mode !== "two-sided") continue;

        let faceOpacity = 1;
        if (transparency?.mode === "one-sided") {
          faceOpacity = opacity(transparency.opacity, DEFAULT_ONE_SIDED_OPACITY);
        } else if (twoSidedOpacity) {
          faceOpacity = frontFacing ? twoSidedOpacity.front : twoSidedOpacity.back;
        }

        const points = face.indices.map((i) => {
          const ndc = transformPoint(frame.viewProjection, world[i]);
          return {
            x: (ndc.x * 0.5 + 0.5) * frame.width,
            y: (1 - (ndc.y * 0.5 + 0.5)) * frame.height,
          };
        });

        let depth = 0;
        for (const i of face.indices) {
          const d = subtract(world[i], frame.eye);
          depth += dot(d, d);
        }
        depth /= face.indices.length;

        // Specular needs the view direction from the face toward the eye; use
        // the face centroid. Emissive-only or plain faces skip that work.
        let surface: Surface | undefined;
        const material = face.material;
        if (material) {
          if (material.specular) {
            let cx = 0;
            let cy = 0;
            let cz = 0;
            for (const i of face.indices) {
              cx += world[i].x;
              cy += world[i].y;
              cz += world[i].z;
            }
            const inv = 1 / face.indices.length;
            const viewDir = normalize(
              subtract(frame.eye, { x: cx * inv, y: cy * inv, z: cz * inv }),
            );
            surface = { material, viewDir };
          } else {
            surface = { material };
          }
        }

        polygons.push({
          points,
          color: shadeColor(normal, face.color, frame.light, surface),
          depth,
          opacity: faceOpacity,
        });
      }
    }

    polygons.sort((p, q) => q.depth - p.depth);
    for (const poly of polygons) {
      if (poly.points.length < 3) continue;
      ctx.beginPath();
      ctx.moveTo(poly.points[0].x, poly.points[0].y);
      for (let i = 1; i < poly.points.length; i++) {
        ctx.lineTo(poly.points[i].x, poly.points[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = poly.color;
      ctx.strokeStyle = poly.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = poly.opacity;
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  destroy(): void {
    this.ctx = undefined;
  }
}
