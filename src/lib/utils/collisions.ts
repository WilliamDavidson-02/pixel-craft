import type { ContainerChild, Sprite } from "pixi.js";

import { TILES } from "@/lib/config/tiles";
import type { ColidedSides } from "@/types/tiles";

export const getIsoCollisionSides = (tile: ContainerChild, player: Sprite): ColidedSides => {
  const cx = tile.x + TILES.TILE_WIDTH_HALF;
  const cy = tile.y + TILES.TILE_HEIGHT_HALF;

  // Before this function is called we alredy know that we have collided with the tile
  // This function is to determin on what side we colided
  return {
    "top-left": player.x + player.width < cx && player.y < cy,
    "bottom-left": player.x + player.width < cx && player.y > cy,
    "bottom-right": player.x > cx && player.y > cy,
    "top-right": player.x > cx && player.y < cy,
    top: player.x + player.width > cx && player.y < cy,
    bottom: player.x + player.width > cx && player.y > cy,
  };
};
