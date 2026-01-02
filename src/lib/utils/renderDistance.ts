import { TILES } from "@/lib/config/tiles";

export let RENDER_DISTANCE = 2;

export const setRenderDistance = (): void => {
  const width = window.innerWidth;
  const chunkPadding = 2; // We want some extra chunks around the chunks that can fit in the screen so there is no void in the corners
  RENDER_DISTANCE = Math.ceil(width / (TILES.CHUNK_SIZE * TILES.TILE_WIDTH_HALF)) + chunkPadding;
};
