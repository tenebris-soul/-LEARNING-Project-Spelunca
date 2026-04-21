import { Direction } from "../types/directionType";
import type { Vec2 } from "../types/gameStructure/vectorType";

export class Player {
  pos: Vec2 = { x: 0, y: 0 };
  angle: number;
  fov: number;

  speed: number;
  rotationSpeed: number;

  constructor(x: number, y: number, angle: number) {
    this.pos.x = x;
    this.pos.y = y;
    this.angle = angle;
    this.fov = 75;

    this.speed = 0.075;
    this.rotationSpeed = 0.025;
  }

  moveForward(): void {
    this.pos.x += Math.cos(this.angle) * this.speed;
    this.pos.y += Math.sin(this.angle) * this.speed;
  }

  rotate(dir: Direction): void {
    const rotationDirection = dir === Direction.Left ? -1 : 1;
    this.angle += rotationDirection * this.rotationSpeed;
  }

  getFovInRadians(): number {
    return this.fov * (Math.PI / 180);
  }

  getForwardStep(): { x: number; y: number } {
    return {
      x: Math.cos(this.angle) * this.speed,
      y: Math.sin(this.angle) * this.speed,
    };
  }
}
