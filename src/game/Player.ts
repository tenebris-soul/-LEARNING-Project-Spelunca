import type { DirectionType } from "../types/directionType";

export class Player {
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

    this.speed = 0.075;
    this.rotationSpeed = 0.08;
  }

  moveForward(): void {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
  }

  rotate(dir: DirectionType): void {
    const rotationDirection = dir === "Left" ? -1 : 1;
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
