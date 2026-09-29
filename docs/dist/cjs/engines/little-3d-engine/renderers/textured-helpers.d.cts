import type { Mesh } from "../core/mesh.cjs";
/**
 * An image source accepted for a mesh texture: a URL or a drawable element. A
 * URL on another origin must allow CORS for the WebGL and WebGPU renderers; to
 * load an image some other way, pass the loaded image instead.
 */
export type TextureSource = string | TexImageSource;
/** Options for {@link loadImage}. */
interface LoadImageOptions {
    /**
     * Request the image with CORS, which a GPU upload of an image from another
     * origin requires. Canvas 2D can draw such an image without it.
     */
    cors: boolean;
    onLoad?: (image: HTMLImageElement) => void;
    onError: (error: Error) => void;
}
/** Start loading the image at `url` and return it; `onLoad` or `onError` follows. */
export declare function loadImage(url: string, options: LoadImageOptions): HTMLImageElement;
/** Warn that a texture could not be used; its mesh keeps drawing in its plain color. */
export declare function warnTextureFailed(source: TextureSource, error: unknown): void;
/**
 * UVs as a planar projection of the mesh's XY bounds (u right, v up), emitted
 * in the same face-fan order as `expandToTriangles` so the arrays stay
 * aligned. Exact for billboard quads; flat meshes map incidentally.
 */
export declare function planarUVs(mesh: Mesh): Float32Array;
export {};
