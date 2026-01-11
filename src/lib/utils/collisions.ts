import type { ContainerChild, Sprite } from "pixi.js";

import { TILE } from "@/lib/config/tile";
import type { ColidedSides } from "@/types/tiles";

export const getIsoCollisionSides = (tile: ContainerChild, player: Sprite): ColidedSides => {
  const cx = tile.x + TILE.WIDTH_HALF;
  const cy = tile.y + TILE.HEIGHT_HALF;

  // Before this function is called we already know that we have collided with the tile
  // This function is to determine on what side we collided
  return {
    "top-left": player.x + player.width < cx && player.y < cy,
    "bottom-left": player.x + player.width < cx && player.y > cy,
    "bottom-right": player.x > cx && player.y > cy,
    "top-right": player.x > cx && player.y < cy,
    top: player.x + player.width > cx && player.y < cy,
    bottom: player.x + player.width > cx && player.y > cy,
  };
};
