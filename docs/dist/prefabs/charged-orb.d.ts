import { type ChargedOrbOptions } from "../animations/charged-orb.js";
import type { ProgressSpinnerOptions } from "../index.js";
import type { ParticlesOptions } from "../animations/particles.js";
import type { ProgressPrefabOptions } from "./types.js";
export interface ChargedOrbPrefabOptions extends ProgressPrefabOptions {
    /** Overrides for the orb layer. */
    orb?: ChargedOrbOptions;
    /** Overrides for the particle layer. */
    particles?: ParticlesOptions;
}
/**
 * A progress story: the center orb pops straight to full size, and every 10%
 * of progress a mini orb pops out of it into an evenly spread satellite ring,
 * each satellite trailing its own spark stream; at 100% the satellites take
 * one extra lap, dive back into the big orb, and the orb pops away.
 */
export declare function chargedOrb(options?: ChargedOrbPrefabOptions): ProgressSpinnerOptions;
