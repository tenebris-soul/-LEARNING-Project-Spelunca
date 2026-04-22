import type { LevelDataType } from "../types/levelStructure/levelType";
import { isPointInPolygon } from "./canOccupy";

export function getSectorFloorZ(
  level: LevelDataType,
  x: number,
  y: number,
): number {
  const point = { x, y };

  for (let i = 0; i < level.sectors.length; i++) {
    const sector = level.sectors[i];
    const vertices = sector.walls.map((wallIndex) => level.walls[wallIndex].a);

    if (vertices.length >= 3 && isPointInPolygon(point, vertices)) {
      return level.sectors[i].floor;
    }
  }

  return 0;
}
