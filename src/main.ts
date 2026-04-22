import { Application } from "pixi.js";
import { Game } from "./game/Game";

const app = new Application();

async function main() {
  await app.init({
    width: 1280,
    height: 720,
    background: "#20242a",
  });

  document.body.appendChild(app.canvas);

  const game = new Game(app);

  await game.init();

  app.ticker.add(() => {
    game.update();
  });
}

main();
