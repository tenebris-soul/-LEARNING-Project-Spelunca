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

  const game = new Game(app);

  game.init();

  app.ticker.add(() => {
    game.update();
  });
}

main();
