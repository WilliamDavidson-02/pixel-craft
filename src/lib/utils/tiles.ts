import type { ContainerChild } from "pixi.js";

import { TILE } from "@/lib/config/tile";

export const parseTileLabel = (label: string): { x: number; y: number } | null => {
  const [rawX, rawY] = label.split("_");
  const x = parseFloat(rawX);
  const y = parseFloat(rawY);

  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
};

export const getTileBasePosition = (tile: ContainerChild) => {
  return parseTileLabel(tile.label) ?? { x: tile.x, y: tile.y };
};

export const isPointInIsometricTile = (px: number, py: number, tile: ContainerChild) => {
  const { x, y } = getTileBasePosition(tile);
  const dx = Math.abs(px - (x + TILE.WIDTH_HALF)) / TILE.WIDTH_HALF;
  const dy = Math.abs(py - (y + TILE.HEIGHT_HALF)) / TILE.HEIGHT_HALF;

  return dx + dy <= 1;
};

export const getTileLevel = (tile: ContainerChild): number => {
  const base = parseTileLabel(tile.label);
  if (!base) return 0;

  // Elevated terrain is moved up by TILE.HEIGHT_HALF for each level
  return Math.round(Math.max(0, base.y - tile.y) / TILE.HEIGHT_HALF);
};

export const getMaxTileLevel = (tiles: ContainerChild[], initialLevel = 0): number => {
  let max = initialLevel;

  for (const tile of tiles) {
    const level = getTileLevel(tile);
    if (level > max) max = level;
  }

  return max;
};
