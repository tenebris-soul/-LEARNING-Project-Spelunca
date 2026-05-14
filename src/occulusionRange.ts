export class ScreenOcclusion {
  private screenWidth: number;
  private screenHeight: number;

  private openTop: number[];
  private openBottom: number[];

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.openTop = new Array(screenWidth).fill(0);
    this.openBottom = new Array(screenWidth).fill(screenHeight);
  }

  isFullyCovered(xStart: number, xEnd: number): boolean {
    const start = this.clampX(xStart);
    const end = this.clampX(xEnd);

    for (let x = start; x <= end; x++) {
      if (this.openTop[x] < this.openBottom[x]) {
        return false;
      }
    }

    return true;
  }

  addSolid(xStart: number, xEnd: number) {
    const start = this.clampX(xStart);
    const end = this.clampX(xEnd);

    for (let x = start; x <= end; x++) {
      this.openTop[x] = this.screenHeight;
      this.openBottom[x] = 0;
    }
  }

  addUpper(wall: { x1: number; x2: number; yBottom1: number; yBottom2: number }) {
    const start = this.clampX(Math.floor(wall.x1));
    const end = this.clampX(Math.ceil(wall.x2));

    for (let x = start; x <= end; x++) {
      const yBottom = this.lerpAtX(x, wall.x1, wall.x2, wall.yBottom1, wall.yBottom2);
      this.openTop[x] = Math.max(this.openTop[x], yBottom);
    }
  }

  addLower(wall: { x1: number; x2: number; yTop1: number; yTop2: number }) {
    const start = this.clampX(Math.floor(wall.x1));
    const end = this.clampX(Math.ceil(wall.x2));

    for (let x = start; x <= end; x++) {
      const yTop = this.lerpAtX(x, wall.x1, wall.x2, wall.yTop1, wall.yTop2);
      this.openBottom[x] = Math.min(this.openBottom[x], yTop);
    }
  }

  private clampX(x: number): number {
    return Math.max(0, Math.min(this.screenWidth - 1, x));
  }

  private lerpAtX(
    x: number,
    x1: number,
    x2: number,
    y1: number,
    y2: number,
  ): number {
    if (Math.abs(x2 - x1) < 0.00001) return y1;

    const t = (x - x1) / (x2 - x1);
    return y1 + (y2 - y1) * t;
  }
}
