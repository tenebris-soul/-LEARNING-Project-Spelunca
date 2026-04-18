import type { PlayerType } from "../types/playerType";
import type { DirectionType } from "../types/directionType";

export class Player implements PlayerType {
  x: number;
  y: number;
  angle: number;
  fov: number;

  speed: number;
  rotationSpeed: number;

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.fov = 75;

    this.speed = 0.1;
    this.rotationSpeed = 0.15;
  }

  moveForward(): void {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    console.log(
      `Player position: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`,
    );
  }

  rotate(dir: DirectionType): void {
    const rotationDirection = dir === "Left" ? -1 : 1;
    this.angle += rotationDirection * this.rotationSpeed;

    console.log(`Player angle: ${this.angle.toFixed(2)}`);
  }

  getFovInRadians(): number {
    return this.fov * (Math.PI / 180);
  }
}
