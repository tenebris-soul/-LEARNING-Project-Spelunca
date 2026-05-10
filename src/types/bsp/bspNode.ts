import type { Linedef } from "../sectorLogic/linedef";

export type BSPNode = {
  front: BSPNode | null;
  back: BSPNode | null;

  splitter: Linedef;
};
