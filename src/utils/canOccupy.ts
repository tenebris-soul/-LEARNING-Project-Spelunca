import type { LevelDataType } from "../types/levelStructure/levelType";
import type { Vec2 } from "../types/gameStructure/vectorType";

const eps = 0.0001;

function isPointOnSegment(point: Vec2, a: Vec2, b: Vec2): boolean {
  const cross = (point.x - a.x) * (b.y - a.y) - (point.y - a.y) * (b.x - a.x);
  if (Math.abs(cross) > eps) {
    return false;
  }

  const dot = (point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y);
  if (dot < -eps) {
    return false;
  }

  const sqLen = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  return dot <= sqLen + eps;
}

function isPointInPolygon(point: Vec2, vertices: Vec2[]): boolean {
  let inside = false;

  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const a = vertices[i];
    const b = vertices[j];

    if (isPointOnSegment(point, a, b)) {
      return true;
    }

    const intersects =
      (a.y > point.y) !== (b.y > point.y) &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function canOccupy(level: LevelDataType, x: number, y: number): boolean {
  const point = { x, y };

  for (let i = 0; i < level.sectors.length; i++) {
    const sector = level.sectors[i];
    const vertices = sector.walls.map((wallIndex) => level.walls[wallIndex].a);

    if (vertices.length >= 3 && isPointInPolygon(point, vertices)) {
      return true;
    }
  }

  return false;
}
