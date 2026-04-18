import type { GameType } from "../types/gameType";
import type { LevelDataType } from "../types/levelType";
import type { PlayerType } from "../types/playerType";

import { levels } from "../data/levels";
import { Player } from "./player";
import { Keys } from "./Input";

export class Game implements GameType {
  player: PlayerType;
  levels: Record<string, LevelDataType>;
  canvas: HTMLCanvasElement;

  private currentLevel: LevelDataType | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.player = {} as PlayerType;
    this.levels = levels;
    this.canvas = canvas;
  }

  init() {
    this.currentLevel = this.levels["test_level"];
    const spawn = this.currentLevel.player_spawn;
    this.player = new Player(spawn.x, spawn.y, spawn.angle);
  }

  update() {
    if (Keys["KeyW"] || Keys["ArrowUp"]) {
      this.player.moveForward();
    }

    if (Keys["KeyA"] || Keys["ArrowLeft"]) {
      this.player.rotate("Left");
    }

    if (Keys["KeyD"] || Keys["ArrowRight"]) {
      this.player.rotate("Right");
    }
  }
}
