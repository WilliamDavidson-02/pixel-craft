import { ColorMatrixFilter, Sprite } from "pixi.js";

import { state } from "@/core/state";
import { isAdjacentToWater } from "@/core/terrain/water";
import { CHUNK, TILE } from "@/lib/config";
import { getBlockType } from "@/lib/utils/block";
import { generateBlockTypeNoise, getPerlinAroundCell } from "@/lib/utils/perlinNoise";
import { getTerrainHeightLevel } from "@/lib/utils/position";
import type { GroundSpriteData } from "@/types/ground";

const shadowFilterCahche: Record<string, ColorMatrixFilter> = {};

const getTerrainShadowFilter = (level: number, isWater: boolean, x: number, y: number) => {
  const perlin = getPerlinAroundCell(x, y, 1);
  const frontTiles = [
    perlin[1][2], // Rigtht
    perlin[2][1], // Bottom
    perlin[2][2], // Bottom-right
  ] as const;

  const heigherTileCount = frontTiles.reduce((count, perlinValue) => {
    const adjacentLevel = getTerrainHeightLevel(perlinValue).level;

    if (isWater) {
      count += adjacentLevel < level ? 1 : 0;
    } else {
      count += adjacentLevel > level ? 1 : 0;
    }

    return count;
  }, 0);

  if (heigherTileCount === 0) {
    return null;
  }

  const shadowCountMap = [1, 0.95, 0.9, 0.85];
  const brightness = shadowCountMap[heigherTileCount];

  const cacheKey = `${heigherTileCount}_${brightness}`;
  if (shadowFilterCahche[cacheKey]) {
    return shadowFilterCahche[cacheKey]!;
  }

  const shadowFilter = new ColorMatrixFilter();
  shadowFilter.brightness(brightness, false);
  shadowFilterCahche[cacheKey] = shadowFilter;
  return shadowFilter;
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

  const filter = getTerrainShadowFilter(level, isWater, xPosTile, yPosTile);

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

    if (filter) {
      sprite.filters = [filter];
    }
  }

  return sprite;
};
