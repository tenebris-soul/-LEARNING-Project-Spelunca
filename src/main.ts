import { testLevel } from "./levels/testLevel";
import "./style.css";
import { Application, Graphics } from "pixi.js";
import { isLevelStructureValid } from "./utils/levels/checkLevelStructure";
import { Player } from "./player";
import { Renderer } from "./renderer";

const appElement = document.querySelector<HTMLDivElement>("#app")!;

const level = testLevel;

async function main() {
  const app = new Application();

  await app.init({
    width: 800,
    height: 600,
    backgroundColor: 0x222222,
  });

  appElement.appendChild(app.canvas);

  const player = new Player(
    level.playerStart.x,
    level.playerStart.y,
    level.playerStart.angle,
    level.playerStart.sectorIndex, // потом заменить на проверку по координатам,
    level, // УБРАТЬ ЭТО НАФИГ ПОТОМЫ
  );

  const renderer = new Renderer(player, app.canvas.width, app.canvas.height);

  const speluncaGraphics = new Graphics();
  app.stage.addChild(speluncaGraphics);

  if (!isLevelStructureValid(level)) return;
  renderer.changeLevel(level);

  const levelGraphics = new Graphics();
  app.stage.addChild(levelGraphics);

  const playerGraphics = new Graphics();
  app.stage.addChild(playerGraphics);

  const raysGraphics = new Graphics();
  app.stage.addChild(raysGraphics);

  renderer.constructTopDown(playerGraphics, levelGraphics, raysGraphics);
  renderer.constructSpelunca(speluncaGraphics);

  app.ticker.add((ticker) => {
    player.handleMovement(ticker.elapsedMS / 1000.0, level);

    renderer.renderFromCamera();
    renderer.renderTopDown();
  });
}

main();
