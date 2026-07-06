import type { ProgressSpinnerOptions } from "../index.js";
import type { MotionProgressPrefabOptions } from "./types.js";
/**
 * A progress story: a translucent train of ice cubes runs laps around a tilted
 * square track, shedding a trail of pale stars. Every 2% of progress attaches
 * one more car, popping it into existence at the tail; at 100% the whole convoy
 * peels off the track one after another and accelerates away, clearing the view
 * within four seconds as the star trail drains behind it.
 */
export declare function ghostTrain(options?: MotionProgressPrefabOptions): ProgressSpinnerOptions;
