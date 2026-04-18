export const DirectionType = {
  Left: "Left",
  Right: "Right",
} as const;

export type DirectionType = (typeof DirectionType)[keyof typeof DirectionType];
