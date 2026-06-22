export type TweenType =
  | "linear"
  | "quadratic"
  | "cubic"
  | "quartic"
  | "quintic";

export type TweenFunction = (value: number, overextend?: boolean) => number;

function input(value: number, overextend: boolean): number {
  if (Number.isNaN(value)) return 0;
  if (overextend) return value;
  return Math.min(1, Math.max(0, value));
}

export function linear(value: number, overextend = false): number {
  return input(value, overextend);
}

export function quadratic(value: number, overextend = false): number {
  const t = input(value, overextend);
  return t * t;
}

export function cubic(value: number, overextend = false): number {
  const t = input(value, overextend);
  return t * t * t;
}

export function quartic(value: number, overextend = false): number {
  const t = input(value, overextend);
  return t * t * t * t;
}

export function quintic(value: number, overextend = false): number {
  const t = input(value, overextend);
  return t * t * t * t * t;
}

export const tweenTypes: Readonly<Record<TweenType, TweenFunction>> = {
  linear,
  quadratic,
  cubic,
  quartic,
  quintic,
};

export function tween(type: TweenType, value: number, overextend = false): number {
  return tweenTypes[type](value, overextend);
}
