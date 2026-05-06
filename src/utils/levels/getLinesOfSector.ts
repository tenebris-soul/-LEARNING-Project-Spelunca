import type { Level } from "../../types/levelLogic/level";
import type { Linedef } from "../../types/sectorLogic/linedef";

export function getLinesOfSector(
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
      lines.push(line);
    }
  }

  return lines;
}
