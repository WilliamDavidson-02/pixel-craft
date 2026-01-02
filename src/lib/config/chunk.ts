import { TILE } from "./tile";

const SIZE = 16;

export const CHUNK = {
  SIZE,
  WIDTH: SIZE * TILE.WIDTH,
  HEIGHT: SIZE * TILE.HEIGHT,
} as const;
