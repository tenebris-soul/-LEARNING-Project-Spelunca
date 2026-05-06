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
