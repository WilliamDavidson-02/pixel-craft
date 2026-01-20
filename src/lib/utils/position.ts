import type { Container } from "pixi.js";

import { CHUNK, TERRAIN_HEIGHT, TILE } from "@/lib/config";
import { setDebugItem } from "@/lib/debug";
import type { Coordinates } from "@/types/player";

export type TerrainHeightResult = {
  level: number;
  isWater: boolean;
};

/**
 * Maps a Perlin noise value to a discrete terrain height level.
 * Uses Math.floor() to prevent single-tile spikes by grouping values downward.
 *
 * Ground: perlin < -0.15 → levels 0-3 (more negative = higher level)
 * Base:   -0.15 ≤ perlin < 0.15 → level 0
 * Water:  perlin ≥ 0.15 → levels 0-3 (more positive = deeper)
 *
 * @param perlinValue - The Perlin noise value (typically -1 to 1)
 * @returns Object with level (0 to max) and isWater boolean
 */
export const getTerrainHeightLevel = (perlinValue: number): TerrainHeightResult => {
  const { GROUND_LEVELS, WATER_DEPTH_LEVELS, GROUND_RANGE, WATER_RANGE, WATER_THRESHOLD } =
    TERRAIN_HEIGHT;

  // Clamp perlin value to expected range for safety
  const clampedPerlin = Math.max(-1, Math.min(1, perlinValue));

  // Water depth (perlin >= 0.15)
  if (clampedPerlin >= WATER_THRESHOLD) {
    // Normalize [0.15, 1] to [0, 1], then scale to levels
    const normalized = (clampedPerlin - WATER_RANGE.min) / (WATER_RANGE.max - WATER_RANGE.min);
    // Floor to get discrete level, clamp to max level - 1
    const level = Math.min(Math.floor(normalized * WATER_DEPTH_LEVELS), WATER_DEPTH_LEVELS - 1);
    return { level, isWater: true };
  }

  // Elevated ground (perlin < -0.15)
  if (clampedPerlin < GROUND_RANGE.max) {
    // Normalize [-1, -0.15] to [0, 1] (inverted: more negative = higher value)
    // -1 should give highest level, -0.15 should give level 0
    const normalized = (GROUND_RANGE.max - clampedPerlin) / (GROUND_RANGE.max - GROUND_RANGE.min);
    // Floor to get discrete level, clamp to max level - 1
    const level = Math.min(Math.floor(normalized * GROUND_LEVELS), GROUND_LEVELS - 1);
    return { level, isWater: false };
  }

  // Base level (-0.15 to 0.15)
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
