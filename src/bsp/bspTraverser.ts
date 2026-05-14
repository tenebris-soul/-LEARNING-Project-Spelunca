import type { BSPNode } from "../types/bsp/bspNode";
import type { Linedef } from "../types/sectorLogic/linedef";
import type { Vertex } from "../types/sectorLogic/vertex";
import { cross } from "../utils/mathUtils";

type Side = "front" | "back";

export class BSPTraverser {
  traverseFrontToBack(
    root: BSPNode,
    playerPos: { x: number; y: number },
  ): Linedef[] {
    const result: Linedef[] = [];

    this.visitFrontToBack(root, playerPos, result);

    return result;
  }

  private visitFrontToBack(
    node: BSPNode | null,
    playerPos: { x: number; y: number },
    result: Linedef[],
  ) {
    if (node === null) return;

    const side = this.getPointSide(playerPos, node.splitter);

    if (side === "front") {
      this.visitFrontToBack(node.front, playerPos, result);
      result.push(node.splitter);
      this.visitFrontToBack(node.back, playerPos, result);
    } else {
      this.visitFrontToBack(node.back, playerPos, result);
      result.push(node.splitter);
      this.visitFrontToBack(node.front, playerPos, result);
    }
  }

  private getPointSide(p: Vertex, splitter: Linedef): Side {
    const splitterStart = splitter.v1;
    const splitterEnd = splitter.v2;

    const v = {
      x: splitterEnd.x - splitterStart.x,
      y: splitterEnd.y - splitterStart.y,
    };
    const u = { x: p.x - splitterStart.x, y: p.y - splitterStart.y };

    const crossProd = cross(v, u);

    const EPS = 0.00001;

    if (crossProd > EPS) return "front";
    else return "back";
  }
}
