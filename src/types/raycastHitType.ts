import type { Vec2 } from "./gameStructure/vector2Type";

export type RaycastHitType = {
  // Расстояние без fisheye. Его используем для высоты стен на экране.
  correctDistance: number;
  // Точка, где луч встретил финальную стену.
  hit: Vec2;
  // Индекс стены, в которую пришёл луч.
  wallIndex: number;
  // Смещение вдоль стены в диапазоне 0..1. Нужен для выборки текстуры.
  textureU: number;
  // Нормаль финальной стены.
  normal: Vec2;
  // Сектор, в котором находится финальная стена.
  sectorIndex: number;
};

export type RaySegment = {
  // Через какой сектор проходит этот кусок луча.
  sectorIndex: number;
  // Где луч вошёл в сектор, в сыром t вдоль луча.
  enterT: number;
  // Где луч вышел из сектора или упёрся в стену.
  exitT: number;
  // Через какую стену луч покинул сектор.
  exitWallIndex: number;
  // Как именно закончился сегмент: портал, твёрдая стена или пустота.
  exitKind: "portal" | "solid" | "void";
};

export type DetailedRayResult = {
  // Финальное попадание в твёрдую стену. Для обычного рендера стен этого достаточно.
  finalHit: RaycastHitType | null;
  // Полный путь луча по секторам. Это уже нужно для пола/потолка через порталы.
  segments: RaySegment[];
};
