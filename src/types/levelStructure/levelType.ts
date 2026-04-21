import type { PlayerSpawnPoint } from "../playerSpawnPointType";
import type { Sector } from "./sectorType";
import type { Wall } from "./wallType";

// export type LevelDataType = {
//   width: number;
//   height: number;
//   player_spawn: PlayerSpawnPoint;
//   tiles: Uint8Array;
// };

export type LevelDataType = {
  playerSpawn: PlayerSpawnPoint;
  walls: Wall[];
  sectors: Sector[];
};
