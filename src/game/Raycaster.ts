import type { LevelDataType } from "../types/levelType";
import type { RaycastHitType } from "../types/raycastHitType";

export class Raycaster {
  castRay(
    posX: number,
    posY: number,
    rayAngle: number,
    playerAngle: number,
    levelData: LevelDataType,
  ) {
    const rayDirX = Math.cos(rayAngle);
    const rayDirY = Math.sin(rayAngle);

    let mapX = Math.floor(posX);
    let mapY = Math.floor(posY);

    let deltaDistX = rayDirX === 0 ? Infinity : Math.abs(1 / rayDirX);
    let deltaDistY = rayDirY === 0 ? Infinity : Math.abs(1 / rayDirY);

    let stepX = rayDirX < 0 ? -1 : 1;
    let stepY = rayDirY < 0 ? -1 : 1;

    let sideDistX =
      rayDirX < 0
        ? (posX - mapX) * deltaDistX
        : (mapX + 1.0 - posX) * deltaDistX;
    let sideDistY =
      rayDirY < 0
        ? (posY - mapY) * deltaDistY
        : (mapY + 1.0 - posY) * deltaDistY;

    let isHitted = false;
    let side = 0;

    while (!isHitted) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }

      if (
        mapX >= 0 &&
        mapX < levelData.width &&
        mapY >= 0 &&
        mapY < levelData.height
      ) {
        if (levelData.tiles[mapY * levelData.width + mapX] === 1) {
          isHitted = true;
        }
      }
    }

    let rawDistance: number;
    if (side === 0) {
      rawDistance = (mapX - posX + (1 - stepX) / 2) / rayDirX;
    } else {
      rawDistance = (mapY - posY + (1 - stepY) / 2) / rayDirY;
    }

    const hitX = posX + rayDirX * rawDistance;
    const hitY = posY + rayDirY * rawDistance;

    const distance = rawDistance * Math.cos(rayAngle - playerAngle);

    const hit: RaycastHitType = {
      distance,
      hitX,
      hitY,
      mapX,
      mapY,
      side,
    };

    return hit;
  }

  castRays(
    playerX: number,
    playerY: number,
    playerAngle: number,
    fov: number,
    numRays: number,
    levelData: LevelDataType,
  ): RaycastHitType[] {
    const hits: RaycastHitType[] = [];
    const startAngle = playerAngle - fov / 2;
    const angleStep = fov / numRays;

    for (let i = 0; i < numRays; i++) {
      const rayAngle = startAngle + i * angleStep;
      const hit = this.castRay(
        playerX,
        playerY,
        rayAngle,
        playerAngle,
        levelData,
      );
      hits.push(hit);
    }
    return hits;
  }
}
