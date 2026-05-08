export function cross(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return a.x * b.y - a.y * b.x;
}

export function dot(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return a.x * b.x + a.y * b.y;
}

export function clamp(value: number, min: number, max: number) {
  const ceil = Math.min(value, max);
  return Math.max(min, ceil);
}

export function lerpAtX(
  x: number,
  x1: number,
  x2: number,
  y1: number,
  y2: number,
): number {
  if (Math.abs(x2 - x1) < 0.00001) return y1;

  const t = (x - x1) / (x2 - x1);
  return y1 + (y2 - y1) * t;
}
