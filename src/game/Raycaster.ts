import type { LevelDataType } from "../types/levelStructure/levelType";
import type { DetailedRayResult, RaySegment } from "../types/raycastHitType";
import type { Vec2 } from "../types/gameStructure/vector2Type";

type SectorHitCandidate = {
  t: number;
  hit: Vec2;
  wallIndex: number;
  textureU: number;
  normal: Vec2;
};

export class Raycaster {
  private readonly eps = 0.00001;
  private readonly maxViewDist = 100;
  private readonly maxPortalDepth = 16;

  private cross(a: Vec2, b: Vec2): number {
    return a.x * b.y - a.y * b.x;
  }

  private dot(a: Vec2, b: Vec2): number {
    return a.x * b.x + a.y * b.y;
  }

  private normalize(v: Vec2): Vec2 {
    const length = Math.hypot(v.x, v.y);
    if (length < this.eps) {
      return { x: 0, y: 0 };
    }

    return {
      x: v.x / length,
      y: v.y / length,
    };
  }

  private getFarHit(playerPos: Vec2, rayAngle: number): DetailedRayResult {
    const D = { x: Math.cos(rayAngle), y: Math.sin(rayAngle) };

    return {
      finalHit: {
        correctDistance: this.maxViewDist,
        hit: {
          x: playerPos.x + D.x * this.maxViewDist,
          y: playerPos.y + D.y * this.maxViewDist,
        },
        wallIndex: -1,
        textureU: 0,
        normal: {
          x: 0,
          y: 0,
        },
        sectorIndex: -1,
      },
      segments: [],
    };
  }

  private isPointInSector(
    point: Vec2,
    sectorIndex: number,
    level: LevelDataType,
  ): boolean {
    const sector = level.sectors[sectorIndex];
    if (!sector || sector.walls.length < 3) {
      return false;
    }

    const vertices = sector.walls.map((wallIndex) => level.walls[wallIndex].a);
    let inside = false;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const a = vertices[i];
      const b = vertices[j];
      const intersects =
        a.y > point.y !== b.y > point.y &&
        point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;

      if (intersects) {
        inside = !inside;
      }
    }

    return inside;
  }

  private findSectorIndex(point: Vec2, level: LevelDataType): number | null {
    for (let i = 0; i < level.sectors.length; i++) {
      if (this.isPointInSector(point, i, level)) {
        return i;
      }
    }

    return null;
  }

  private getAdjacentSector(
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

  private findNearestHitInSector(
    origin: Vec2,
    direction: Vec2,
    sectorIndex: number,
    level: LevelDataType,
    ignoredWallIndex: number | null,
  ): SectorHitCandidate | null {
    const sector = level.sectors[sectorIndex];
    if (!sector) {
      return null;
    }

    let bestT = Infinity;
    let bestCandidate: SectorHitCandidate | null = null;

    for (let i = 0; i < sector.walls.length; i++) {
      const wallIndex = sector.walls[i];
      if (wallIndex === ignoredWallIndex) {
        continue;
      }

      const wall = level.walls[wallIndex];
      const A = wall.a;
      const B = wall.b;
      const S = { x: B.x - A.x, y: B.y - A.y };
      const AP = { x: A.x - origin.x, y: A.y - origin.y };
      const denom = this.cross(direction, S);

      if (Math.abs(denom) < this.eps) {
        continue;
      }

      const t = this.cross(AP, S) / denom;
      const u = this.cross(AP, direction) / denom;

      if (t <= this.eps || u < 0 || u > 1 || t >= bestT) {
        continue;
      }

      const hit = {
        x: origin.x + direction.x * t,
        y: origin.y + direction.y * t,
      };

      let normal = this.normalize({ x: -S.y, y: S.x });
      if (this.dot(normal, direction) > 0) {
        normal = {
          x: -normal.x,
          y: -normal.y,
        };
      }

      bestT = t;
      bestCandidate = {
        t: bestT,
        hit,
        wallIndex,
        textureU: u,
        normal,
      };
    }

    return bestCandidate;
  }

  castRay(
    playerPos: Vec2,
    rayAngle: number,
    playerAngle: number,
    level: LevelDataType,
  ): DetailedRayResult {
    // Направление текущего луча.
    const direction = { x: Math.cos(rayAngle), y: Math.sin(rayAngle) };
    let currentSectorIndex = this.findSectorIndex(playerPos, level);

    if (currentSectorIndex === null) {
      return { finalHit: null, segments: [] };
    }

    let origin = playerPos;
    let ignoredWallIndex: number | null = null;

    let enterT = 0;
    const segments: RaySegment[] = [];

    for (let depth = 0; depth < this.maxPortalDepth; depth++) {
      const nearestHit = this.findNearestHitInSector(
        origin,
        direction,
        currentSectorIndex,
        level,
        ignoredWallIndex,
      );

      if (!nearestHit) {
        return { finalHit: null, segments };
      }

      const wall = level.walls[nearestHit.wallIndex];
      // Если стена не solid, пробуем перейти в соседний сектор.
      const nextSector = wall.solid
        ? null
        : this.getAdjacentSector(
            nearestHit.wallIndex,
            currentSectorIndex,
            level,
          );

      const exitTVec = {
        x: nearestHit.hit.x - playerPos.x,
        y: nearestHit.hit.y - playerPos.y,
      } as Vec2;

      const exitT = Math.hypot(exitTVec.x, exitTVec.y);

      segments.push({
        sectorIndex: currentSectorIndex,
        enterT,
        exitT,
        exitWallIndex: nearestHit.wallIndex,
        exitKind: wall.solid
          ? "solid"
          : nextSector !== null
            ? "portal"
            : "void",
      });

      if (wall.solid) {
        const rawDistance = Math.hypot(
          nearestHit.hit.x - playerPos.x,
          nearestHit.hit.y - playerPos.y,
        );

        return {
          finalHit: {
            correctDistance: rawDistance * Math.cos(rayAngle - playerAngle),
            hit: nearestHit.hit,
            wallIndex: nearestHit.wallIndex,
            textureU: nearestHit.textureU,
            normal: nearestHit.normal,
            sectorIndex: currentSectorIndex,
          },
          segments,
        };
      }

      const nextSectorIndex = this.getAdjacentSector(
        nearestHit.wallIndex,
        currentSectorIndex,
        level,
      );

      if (nextSectorIndex === null) {
        const rawDistance = Math.hypot(
          nearestHit.hit.x - playerPos.x,
          nearestHit.hit.y - playerPos.y,
        );

        return {
          finalHit: {
            correctDistance: rawDistance * Math.cos(rayAngle - playerAngle),
            hit: nearestHit.hit,
            wallIndex: nearestHit.wallIndex,
            textureU: nearestHit.textureU,
            normal: nearestHit.normal,
            sectorIndex: currentSectorIndex,
          },
          segments,
        };
      }

      origin = {
        x: nearestHit.hit.x + direction.x * this.eps * 10,
        y: nearestHit.hit.y + direction.y * this.eps * 10,
      };
      currentSectorIndex = nextSectorIndex;
      ignoredWallIndex = nearestHit.wallIndex;
      enterT = exitT;
    }

    return { finalHit: null, segments };
  }

  castRays(
    playerPos: Vec2,
    playerAngle: number,
    fov: number,
    numRays: number,
    level: LevelDataType,
  ): DetailedRayResult[] {
    const hits: DetailedRayResult[] = [];

    const startAngle = playerAngle - fov / 2;
    const angleStep = fov / numRays;

    for (let i = 0; i < numRays; i++) {
      const rayAngle = startAngle + (i + 0.5) * angleStep;
      const hit = this.castRay(playerPos, rayAngle, playerAngle, level);

      if (hit != null) {
        hits.push(hit);
      } else {
        hits.push(this.getFarHit(playerPos, rayAngle));
      }
    }

    return hits;
  }
}
