/** Options for {@link starTexture}. */
export interface StarTextureOptions {
    /**
     * Radius of a soft glow drawn around the star, in canvas pixels. A blurred
     * copy of the star is composited underneath the crisp one, so the glow takes
     * the particle's tint. Default `0` (no glow).
     */
    glow?: number;
}
/**
 * A white five-point star on a transparent square canvas. With `glow`, a
 * blurred copy is composited beneath the crisp star for a soft halo.
 */
export declare function starTexture(options?: StarTextureOptions): HTMLCanvasElement;
