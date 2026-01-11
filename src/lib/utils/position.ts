import type { Container } from "pixi.js";

import { CHUNK, TILE } from "@/lib/config";
import { setDebugItem } from "@/lib/debug";
import type { Coordinates } from "@/types/player";

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
