import type { Player } from "../../player";
import type { Linedef } from "../../types/sectorLogic/linedef";

export function isLinePotentiallyVisible(
  line: Linedef,
  player: Player,
): boolean {
  const ax = line.v1.x - player.x;
  const ay = line.v1.y - player.y;
  const bx = line.v2.x - player.x;
  const by = line.v2.y - player.y;

  const forwardX = Math.cos(player.angle);
  const forwardY = Math.sin(player.angle);

  const aDepth = ax * forwardX + ay * forwardY;
  const bDepth = bx * forwardX + by * forwardY;

  const near = player.near;

  if (aDepth <= near && bDepth <= near) return false;

  const rightX = -forwardY;
  const rightY = forwardX;

  const aSide = ax * rightX + ay * rightY;
  const bSide = bx * rightX + by * rightY;

  const halfFov = (75 * Math.PI) / 180 / 2;
  const tanHalfFov = Math.tan(halfFov);

  const aInside = Math.abs(aSide) <= aDepth * tanHalfFov;
  const bInside = Math.abs(bSide) <= bDepth * tanHalfFov;

  if (aInside || bInside) return true;

  return aSide * bSide < 0;
}
