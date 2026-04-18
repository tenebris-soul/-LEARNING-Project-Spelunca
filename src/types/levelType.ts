import type { PlayerSpawnPoint } from "./playerSpawnPointType";

export type LevelDataType = {
  width: number;
  height: number;
  player_spawn: PlayerSpawnPoint;
  tiles: Uint8Array;
};
