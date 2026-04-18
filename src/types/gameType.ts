import type { LevelDataType } from "./levelType";
import type { PlayerType } from "./playerType";

export type GameType = {
  player: PlayerType;
  levels: Record<string, LevelDataType>;
  canvas: HTMLCanvasElement;

  init(): void;
  update(): void;
};
