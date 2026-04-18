import type { DirectionType } from "./directionType";

export type PlayerType = {
  x: number;
  y: number;
  angle: number;
  fov: number;

  speed: number;
  rotationSpeed: number;

  moveForward(): void;
  rotate(dir: DirectionType): void;
  getFovInRadians(): number;
};
