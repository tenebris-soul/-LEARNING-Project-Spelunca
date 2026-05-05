import type { Linedef } from "../sectorLogic/linedef";
import type { Sector } from "../sectorLogic/sector";
import type { Sidedef } from "../sectorLogic/sidedef";
import type { Vertex } from "../sectorLogic/vertex";

export type Level = {
  name: string;

  vertices: Vertex[];
  lines: Linedef[];
  sides: Sidedef[];
  sectors: Sector[];

  playerStart: {
    x: number;
    y: number;
    angle: number;
    sectorIndex: number;
  };
};
