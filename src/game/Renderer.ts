import { Application, Graphics } from "pixi.js";
import type { LevelDataType } from "../types/levelStructure/levelType";
import type { Player } from "./Player";
import type { RaycastHitType } from "../types/raycastHitType";
import type { Vec2 } from "../types/gameStructure/vectorType";

export class Renderer {
  private app: Application;
  private graphics: Graphics;

  private readonly eps: number = 0.01;

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

    const scale = 40;
    const offsetX = 30;
    const offsetY = 30;

    // рисуем стены
    for (let i = 0; i < levelData.walls.length; i++) {
      const wall = levelData.walls[i];

      const a = wall.a;
      const b = wall.b;

      const aScreen = {
        x: offsetX + a.x * scale,
        y: offsetY + a.y * scale,
      };

      const bScreen = {
        x: offsetX + b.x * scale,
        y: offsetY + b.y * scale,
      };

      this.graphics.moveTo(aScreen.x, aScreen.y);
      this.graphics.lineTo(bScreen.x, bScreen.y);
      this.graphics.stroke({ width: 2, color: wall.color });
    }

    // рисуем игрока
    const playerScreen: Vec2 = {
      x: offsetX + player.pos.x * scale,
      y: offsetY + player.pos.y * scale,
    };

    this.graphics.circle(playerScreen.x, playerScreen.y, 15);
    this.graphics.fill(0xff0000);

    // рисуем лучи от игрока
    for (let i = 0; i < raycastHits.length; i++) {
      const hit = raycastHits[i].hit;
      const hitScreen = {
        x: offsetX + hit.x * scale,
        y: offsetY + hit.y * scale,
      };

      this.graphics.moveTo(playerScreen.x, playerScreen.y);
      this.graphics.lineTo(hitScreen.x, hitScreen.y);
      this.graphics.stroke({ width: 2, color: 0xff0000 });
    }

    this.app.stage.addChild(this.graphics);
  }

  DrawScene(
    raycastHits: RaycastHitType[],
    level: LevelDataType,
    fov: number,
    numRays: number,
  ): void {
    this.graphics.clear();

    const screenWidth = this.app.canvas.width;
    const screenHeight = this.app.canvas.height;

    this.graphics.rect(0, 0, screenWidth, screenHeight / 2);
    this.graphics.fill(0x87ceeb);
    this.graphics.rect(0, screenHeight / 2, screenWidth, screenHeight / 2);
    this.graphics.fill(0xcfcfc4);

    const projectPlaneDist = screenWidth / 2 / Math.tan(fov / 2);
    const columnWidth = screenWidth / numRays;

    for (let i = 0; i < raycastHits.length; i++) {
      const hit = raycastHits[i];

      if (hit.wallIndex === -1) continue;

      const dist = hit.correctDistance < this.eps ? this.eps : hit.correctDistance;
      const wallHeight = (1 * projectPlaneDist) / dist; // потом заменить на дум-подобное

      const drawStart = (screenHeight - wallHeight) / 2;
      const collumnX = i * columnWidth;

      const distanceShade = 1 / (1 + dist * 0.08); // потом степень затухания вынести
      const wallColor = level.walls[hit.wallIndex].color;
      let shadeColor = null;

      if (wallColor !== undefined) {
        const r = (wallColor >> 16) & 255;
        const g = (wallColor >> 8) & 255;
        const b = wallColor % 255;

        const r2 = Math.floor(r * distanceShade);
        const g2 = Math.floor(g * distanceShade);
        const b2 = Math.floor(b * distanceShade);

        shadeColor = (r2 << 16) | (g2 << 8) | b2;
      }

      this.graphics.rect(collumnX, drawStart, columnWidth, wallHeight);
      if (shadeColor !== null) this.graphics.fill(shadeColor);
      else this.graphics.fill(wallColor);
    }

    this.app.stage.addChild(this.graphics);
  }
}
