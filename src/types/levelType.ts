import type { PlayerSpawnPoint } from "./playerSpawnPointType";

export type LevelDataType = {
  width: number;
  height: number;
  player_spawn: PlayerSpawnPoint;
  tiles: Uint8Array;
};

export function canOccupy(level: LevelDataType, x: number, y: number): boolean {
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);

  if (tileX < 0 || tileX >= level.width || tileY < 0 || tileY >= level.height) {
    return false;
  }

  const index = tileY * level.width + tileX;
  return level.tiles[index] === 0;
}
