export type Coordinates = { x: number; y: number };

export const allowedKeys = ["w", "a", "s", "d"] as const;
export type AllowedKeys = (typeof allowedKeys)[number];
