import { testLevel } from "./levels/testLevel";
import "./style.css";
import { Application, Graphics } from "pixi.js";
import { isLevelStructureValid } from "./utils/levels/checkLevelStructure";
import { Keys } from "./input";
import type { Linedef } from "./types/sectorLogic/linedef";

const appElement = document.querySelector<HTMLDivElement>("#app")!;

const level = testLevel;

const { lines, vertices } = level;

const scale = 30;
const offsetX = 80;
const offsetY = 120;

let playerX = level.playerStart.x;
let playerY = level.playerStart.y;
let playerAngle = level.playerStart.angle;
const playerRadius = 0.25;

async function main() {
  const app = new Application();

  await app.init({
    width: 800,
    height: 600,
    backgroundColor: 0x222222,
  });

  appElement.appendChild(app.canvas);

  if (!isLevelStructureValid(level)) return;

  for (const line of lines) {
    const lineGraphics = new Graphics();

    const v1 = vertices[line.v1Index];
    const v2 = vertices[line.v2Index];

    lineGraphics.moveTo(v1.x * scale + offsetX, v1.y * scale + offsetY);
    lineGraphics.lineTo(v2.x * scale + offsetX, v2.y * scale + offsetY);

    if (line.backSidedefIndex !== null)
      lineGraphics.stroke({ width: 2, color: 0xffffff });
    else lineGraphics.stroke({ width: 2, color: 0x454545 });

    app.stage.addChild(lineGraphics);
  }

  const playerGraphics = new Graphics();

  app.stage.addChild(playerGraphics);

  const viewRayGraphics = new Graphics();

  app.stage.addChild(viewRayGraphics);

  app.ticker.add((ticker) => {
    drawPlayer(playerGraphics, viewRayGraphics, ticker.elapsedMS / 1000.0);
  });
}

function drawPlayer(
  playerGraphics: Graphics,
  viewRayGraphics: Graphics,
  deltaTime: number,
) {
  playerGraphics.clear();
  viewRayGraphics.clear();

  if (Keys["KeyA"] === true) {
    playerAngle -= 5.0 * deltaTime;
  } else if (Keys["KeyD"] === true) {
    playerAngle += 5.0 * deltaTime;
  }

  const playerSpeed = 3;
  let dirX: number = 0;
  let dirY: number = 0;

  if (Keys["KeyW"] === true) {
    dirX = playerSpeed * Math.cos(playerAngle) * deltaTime;
    dirY = playerSpeed * Math.sin(playerAngle) * deltaTime;
  } else if (Keys["KeyS"]) {
    dirX = -playerSpeed * Math.cos(playerAngle) * deltaTime;
    dirY = -playerSpeed * Math.sin(playerAngle) * deltaTime;
  }

  moveAndCollide(dirX, dirY);

  const rayX = Math.cos(playerAngle) * scale;
  const rayY = Math.sin(playerAngle) * scale;

  playerGraphics
    .circle(playerX * scale + offsetX, playerY * scale + offsetY, 10)
    .fill(0xffcc00);

  viewRayGraphics
    .moveTo(playerX * scale + offsetX, playerY * scale + offsetY)
    .lineTo(playerX * scale + offsetX + rayX, playerY * scale + offsetY + rayY)
    .stroke({ width: 1, color: 0x87ceeb });
}

function moveAndCollide(offsetX: number, offsetY: number) {
  if (offsetX === 0 && offsetY === 0) return;

  const collision = findSolidCollision(offsetX, offsetY);

  if (collision === null) {
    playerX += offsetX;
    playerY += offsetY;
    return;
  }

  const v1 = vertices[collision.v1Index];
  const v2 = vertices[collision.v2Index];

  const wall = {
    x: v2.x - v1.x,
    y: v2.y - v1.y,
  };

  const length = Math.sqrt(wall.x * wall.x + wall.y * wall.y);
  if (length === 0) return;

  const normal = {
    x: -wall.y / length,
    y: wall.x / length,
  };

  const dot = offsetX * normal.x + offsetY * normal.y;

  const normalPartX = normal.x * dot;
  const normalPartY = normal.y * dot;

  const slideX = offsetX - normalPartX;
  const slideY = offsetY - normalPartY;

  const slideCollision = findSolidCollision(slideX, slideY);

  if (slideCollision === null) {
    playerX += slideX;
    playerY += slideY;
  }
}

function findSolidCollision(offsetX: number, offsetY: number): Linedef | null {
  const r = { x: offsetX, y: offsetY };

  for (const line of lines) {
    if (line.backSidedefIndex !== null) continue;

    const v1 = vertices[line.v1Index];
    const v2 = vertices[line.v2Index];

    const s = {
      x: v2.x - v1.x,
      y: v2.y - v1.y,
    };

    const denominator = cross(r, s);

    if (Math.abs(denominator) < 0.000001) continue;

    const qMinusP = {
      x: v1.x - playerX,
      y: v1.y - playerY,
    };

    const t = cross(qMinusP, s) / denominator;
    const u = cross(qMinusP, r) / denominator;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return line;
  }

  return null;
}

function cross(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return a.x * b.y - a.y * b.x;
}

main();
