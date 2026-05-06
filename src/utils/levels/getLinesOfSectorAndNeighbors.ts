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
      line.v1Index === portal.v1Index ||
      line.v2Index === portal.v2Index ||
      line.v1Index == portal.v2Index ||
      line.v2Index === portal.v1Index
    )
      portalNeighbors.push(line);
  }

  return portalNeighbors;
}
