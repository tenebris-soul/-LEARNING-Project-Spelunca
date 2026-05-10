import type { Level } from "../../types/levelLogic/level";
import type { Linedef } from "../../types/sectorLogic/linedef";

export function getLinesOfSectorAndNeighbors(
  level: Level,
  sectorIndex: number,
): Linedef[] | undefined {
  if (sectorIndex < 0 || sectorIndex >= level.sectors.length) {
    console.error("Sector is not defined!");
    return undefined;
  }
  let lines: Linedef[] = [];

  for (const line of level.lines) {
    if (level.sides[line.frontSidedefIndex].sector === sectorIndex) {
      if (line.backSidedefIndex === null) {
        lines.push(line);
      } else {
        const neighbors = getPortalNeighborLines(level, line);
        lines.push(...neighbors);
      }
    }
  }

  return lines;
}

function getPortalNeighborLines(level: Level, portal: Linedef): Linedef[] {
  let portalNeighbors: Linedef[] = [];

  for (const line of level.lines) {
    if (portal === line) continue;

    if (
      isSameVertex(line.v1, portal.v1) ||
      isSameVertex(line.v2, portal.v2) ||
      isSameVertex(line.v1, portal.v2) ||
      isSameVertex(line.v2, portal.v1)
    )
      portalNeighbors.push(line);
  }

  return portalNeighbors;
}

function isSameVertex(
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean {
  return a.x === b.x && a.y === b.y;
}
