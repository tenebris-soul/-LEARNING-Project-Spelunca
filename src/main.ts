import { Application, Graphics } from "pixi.js";
import { Game } from "./game/Game";

const app = new Application();

async function main() {
  await app.init({
    width: 800,
    height: 600,
    background: "#20242a",
  });

  document.body.appendChild(app.canvas);

  const game = new Game(app.canvas);

  const box = new Graphics();
  box.rect(100, 100, 200, 150);
  box.fill(0x4fc3f7);

  app.stage.addChild(box);

  game.init();

  app.ticker.add(() => {
    game.update();
  });
}

main();
