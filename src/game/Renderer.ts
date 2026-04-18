import { Application, Graphics } from "pixi.js";
import type { LevelDataType } from "../types/levelType";
import type { Player } from "./Player";
import type { RaycastHitType } from "../types/raycastHitType";

export class Renderer {
  private app: Application;
  private graphics: Graphics;

  constructor(app: Application) {
    this.app = app;
    this.graphics = new Graphics();
  }

  DebugView(
    levelData: LevelDataType,
    player: Player,
    raycastHits: RaycastHitType[],
  ): void {
    this.graphics.clear();

    const tileSize = 32;

    // рисуем уровень
    for (let y = 0; y < levelData.height; y++) {
      for (let x = 0; x < levelData.width; x++) {
        const tileValue = levelData.tiles[y * levelData.width + x];

        if (tileValue === 1) {
          this.graphics.rect(x * tileSize, y * tileSize, tileSize, tileSize);
          this.graphics.fill(0x4fc3f7);
        } else {
          this.graphics.rect(x * tileSize, y * tileSize, tileSize, tileSize);
          this.graphics.fill(0x20242a);
        }

        this.graphics.stroke({ width: 1, color: 0x111111 });
      }
    }

    const playerX = player.x * tileSize;
    const playerY = player.y * tileSize;

    // рисуем игрока
    this.graphics.circle(playerX, playerY, 5);
    this.graphics.fill(0xff5722);

    // рисуем луч от игрока
    for (let i = 0; i < raycastHits.length; i++) {
      const raycastHit = raycastHits[i];
      this.graphics.moveTo(playerX, playerY);
      this.graphics.lineTo(
        raycastHit.hitX * tileSize,
        raycastHit.hitY * tileSize,
      );
    }
    this.graphics.stroke({ width: 2, color: 0xff5722 });

    this.app.stage.addChild(this.graphics);
  }

  DrawScene(raycastHits: RaycastHitType[]): void {
    this.graphics.clear();

    this.graphics.rect(0, 0, this.app.canvas.width, this.app.canvas.height / 2);
    this.graphics.fill(0x191970);

    this.graphics.rect(
      0,
      this.app.canvas.height / 2,
      this.app.canvas.width,
      this.app.canvas.height,
    );
    this.graphics.fill(0x6495ed);

    for (let i = 0; i < raycastHits.length; i++) {
      const screenHeight = this.app.canvas.height;

      const wallHeight = screenHeight / raycastHits[i].distance;

      const drawStart = screenHeight / 2 - wallHeight / 2;

      const wallWidth = this.app.canvas.width / raycastHits.length;

      this.graphics.rect(i * wallWidth, drawStart, wallWidth, wallHeight);

      if (raycastHits[i].side === 1) {
        this.graphics.fill(0xaaaaaa);
      } else {
        this.graphics.fill(0xffffff);
      }
    }

    this.app.stage.addChild(this.graphics);
  }
}
