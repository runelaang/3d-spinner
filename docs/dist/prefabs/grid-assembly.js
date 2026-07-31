import { GridAssemblyAnimation, } from "../animations/grid-assembly.js";
import { progressSpinner } from "./spinner.js";
/**
 * A progress story: 25 shapes fly in and circle the view edge, dock one by one
 * into a 5x5 grid as progress climbs, hold the finished grid for a moment at
 * 100%, then dive into the center and vanish with a small pop.
 */
export function gridAssembly(options = {}) {
    return progressSpinner(new GridAssemblyAnimation({
        backend: options.backend,
        label: options.label,
        fadeLabel: options.fadeLabel,
        ...options.assembly,
    }), options);
}
