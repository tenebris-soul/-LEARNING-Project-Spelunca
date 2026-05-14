import type { Graphics } from "pixi.js";
import type { Level } from "./types/levelLogic/level";
import type { Player } from "./player";
import type { BSPNode } from "./types/bsp/bspNode";
import type { Linedef } from "./types/sectorLogic/linedef";
import type { Vertex } from "./types/sectorLogic/vertex";
import { lerp } from "./utils/mathUtils";

type CameraPoint = { x: number; z: number };

export class Renderer {
  // top-down графика (дебаг)
  private topDownScale = 30;
  private topDownOffsetX = 80;
  private topDownOffsetY = 120;

  private playerGraphics: Graphics | null = null;
  private levelGraphics: Graphics | null = null;
  private bspGraphics: Graphics | null = null;
  private raysGraphics: Graphics | null = null;

  // 3d графика
  private screenWidth: number;
  private screenHeight: number;
  private speluncaGraphics: Graphics | null = null;

  // база всякая
  private player: Player;
  private currentLevel: Level | null = null;

  constructor(player: Player, screenWidth: number, screenHeight: number) {
    this.player = player;

    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  // top-down рендер
  constructTopDown(
    playerGraphics: Graphics,
    levelGraphics: Graphics,
    bspGraphics: Graphics,
    raysGraphics: Graphics,
    _bspTree: BSPNode,
  ) {
    this.playerGraphics = playerGraphics;
    this.levelGraphics = levelGraphics;
    this.bspGraphics = bspGraphics;
    this.raysGraphics = raysGraphics;
  }

  renderTopDown(renderCandidates: Linedef[]) {
    this.drawTopDownLevel();
    this.drawRenderCandidates(renderCandidates);
    this.drawPlayerAndRays();
  }

  private drawTopDownLevel() {
    if (this.levelGraphics === null) {
      console.warn(
        "Level graphics is not assigned! Level will not be rendered.",
      );
      return;
    }

    this.levelGraphics.clear();

    if (this.currentLevel === null) {
      console.warn("Level is not assigned!");
      return;
    }

    for (const line of this.currentLevel.lines) {
      const v1 = line.v1;
      const v2 = line.v2;

      this.levelGraphics
        .moveTo(
          v1.x * this.topDownScale + this.topDownOffsetX,
          v1.y * this.topDownScale + this.topDownOffsetY,
        )
        .lineTo(
          v2.x * this.topDownScale + this.topDownOffsetX,
          v2.y * this.topDownScale + this.topDownOffsetY,
        )
        .stroke({
          width: 2,
          color: line.backSidedefIndex !== null ? 0xffffff : 0x454545,
        });
    }
  }

  private drawRenderCandidates(lines: Linedef[]) {
    if (this.bspGraphics === null) return;

    this.bspGraphics.clear();

    for (const line of lines) {
      const v1 = line.v1;
      const v2 = line.v2;

      this.bspGraphics
        .moveTo(
          v1.x * this.topDownScale + this.topDownOffsetX,
          v1.y * this.topDownScale + this.topDownOffsetY,
        )
        .lineTo(
          v2.x * this.topDownScale + this.topDownOffsetX,
          v2.y * this.topDownScale + this.topDownOffsetY,
        )
        .stroke({
          width: 4,
          color: 0xffff00,
          alpha: 1,
        });
    }
  }
  private drawPlayerAndRays() {
    if (this.playerGraphics === null) {
      console.warn(
        "Player graphics is not assigned! Player will not be rendered.",
      );
      return;
    }
    if (this.raysGraphics === null) {
      console.warn("Rays graphics is not assigned! Rays will not be rendered.");
      return;
    }

    this.playerGraphics.clear();
    this.raysGraphics.clear();

    if (this.currentLevel === null) {
      console.warn("Level is not assigned!");
      return;
    }

    const rayX = Math.cos(this.player.angle) * this.topDownScale;
    const rayY = Math.sin(this.player.angle) * this.topDownScale;

    this.playerGraphics
      .circle(
        this.player.x * this.topDownScale + this.topDownOffsetX,
        this.player.y * this.topDownScale + this.topDownOffsetY,
        this.player.radius * this.topDownScale,
      )
      .fill(0xffa500);

    this.raysGraphics
      .moveTo(
        this.player.x * this.topDownScale + this.topDownOffsetX,
        this.player.y * this.topDownScale + this.topDownOffsetY,
      )
      .lineTo(
        this.player.x * this.topDownScale + this.topDownOffsetX + rayX,
        this.player.y * this.topDownScale + this.topDownOffsetY + rayY,
      )
      .stroke({ width: 1, color: 0x87ceeb });
  }

  // 3d-визуализация
  construct3D(spelunca: Graphics) {
    this.speluncaGraphics = spelunca;
  }

  render3D(lines: Linedef[]) {
    if (this.speluncaGraphics === null) return;
    if (this.currentLevel === null) return;

    this.speluncaGraphics.clear();
    this.speluncaGraphics.rect(0, 0, this.screenWidth, this.screenHeight / 2);
    this.speluncaGraphics.fill(0x17191d);
    this.speluncaGraphics.rect(
      0,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight / 2,
    );
    this.speluncaGraphics.fill(0x2b2925);

    const projectionPlaneDist =
      this.screenWidth / 2 / Math.tan(this.player.fov / 2);
    const closedColumns = new Array<boolean>(this.screenWidth).fill(false);

    for (const line of lines) {
      let p1 = this.getCameraPoint(line.v1);
      let p2 = this.getCameraPoint(line.v2);

      if (p1.z <= this.player.near && p2.z <= this.player.near) continue;

      let u1 = 0;
      let u2 = Math.sqrt(
        (line.v2.x - line.v1.x) * (line.v2.x - line.v1.x) +
          (line.v2.y - line.v1.y) * (line.v2.y - line.v1.y),
      );

      if (p1.z < this.player.near || p2.z < this.player.near) {
        const t = (this.player.near - p1.z) / (p2.z - p1.z);
        const clippedPoint = {
          x: lerp(p1.x, p2.x, t),
          z: this.player.near,
        };
        const clippedU = lerp(u1, u2, t);

        if (p1.z < this.player.near) {
          p1 = clippedPoint;
          u1 = clippedU;
        } else {
          p2 = clippedPoint;
          u2 = clippedU;
        }
      }

      // прост рендер по X
      let screenX1 = this.screenWidth / 2 + (p1.x * projectionPlaneDist) / p1.z;
      let screenX2 = this.screenWidth / 2 + (p2.x * projectionPlaneDist) / p2.z;

      if (Math.abs(screenX2 - screenX1) < 0.00001) continue;
      if (screenX1 < 0 && screenX2 < 0) continue;
      if (screenX1 >= this.screenWidth && screenX2 >= this.screenWidth)
        continue;

      // теперь рендер по Y
      const sectorIndex =
        this.currentLevel.sides[line.frontSidedefIndex].sector;

      const topSector =
        this.currentLevel.sectors[sectorIndex].ceilingHeight -
        this.player.eyeHeight;
      const botSector =
        this.currentLevel.sectors[sectorIndex].floorHeight -
        this.player.eyeHeight;

      let screenY1 = {
        topScreen:
          this.screenHeight / 2 - (topSector * projectionPlaneDist) / p1.z,
        botScreen:
          this.screenHeight / 2 - (botSector * projectionPlaneDist) / p1.z,
      };
      let screenY2 = {
        topScreen:
          this.screenHeight / 2 - (topSector * projectionPlaneDist) / p2.z,
        botScreen:
          this.screenHeight / 2 - (botSector * projectionPlaneDist) / p2.z,
      };

      // свапаем если есть необходимость
      if (screenX1 > screenX2) {
        [screenX1, screenX2] = [screenX2, screenX1];
        [screenY1, screenY2] = [screenY2, screenY1];
        [p1, p2] = [p2, p1];
        [u1, u2] = [u2, u1];
      }

      // инвертируем глубину для будущего
      const invDepth1 = 1 / p1.z;
      const invDepth2 = 1 / p2.z;

      // посчитаем длину стены для будущего
      const uOverDepth1 = u1 / p1.z;
      const uOverDepth2 = u2 / p2.z;

      const xStart = Math.ceil(Math.max(screenX1, 0));
      const xEnd = Math.floor(Math.min(screenX2, this.screenWidth - 1));

      if (xStart > xEnd) continue;

      // терь рендерим
      for (let x = xStart; x <= xEnd; x++) {
        if (closedColumns[x]) continue;

        const t = (x - screenX1) / (screenX2 - screenX1);

        const yTop = lerp(screenY1.topScreen, screenY2.topScreen, t);
        const yBot = lerp(screenY1.botScreen, screenY2.botScreen, t);

        const drawY1 = Math.ceil(Math.max(yTop, 0));
        const drawY2 = Math.floor(Math.min(yBot, this.screenHeight - 1));

        if (drawY1 > drawY2) continue;

        const invDepth = lerp(invDepth1, invDepth2, t);
        const depth = 1 / invDepth;

        const u = lerp(uOverDepth1, uOverDepth2, t) / invDepth;
        const textureStripe = Math.abs(Math.floor(u * 4)) % 2;
        const shade = Math.max(0.25, Math.min(1, 1 - depth / 24));
        const baseColor = textureStripe === 0 ? 0x8f8f78 : 0x777766;
        const r = Math.floor(((baseColor >> 16) & 255) * shade);
        const g = Math.floor(((baseColor >> 8) & 255) * shade);
        const b = Math.floor((baseColor & 255) * shade);
        const color = (r << 16) + (g << 8) + b;

        this.speluncaGraphics.rect(x, drawY1, 1, drawY2 - drawY1 + 1);
        this.speluncaGraphics.fill(color);

        if (line.backSidedefIndex === null) {
          closedColumns[x] = true;
        }
      }
    }
  }

  private getCameraPoint(point: Vertex): CameraPoint {
    const dx = point.x - this.player.x;
    const dy = point.y - this.player.y;

    const cosA = Math.cos(this.player.angle);
    const sinA = Math.sin(this.player.angle);

    return {
      x: -dx * sinA + dy * cosA,
      z: dx * cosA + dy * sinA,
    };
  }

  changeLevel(level: Level) {
    this.currentLevel = level;
  }
}
