import type { Container } from "pixi.js";

import { CHUNK, TERRAIN_HEIGHT, TILE } from "@/lib/config";
import { setDebugItem } from "@/lib/debug";
import type { Coordinates } from "@/types/player";

export type TerrainHeightResult = {
  level: number;
  isWater: boolean;
};

export const getTerrainHeightLevel = (perlinValue: number): TerrainHeightResult => {
  if (perlinValue >= TERRAIN_HEIGHT.WATER_THRESHOLD) {
    // Normalize [0.15, 1] to [0, 1], then scale to levels
    const adjustedValue = perlinValue - TERRAIN_HEIGHT.WATER_RANGE.MIN;
    const range = TERRAIN_HEIGHT.WATER_RANGE.MAX - TERRAIN_HEIGHT.WATER_RANGE.MIN;
    const normalized = adjustedValue / range;

    const level = Math.min(
      Math.floor(normalized * TERRAIN_HEIGHT.WATER_DEPTH_LEVELS),
      TERRAIN_HEIGHT.WATER_DEPTH_LEVELS - 1,
    );

    return { level, isWater: true };
  }

  if (perlinValue < TERRAIN_HEIGHT.GROUND_RANGE.MAX) {
    // Normalize [-1, -0.15] to [0, 1] (inverted: more negative = higher value)
    // -1 should give highest level, -0.15 should give level 0
    const adjustedValue = TERRAIN_HEIGHT.GROUND_RANGE.MAX - perlinValue;
    const range = TERRAIN_HEIGHT.GROUND_RANGE.MAX - TERRAIN_HEIGHT.GROUND_RANGE.MIN;
    const normalized = adjustedValue / range;

    // Floor to get discrete level, clamp to max level - 1
    const level = Math.min(
      Math.floor(normalized * TERRAIN_HEIGHT.GROUND_LEVELS),
      TERRAIN_HEIGHT.GROUND_LEVELS - 1,
    );
    return { level, isWater: false };
  }

  // Base level
  return { level: 0, isWater: false };
};

export const getIsometricTilePositions = (
  row: number,
  col: number,
  width: number,
  height: number,
): { xPosTile: number; yPosTile: number } => {
  const xPosTile = (col - row) * width;
  const yPosTile = (col + row) * height;

  return { xPosTile, yPosTile };
};

export const getGlobalPositionFromNoneStagedTile = (
  parent: Container,
  x: number,
  y: number,
): Coordinates => {
  const globalParent = parent.getGlobalPosition();

  return {
    x: x + globalParent.x,
    y: y + globalParent.y,
  };
};

export const isoPosToWorldPos = (x: number, y: number): Coordinates => {
  const xPos = Math.floor((x / TILE.WIDTH_HALF + y / TILE.HEIGHT_HALF) / 2);
  const yPos = Math.floor((y / TILE.HEIGHT_HALF - x / TILE.WIDTH_HALF) / 2);

  return { x: xPos, y: yPos };
};

// The globla position anchor point is set to top left but the visual position is centered,
// and therefore we need to offset by half the window size
export const getChunkByGlobalPosition = (x: number, y: number): { row: number; col: number } => {
  const pos = isoPosToWorldPos(x + window.innerWidth / 2, y + window.innerHeight / 2);

  const col = Math.floor(pos.x / CHUNK.SIZE);
  const row = Math.floor(pos.y / CHUNK.SIZE);

  setDebugItem("chunk", { row, col });

  return { row, col };
};
