import type { Application } from "pixi.js";
import { canOccupy, type LevelDataType } from "../types/levelType";

import { levels } from "../data/Levels";
import { Player } from "./Player";
import { Keys } from "./Input";
import { Renderer } from "./Renderer";
import { Raycaster } from "./Raycaster";

export class Game {
  player: Player | null = null;
  levels: Record<string, LevelDataType>;
  raycaster: Raycaster;
  renderer: Renderer;

  private currentLevel: LevelDataType | null = null;

  constructor(app: Application) {
    this.levels = levels;
    this.renderer = new Renderer(app);
    this.raycaster = new Raycaster();
  }

  init() {
    this.currentLevel = this.levels["test_level"];
    const spawn = this.currentLevel.player_spawn;
    this.player = new Player(spawn.x, spawn.y, spawn.angle);
  }

  update() {
    const level = this.currentLevel;

    if (!level || !this.player) {
      return;
    }

    if (Keys["KeyW"] || Keys["ArrowUp"]) {
      const step = this.player.getForwardStep();
      const nextX = this.player.x + step.x;
      const nextY = this.player.y + step.y;

      if (canOccupy(level, nextX, this.player.y)) {
        this.player.x = nextX;
      }

      if (canOccupy(level, this.player.x, nextY)) {
        this.player.y = nextY;
      }
    }

    if (Keys["KeyA"] || Keys["ArrowLeft"]) {
      this.player.rotate("Left");
    }

    if (Keys["KeyD"] || Keys["ArrowRight"]) {
      this.player.rotate("Right");
    }

    const raycastHits = this.raycaster.castRays(
      this.player.x,
      this.player.y,
      this.player.angle,
      this.player.getFovInRadians(),
      120,
      level,
    );

    // this.renderer.DebugView(level, this.player, raycastHits);
    this.renderer.DrawScene(raycastHits);
  }
}
