import { Container } from "pixi.js";

import { getCellFromKey } from "@/core/chunks";
import { state } from "@/core/state";
import { createGroundSprite } from "@/core/terrain/ground";
import { TILES } from "@/lib/config/tiles";
import { getPerlinNoise } from "@/lib/utils/perlinNoise";
import { getIsometricTilePositions } from "@/lib/utils/position";

import { type TileCallback } from "../types/tiles";

export const loopTiles = <T>(width: number, height: number, callback: TileCallback<T>): T[] => {
  const results: T[] = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      results.push(callback(row, col));
    }
  }

  return results;
};

export const createTiles = (keys: string[]): void => {
  for (const key of keys) {
    const cellValue = getCellFromKey(key);
    const perlin = getPerlinNoise(cellValue.col, cellValue.row);

    loopTiles(TILES.CHUNK_SIZE, TILES.CHUNK_SIZE, (row, col) => {
      const currentRow = cellValue.row * TILES.CHUNK_SIZE + row;
      const currentCol = cellValue.col * TILES.CHUNK_SIZE + col;

      const { xPosTile, yPosTile } = getIsometricTilePositions(
        currentRow,
        currentCol,
        TILES.TILE_WIDTH_HALF,
        TILES.TILE_HEIGHT_HALF,
      );

      const groundSprite = createGroundSprite({ xPosTile, yPosTile, perlin, row, col });

      if (!state.chunks.has(key)) {
        state.chunks.set(key, {
          ground: new Container({ label: key, zIndex: currentRow + currentCol, cullable: true }),
          object: new Container({ label: key, zIndex: currentRow + currentCol, cullable: true }),
        });
      }

      if (groundSprite) {
        state.chunks.get(key)?.ground?.addChild(groundSprite);
      }
    });
  }
};
