import { Container, type ContainerChild, type Sprite } from "pixi.js";

import type { Coordinates } from "@/core/entities/player";
import { createGroundSprite } from "@/core/terrain/ground";
import { createVegetationSprite } from "@/core/terrain/vegetation";
import { getCellFromKey } from "@/lib/utils/chunks";
import { getPerlinNoise } from "@/lib/utils/perlinNoise";

import { type Chunk, type Chunks, type ColidedSides, type TileCallback } from "../types/tiles";

export const TILE_WIDTH = 128;
export const TILE_WIDTH_HALF = TILE_WIDTH / 2;
export const TILE_HEIGHT = 64;
export const TILE_HEIGHT_HALF = TILE_HEIGHT / 2;

export const CHUNK_SIZE = 16;
export const CHUNK_WIDTH = CHUNK_SIZE * TILE_WIDTH;
export const CHUNK_HEIGHT = CHUNK_SIZE * TILE_HEIGHT;
export let RENDER_DISTANCE = 4;
const MAX_STORED_CHUNKS = RENDER_DISTANCE * RENDER_DISTANCE * 16;

let chunks: Chunks = new Map();
export let chunkCreationList: string[] = [];
let currentChunk = "";

export const setRenderDistance = (): void => {
  const width = window.innerWidth;
  const chunkPadding = 2; // We want some extra chunks around the chunks that can fit in the screen so there is no void in the corners
  RENDER_DISTANCE = Math.ceil(width / (CHUNK_SIZE * TILE_WIDTH_HALF)) + chunkPadding;
};

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

    loopTiles(CHUNK_SIZE, CHUNK_SIZE, (row, col) => {
      const currentRow = cellValue.row * CHUNK_SIZE + row;
      const currentCol = cellValue.col * CHUNK_SIZE + col;

      const { xPosTile, yPosTile } = getIsometricTilePositions(
        currentRow,
        currentCol,
        TILE_WIDTH_HALF,
        TILE_HEIGHT_HALF,
      );

      const groundSprite = createGroundSprite({ xPosTile, yPosTile, perlin, row, col });

      if (!chunks.has(key)) {
        chunks.set(key, {
          ground: new Container({ label: key, zIndex: currentRow + currentCol, cullable: true }),
          surface: new Container({ label: key, zIndex: currentRow + currentCol, cullable: true }),
        });
      }

      if (groundSprite) {
        chunks.get(key)?.ground?.addChild(groundSprite);

        const vegetationSprite = createVegetationSprite({ xPosTile, yPosTile, perlin, row, col });
        if (vegetationSprite) {
          chunks.get(key)?.surface?.addChild(vegetationSprite);
        }
      }
    });
  }
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
  const xPos = Math.floor((x / TILE_WIDTH_HALF + y / TILE_HEIGHT_HALF) / 2);
  const yPos = Math.floor((y / TILE_HEIGHT_HALF - x / TILE_WIDTH_HALF) / 2);

  return { x: xPos, y: yPos };
};

export const getChunkByGlobalPosition = (x: number, y: number): { row: number; col: number } => {
  const pos = isoPosToWorldPos(x, y);

  const col = Math.floor(pos.x / CHUNK_SIZE);
  const row = Math.floor(pos.y / CHUNK_SIZE);

  return { row, col };
};

export const getChunkByKey = (key: string): Chunk | undefined => {
  return chunks.get(key);
};

export const getChunk = (row: number, col: number): Chunk | undefined => {
  return chunks.get(`${col}_${row}`);
};

export const getVisibleChunkKeys = (row: number, col: number, area = RENDER_DISTANCE): string[] => {
  const keys: string[] = [];

  for (let chunkY = row - area; chunkY <= row + area; chunkY++) {
    for (let chunkX = col - area; chunkX <= col + area; chunkX++) {
      keys.push(`${chunkX}_${chunkY}`);
    }
  }

  return keys;
};

export const getVisibleChunks = (keys: string[]): Chunks => {
  const selectedChunks: Chunks = new Map();

  for (const key of keys) {
    const chunk = chunks.get(key);

    if (chunk) {
      selectedChunks.set(key, chunk);
    }
  }

  return selectedChunks;
};

export const setInitalTiles = (world: Container, ground: Container, surface: Container): void => {
  // Inverting the world pos since we move the world the other way to simulate movement
  const { row, col } = getChunkByGlobalPosition(-world.x, -world.y);
  const keys = getVisibleChunkKeys(row, col);

  const newChunkKeys = keys.filter((key) => !chunks.has(key));
  createTiles(newChunkKeys);

  for (const [, chunk] of chunks) {
    if (chunk.ground) {
      ground.addChild(chunk.ground);
    }
    if (chunk.surface) {
      surface.addChild(chunk.surface);
    }
  }
};

export const setNewChunksToRender = (world: Container): void => {
  // Inverting the world pos since we move the world the other way to simulate movement
  const { row, col } = getChunkByGlobalPosition(-world.x, -world.y);
  const keys = getVisibleChunkKeys(row, col);
  chunkCreationList = keys.filter((key) => !chunks.has(key) && !chunkCreationList.includes(key));
};

export const createChunk = (key: string): void => {
  if (currentChunk) return;
  currentChunk = key;
  createTiles([key]);

  chunkCreationList = chunkCreationList.filter((chunk) => chunk !== key);
  setTimeout(() => (currentChunk = ""), 100); // Spacing chunk creation to not block player movment for an extended period of time
};

export const updateVisibleChunks = (
  world: Container,
  ground: Container,
  surface: Container,
): void => {
  // Inverting the world pos since we move the world the other way to simulate movement
  const { row, col } = getChunkByGlobalPosition(-world.x, -world.y);
  const keys = getVisibleChunkKeys(row, col);

  const visibleChunks = getVisibleChunks(keys);

  // To prevent the memory of chunks getting to large we clear the tiles that are not in view
  if (chunks.size >= MAX_STORED_CHUNKS) {
    chunks = visibleChunks;
  }

  const groundChunksToRemove = ground.children.filter((chunk) => !visibleChunks.has(chunk.label));
  ground.removeChild(...groundChunksToRemove);

  const surfaceChunksToRemove = ground.children.filter((chunk) => !visibleChunks.has(chunk.label));
  surface.removeChild(...surfaceChunksToRemove);

  const currentGroundChunks = new Set(ground.children.map((chunk) => chunk.label));
  for (const key of keys) {
    if (!currentGroundChunks.has(key)) {
      const chunk = visibleChunks.get(key);
      if (chunk?.ground) {
        ground.addChild(chunk.ground);
      }

      if (chunk?.surface) {
        surface.addChild(chunk.surface);
      }
    }
  }
};

export const getIsoCollisionSides = (tile: ContainerChild, player: Sprite): ColidedSides => {
  const cx = tile.x + TILE_WIDTH_HALF;
  const cy = tile.y + TILE_HEIGHT_HALF;

  // Before this function is called we alredy know that we have collided with the tile
  // This function is to determin on what side we colided
  return {
    "top-left": player.x + player.width < cx && player.y < cy,
    "bottom-left": player.x + player.width < cx && player.y > cy,
    "bottom-right": player.x > cx && player.y > cy,
    "top-right": player.x > cx && player.y < cy,
    top: player.x + player.width > cx && player.y < cy,
    bottom: player.x + player.width > cx && player.y > cy,
  };
};
