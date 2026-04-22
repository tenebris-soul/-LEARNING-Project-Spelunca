import type { Vec2 } from "../gameStructure/vector2Type";

export type Wall = {
  a: Vec2;
  b: Vec2;
  solid: boolean;
  frontSector?: number;
  backSector?: number;
  color?: number;
  textureName?: string;
  textureRepeat?: number;
};
