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
    const frontSector = level.sides[line.frontSidedefIndex].sector;
    const backSector =
      line.backSidedefIndex !== null
        ? level.sides[line.backSidedefIndex].sector
        : null;

    if (frontSector === sectorIndex || backSector === sectorIndex) {
      lines.push(line);
    }
  }

  return lines;
}
