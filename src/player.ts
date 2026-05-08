import { Keys } from "./input";
import type { Level } from "./types/levelLogic/level";
import { getLinesOfSectorAndNeighbors } from "./utils/levels/getLinesOfSectorAndNeighbors";
import { isPointInSector } from "./utils/levels/isPointInSector";
import { dot, clamp } from "./utils/mathUtils";

type PlayerMoveVec = { x: number; y: number };
export class Player {
  private playerHeight = 1.75;

  x: number;
  y: number;
  angle: number;

  radius: number = 0.25;
  speed: number = 3;
  turnSpeed: number = 2;

  eyeHeight: number = this.playerHeight;

  currentSectorIndex: number;

  constructor(
    x: number,
    y: number,
    angle: number,
    playerSectorIndex: number,
    level: Level,
  ) {
    this.x = x;
    this.y = y;
    this.angle = angle;

    this.currentSectorIndex = playerSectorIndex;

    this.eyeHeight =
      level.sectors[this.currentSectorIndex].floorHeight + this.playerHeight;
  }

  handleMovement(deltaTime: number, level: Level) {
    this.rotate(deltaTime);

    const moveVec = this.getMoveVec(deltaTime);
    this.moveAndCollide(moveVec, level);
  }

  private rotate(deltaTime: number) {
    if (Keys["KeyA"] === true) {
      this.angle -= this.turnSpeed * deltaTime;
    } else if (Keys["KeyD"] === true) {
      this.angle += this.turnSpeed * deltaTime;
    }
  }

  private getMoveVec(deltaTime: number): PlayerMoveVec {
    let moveX: number = 0;
    let moveY: number = 0;

    if (Keys["KeyW"] === true) {
      moveX = this.speed * Math.cos(this.angle) * deltaTime;
      moveY = this.speed * Math.sin(this.angle) * deltaTime;
    } else if (Keys["KeyS"] === true) {
      moveX = -this.speed * Math.cos(this.angle) * deltaTime;
      moveY = -this.speed * Math.sin(this.angle) * deltaTime;
    }

    return { x: moveX, y: moveY };
  }

  private moveAndCollide(moveVec: PlayerMoveVec, level: Level) {
    if (moveVec.x === 0 && moveVec.y === 0) return;

    const EPS = 0.00001;

    let nextX = this.x + moveVec.x;
    let nextY = this.y + moveVec.y;

    const currentSectorLines = getLinesOfSectorAndNeighbors(
      level,
      this.currentSectorIndex,
    );

    for (let i: number = 0; i < 3; i++) {
      if (currentSectorLines === undefined) break;

      for (const line of currentSectorLines) {
        if (line.backSidedefIndex !== null) continue;

        const A = level.vertices[line.v1Index];
        const B = level.vertices[line.v2Index];

        const AB = { x: B.x - A.x, y: B.y - A.y };
        const AP = { x: nextX - A.x, y: nextY - A.y };

        let t = dot(AP, AB) / dot(AB, AB);
        t = clamp(t, 0, 1);

        const closest = { x: A.x + AB.x * t, y: A.y + AB.y * t };

        const delta = { x: nextX - closest.x, y: nextY - closest.y };
        const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);

        if (distance > EPS && distance < this.radius) {
          const pushDir = { x: delta.x / distance, y: delta.y / distance };
          const pushLen = this.radius - distance + 0.0001;
          nextX += pushDir.x * pushLen;
          nextY += pushDir.y * pushLen;
        }
      }
    }

    this.x = nextX;
    this.y = nextY;

    this.updateCurrentSector(level);
  }

  private updateCurrentSector(level: Level) {
    if (isPointInSector(level, this.currentSectorIndex, this.x, this.y)) return;

    for (const line of level.lines) {
      if (line.backSidedefIndex === null) continue;

      const frontSector = level.sides[line.frontSidedefIndex].sector;
      const backSector = level.sides[line.backSidedefIndex].sector;

      let nextSector: number | null = null;

      if (frontSector === this.currentSectorIndex) {
        nextSector = backSector;
      } else if (backSector === this.currentSectorIndex) {
        nextSector = frontSector;
      }

      if (nextSector === null) continue;

      if (isPointInSector(level, nextSector, this.x, this.y)) {
        this.currentSectorIndex = nextSector;
        this.eyeHeight =
          level.sectors[nextSector].floorHeight + this.playerHeight;
        return;
      }
    }
  }
}
