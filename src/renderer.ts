import type { Graphics } from "pixi.js";
import type { Level } from "./types/levelLogic/level";
import type { Player } from "./player";
import { getLinesOfSector } from "./utils/levels/getLinesOfSector";

type Vec2 = { x: number; y: number };
type CameraPoint = { x: number; z: number };

export class Renderer {
  // top-down графика (дебаг)
  private topDownScale = 30;
  private topDownOffsetX = 80;
  private topDownOffsetY = 120;

  private playerGraphics: Graphics | null = null;
  private levelGraphics: Graphics | null = null;
  private raysGraphics: Graphics | null = null;

  // 3d графика
  private speluncaGraphics: Graphics | null = null;
  private fov = (75 * Math.PI) / 180;
  private near = 0.01;
  private screenWidth: number;
  private screenHeight: number;

  // база всякая
  private player: Player;
  private currentLevel: Level | null = null;

  constructor(player: Player, screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.player = player;
  }

  // top-down рендер
  constructTopDown(
    playerGraphics: Graphics,
    levelGraphics: Graphics,
    raysGraphics: Graphics,
  ) {
    this.playerGraphics = playerGraphics;
    this.levelGraphics = levelGraphics;
    this.raysGraphics = raysGraphics;
  }

  renderTopDown() {
    this.drawTopDownLevel();
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

    const { lines, vertices } = this.currentLevel;

    for (const line of lines) {
      const v1 = vertices[line.v1Index];
      const v2 = vertices[line.v2Index];

      this.levelGraphics.moveTo(
        v1.x * this.topDownScale + this.topDownOffsetX,
        v1.y * this.topDownScale + this.topDownOffsetY,
      );
      this.levelGraphics.lineTo(
        v2.x * this.topDownScale + this.topDownOffsetX,
        v2.y * this.topDownScale + this.topDownOffsetY,
      );

      if (line.backSidedefIndex !== null)
        this.levelGraphics.stroke({ width: 2, color: 0xffffff });
      else this.levelGraphics.stroke({ width: 2, color: 0x454545 });
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
      .fill(0xffcc00);

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
  constructSpelunca(speluncaGraphics: Graphics) {
    this.speluncaGraphics = speluncaGraphics;
  }

  renderFromCamera() {
    if (this.currentLevel === null) return;

    if (this.speluncaGraphics === null) {
      console.warn(
        "Spelunca graphics is not assigned! 3D will not be rendered.",
      );
      return;
    }
    this.speluncaGraphics.clear();

    const lines = getLinesOfSector(
      this.currentLevel,
      this.player.currentSectorIndex,
    );

    const floor =
      this.currentLevel.sectors[this.player.currentSectorIndex].floorHeight;
    const ceil =
      this.currentLevel.sectors[this.player.currentSectorIndex].ceilingHeight;

    if (lines === undefined) return;

    for (const line of lines) {
      if (line.backSidedefIndex !== null) continue;

      const p1: Vec2 = {
        x: this.currentLevel.vertices[line.v1Index].x,
        y: this.currentLevel.vertices[line.v1Index].y,
      };
      const p2: Vec2 = {
        x: this.currentLevel.vertices[line.v2Index].x,
        y: this.currentLevel.vertices[line.v2Index].y,
      };

      const p1Cam = this.worldToCamera(p1);
      const p2Cam = this.worldToCamera(p2);

      const clipped = this.clipWallToNearPlane(p1Cam, p2Cam);

      if (clipped === null) continue;

      const [p1Clipped, p2Clipped] = clipped;

      const focalLength = this.screenWidth / 2 / Math.tan(this.fov / 2);

      const p1ScreenX =
        this.screenWidth / 2 + (p1Clipped.x / p1Clipped.z) * focalLength;
      const p2ScreenX =
        this.screenWidth / 2 + (p2Clipped.x / p2Clipped.z) * focalLength;

      const p1ScreenUp =
        this.screenHeight / 2 -
        ((ceil - this.player.eyeHeight) / p1Clipped.z) * focalLength;
      const p1ScreenDown =
        this.screenHeight / 2 -
        ((floor - this.player.eyeHeight) / p1Clipped.z) * focalLength;
      const p2ScreenUp =
        this.screenHeight / 2 -
        ((ceil - this.player.eyeHeight) / p2Clipped.z) * focalLength;
      const p2ScreenDown =
        this.screenHeight / 2 -
        ((floor - this.player.eyeHeight) / p2Clipped.z) * focalLength;

      this.speluncaGraphics
        .moveTo(p1ScreenX, p1ScreenUp)
        .lineTo(p1ScreenX, p1ScreenDown)
        .lineTo(p2ScreenX, p2ScreenDown)
        .lineTo(p2ScreenX, p2ScreenUp)
        .closePath()
        .fill(0xffcc00);
    }
  }

  private worldToCamera(point: Vec2): CameraPoint {
    const dx = point.x - this.player.x;
    const dy = point.y - this.player.y;

    const sin = Math.sin(this.player.angle);
    const cos = Math.cos(this.player.angle);

    return {
      x: dx * -sin + dy * cos,
      z: dx * cos + dy * sin,
    };
  }

  clipWallToNearPlane(
    p1: CameraPoint,
    p2: CameraPoint,
  ): [CameraPoint, CameraPoint] | null {
    const p1Behind = p1.z < this.near;
    const p2Behind = p2.z < this.near;

    if (p1Behind && p2Behind) {
      return null;
    }

    if (!p1Behind && !p2Behind) {
      return [p1, p2];
    }

    // Одна точка за near-plane, другая перед ней
    const t = (this.near - p1.z) / (p2.z - p1.z);

    const clippedPoint: CameraPoint = {
      x: p1.x + (p2.x - p1.x) * t,
      z: this.near,
    };

    if (p1Behind) {
      return [clippedPoint, p2];
    } else {
      return [p1, clippedPoint];
    }
  }

  changeLevel(level: Level) {
    this.currentLevel = level;
  }
}
