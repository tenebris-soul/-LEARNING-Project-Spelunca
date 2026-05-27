import type { Graphics, Texture } from "pixi.js";
import type { Level } from "./types/levelLogic/level";
import type { Player } from "./player";
import type { BSPNode } from "./types/bsp/bspNode";
import type { Linedef } from "./types/sectorLogic/linedef";
import type { Vertex } from "./types/sectorLogic/vertex";
import { lerp } from "./utils/mathUtils";
import type { Sector } from "./types/sectorLogic/sector";
import { getPlayerSideByLine } from "./utils/levels/getPlayerSideByLine";
import { getTexture } from "./utils/loadTextures";

type CameraPoint = { x: number; z: number };
type WallColumn = {
  x: number;
  y1: number;
  y2: number;

  textureId: string;
  textureX: number;

  wallY1: number;
  wallY2: number;

  shade: number;
};
type PlaneColumn = {
  x: number;
  y1: number;
  y2: number;

  sectorIndex: number;
  type: "floor" | "ceiling";
};

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
  private surfaceContext: CanvasRenderingContext2D | null = null;
  private surfaceImageData: ImageData | null = null;
  private surfaceTexture: Texture | null = null;

  private textureWorldSize = 2;
  private planeTextureWorldSize = 2;

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
  construct3D(surfaceCanvas: HTMLCanvasElement, surfaceTexture: Texture) {
    const context = surfaceCanvas.getContext("2d");
    if (context === null) {
      throw new Error("Canvas 2D context is not available");
    }

    this.surfaceContext = context;
    this.surfaceImageData = context.createImageData(
      this.screenWidth,
      this.screenHeight,
    );
    this.surfaceTexture = surfaceTexture;
  }

  render3D(lines: Linedef[]) {
    if (this.surfaceContext === null || this.surfaceImageData === null) return;
    if (this.currentLevel === null) return;

    this.clearFrameBuffer();

    const projectionPlaneDist =
      this.screenWidth / 2 / Math.tan(this.player.fov / 2);

    const openTop = new Array(this.screenWidth).fill(0);
    const openBottom = new Array(this.screenWidth).fill(this.screenHeight - 1);
    const planeColumns: PlaneColumn[] = [];
    const wallColumns: WallColumn[] = [];

    for (const line of lines) {
      if (line.backSidedefIndex === null)
        this.processSolidWall(
          line,
          projectionPlaneDist,
          openTop,
          openBottom,
          planeColumns,
          wallColumns,
        );
      else
        this.processPortal(
          line,
          projectionPlaneDist,
          openTop,
          openBottom,
          planeColumns,
          wallColumns,
        );
    }

    this.drawPlaneColumns(planeColumns, projectionPlaneDist);
    this.drawWallColumns(wallColumns);
    this.presentFrameBuffer();
  }

  private processPortal(
    line: Linedef,
    projectionPlaneDist: number,
    openTop: number[],
    openBot: number[],
    planeColumns: PlaneColumn[],
    wallColumns: WallColumn[],
  ) {
    if (this.currentLevel === null) return;
    if (line.backSidedefIndex === null) return;

    const frontSectorIndex =
      this.currentLevel.sides[line.frontSidedefIndex].sector;
    const backSectorIndex =
      this.currentLevel.sides[line.backSidedefIndex].sector;

    let currentSector: Sector;
    let neighborSector: Sector;
    let currentSectorIndex: number;

    const playerSide = getPlayerSideByLine(line, {
      x: this.player.x,
      y: this.player.y,
    });
    if (playerSide === "front") {
      currentSectorIndex = frontSectorIndex;
      currentSector = this.currentLevel.sectors[frontSectorIndex];
      neighborSector = this.currentLevel.sectors[backSectorIndex];
    } else {
      currentSectorIndex = backSectorIndex;
      currentSector = this.currentLevel.sectors[backSectorIndex];
      neighborSector = this.currentLevel.sectors[frontSectorIndex];
    }

    let p1 = this.getCameraPoint(line.v1);
    let p2 = this.getCameraPoint(line.v2);

    if (p1.z <= this.player.near && p2.z <= this.player.near) return;

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

    let screenX1 = this.screenWidth / 2 + (p1.x * projectionPlaneDist) / p1.z;
    let screenX2 = this.screenWidth / 2 + (p2.x * projectionPlaneDist) / p2.z;

    if (Math.abs(screenX2 - screenX1) < 0.00001) return;
    if (screenX1 < 0 && screenX2 < 0) return;
    if (screenX1 >= this.screenWidth && screenX2 >= this.screenWidth) return;

    if (screenX1 > screenX2) {
      [screenX1, screenX2] = [screenX2, screenX1];
      [p1, p2] = [p2, p1];
      [u1, u2] = [u2, u1];
    }

    const xStart = Math.ceil(Math.max(screenX1, 0));
    const xEnd = Math.floor(Math.min(screenX2, this.screenWidth - 1));

    if (xStart > xEnd) return;

    const currentCeiling = currentSector.ceilingHeight - this.player.eyeHeight;
    const neighborCeiling =
      neighborSector.ceilingHeight - this.player.eyeHeight;
    const currentFloor = currentSector.floorHeight - this.player.eyeHeight;
    const neighborFloor = neighborSector.floorHeight - this.player.eyeHeight;

    const currentCeilingY1 =
      this.screenHeight / 2 - (currentCeiling * projectionPlaneDist) / p1.z;
    const currentCeilingY2 =
      this.screenHeight / 2 - (currentCeiling * projectionPlaneDist) / p2.z;
    const neighborCeilingY1 =
      this.screenHeight / 2 - (neighborCeiling * projectionPlaneDist) / p1.z;
    const neighborCeilingY2 =
      this.screenHeight / 2 - (neighborCeiling * projectionPlaneDist) / p2.z;

    const currentFloorY1 =
      this.screenHeight / 2 - (currentFloor * projectionPlaneDist) / p1.z;
    const currentFloorY2 =
      this.screenHeight / 2 - (currentFloor * projectionPlaneDist) / p2.z;
    const neighborFloorY1 =
      this.screenHeight / 2 - (neighborFloor * projectionPlaneDist) / p1.z;
    const neighborFloorY2 =
      this.screenHeight / 2 - (neighborFloor * projectionPlaneDist) / p2.z;

    for (let x: number = xStart; x <= xEnd; x++) {
      if (openTop[x] > openBot[x]) continue;

      const t = (x - screenX1) / (screenX2 - screenX1);

      const currentCeilingY = lerp(currentCeilingY1, currentCeilingY2, t);
      const neighborCeilingY = lerp(neighborCeilingY1, neighborCeilingY2, t);
      const currentFloorY = lerp(currentFloorY1, currentFloorY2, t);
      const neighborFloorY = lerp(neighborFloorY1, neighborFloorY2, t);

      const prevOpenTop = openTop[x];
      const prevOpenBot = openBot[x];

      const ceilingY1 = Math.ceil(prevOpenTop);
      const ceilingY2 = Math.floor(Math.min(currentCeilingY, prevOpenBot));

      if (ceilingY1 <= ceilingY2) {
        planeColumns.push({
          x,
          y1: ceilingY1,
          y2: ceilingY2,
          sectorIndex: currentSectorIndex,
          type: "ceiling",
        });
      }

      const floorY1 = Math.ceil(Math.max(currentFloorY, prevOpenTop));
      const floorY2 = Math.floor(prevOpenBot);

      if (floorY1 <= floorY2) {
        planeColumns.push({
          x,
          y1: floorY1,
          y2: floorY2,
          sectorIndex: currentSectorIndex,
          type: "floor",
        });
      }

      // получаем айди текстуры
      let textureId;
      let side;

      if (playerSide === "front") {
        side = this.currentLevel.sides[line.frontSidedefIndex];
      } else {
        side = this.currentLevel.sides[line.backSidedefIndex];
      }

      textureId = side.texture;

      // считаем координату текстуры вдоль стены
      const texture = getTexture(textureId);

      const uOverDepth1 = u1 / p1.z;
      const uOverDepth2 = u2 / p2.z;

      const invDepth = lerp(1 / p1.z, 1 / p2.z, t);
      const depth = 1 / invDepth;
      const u = lerp(uOverDepth1, uOverDepth2, t) / invDepth;

      const textureWorldSize = line.textureWorldSize ?? this.textureWorldSize;
      const repeatU = u / textureWorldSize;
      const textureX =
        ((Math.floor(repeatU * texture.width) % texture.width) +
          texture.width) %
        texture.width;

      const shade = Math.max(0.25, Math.min(1, 1 - depth / 24));

      if (neighborCeilingY > currentCeilingY) {
        const drawY1 = Math.ceil(Math.max(currentCeilingY, prevOpenTop));
        const drawY2 = Math.floor(Math.min(neighborCeilingY, prevOpenBot));

        if (drawY1 <= drawY2) {
          wallColumns.push({
            x,
            y1: drawY1,
            y2: drawY2,
            textureId: textureId,
            textureX: textureX,
            wallY1: currentCeilingY,
            wallY2: neighborCeilingY,
            shade: shade,
          });
        }
      }

      if (neighborFloorY < currentFloorY) {
        const drawY1 = Math.ceil(Math.max(neighborFloorY, prevOpenTop));
        const drawY2 = Math.floor(Math.min(currentFloorY, prevOpenBot));

        if (drawY1 <= drawY2) {
          wallColumns.push({
            x,
            y1: drawY1,
            y2: drawY2,
            textureId: textureId,
            textureX: textureX,
            wallY1: neighborFloorY,
            wallY2: currentFloorY,
            shade: shade,
          });
        }
      }

      const portalOpenTop = Math.max(currentCeilingY, neighborCeilingY);
      const portalOpenBot = Math.min(currentFloorY, neighborFloorY);

      openTop[x] = Math.max(prevOpenTop, portalOpenTop);
      openBot[x] = Math.min(prevOpenBot, portalOpenBot);
    }
  }

  private processSolidWall(
    line: Linedef,
    projectionPlaneDist: number,
    openTop: number[],
    openBot: number[],
    planeColumns: PlaneColumn[],
    wallColumns: WallColumn[],
  ) {
    if (this.currentLevel === null) return;

    let p1 = this.getCameraPoint(line.v1);
    let p2 = this.getCameraPoint(line.v2);

    if (p1.z <= this.player.near && p2.z <= this.player.near) return;

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

    if (Math.abs(screenX2 - screenX1) < 0.00001) return;
    if (screenX1 < 0 && screenX2 < 0) return;
    if (screenX1 >= this.screenWidth && screenX2 >= this.screenWidth) return;

    // теперь рендер по Y
    const sectorIndex = this.currentLevel.sides[line.frontSidedefIndex].sector;

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

    if (xStart > xEnd) return;

    // терь рендерим
    for (let x = xStart; x <= xEnd; x++) {
      if (openTop[x] > openBot[x]) continue;

      const t = (x - screenX1) / (screenX2 - screenX1);

      const yTop = lerp(screenY1.topScreen, screenY2.topScreen, t);
      const yBot = lerp(screenY1.botScreen, screenY2.botScreen, t);

      const ceilingY1 = Math.ceil(openTop[x]);
      const ceilingY2 = Math.floor(Math.min(yTop, openBot[x]));

      if (ceilingY1 <= ceilingY2) {
        planeColumns.push({
          x,
          y1: ceilingY1,
          y2: ceilingY2,
          sectorIndex: sectorIndex,
          type: "ceiling",
        });
      }

      const floorY1 = Math.ceil(Math.max(yBot, openTop[x]));
      const floorY2 = Math.floor(openBot[x]);

      if (floorY1 <= floorY2) {
        planeColumns.push({
          x,
          y1: floorY1,
          y2: floorY2,
          sectorIndex: sectorIndex,
          type: "floor",
        });
      }

      const drawY1 = Math.ceil(Math.max(yTop, openTop[x]));
      const drawY2 = Math.floor(Math.min(yBot, openBot[x]));

      if (drawY1 > drawY2) continue;

      const invDepth = lerp(invDepth1, invDepth2, t);
      const depth = 1 / invDepth;

      const u = lerp(uOverDepth1, uOverDepth2, t) / invDepth;
      const textureWorldSize = line.textureWorldSize ?? this.textureWorldSize;
      const repeatU = u / textureWorldSize;
      const shade = Math.max(0.25, Math.min(1, 1 - depth / 24));

      // считаем координату текстуры вдоль стены
      const textureId = this.currentLevel.sides[line.frontSidedefIndex].texture;
      const texture = getTexture(textureId);

      // let textureX = Math.floor(u * textureScale) % textureWidth;
      const textureX =
        ((Math.floor(repeatU * texture.width) % texture.width) +
          texture.width) %
        texture.width;

      wallColumns.push({
        x,
        y1: drawY1,
        y2: drawY2,
        textureId: textureId,
        textureX: textureX,
        wallY1: yTop,
        wallY2: yBot,
        shade: shade,
      });

      // для открытых пространств не подойдёт
      // нужно что-то придумать
      if (line.backSidedefIndex === null) {
        openTop[x] = this.screenHeight;
        openBot[x] = -1;
      }
    }
  }

  private drawPlaneColumns(
    columns: PlaneColumn[],
    projectionPlaneDist: number,
  ) {
    if (this.currentLevel === null) return;

    const cosA = Math.cos(this.player.angle);
    const sinA = Math.sin(this.player.angle);

    for (const column of columns) {
      const sector = this.currentLevel.sectors[column.sectorIndex];
      const textureId =
        column.type === "floor" ? sector.floorTexture : sector.ceilingTexture;
      const texture = getTexture(textureId);

      const cameraX =
        (column.x - this.screenWidth / 2) / projectionPlaneDist;
      const rayWorldX = cosA - cameraX * sinA;
      const rayWorldY = sinA + cameraX * cosA;

      for (let y = column.y1; y <= column.y2; y++) {
        const screenY = y - this.screenHeight / 2;
        if (Math.abs(screenY) < 0.00001) continue;

        let depth: number;

        if (column.type === "floor") {
          depth =
            ((this.player.eyeHeight - sector.floorHeight) *
              projectionPlaneDist) /
            screenY;
        } else {
          depth =
            ((sector.ceilingHeight - this.player.eyeHeight) *
              projectionPlaneDist) /
            -screenY;
        }

        if (depth <= 0) continue;

        const worldX = this.player.x + rayWorldX * depth;
        const worldY = this.player.y + rayWorldY * depth;
        const textureU = worldX / this.planeTextureWorldSize;
        const textureV = worldY / this.planeTextureWorldSize;
        const textureX =
          ((Math.floor(textureU * texture.width) % texture.width) +
            texture.width) %
          texture.width;
        const textureY =
          ((Math.floor(textureV * texture.height) % texture.height) +
            texture.height) %
          texture.height;
        const index = (textureY * texture.width + textureX) * 4;
        const shade = Math.max(0.2, Math.min(1, 1 - depth / 32));
        const r = Math.floor(texture.data[index] * shade);
        const g = Math.floor(texture.data[index + 1] * shade);
        const b = Math.floor(texture.data[index + 2] * shade);
        const color = (r << 16) | (g << 8) | b;

        this.putPixel(column.x, y, color);
      }
    }
  }

  private drawWallColumns(columns: WallColumn[]) {
    for (const column of columns) {
      const texture = getTexture(column.textureId);
      const textureX =
        ((Math.floor(column.textureX) % texture.width) + texture.width) %
        texture.width;

      for (let y = column.y1; y <= column.y2; y++) {
        const v = (y - column.wallY1) / (column.wallY2 - column.wallY1);
        const textureY = Math.max(
          0,
          Math.min(texture.height - 1, Math.floor(v * texture.height)),
        );
        const index = (textureY * texture.width + textureX) * 4;
        const r = Math.floor(texture.data[index] * column.shade);
        const g = Math.floor(texture.data[index + 1] * column.shade);
        const b = Math.floor(texture.data[index + 2] * column.shade);
        const color = (r << 16) | (g << 8) | b;

        this.putPixel(column.x, y, color);
      }
    }
  }

  private clearFrameBuffer() {
    if (this.surfaceImageData === null) return;

    const data = this.surfaceImageData.data;

    for (let y = 0; y < this.screenHeight; y++) {
      const color = y < this.screenHeight / 2 ? 0x17191d : 0x2b2925;
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;

      for (let x = 0; x < this.screenWidth; x++) {
        const index = (y * this.screenWidth + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      }
    }
  }

  private putPixel(x: number, y: number, color: number) {
    if (this.surfaceImageData === null) return;
    if (x < 0 || x >= this.screenWidth || y < 0 || y >= this.screenHeight)
      return;

    const index = (y * this.screenWidth + x) * 4;
    const data = this.surfaceImageData.data;

    data[index] = (color >> 16) & 255;
    data[index + 1] = (color >> 8) & 255;
    data[index + 2] = color & 255;
    data[index + 3] = 255;
  }

  private presentFrameBuffer() {
    if (this.surfaceContext === null || this.surfaceImageData === null) return;

    this.surfaceContext.putImageData(this.surfaceImageData, 0, 0);
    this.surfaceTexture?.source.update();
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
