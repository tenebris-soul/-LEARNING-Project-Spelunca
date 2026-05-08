import type { Graphics } from "pixi.js";
import type { Level } from "./types/levelLogic/level";
import type { Player } from "./player";
import { getLinesOfSector } from "./utils/levels/getLinesOfSector";
import type { Linedef } from "./types/sectorLogic/linedef";
import { clamp, lerpAtX } from "./utils/mathUtils";

type Vec2 = { x: number; y: number };
type CameraPoint = { x: number; z: number };
type Projection = {
  xMin: number;
  xMax: number;
  topYLeft: number;
  topYRight: number;
  bottomYLeft: number;
  bottomYRight: number;
};

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
  private nearPlane = 0.05;
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
  constructSpelunca(speluncaGraphics: Graphics) {
    this.speluncaGraphics = speluncaGraphics;
  }

  renderFromCamera() {
    if (this.speluncaGraphics === null) {
      console.warn(
        "Spelunca graphics is not assigned! 3D will not be rendered.",
      );
      return;
    }
    this.speluncaGraphics.clear();

    this.renderSector(
      this.player.currentSectorIndex,
      {
        xMin: 0,
        xMax: this.screenWidth,
        topYLeft: 0,
        topYRight: 0,
        bottomYLeft: this.screenHeight,
        bottomYRight: this.screenHeight,
      },
      8,
      new Set(),
    );
  }

  private renderSector(
    sectorIndex: number,
    projection: Projection,
    maxDepth: number,
    visitedPortals: Set<Linedef>,
  ) {
    if (this.currentLevel === null) return;
    if (maxDepth < 0) return;

    const lines = getLinesOfSector(this.currentLevel, sectorIndex);
    if (lines === undefined) return;

    const portalsToRender: Array<{
      line: Linedef;
      nextSectorIndex: number;
      projection: Projection;
    }> = [];

    for (const line of lines) {
      if (line.backSidedefIndex !== null) {
        if (visitedPortals.has(line)) continue;

        this.renderPortal(line, sectorIndex, projection);

        const portalProjection = this.projectPortal(
          line,
          sectorIndex,
          projection,
        );

        if (portalProjection === null) continue;

        const nextSectorIndex = this.getPortalNeighborSector(line, sectorIndex);
        if (nextSectorIndex === null) continue;

        portalsToRender.push({
          line,
          nextSectorIndex,
          projection: portalProjection,
        });
      } else {
        this.renderWall(line, sectorIndex, projection);
      }
    }

    if (maxDepth <= 0) return;

    for (const portal of portalsToRender) {
      const nextVisitedPortals = new Set(visitedPortals);
      nextVisitedPortals.add(portal.line);

      this.renderSector(
        portal.nextSectorIndex,
        portal.projection,
        maxDepth - 1,
        nextVisitedPortals,
      );
    }
  }

  private getPortalNeighborSector(
    line: Linedef,
    sectorIndex: number,
  ): number | null {
    if (this.currentLevel === null || line.backSidedefIndex === null) {
      return null;
    }

    const frontSector = this.currentLevel.sides[line.frontSidedefIndex].sector;
    const backSector = this.currentLevel.sides[line.backSidedefIndex].sector;

    if (sectorIndex === frontSector) return backSector;
    if (sectorIndex === backSector) return frontSector;

    return null;
  }

  private getLinePointsForSector(
    line: Linedef,
    sectorIndex: number,
  ): [Vec2, Vec2] | null {
    if (this.currentLevel === null) return null;

    const frontSector = this.currentLevel.sides[line.frontSidedefIndex].sector;
    const backSector =
      line.backSidedefIndex !== null
        ? this.currentLevel.sides[line.backSidedefIndex].sector
        : null;

    const v1 = this.currentLevel.vertices[line.v1Index];
    const v2 = this.currentLevel.vertices[line.v2Index];

    if (sectorIndex === frontSector) {
      return [
        { x: v1.x, y: v1.y },
        { x: v2.x, y: v2.y },
      ];
    }

    if (sectorIndex === backSector) {
      return [
        { x: v2.x, y: v2.y },
        { x: v1.x, y: v1.y },
      ];
    }

    return null;
  }

  private isFacingCamera(p1: CameraPoint, p2: CameraPoint): boolean {
    const edgeX = p2.x - p1.x;
    const edgeZ = p2.z - p1.z;

    return p1.x * edgeZ - p1.z * edgeX < 0;
  }

  private projectPortal(
    line: Linedef,
    sectorIndex: number,
    parentProjection: Projection,
  ): Projection | null {
    if (this.currentLevel === null) return null;

    const points = this.getLinePointsForSector(line, sectorIndex);
    if (points === null) return null;
    const [p1, p2] = points;

    const p1Cam = this.worldToCamera(p1);
    const p2Cam = this.worldToCamera(p2);

    if (!this.isFacingCamera(p1Cam, p2Cam)) return null;

    const clipped = this.clipSegmentToView(p1Cam, p2Cam);
    if (clipped === null) return null;

    let [a, b] = clipped;

    const focalLength = this.screenWidth / 2 / Math.tan(this.fov / 2);

    let aX = this.screenWidth / 2 + (a.x / a.z) * focalLength;
    let bX = this.screenWidth / 2 + (b.x / b.z) * focalLength;

    if (aX > bX) {
      [a, b] = [b, a];
      [aX, bX] = [bX, aX];
    }

    const neighborSectorIndex = this.getPortalNeighborSector(line, sectorIndex);
    if (neighborSectorIndex === null) return null;

    const neighborSector = this.currentLevel.sectors[neighborSectorIndex];

    const portalTopLeft = this.projectY(neighborSector.ceilingHeight, a.z);
    const portalTopRight = this.projectY(neighborSector.ceilingHeight, b.z);
    const portalBottomLeft = this.projectY(neighborSector.floorHeight, a.z);
    const portalBottomRight = this.projectY(neighborSector.floorHeight, b.z);

    const xMin = Math.max(aX, parentProjection.xMin);
    const xMax = Math.min(bX, parentProjection.xMax);

    if (xMax <= xMin) return null;

    const portalTopAtMin = lerpAtX(xMin, aX, bX, portalTopLeft, portalTopRight);
    const portalTopAtMax = lerpAtX(xMax, aX, bX, portalTopLeft, portalTopRight);

    const portalBottomAtMin = lerpAtX(
      xMin,
      aX,
      bX,
      portalBottomLeft,
      portalBottomRight,
    );

    const portalBottomAtMax = lerpAtX(
      xMax,
      aX,
      bX,
      portalBottomLeft,
      portalBottomRight,
    );

    const parentTopAtMin = lerpAtX(
      xMin,
      parentProjection.xMin,
      parentProjection.xMax,
      parentProjection.topYLeft,
      parentProjection.topYRight,
    );

    const parentTopAtMax = lerpAtX(
      xMax,
      parentProjection.xMin,
      parentProjection.xMax,
      parentProjection.topYLeft,
      parentProjection.topYRight,
    );

    const parentBottomAtMin = lerpAtX(
      xMin,
      parentProjection.xMin,
      parentProjection.xMax,
      parentProjection.bottomYLeft,
      parentProjection.bottomYRight,
    );

    const parentBottomAtMax = lerpAtX(
      xMax,
      parentProjection.xMin,
      parentProjection.xMax,
      parentProjection.bottomYLeft,
      parentProjection.bottomYRight,
    );

    const topYLeft = Math.max(portalTopAtMin, parentTopAtMin);
    const topYRight = Math.max(portalTopAtMax, parentTopAtMax);

    const bottomYLeft = Math.min(portalBottomAtMin, parentBottomAtMin);
    const bottomYRight = Math.min(portalBottomAtMax, parentBottomAtMax);

    if (bottomYLeft <= topYLeft && bottomYRight <= topYRight) return null;

    return {
      xMin,
      xMax,
      topYLeft,
      topYRight,
      bottomYLeft,
      bottomYRight,
    };
  }

  private renderPortal(
    line: Linedef,
    sectorIndex: number,
    projection: Projection,
  ) {
    if (
      this.currentLevel === null ||
      this.speluncaGraphics === null ||
      line.backSidedefIndex === null
    )
      return;

    // здесь получаем высоты секторов
    const currentFloor = this.currentLevel.sectors[sectorIndex].floorHeight;
    const currentCeil = this.currentLevel.sectors[sectorIndex].ceilingHeight;

    const neighborSectorIndex = this.getPortalNeighborSector(line, sectorIndex);
    if (neighborSectorIndex === null) return;

    const neighborFloor =
      this.currentLevel.sectors[neighborSectorIndex].floorHeight;
    const neighborCeil =
      this.currentLevel.sectors[neighborSectorIndex].ceilingHeight;

    // туточки получаем точки
    const points = this.getLinePointsForSector(line, sectorIndex);
    if (points === null) return;
    const [p1, p2] = points;
    const p1Cam = this.worldToCamera(p1);
    const p2Cam = this.worldToCamera(p2);

    if (!this.isFacingCamera(p1Cam, p2Cam)) return;

    // делаем верхнюю стенку портала если есть
    if (neighborCeil < currentCeil) {
      this.renderPartOfWall(
        p1Cam,
        p2Cam,
        currentCeil,
        neighborCeil,
        projection,
      );
    }

    // делаем нижнюю стенку если есть
    if (neighborFloor > currentFloor) {
      this.renderPartOfWall(
        p1Cam,
        p2Cam,
        neighborFloor,
        currentFloor,
        projection,
      );
    }
  }

  private renderWall(
    line: Linedef,
    sectorIndex: number,
    projection: Projection,
  ) {
    if (this.currentLevel === null || this.speluncaGraphics === null) return;

    const floor = this.currentLevel.sectors[sectorIndex].floorHeight;
    const ceil = this.currentLevel.sectors[sectorIndex].ceilingHeight;

    const points = this.getLinePointsForSector(line, sectorIndex);
    if (points === null) return;
    const [p1, p2] = points;

    const p1Cam = this.worldToCamera(p1);
    const p2Cam = this.worldToCamera(p2);

    if (!this.isFacingCamera(p1Cam, p2Cam)) return;

    this.renderPartOfWall(p1Cam, p2Cam, ceil, floor, projection);
  }

  private renderPartOfWall(
    p1Cam: CameraPoint,
    p2Cam: CameraPoint,
    ceil: number,
    floor: number,
    projection: Projection,
  ) {
    if (this.speluncaGraphics === null) return;

    const clipped = this.clipSegmentToView(p1Cam, p2Cam);
    if (clipped === null) return;

    let [leftPoint, rightPoint] = clipped;

    const focalLength = this.screenWidth / 2 / Math.tan(this.fov / 2);

    let x1 = this.screenWidth / 2 + (leftPoint.x / leftPoint.z) * focalLength;
    let x2 = this.screenWidth / 2 + (rightPoint.x / rightPoint.z) * focalLength;

    let top1 =
      this.screenHeight / 2 -
      ((ceil - this.player.eyeHeight) / leftPoint.z) * focalLength;

    let bottom1 =
      this.screenHeight / 2 -
      ((floor - this.player.eyeHeight) / leftPoint.z) * focalLength;

    let top2 =
      this.screenHeight / 2 -
      ((ceil - this.player.eyeHeight) / rightPoint.z) * focalLength;

    let bottom2 =
      this.screenHeight / 2 -
      ((floor - this.player.eyeHeight) / rightPoint.z) * focalLength;

    if (x1 > x2) {
      [x1, x2] = [x2, x1];
      [top1, top2] = [top2, top1];
      [bottom1, bottom2] = [bottom2, bottom1];
    }

    const drawX1 = Math.max(x1, projection.xMin);
    const drawX2 = Math.min(x2, projection.xMax);

    if (drawX2 <= drawX1) return;

    const startX = Math.max(0, Math.floor(drawX1));
    const endX = Math.min(this.screenWidth - 1, Math.ceil(drawX2));

    for (let screenX = startX; screenX <= endX; screenX++) {
      const sampleX = clamp(screenX + 0.5, drawX1, drawX2);

      const wallTop = lerpAtX(sampleX, x1, x2, top1, top2);
      const wallBottom = lerpAtX(sampleX, x1, x2, bottom1, bottom2);

      const portalTop = lerpAtX(
        sampleX,
        projection.xMin,
        projection.xMax,
        projection.topYLeft,
        projection.topYRight,
      );

      const portalBottom = lerpAtX(
        sampleX,
        projection.xMin,
        projection.xMax,
        projection.bottomYLeft,
        projection.bottomYRight,
      );

      const finalTop = clamp(
        Math.max(wallTop, portalTop),
        0,
        this.screenHeight,
      );
      const finalBottom = clamp(
        Math.min(wallBottom, portalBottom),
        0,
        this.screenHeight,
      );

      if (finalBottom <= finalTop) continue;

      this.speluncaGraphics
        .rect(screenX, finalTop, 1, finalBottom - finalTop)
        .fill(0xffcc00);
    }
  }

  private clipSegmentToView(
    p1: CameraPoint,
    p2: CameraPoint,
  ): [CameraPoint, CameraPoint] | null {
    const tanHalfFov = Math.tan(this.fov / 2);
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    let tEnter = 0;
    let tExit = 1;

    const clipByPlane = (startDistance: number, distanceDelta: number) => {
      const EPS = 0.000001;

      if (Math.abs(distanceDelta) < EPS) {
        return startDistance >= 0;
      }

      const t = -startDistance / distanceDelta;

      if (distanceDelta > 0) {
        tEnter = Math.max(tEnter, t);
      } else {
        tExit = Math.min(tExit, t);
      }

      return tEnter <= tExit;
    };

    if (!clipByPlane(p1.z - this.nearPlane, dz)) return null;
    if (!clipByPlane(p1.x + p1.z * tanHalfFov, dx + dz * tanHalfFov)) {
      return null;
    }
    if (!clipByPlane(-p1.x + p1.z * tanHalfFov, -dx + dz * tanHalfFov)) {
      return null;
    }

    return [
      { x: p1.x + dx * tEnter, z: p1.z + dz * tEnter },
      { x: p1.x + dx * tExit, z: p1.z + dz * tExit },
    ];
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

  private projectY(worldHeight: number, z: number) {
    const focalLength = this.screenWidth / 2 / Math.tan(this.fov / 2);
    const eyeHeight = this.player.eyeHeight;

    return (
      this.screenHeight / 2 - ((worldHeight - eyeHeight) / z) * focalLength
    );
  }

  changeLevel(level: Level) {
    this.currentLevel = level;
  }
}
