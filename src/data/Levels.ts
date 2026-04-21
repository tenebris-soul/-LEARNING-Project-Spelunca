import type { LevelDataType } from "../types/levelStructure/levelType";

const point = (x: number, y: number) => ({ x, y });
const portalColor = 0x20242a;

const room0DoorTop = point(7.83, 3.35);
const room0DoorBottom = point(7.46, 4.55);
const room1DoorTop = point(9.99, 3.25);
const room1DoorBottom = point(9.78, 4.45);

export const levels: Record<string, LevelDataType> = {
  test_level: {
    playerSpawn: {
      x: 3.2,
      y: 3.4,
      angle: 0.2,
    },
    walls: [
      // Room 0: skewed six-sided room.
      {
        a: point(1.0, 1.0),
        b: point(6.2, 1.2),
        solid: true,
        frontSector: 0,
        color: 0x5fa8ff,
      },
      {
        a: point(6.2, 1.2),
        b: point(8.0, 2.8),
        solid: true,
        frontSector: 0,
        color: 0x5fa8ff,
      },
      {
        a: point(8.0, 2.8),
        b: room0DoorTop,
        solid: true,
        frontSector: 0,
        color: 0x5fa8ff,
      },
      {
        a: room0DoorTop,
        b: room0DoorBottom,
        solid: false,
        frontSector: 0,
        backSector: 2,
        color: portalColor,
      },
      {
        a: room0DoorBottom,
        b: point(7.1, 5.7),
        solid: true,
        frontSector: 0,
        color: 0x5fa8ff,
      },
      {
        a: point(7.1, 5.7),
        b: point(4.2, 7.0),
        solid: true,
        frontSector: 0,
        color: 0x5fa8ff,
      },
      {
        a: point(4.2, 7.0),
        b: point(1.6, 5.6),
        solid: true,
        frontSector: 0,
        color: 0x5fa8ff,
      },
      {
        a: point(1.6, 5.6),
        b: point(1.0, 1.0),
        solid: true,
        frontSector: 0,
        color: 0x5fa8ff,
      },

      // Corridor: thin passage that connects both rooms.
      {
        a: room1DoorTop,
        b: room0DoorTop,
        solid: true,
        frontSector: 2,
        color: 0xa5d6a7,
      },

      // Room 1: another irregular room for segment testing.
      {
        a: point(10.2, 2.0),
        b: point(14.4, 1.5),
        solid: true,
        frontSector: 1,
        color: 0xffb74d,
      },
      {
        a: point(14.4, 1.5),
        b: point(16.7, 3.9),
        solid: true,
        frontSector: 1,
        color: 0xffb74d,
      },
      {
        a: point(16.7, 3.9),
        b: point(15.4, 7.4),
        solid: true,
        frontSector: 1,
        color: 0xffb74d,
      },
      {
        a: point(15.4, 7.4),
        b: point(11.8, 8.2),
        solid: true,
        frontSector: 1,
        color: 0xffb74d,
      },
      {
        a: point(11.8, 8.2),
        b: point(9.6, 5.5),
        solid: true,
        frontSector: 1,
        color: 0xffb74d,
      },
      {
        a: point(9.6, 5.5),
        b: room1DoorBottom,
        solid: true,
        frontSector: 1,
        color: 0xffb74d,
      },
      {
        a: room1DoorBottom,
        b: room1DoorTop,
        solid: false,
        frontSector: 2,
        backSector: 1,
        color: portalColor,
      },
      {
        a: room1DoorTop,
        b: point(10.2, 2.0),
        solid: true,
        frontSector: 1,
        color: 0xffb74d,
      },
      {
        a: room0DoorBottom,
        b: room1DoorBottom,
        solid: true,
        frontSector: 2,
        color: 0xa5d6a7,
      },
    ],
    sectors: [
      {
        floor: 0,
        ceil: 1.3,
        walls: [0, 1, 2, 3, 4, 5, 6, 7],
        floorColor: 0x2b2d42,
        ceilColor: 0x8d99ae,
      },
      {
        floor: 0,
        ceil: 1.6,
        walls: [9, 10, 11, 12, 13, 14, 15, 16],
        floorColor: 0x283618,
        ceilColor: 0xfefae0,
      },
      {
        floor: 0,
        ceil: 1.45,
        walls: [3, 17, 15, 8],
        floorColor: 0x344e41,
        ceilColor: 0xdad7cd,
      },
    ],
  },
};
