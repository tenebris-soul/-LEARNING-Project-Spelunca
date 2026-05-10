import { testLevel } from "./levels/testLevel";
import "./style.css";
import { Application, Graphics, Sprite, Texture } from "pixi.js";
import { isLevelStructureValid } from "./utils/levels/checkLevelStructure";
import { Player } from "./player";
import { Renderer } from "./renderer";
import { BSPTreeBuilder } from "./bsp/bspBuilder";

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

  const bspBuilder = new BSPTreeBuilder(level);
  const bspRoot = bspBuilder.getTree();

  if (!bspRoot) return;

  const renderer = new Renderer(player);

  const surfaceCanvas = document.createElement("canvas");
  surfaceCanvas.width = app.canvas.width;
  surfaceCanvas.height = app.canvas.height;

  const surfaceTexture = Texture.from(surfaceCanvas);
  const surfaceSprite = new Sprite(surfaceTexture);
  app.stage.addChild(surfaceSprite);

  const speluncaGraphics = new Graphics();
  app.stage.addChild(speluncaGraphics);

  if (!isLevelStructureValid(level)) return;
  renderer.changeLevel(level);

  const levelGraphics = new Graphics();
  app.stage.addChild(levelGraphics);

  const bspGraphics = new Graphics();
  app.stage.addChild(bspGraphics);

  const playerGraphics = new Graphics();
  app.stage.addChild(playerGraphics);

  const raysGraphics = new Graphics();
  app.stage.addChild(raysGraphics);

  renderer.constructTopDown(
    playerGraphics,
    levelGraphics,
    bspGraphics,
    raysGraphics,
    bspRoot,
  );

  app.ticker.add((ticker) => {
    player.handleMovement(ticker.elapsedMS / 1000.0, level);

    renderer.renderTopDown();
  });
}

main();
