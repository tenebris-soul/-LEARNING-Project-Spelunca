// LEVEL DONE BY CHATGPT

import type { Level } from "../types/levelLogic/level";

export const testLevel: Level = {
  name: "TestLevel",

  vertices: [
    // Room A: 6 углов
    { x: 0, y: 1 }, // 0
    { x: 2, y: -1 }, // 1
    { x: 7, y: -1 }, // 2
    { x: 9, y: 2 }, // 3 shared A/corridor
    { x: 7, y: 6 }, // 4 shared A/corridor
    { x: 1, y: 5 }, // 5

    // Corridor + Room B shared portal
    { x: 14, y: 2.5 }, // 6 shared corridor/B
    { x: 14, y: 4 }, // 7 shared corridor/B

    // Room B: 6 углов, другая форма
    { x: 18, y: 1 }, // 8
    { x: 23, y: 3 }, // 9
    { x: 24, y: 7 }, // 10
    { x: 21, y: 10 }, // 11
    { x: 16, y: 9 }, // 12
  ],

  sectors: [
    {
      floorHeight: 0,
      ceilingHeight: 4,
      floorTexture: "floor_stone",
      ceilingTexture: "ceiling_dark",
    },
    {
      floorHeight: 0,
      ceilingHeight: 2.5,
      floorTexture: "floor_metal",
      ceilingTexture: "ceiling_metal",
    },
    {
      floorHeight: -0.5,
      ceilingHeight: 5,
      floorTexture: "floor_tiles",
      ceilingTexture: "ceiling_concrete",
    },
  ],

  sides: [
    // 0-5: Room A sides
    { sector: 0, texture: "room_a_wall" }, // 0
    { sector: 0, texture: "room_a_wall" }, // 1
    { sector: 0, texture: "room_a_wall" }, // 2
    { sector: 0, texture: "room_a_wall" }, // 3 portal side A -> corridor
    { sector: 0, texture: "room_a_wall" }, // 4
    { sector: 0, texture: "room_a_wall" }, // 5

    // 6-9: Corridor sides
    { sector: 1, texture: "corridor_wall" }, // 6 portal side corridor -> A
    { sector: 1, texture: "corridor_wall" }, // 7
    { sector: 1, texture: "corridor_wall" }, // 8 portal side corridor -> B
    { sector: 1, texture: "corridor_wall" }, // 9

    // 10-16: Room B sides
    { sector: 2, texture: "room_b_wall" }, // 10 portal side B -> corridor
    { sector: 2, texture: "room_b_wall" }, // 11
    { sector: 2, texture: "room_b_wall" }, // 12
    { sector: 2, texture: "room_b_wall" }, // 13
    { sector: 2, texture: "room_b_wall" }, // 14
    { sector: 2, texture: "room_b_wall" }, // 15
    { sector: 2, texture: "room_b_wall" }, // 16
  ],

  lines: [
    // Room A
    { v1Index: 0, v2Index: 1, frontSidedefIndex: 0, backSidedefIndex: null },
    { v1Index: 1, v2Index: 2, frontSidedefIndex: 1, backSidedefIndex: null },
    { v1Index: 2, v2Index: 3, frontSidedefIndex: 2, backSidedefIndex: null },

    // Portal Room A <-> Corridor
    { v1Index: 3, v2Index: 4, frontSidedefIndex: 3, backSidedefIndex: 6 },

    { v1Index: 4, v2Index: 5, frontSidedefIndex: 4, backSidedefIndex: null },
    { v1Index: 5, v2Index: 0, frontSidedefIndex: 5, backSidedefIndex: null },

    // Corridor
    { v1Index: 3, v2Index: 6, frontSidedefIndex: 7, backSidedefIndex: null },

    // Portal Corridor <-> Room B
    { v1Index: 6, v2Index: 7, frontSidedefIndex: 8, backSidedefIndex: 10 },

    { v1Index: 7, v2Index: 4, frontSidedefIndex: 9, backSidedefIndex: null },

    // Room B
    { v1Index: 6, v2Index: 8, frontSidedefIndex: 11, backSidedefIndex: null },
    { v1Index: 8, v2Index: 9, frontSidedefIndex: 12, backSidedefIndex: null },
    { v1Index: 9, v2Index: 10, frontSidedefIndex: 13, backSidedefIndex: null },
    { v1Index: 10, v2Index: 11, frontSidedefIndex: 14, backSidedefIndex: null },
    { v1Index: 11, v2Index: 12, frontSidedefIndex: 15, backSidedefIndex: null },
    { v1Index: 12, v2Index: 7, frontSidedefIndex: 16, backSidedefIndex: null },
  ],

  playerStart: {
    x: 3,
    y: 2,
    angle: 0,
    sectorIndex: 0,
  },
};
