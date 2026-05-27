import type { BSPNode } from "../types/bsp/bspNode";
import type { Level } from "../types/levelLogic/level";
import type { Linedef } from "../types/sectorLogic/linedef";
import type { Vertex } from "../types/sectorLogic/vertex";
import { cross } from "../utils/mathUtils";

type FrontLines = Linedef[];
type BackLines = Linedef[];

type Side = "front" | "back" | "on";
type LineSide = "front" | "back" | "spanning" | "collinear";

type SplitPoint = { x: number; y: number };

export class BSPTreeBuilder {
  private currentLevel: Level;
  private rootNode: BSPNode | null = null;

  constructor(level: Level) {
    this.currentLevel = level;
    this.rootNode = this.buildBSPTree(this.currentLevel.lines);
  }

  getTree(): BSPNode | null {
    return this.rootNode;
  }

  private buildBSPTree(inputLines: Linedef[]): BSPNode | null {
    if (inputLines.length === 0) return null;

    const splitter = this.chooseBestSplitter(inputLines);
    const { front, back } = this.splitSpace(splitter, inputLines);

    return {
      front: this.buildBSPTree(front),
      back: this.buildBSPTree(back),
      splitter: splitter,
    };
  }

  private chooseBestSplitter(inputLines: Linedef[]): Linedef {
    let bestLine = inputLines[0];
    let bestScore = Infinity;

    for (const candidate of inputLines) {
      const otherLines = inputLines.filter((line) => line !== candidate);

      let frontCount = 0;
      let backCount = 0;
      let splitCount = 0;

      for (const line of otherLines) {
        const side = this.getLineSide(line, candidate);
        if (side === "front") frontCount++;
        else if (side === "back") backCount++;
        else if (side === "spanning") {
          frontCount++;
          backCount++;
          splitCount++;
        }
      }
      const balancePenalty = Math.abs(frontCount - backCount);
      const sizePenalty = Math.max(frontCount, backCount);

      const score = splitCount * 10 + balancePenalty * 1 + sizePenalty * 0.25;

      if (score < bestScore) {
        bestScore = score;
        bestLine = candidate;
      }
    }

    return bestLine;
  }

  private splitSpace(
    splitter: Linedef,
    lines: Linedef[],
  ): { front: FrontLines; back: BackLines } {
    const front: FrontLines = [];
    const back: BackLines = [];

    for (const line of lines) {
      if (line === splitter) continue;

      const lineSide = this.getLineSide(line, splitter);

      if (lineSide === "front") front.push(line);
      else if (lineSide === "back") back.push(line);
      else if (lineSide === "collinear") front.push(line);
      else if (lineSide === "spanning") {
        const splitPoint = this.splitLine(line, splitter);

        if (splitPoint === null) {
          front.push(line);
          continue;
        }

        const firstPartLine: Linedef = {
          v1: { x: line.v1.x, y: line.v1.y },
          v2: { x: splitPoint.x, y: splitPoint.y },
          frontSidedefIndex: line.frontSidedefIndex,
          backSidedefIndex: line.backSidedefIndex,
          textureWorldSize: line.textureWorldSize,
        };
        const secondPartLine: Linedef = {
          v1: { x: splitPoint.x, y: splitPoint.y },
          v2: { x: line.v2.x, y: line.v2.y },
          frontSidedefIndex: line.frontSidedefIndex,
          backSidedefIndex: line.backSidedefIndex,
          textureWorldSize: line.textureWorldSize,
        };

        const firstLinePartSide = this.getLineSide(firstPartLine, splitter);
        const secondLinePartSide = this.getLineSide(secondPartLine, splitter);

        if (firstLinePartSide === "front" && secondLinePartSide === "front")
          front.push(firstPartLine, secondPartLine);
        else if (firstLinePartSide === "back" && secondLinePartSide === "back")
          back.push(firstPartLine, secondPartLine);
        else if (
          firstLinePartSide === "front" &&
          secondLinePartSide === "back"
        ) {
          front.push(firstPartLine);
          back.push(secondPartLine);
        } else if (
          firstLinePartSide === "back" &&
          secondLinePartSide === "front"
        ) {
          front.push(secondPartLine);
          back.push(firstPartLine);
        }
      }
    }

    return { front, back };
  }

  private splitLine(line: Linedef, splitter: Linedef): SplitPoint | null {
    const p = line.v1;
    const p1 = line.v2;
    const q = splitter.v1;
    const q1 = splitter.v2;

    const r = { x: p1.x - p.x, y: p1.y - p.y };
    const s = { x: q1.x - q.x, y: q1.y - q.y };

    const qMinusP = { x: q.x - p.x, y: q.y - p.y };

    const denom = cross(r, s);

    const EPS = 0.0000001;

    if (Math.abs(denom) < EPS) return null;

    const t = cross(qMinusP, s) / denom;
    if (t > EPS && t < 1 - EPS)
      return {
        x: p.x + r.x * t,
        y: p.y + r.y * t,
      };
    else return null;
  }

  private getLineSide(line: Linedef, splitter: Linedef): LineSide {
    const p1 = line.v1;
    const p2 = line.v2;

    const p1Side = this.getPointSide(p1, splitter);
    const p2Side = this.getPointSide(p2, splitter);

    if (p1Side === "front" && p2Side === "front") return "front";
    if (p1Side === "back" && p2Side === "back") return "back";
    if (p1Side === "on" && p2Side === "on") return "collinear";
    if (p1Side === "on" && p2Side === "front") return "front";
    if (p1Side === "back" && p2Side === "on") return "back";
    if (p1Side === "front" && p2Side === "on") return "front";
    if (p1Side === "on" && p2Side === "back") return "back";

    return "spanning";
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
    else if (crossProd < EPS) return "back";
    else return "on";
  }
}
