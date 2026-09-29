/** Return `value`, or throw a `RangeError` naming `name` if it is `NaN` or infinite. */
export declare function finite(value: number, name: string): number;
/** Return `value`, or throw a `RangeError` naming `name` unless it is finite and not zero. */
export declare function finiteNonZero(value: number, name: string): number;
/** Return `value`, or throw a `RangeError` naming `name` unless it is finite and above zero. */
export declare function positiveFinite(value: number, name: string): number;
