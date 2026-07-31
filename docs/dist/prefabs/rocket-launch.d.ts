import type { ProgressSpinnerOptions } from "../index.js";
import type { ProgressPrefabOptions } from "./types.js";
/**
 * A progress story on a launch pad: every 5% of progress a small rocket slides
 * in cartoon-style from the right and lines up under the progress text, idling
 * on a thin wisp of smoke. At 100% the whole row blasts off in a loose stagger
 * on columns of fire; partway up, three of them suddenly veer 30-50 degrees and
 * streak away.
 */
export declare function rocketLaunch(options?: ProgressPrefabOptions): ProgressSpinnerOptions;
