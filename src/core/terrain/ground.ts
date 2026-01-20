import { Sprite } from "pixi.js";

import { state } from "@/core/state";
import { isAdjacentToWater } from "@/core/terrain/water";
import { BLOCK_TYPE, CHUNK, TILE } from "@/lib/config";
import { generateBlockTypeNoise } from "@/lib/utils/perlinNoise";
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
 * Gets the height levels of adjacent tiles for cliff detection.
 * Returns null if the adjacent tile is out of bounds.
 */
const getAdjacentHeightLevels = (
  perlin: number[][],
  row: number,
  col: number,
): { top: number | null; left: number | null } => {
  // In isometric view, "behind" tiles are at row-1 and col-1
  const topLevel = row > 0 ? getTerrainHeightLevel(perlin[row - 1][col]).level : null;
  const leftLevel = col > 0 ? getTerrainHeightLevel(perlin[row][col - 1]).level : null;

  return { top: topLevel, left: leftLevel };
};

/**
 * Creates cliff filler sprites when there's a height gap > 1 between adjacent tiles.
 * Fills the gap with dirt blocks to prevent visual holes.
 */
const createCliffFillers = (
  x: number,
  baseY: number,
  currentLevel: number,
  adjacentLevels: { top: number | null; left: number | null },
  isWater: boolean,
): Sprite[] => {
  const fillers: Sprite[] = [];

  if (!state.assets.blocks) return fillers;

  // Check each adjacent tile for height gaps
  const adjacentValues = [adjacentLevels.top, adjacentLevels.left];

  for (const adjacentLevel of adjacentValues) {
    if (adjacentLevel === null) continue;

    const levelDiff = Math.abs(currentLevel - adjacentLevel);

    // Only fill if there's a gap > 1 level
    if (levelDiff > 1) {
      // Determine the range of levels to fill
      const minLevel = Math.min(currentLevel, adjacentLevel);
      const maxLevel = Math.max(currentLevel, adjacentLevel);

      // Fill intermediate levels with dirt blocks
      for (let fillLevel = minLevel + 1; fillLevel < maxLevel; fillLevel++) {
        const fillerSprite = new Sprite({
          width: TILE.WIDTH,
          height: TILE.HEIGHT * 2,
          x: x,
          y: isWater
            ? baseY + (fillLevel + 1) * TILE.HEIGHT_HALF
            : baseY - fillLevel * TILE.HEIGHT_HALF,
          label: `filler_${x}_${fillLevel}`,
        });
        fillerSprite.texture = state.assets.blocks.animations["dirt"][0];
        fillers.push(fillerSprite);
      }
    }
  }

  return fillers;
};

/**
 * Gets a 3x3 perlin grid centered on the current tile for shore detection.
 */
const getPerlinAroundTile = (perlin: number[][], row: number, col: number): number[][] => {
  const result: number[][] = [];
  const size = perlin.length;

  for (let dy = -1; dy <= 1; dy++) {
    const rowData: number[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      const newRow = row + dy;
      const newCol = col + dx;
      // If out of bounds, use center value (safe fallback)
      if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
        rowData.push(perlin[row][col]);
      } else {
        rowData.push(perlin[newRow][newCol]);
      }
    }
    result.push(rowData);
  }

  return result;
};

/**
 * Determines the block type based on terrain factors and secondary noise.
 * Priority: stone > sand > default (grass/dirt)
 * Stone uses inverted threshold (< threshold) to avoid overlap with sand.
 */
const getBlockType = (
  level: number,
  isWater: boolean,
  isShore: boolean,
  blockNoise: number,
): BlockType => {
  const {
    SAND_SHORE_THRESHOLD,
    SAND_INLAND_SPREAD,
    SAND_UNDERWATER_THRESHOLD,
    STONE_GROUND_THRESHOLD,
    STONE_UNDERWATER_THRESHOLD,
    STONE_MIN_GROUND_LEVEL,
  } = BLOCK_TYPE;

  if (isWater) {
    // Underwater: dirt by default, can be sand or stone
    // Stone uses inverted threshold (lower noise = stone) to separate from sand
    if (blockNoise < STONE_UNDERWATER_THRESHOLD) {
      return "stone";
    }
    if (blockNoise > SAND_UNDERWATER_THRESHOLD) {
      return "sand";
    }
    return "dirt";
  }

  // Ground tiles
  // High elevation: can have stone (inverted threshold)
  if (level >= STONE_MIN_GROUND_LEVEL && blockNoise < STONE_GROUND_THRESHOLD) {
    return "stone";
  }

  // Shore tiles: sand with noise-based variation
  // Also allow sand to creep inland based on noise and spread threshold
  if (isShore) {
    // Not all shore tiles get sand - use noise for variation
    if (blockNoise > SAND_SHORE_THRESHOLD) {
      return "sand";
    }
  } else if (blockNoise > SAND_INLAND_SPREAD) {
    // Inland sand patches (rare, only when noise is very high)
    // This creates occasional sand patches away from water
    return "sand";
  }

  return "grass";
};

export const createGroundSprite = (data: GroundSpriteData): Sprite[] => {
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

  // Get terrain height level using dynamic formula
  const { level, isWater } = getTerrainHeightLevel(perlinValue);

  // Get shore detection (3x3 perlin grid around current tile)
  const perlinAround = getPerlinAroundTile(perlin, row, col);
  const isShore = isAdjacentToWater(perlinAround);

  // Get secondary noise for block type variation (use world coordinates)
  const worldX = chunkCol * CHUNK.SIZE + col;
  const worldY = chunkRow * CHUNK.SIZE + row;
  const blockNoise = generateBlockTypeNoise(worldX, worldY);

  // Determine block type
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

  // Get adjacent tile heights and create cliff fillers if needed
  const adjacentLevels = getAdjacentHeightLevels(perlin, row, col);
  const fillers = createCliffFillers(x, y, level, adjacentLevels, isWater);

  return [sprite, ...fillers];
};
