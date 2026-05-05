import type { Level } from "../../types/levelLogic/level";
import { isValidIndex } from "../isValidIndex";

export function isLevelStructureValid(level: Level): boolean {
  const { vertices, lines, sides, sectors } = level;

  for (let i: number = 0; i < lines.length; i++) {
    const line = lines[i];

    // проверяем существование вертексов
    if (
      !isValidIndex(line.v1Index, vertices.length) ||
      !isValidIndex(line.v2Index, vertices.length)
    ) {
      console.error(`Vertices of line ${i} does not exist`);
      return false;
    }

    // проверяем существование передней стороны линии
    if (!isValidIndex(line.frontSidedefIndex, sides.length)) {
      console.error(`Front side of line ${i} does not exist`);
      return false;
    }

    // проверяем существование задней стороны линии
    if (
      line.backSidedefIndex !== null &&
      !isValidIndex(line.backSidedefIndex, sides.length)
    ) {
      console.error(`Back side of line ${i} does not exist`);
      return false;
    }

    const frontSector = sides[line.frontSidedefIndex].sector;
    const backSector =
      line.backSidedefIndex === null
        ? null
        : sides[line.backSidedefIndex].sector;

    // проверяем, что сайды линии не ведут в один и тот же сектор
    if (backSector !== null && backSector === frontSector) {
      console.error(`Line ${i} has portal sides pointing to the same sector`);
      return false;
    }
  }

  // проверяем существование секторов
  for (let i: number = 0; i < sides.length; i++) {
    const side = sides[i];

    if (!isValidIndex(side.sector, sectors.length)) {
      console.error(`Sector of side ${i} does not exist`);
      return false;
    }
  }

  // проверяем существование сектора игрока
  if (!isValidIndex(level.playerStart.sectorIndex, sectors.length)) {
    console.error(`Player start sector does not exist`);
    return false;
  }
  return true;
}
