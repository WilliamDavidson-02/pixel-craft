import { Sprite } from "pixi.js";

import { state } from "@/core/state";
import { isAdjacentToWater } from "@/core/terrain/water";
import { BLOCK_TYPE, CHUNK, TILE } from "@/lib/config";
import { generateBlockTypeNoise, getPerlinAroundCell } from "@/lib/utils/perlinNoise";
import { getTerrainHeightLevel } from "@/lib/utils/position";

type GroundSpriteData = {
  xPosTile: number;
  yPosTile: number;
  perlin: number[][];
  row: number;
  col: number;
  chunkCol: number;
  chunkRow: number;
};

type BlockType = "grass" | "dirt" | "sand" | "stone";

/**
 * Determines the block type based on terrain factors
 */
const getBlockType = (
  level: number,
  isWater: boolean,
  isShore: boolean,
  blockNoise: number,
): BlockType => {
  if (isWater) {
    // Stone uses inverted threshold (lower noise = stone) to separate from sand
    if (blockNoise < BLOCK_TYPE.STONE_UNDERWATER_THRESHOLD) {
      return "stone";
    }

    if (blockNoise > BLOCK_TYPE.SAND_UNDERWATER_THRESHOLD) {
      return "sand";
    }

    return "dirt";
  }

  // High elevation: can have stone (inverted threshold)
  if (
    level >= BLOCK_TYPE.STONE_MIN_GROUND_LEVEL &&
    blockNoise < BLOCK_TYPE.STONE_GROUND_THRESHOLD
  ) {
    return "stone";
  }

  // Shore tiles: sand with noise based variation
  // Also allow sand to creep inland based on noise and spread threshold
  if (
    isShore &&
    blockNoise > BLOCK_TYPE.SAND_SHORE_THRESHOLD &&
    level <= BLOCK_TYPE.SAND_MAX_GROUND_LEVEL
  ) {
    return "sand";
  }

  return "grass";
};

export const createGroundSprite = (data: GroundSpriteData): Sprite => {
  const { xPosTile, yPosTile, perlin, row, col, chunkCol, chunkRow } = data;
  const perlinValue = perlin[row][col];

  const x = xPosTile - TILE.WIDTH_HALF;
  const y = yPosTile;

  const sprite = new Sprite({
    width: TILE.WIDTH,
    height: TILE.HEIGHT * 2, // Double the height since we have walls on some blocks
    x: x,
    y: y,
    label: `${x}_${y}`,
  });

  const { level, isWater } = getTerrainHeightLevel(perlinValue);

  const perlinAround = getPerlinAroundCell(row, col);
  const isShore = isAdjacentToWater(perlinAround);

  // Get secondary noise for block type variation
  const worldX = chunkCol * CHUNK.SIZE + col;
  const worldY = chunkRow * CHUNK.SIZE + row;

  const blockNoise = generateBlockTypeNoise(worldX, worldY);
  const blockType = getBlockType(level, isWater, isShore, blockNoise);

  if (state.assets.blocks) {
    sprite.texture = state.assets.blocks.animations[blockType][0];

    if (isWater) {
      // +1 accounts for base water offset, level adds additional depth
      sprite.y += (level + 1) * TILE.HEIGHT_HALF;
    } else {
      sprite.y -= level * TILE.HEIGHT_HALF;
    }
  }

  return sprite;
};
