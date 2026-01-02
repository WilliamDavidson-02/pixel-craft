import type { Container } from "pixi.js";

import { state } from "@/core/state";
import { createTiles } from "@/core/tiles";
import { TILES } from "@/lib/config/tiles";
import { getChunkByGlobalPosition } from "@/lib/utils/position";
import { RENDER_DISTANCE } from "@/lib/utils/renderDistance";
import type { Chunk, ChunkKey, Chunks } from "@/types/chunks";

export let chunkCreationList: string[] = [];
let currentChunk = "";

const MAX_STORED_CHUNKS = RENDER_DISTANCE * RENDER_DISTANCE * 16;

export const getChunkKey = (row: number, col: number): ChunkKey => {
  const chunkX = Math.floor(col / TILES.CHUNK_SIZE);
  const chunkY = Math.floor(row / TILES.CHUNK_SIZE);

  return `${chunkX}_${chunkY}`;
};

export const getCellFromKey = (key: string) => {
  const [col, row] = key.split("_");
  return { col: parseInt(col), row: parseInt(row) };
};

export const isChunkKey = (key?: string): key is ChunkKey => {
  if (!key) return false;

  const { row, col } = getCellFromKey(key);
  return Number.isFinite(row) && Number.isFinite(col);
};

export const getChunk = (row: number, col: number): Chunk | undefined => {
  return state.chunks.get(`${col}_${row}`);
};

export const getChunkByKey = (key?: ChunkKey): Chunk | undefined => {
  if (!key) return;

  return state.chunks.get(key);
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
    const chunk = state.chunks.get(key);

    if (chunk) {
      selectedChunks.set(key, chunk);
    }
  }

  return selectedChunks;
};

export const renderChunks = (world: Container, groundLayer: Container, objectLayer: Container) => {
  // Inverting the world pos since we move the world the other way to simulate movement
  const { row, col } = getChunkByGlobalPosition(-world.x, -world.y);
  const keys = getVisibleChunkKeys(row, col);

  const newChunkKeys = keys.filter((key) => !state.chunks.has(key));
  createTiles(newChunkKeys);

  for (const [, chunk] of state.chunks) {
    if (chunk.ground) {
      groundLayer.addChild(chunk.ground);
    }
    if (chunk.object) {
      objectLayer.addChild(chunk.object);
    }
  }
};

export const setNewChunksToRender = (world: Container): void => {
  // Inverting the world pos since we move the world the other way to simulate movement
  const { row, col } = getChunkByGlobalPosition(-world.x, -world.y);
  const keys = getVisibleChunkKeys(row, col);
  chunkCreationList = keys.filter(
    (key) => !state.chunks.has(key) && !chunkCreationList.includes(key),
  );
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
  groundLayer: Container,
  objectLayer: Container,
): void => {
  // Inverting the world pos since we move the world the other way to simulate movement
  const { row, col } = getChunkByGlobalPosition(-world.x, -world.y);
  const keys = getVisibleChunkKeys(row, col);

  const visibleChunks = getVisibleChunks(keys);

  // To prevent the memory of chunks getting to large we clear the tiles that are not in view
  if (state.chunks.size >= MAX_STORED_CHUNKS) {
    state.chunks = visibleChunks;
  }

  const groundChunksToRemove = groundLayer.children.filter(
    (chunk) => !visibleChunks.has(chunk.label),
  );
  groundLayer.removeChild(...groundChunksToRemove);

  const surfaceChunksToRemove = groundLayer.children.filter(
    (chunk) => !visibleChunks.has(chunk.label),
  );
  objectLayer.removeChild(...surfaceChunksToRemove);

  const currentGroundChunks = new Set(groundLayer.children.map((chunk) => chunk.label));
  for (const key of keys) {
    if (!currentGroundChunks.has(key)) {
      const chunk = visibleChunks.get(key);
      if (chunk?.ground) {
        groundLayer.addChild(chunk.ground);
      }

      if (chunk?.object) {
        objectLayer.addChild(chunk.object);
      }
    }
  }
};
