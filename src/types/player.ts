import type { ChunkKey } from "./chunks";

export type Coordinates = { x: number; y: number };

export const allowedKeys = ["w", "a", "s", "d"] as const;
export type AllowedKeys = (typeof allowedKeys)[number];

export type Vertical = "up" | "down";
export type Horizontal = "left" | "right";
type Center = "center";

export type LandKey =
  | `${Vertical}-${Center}`
  | `${Vertical}-${Horizontal}`
  | `${Horizontal}-${Horizontal}`;

export type WaterKey = `water-${LandKey}`;

export type AnimationKey = LandKey | WaterKey;

type PlayerStateAnimation = {
  currentFrame: number;
  key: AnimationKey;
};

export type PlayerState = {
  animation: PlayerStateAnimation;
  position: Coordinates;
  movementKeys: Set<AllowedKeys>;
  chunkKey?: ChunkKey;
  inWater: boolean;
};
