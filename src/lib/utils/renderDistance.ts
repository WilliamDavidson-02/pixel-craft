import { CHUNK, TILE } from "@/lib/config";

export let RENDER_DISTANCE = 2;

export const setRenderDistance = (): void => {
  const width = window.innerWidth;
  const chunkPadding = 2; // We want some extra chunks around the chunks that can fit in the screen so there is no void in the corners
  RENDER_DISTANCE = Math.ceil(width / (CHUNK.SIZE * TILE.WIDTH_HALF)) + chunkPadding;
};
