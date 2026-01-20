import { Sprite } from "pixi.js";

import { state } from "@/core/state";
import { TILE } from "@/lib/config";
import { getTerrainHeightLevel } from "@/lib/utils/position";

type GroundSpriteData = {
  xPosTile: number;
  yPosTile: number;
  perlin: number[][];
  row: number;
  col: number;
};

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

export const createGroundSprite = (data: GroundSpriteData): Sprite[] => {
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

  // Get terrain height level using dynamic formula
  const { level, isWater } = getTerrainHeightLevel(perlinValue);

  if (state.assets.blocks) {
    if (isWater) {
      // Water/underwater terrain: use dirt texture and lower the tile
      sprite.texture = state.assets.blocks.animations["dirt"][0];
      // +1 accounts for base water offset, level adds additional depth
      sprite.y += (level + 1) * TILE.HEIGHT_HALF;
    } else {
      // Ground terrain: use grass texture and raise the tile
      sprite.texture = state.assets.blocks.animations["grass"][0];
      sprite.y -= level * TILE.HEIGHT_HALF;
    }
  }

  // Get adjacent tile heights and create cliff fillers if needed
  const adjacentLevels = getAdjacentHeightLevels(perlin, row, col);
  const fillers = createCliffFillers(x, y, level, adjacentLevels, isWater);

  return [sprite, ...fillers];
};
