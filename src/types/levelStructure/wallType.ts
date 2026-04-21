import type { Vec2 } from "../gameStructure/vectorType";

export type Wall = {
  a: Vec2;
  b: Vec2;
  solid: boolean;
  frontSector?: number;
  backSector?: number;
  color?: number;
};
