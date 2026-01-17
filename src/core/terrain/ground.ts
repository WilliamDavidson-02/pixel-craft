import { Sprite } from "pixi.js";

import { state } from "@/core/state";
import { isTileWater } from "@/core/terrain/water";
import { TILE } from "@/lib/config";

type GroundSpriteData = {
  xPosTile: number;
  yPosTile: number;
  perlin: number[][];
  row: number;
  col: number;
};

export const createGroundSprite = (data: GroundSpriteData): Sprite | null => {
  const { xPosTile, yPosTile, perlin, row, col } = data;
  const perlinValue = perlin[row][col];

  const x = xPosTile - TILE.WIDTH_HALF;
  const y = yPosTile;

  const sprite = new Sprite({
    width: TILE.WIDTH,
    height: TILE.HEIGHT * 2, // Dubble the height since we have walls on some block but this does not effect the position only the texture
    x: x,
    y: y,
    label: `${x}_${y}`, // Adding the positino to the label so we can get tha same tile on the surface as well
  });

  if (perlinValue < -0.15 && perlinValue >= -0.35) {
    sprite.y -= TILE.HEIGHT_HALF;
    sprite.tint = 0x7fbf7f; // Darker green for lower ground
  } else if (perlinValue < -0.35 && perlinValue >= -0.55) {
    sprite.y -= TILE.HEIGHT;
    sprite.tint = 0x3f7f3f; // Even darker green for lowest ground
  } else if (perlinValue < -0.55) {
    sprite.y -= TILE.HEIGHT + TILE.HEIGHT_HALF;
    sprite.tint = 0x1f3f1f; // Very dark green for the lowest ground
  }

  if (state.assets.blocks) {
    sprite.texture = state.assets.blocks.animations["grass"][0];

    if (isTileWater(perlin[row][col])) {
      sprite.texture = state.assets.blocks.animations["dirt"][0];
      sprite.y += TILE.HEIGHT_HALF;

      if (perlinValue > 0.25 && perlinValue <= 0.35) {
        sprite.y += TILE.HEIGHT_HALF;
        sprite.tint = 0xa67c52; // Brown for shallow water
      } else if (perlinValue > 0.35 && perlinValue <= 0.45) {
        console.log(perlin[row][col]);
        sprite.y += TILE.HEIGHT;
        sprite.tint = 0x6b4f2a; // Darker brown for deeper water
      } else if (perlinValue > 0.45) {
        console.log(perlin[row][col]);
        sprite.y += TILE.HEIGHT + TILE.HEIGHT_HALF;
        sprite.tint = 0x6b4f2a; // Darker brown for deeper water
      }
    }
  }

  return sprite;
};
