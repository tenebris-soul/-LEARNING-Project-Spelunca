import type { Vec2 } from "./gameStructure/vectorType";

export type RaycastHitType = {
  correctDistance: number;
  hit: Vec2;
  wallIndex: number;
  textureU: number;
  normal: Vec2;
};
