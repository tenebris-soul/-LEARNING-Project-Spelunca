import type { Level } from "../../types/levelLogic/level";

export function isPointInSector(
  level: Level,
  sectorIndex: number,
  x: number,
  y: number,
): boolean {
  let inside: boolean = false;

  for (const line of level.lines) {
    const frontSector = level.sides[line.frontSidedefIndex].sector;
    const backSector =
      line.backSidedefIndex !== null
        ? level.sides[line.backSidedefIndex].sector
        : null;

    if (frontSector !== sectorIndex && backSector !== sectorIndex) continue;

    const A = level.vertices[line.v1Index];
    const B = level.vertices[line.v2Index];

    const intersects =
      A.y > y !== B.y > y && x < ((B.x - A.x) * (y - A.y)) / (B.y - A.y) + A.x;

    if (intersects) inside = !inside;
  }

  return inside;
}
