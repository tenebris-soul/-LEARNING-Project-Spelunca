import { Application, Graphics, Rectangle, Sprite, Texture } from "pixi.js";
import type { LevelDataType } from "../types/levelStructure/levelType";
import type { DetailedRayResult } from "../types/raycastHitType";
import type { Vec2 } from "../types/gameStructure/vector2Type";
import type { Player } from "./Player";
import { TextureLoader } from "./TextureLoader";
import { getPlayerSector } from "../utils/canOccupy";

export class Renderer {
  private app: Application;
  private graphics: Graphics;
  private textureLoader: TextureLoader;
  private wallSprites: Sprite[] = [];
  private portalSprites: Sprite[] = [];

  private floorBufferWidth: number = 0;
  private floorBufferHeight: number = 0;
  private floorCanvas: HTMLCanvasElement | null = null;
  private floorCtx: CanvasRenderingContext2D | null = null;
  private floorImageData: ImageData | undefined = undefined;
  private floorPixels: Uint8ClampedArray | undefined = undefined;
  private floorTexture: Texture | null = null;
  private floorSprite: Sprite | null = null;

  private readonly eps = 0.01;
  private readonly maxPortalSlicesPerRay = 16;

  private getAdjacentSectorIndex(
    wallIndex: number,
    currentSectorIndex: number,
    level: LevelDataType,
  ): number | null {
    const wall = level.walls[wallIndex];

    if (wall.frontSector === currentSectorIndex) {
      return wall.backSector ?? null;
    }

    if (wall.backSector === currentSectorIndex) {
      return wall.frontSector ?? null;
    }

    return null;
  }

  private projectWorldZToScreenY(
    worldZ: number,
    playerZ: number,
    horizonY: number,
    dist: number,
    projectPlaneDist: number,
  ): number {
    return horizonY - ((worldZ - playerZ) / dist) * projectPlaneDist;
  }

  private shadeColor(color: number, shade: number): number {
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;

    const r2 = Math.floor(r * shade);
    const g2 = Math.floor(g * shade);
    const b2 = Math.floor(b * shade);

    return (r2 << 16) | (g2 << 8) | b2;
  }

  constructor(app: Application) {
    this.app = app;
    this.graphics = new Graphics();
    this.textureLoader = new TextureLoader();
  }

  async init(numRays: number): Promise<void> {
    await this.textureLoader.loadTextures();

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const columnWidth = screenWidth / numRays;

    this.graphics.clear();
    this.graphics.rect(0, 0, screenWidth, screenHeight / 2);
    this.graphics.fill(0x87ceeb);
    this.app.stage.addChild(this.graphics);

    // создаём спрайты стен заранее
    for (let i = 0; i < numRays; i++) {
      const wallSprite = new Sprite(Texture.WHITE);
      wallSprite.x = i * columnWidth;
      wallSprite.y = 0;
      wallSprite.width = columnWidth + 1;
      wallSprite.height = 0;
      wallSprite.tint = 0xffffff;
      wallSprite.visible = false;

      this.wallSprites.push(wallSprite);
      this.app.stage.addChild(wallSprite);
    }

    for (let i = 0; i < numRays; i++) {
      for (
        let sliceIndex = 0;
        sliceIndex < this.maxPortalSlicesPerRay;
        sliceIndex++
      ) {
        const portalSprite = new Sprite(Texture.WHITE);
        portalSprite.x = i * columnWidth;
        portalSprite.y = 0;
        portalSprite.width = columnWidth + 1;
        portalSprite.height = 0;
        portalSprite.tint = 0xffffff;
        portalSprite.visible = false;

        this.portalSprites.push(portalSprite);
        this.app.stage.addChild(portalSprite);
      }
    }

    // буфер пола рисуется в маленький canvas, а потом растягивается на экран.
    this.floorBufferWidth = numRays;
    this.floorBufferHeight = Math.ceil(this.app.screen.height / 2);

    this.floorCanvas = document.createElement("canvas");
    this.floorCanvas.width = this.floorBufferWidth;
    this.floorCanvas.height = this.floorBufferHeight;

    this.floorCtx = this.floorCanvas.getContext("2d");

    this.floorImageData = this.floorCtx?.createImageData(
      this.floorBufferWidth,
      this.floorBufferHeight,
    );
    this.floorPixels = this.floorImageData?.data;

    this.floorTexture = Texture.from(this.floorCanvas);
    this.floorTexture.source.scaleMode = "nearest";

    this.floorSprite = new Sprite(this.floorTexture);
    this.floorSprite.x = 0;
    this.floorSprite.y = this.app.screen.height / 2;
    this.floorSprite.width = this.app.screen.width;
    this.floorSprite.height = this.app.screen.height / 2;
    this.app.stage.addChild(this.floorSprite);

    this.app.stage.setChildIndex(this.graphics, 0);
    this.app.stage.setChildIndex(
      this.floorSprite,
      this.app.stage.children.length - 1,
    );
  }

  DebugView(
    levelData: LevelDataType,
    player: Player,
    raycastHits: DetailedRayResult[],
  ): void {
    this.graphics.clear();

    const scale = 40;
    const offsetX = 30;
    const offsetY = 30;

    for (let i = 0; i < levelData.walls.length; i++) {
      const wall = levelData.walls[i];

      const aScreen = {
        x: offsetX + wall.a.x * scale,
        y: offsetY + wall.a.y * scale,
      };

      const bScreen = {
        x: offsetX + wall.b.x * scale,
        y: offsetY + wall.b.y * scale,
      };

      this.graphics.moveTo(aScreen.x, aScreen.y);
      this.graphics.lineTo(bScreen.x, bScreen.y);
      this.graphics.stroke({ width: 2, color: wall.color ?? 0xffffff });
    }

    const playerScreen: Vec2 = {
      x: offsetX + player.pos.x * scale,
      y: offsetY + player.pos.y * scale,
    };

    this.graphics.circle(playerScreen.x, playerScreen.y, 15);
    this.graphics.fill(0xff0000);

    for (let i = 0; i < raycastHits.length; i++) {
      const hit = raycastHits[i].finalHit;
      if (!hit) {
        continue;
      }

      const hitScreen = {
        x: offsetX + hit.hit.x * scale,
        y: offsetY + hit.hit.y * scale,
      };

      this.graphics.moveTo(playerScreen.x, playerScreen.y);
      this.graphics.lineTo(hitScreen.x, hitScreen.y);
      this.graphics.stroke({ width: 2, color: 0xff0000 });
    }

    this.app.stage.addChild(this.graphics);
  }

  DrawScene(
    raycastHits: DetailedRayResult[],
    level: LevelDataType,
    player: Player,
    numRays: number,
  ): void {
    const screenWidth = this.app.canvas.width;
    const screenHeight = this.app.canvas.height;
    const horizonY = screenHeight / 2;
    const currentSectorIndex = getPlayerSector(
      level,
      player.pos.x,
      player.pos.y,
    );
    const currentSector =
      currentSectorIndex >= 0 ? level.sectors[currentSectorIndex] : null;
    const ceilingColor = currentSector?.ceilColor ?? 0x87ceeb;

    this.graphics.clear();
    this.graphics.rect(0, 0, screenWidth, horizonY);
    this.graphics.fill(ceilingColor);

    const fov = player.getFovInRadians();
    const projectPlaneDist = screenWidth / 2 / Math.tan(fov / 2);
    const columnWidth = screenWidth / numRays;

    // рисуем пол по сегментам лучей, чтобы он правильно проходил через порталы.
    this.floorPixels?.fill(0);

    for (let i = 0; i < numRays; i++) {
      const ray = raycastHits[i];
      const segments = ray.segments;
      const rayAngle = player.angle - fov / 2 + (i + 0.5) * (fov / numRays);
      const cosFix = Math.cos(rayAngle - player.angle);

      for (let y = Math.floor(horizonY) + 1; y < screenHeight; y++) {
        const rowOffset = y - horizonY;
        if (rowOffset <= 0) {
          continue;
        }

        for (const segment of segments) {
          const sector = level.sectors[segment.sectorIndex];
          const cameraAboveFloor = player.playerZ - sector.floor;

          if (cameraAboveFloor <= 0) {
            continue;
          }

          const correctDist = (cameraAboveFloor * projectPlaneDist) / rowOffset;
          const rawT = correctDist / cosFix;

          if (rawT < segment.enterT) {
            continue;
          }

          if (rawT > segment.exitT) {
            continue;
          }

          const color = sector.floorColor ?? 0xffffff;
          const shade = 1 / (1 + correctDist * 0.08);
          const bufferX = i;
          const bufferY = y - Math.floor(horizonY) - 1;

          const r = (color >> 16) & 255;
          const g = (color >> 8) & 255;
          const b = color & 255;

          const r2 = Math.floor(r * shade);
          const g2 = Math.floor(g * shade);
          const b2 = Math.floor(b * shade);

          const index = (bufferY * this.floorBufferWidth + bufferX) * 4;

          if (this.floorPixels) {
            this.floorPixels[index] = r2;
            this.floorPixels[index + 1] = g2;
            this.floorPixels[index + 2] = b2;
            this.floorPixels[index + 3] = 255;
          }

          break;
        }
      }
    }

    if (this.floorCtx && this.floorImageData && this.floorTexture) {
      this.floorCtx.putImageData(this.floorImageData, 0, 0);
      this.floorTexture.source.update();
    }

    for (let i = 0; i < this.portalSprites.length; i++) {
      this.portalSprites[i].visible = false;
    }

    // рисуем вертикальные части порталов, если между секторами есть перепад высот
    for (let i = 0; i < numRays; i++) {
      const ray = raycastHits[i];
      const segments = ray.segments;
      const rayAngle = player.angle - fov / 2 + (i + 0.5) * (fov / numRays);
      const cosFix = Math.cos(rayAngle - player.angle);
      const columnX = i * columnWidth;
      let portalSliceSlot = 0;

      // идём от дальних сегментов к ближним, чтобы ближние ступеньки
      // ложились поверх дальних внутри одной и той же колонки
      for (
        let segmentIndex = segments.length - 1;
        segmentIndex >= 0;
        segmentIndex--
      ) {
        const segment = segments[segmentIndex];
        if (segment.exitKind !== "portal") {
          continue;
        }

        const currentSector = level.sectors[segment.sectorIndex];
        const nextSectorIndex = this.getAdjacentSectorIndex(
          segment.exitWallIndex,
          segment.sectorIndex,
          level,
        );

        if (nextSectorIndex === null) {
          continue;
        }

        const nextSector = level.sectors[nextSectorIndex];
        const dist = segment.exitT * cosFix;

        if (dist <= this.eps) {
          continue;
        }

        const currentFloorY = this.projectWorldZToScreenY(
          currentSector.floor,
          player.playerZ,
          horizonY,
          dist,
          projectPlaneDist,
        );
        const nextFloorY = this.projectWorldZToScreenY(
          nextSector.floor,
          player.playerZ,
          horizonY,
          dist,
          projectPlaneDist,
        );

        const shade = Math.max(0.25, 1 / (1 + dist * 0.08));

        if (nextSector.floor > currentSector.floor + this.eps) {
          const stepTop = Math.min(currentFloorY, nextFloorY);
          const stepBottom = Math.max(currentFloorY, nextFloorY);
          const stepHeight = stepBottom - stepTop;

          if (stepHeight > this.eps) {
            if (portalSliceSlot >= this.maxPortalSlicesPerRay) {
              break;
            }

            const stepBaseColor = nextSector.floorColor ?? 0x808080;
            const stepX = Math.floor(columnX);
            const stepY = Math.floor(stepTop);
            const stepBottomY = Math.ceil(stepBottom);
            const stepPixelHeight = stepBottomY - stepY + 1;
            const stepPixelWidth = Math.ceil(columnWidth) + 1;
            const portalSpriteIndex =
              i * this.maxPortalSlicesPerRay + portalSliceSlot;
            const portalSprite = this.portalSprites[portalSpriteIndex];

            if (stepPixelHeight > 0 && portalSprite) {
              portalSprite.texture = Texture.WHITE;
              portalSprite.x = stepX;
              portalSprite.y = stepY;
              portalSprite.width = stepPixelWidth;
              portalSprite.height = stepPixelHeight;
              portalSprite.tint = this.shadeColor(stepBaseColor, shade);
              portalSprite.visible = true;
              portalSliceSlot++;
            }
          }
        }
      }
    }

    for (let i = 0; i < raycastHits.length; i++) {
      const ray = raycastHits[i];
      const hit = raycastHits[i].finalHit;
      const sprite = this.wallSprites[i];

      if (!hit || hit.wallIndex === -1) {
        sprite.visible = false;
        continue;
      }

      const dist =
        hit.correctDistance < this.eps ? this.eps : hit.correctDistance;
      const rayAngle = player.angle - fov / 2 + (i + 0.5) * (fov / numRays);
      const cosFix = Math.cos(rayAngle - player.angle);

      let clipTop = 0;
      let clipBottom = screenHeight;

      for (const segment of ray.segments) {
        if (segment.exitKind !== "portal") {
          continue;
        }

        const currentSector = level.sectors[segment.sectorIndex];
        const nextSectorIndex = this.getAdjacentSectorIndex(
          segment.exitWallIndex,
          segment.sectorIndex,
          level,
        );

        if (nextSectorIndex === null) {
          continue;
        }

        const nextSector = level.sectors[nextSectorIndex];
        const portalDist = segment.exitT * cosFix;

        if (portalDist <= this.eps) {
          continue;
        }

        const portalTopY = this.projectWorldZToScreenY(
          Math.min(currentSector.ceil, nextSector.ceil),
          player.playerZ,
          horizonY,
          portalDist,
          projectPlaneDist,
        );
        const portalBottomY = this.projectWorldZToScreenY(
          Math.max(currentSector.floor, nextSector.floor),
          player.playerZ,
          horizonY,
          portalDist,
          projectPlaneDist,
        );

        clipTop = Math.max(clipTop, portalTopY);
        clipBottom = Math.min(clipBottom, portalBottomY);
      }

      const sector = level.sectors[hit.sectorIndex];
      const topScreen =
        screenHeight / 2 -
        ((sector.ceil - player.playerZ) / dist) * projectPlaneDist;
      const bottomScreen =
        screenHeight / 2 -
        ((sector.floor - player.playerZ) / dist) * projectPlaneDist;

      const drawTop = Math.max(topScreen, clipTop);
      const drawBottom = Math.min(bottomScreen, clipBottom);
      const wallHeight = drawBottom - drawTop;
      const columnX = i * columnWidth;
      const distanceShade = Math.max(0.2, 1 / (1 + dist * 0.08));

      if (wallHeight <= this.eps) {
        sprite.visible = false;
        continue;
      }

      const wall = level.walls[hit.wallIndex];
      const textureName = wall.textureName;
      let tint = 0xffffff;

      if (textureName !== undefined) {
        const wallVec = {
          x: wall.b.x - wall.a.x,
          y: wall.b.y - wall.a.y,
        } as Vec2;

        const wallLength = Math.hypot(wallVec.x, wallVec.y);
        const hitOffsetWorld = hit.textureU * wallLength;
        const textureRepeat = wall.textureRepeat ?? 1;
        const repeatU = (hitOffsetWorld / textureRepeat) % 1;

        const texture = this.textureLoader.getTexture(textureName);
        const texX = Math.min(
          texture.width - 1,
          Math.max(0, Math.floor(repeatU * texture.width)),
        );

        sprite.texture = new Texture({
          source: texture.source,
          frame: new Rectangle(texX, 0, 1, texture.height),
        });

        const shade = Math.floor(255 * distanceShade);
        tint = (shade << 16) | (shade << 8) | shade;
      } else {
        const wallColor = wall.color ?? 0xffffff;
        tint = this.shadeColor(wallColor, distanceShade);
        sprite.texture = Texture.WHITE;
      }

      sprite.x = columnX;
      sprite.y = drawTop;
      sprite.width = columnWidth + 1;
      sprite.height = wallHeight;
      sprite.tint = tint;
      sprite.visible = true;
    }
  }
}
