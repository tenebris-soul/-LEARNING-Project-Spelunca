import type { Application } from "pixi.js";
import { type LevelDataType } from "../types/levelStructure/levelType";

import { levels } from "../data/levels/Levels";
import { Player } from "./Player";
import { Keys } from "./Input";
import { Renderer } from "./Renderer";
import { Raycaster } from "./Raycaster";
import { Direction } from "../types/directionType";
import { canOccupy } from "../utils/canOccupy";
import { getSectorFloorZ } from "../utils/getSectorFloorZ";
import { Lerp } from "../utils/mathUtils";

// type Example = {
//   a: boolean,
//   b?: string
// }

// type A = Required<Example>
// type B = Partial<Example>
// type C = Pick<Example, 'a' | 'b'>
// type D = Omit<Example, 'a' | 'b'>

// type Func = (a: any, b: never) => void

// type Result = ReturnType<Func>
// type A = Parameters<Func>[0]

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

  async init() {
    this.currentLevel = this.levels["test_level"];
    const spawn = this.currentLevel.playerSpawn;

    const playerFloorZ = getSectorFloorZ(this.currentLevel, spawn.x, spawn.y);

    this.player = new Player(spawn.x, spawn.y, spawn.angle, 0.5, playerFloorZ);

    await this.renderer.init(160);
  }

  update() {
    const level = this.currentLevel;

    if (!level || !this.player) {
      return;
    }

    if (Keys["KeyW"] || Keys["ArrowUp"]) {
      const step = this.player.getForwardStep();
      const nextX = this.player.pos.x + step.x;
      const nextY = this.player.pos.y + step.y;

      if (canOccupy(level, nextX, this.player.pos.y)) {
        this.player.pos.x = nextX;

        const newFloorZ = getSectorFloorZ(
          level,
          this.player.pos.x,
          this.player.pos.y,
        );
        this.player.floorZ = newFloorZ;
      }

      if (canOccupy(level, this.player.pos.x, nextY)) {
        this.player.pos.y = nextY;

        const newFloorZ = getSectorFloorZ(
          level,
          this.player.pos.x,
          this.player.pos.y,
        );
        this.player.floorZ = newFloorZ;
      }
    }

    if (Keys["KeyA"] || Keys["ArrowLeft"]) {
      this.player.rotate(Direction.Left);
    }

    if (Keys["KeyD"] || Keys["ArrowRight"]) {
      this.player.rotate(Direction.Right);
    }

    const raycastHits = this.raycaster.castRays(
      this.player.pos,
      this.player.angle,
      this.player.getFovInRadians(),
      160,
      level,
    );

    this.player.playerZ = Lerp(
      this.player.playerZ,
      this.player.floorZ + this.player.eyeHeight,
      0.25,
    );
    this.renderer.DrawScene(raycastHits, level, this.player, 160);
    // this.renderer.DebugView(level, this.player, raycastHits);
  }
}
