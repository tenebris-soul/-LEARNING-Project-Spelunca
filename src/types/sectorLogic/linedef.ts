import type { Vertex } from "./vertex";

export type Linedef = {
  v1: Vertex;
  v2: Vertex;
  frontSidedefIndex: number;
  backSidedefIndex: number | null;
};
