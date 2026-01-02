import type { Container } from "pixi.js";

import type { Coordinates } from "@/core/entities/player";
import { TILES } from "@/lib/config/tiles";
import { setDebugItem } from "@/lib/debug";

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
  const xPos = Math.floor((x / TILES.TILE_WIDTH_HALF + y / TILES.TILE_HEIGHT_HALF) / 2);
  const yPos = Math.floor((y / TILES.TILE_HEIGHT_HALF - x / TILES.TILE_WIDTH_HALF) / 2);

  return { x: xPos, y: yPos };
};

export const getChunkByGlobalPosition = (x: number, y: number): { row: number; col: number } => {
  const pos = isoPosToWorldPos(x + window.innerWidth / 2, y + window.innerHeight / 2);

  const col = Math.floor(pos.x / TILES.CHUNK_SIZE);
  const row = Math.floor(pos.y / TILES.CHUNK_SIZE);

  setDebugItem("chunk", { row, col });

  return { row, col };
};
