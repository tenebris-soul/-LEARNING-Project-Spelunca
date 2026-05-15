import type { Linedef } from "../../types/sectorLogic/linedef";

type Side = "front" | "back" | "on";

export function getPlayerSideByLine(
  line: Linedef,
  playerPos: { x: number; y: number },
): Side {
  const lineDirX = line.v2.x - line.v1.x;
  const lineDirY = line.v2.y - line.v1.y;

  const toPlayerX = playerPos.x - line.v1.x;
  const toPlayerY = playerPos.y - line.v2.y;

  const side = lineDirX * toPlayerY - lineDirY * toPlayerX;
  const EPS = 0.00001;

  if (side > EPS) return "front";
  else if (side < -EPS) return "back";
  return "on";
}
