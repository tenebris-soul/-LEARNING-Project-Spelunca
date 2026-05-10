import type { Graphics } from "pixi.js";
import type { Level } from "./types/levelLogic/level";
import type { Player } from "./player";
import type { BSPNode } from "./types/bsp/bspNode";

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
  // база всякая
  private bspTree: BSPNode | null = null;

  private player: Player;
  private currentLevel: Level | null = null;

  constructor(player: Player) {
    this.player = player;
  }

  // top-down рендер
  constructTopDown(
    playerGraphics: Graphics,
    levelGraphics: Graphics,
    bspGraphics: Graphics,
    raysGraphics: Graphics,
    bspTree: BSPNode,
  ) {
    this.playerGraphics = playerGraphics;
    this.levelGraphics = levelGraphics;
    this.bspGraphics = bspGraphics;
    this.raysGraphics = raysGraphics;
    this.bspTree = bspTree;
  }

  renderTopDown() {
    this.drawTopDownLevel();
    this.drawBSPTree(this.bspTree, 0);
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

  private drawBSPTree(node: BSPNode | null, depth: number) {
    if (this.bspGraphics === null || node === null) return;

    // FIX: redraw the BSP debug layer from scratch each frame.
    if (depth === 0) this.bspGraphics.clear();

    const color = this.getBSPDepthColor(depth);
    const v1 = node.splitter.v1;
    const v2 = node.splitter.v2;

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
        color,
        alpha: 1,
      });

    this.drawBSPTree(node.front, depth + 1);
    this.drawBSPTree(node.back, depth + 1);
  }

  private getBSPDepthColor(depth: number): number {
    const colors = [0xff4040, 0x40ff80, 0x4090ff, 0xffcc40, 0xff40ff, 0x40ffff];

    return colors[depth % colors.length];
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

  changeLevel(level: Level) {
    this.currentLevel = level;
  }
}
