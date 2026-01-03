import { Container } from "pixi.js";

import { state } from "@/core/state";
import { createTiles } from "@/core/tiles";
import { CHUNK } from "@/lib/config";
import { getChunkByGlobalPosition } from "@/lib/utils/position";
import { RENDER_DISTANCE } from "@/lib/utils/renderDistance";
import type { Chunk, ChunkKey, Chunks } from "@/types/chunks";

const MAX_STORED_CHUNKS = 250;
let isRendering = false;

export const getChunkKey = (row: number, col: number): ChunkKey => {
  const chunkX = Math.floor(col / CHUNK.SIZE);
  const chunkY = Math.floor(row / CHUNK.SIZE);

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

export const getVisibleChunkKeys = (
  row: number,
  col: number,
  area = RENDER_DISTANCE,
): ChunkKey[] => {
  const keys: ChunkKey[] = [];

  for (let chunkY = row - area; chunkY <= row + area; chunkY++) {
    for (let chunkX = col - area; chunkX <= col + area; chunkX++) {
      keys.push(`${chunkX}_${chunkY}`);
    }
  }

  return keys;
};

export const getVisibleChunks = (keys: ChunkKey[]): Chunks => {
  const selectedChunks: Chunks = new Map();

  for (const key of keys) {
    const chunk = state.chunks.get(key);

    if (chunk) {
      selectedChunks.set(key, chunk);
    }
  }

  return selectedChunks;
};

const getChunksToRemove = (layer: Container, visibleChunks: Chunks) => {
  return layer.children.filter((chunk) => !visibleChunks.has(chunk.label));
};

const createEmptyChunk = (key: ChunkKey): Chunk => {
  const { row, col } = getCellFromKey(key);
  const zIndex = row + col;

  return {
    ground: new Container({ label: key, zIndex, cullable: true }),
    object: new Container({ label: key, zIndex, cullable: true }),
  };
};

export const renderChunks = (world: Container, groundLayer: Container) => {
  isRendering = true;

  // Inverting the world pos since we move the world the other way to simulate movement
  const { row, col } = getChunkByGlobalPosition(-world.x, -world.y);

  const keys = getVisibleChunkKeys(row, col);
  const visibleChunks = getVisibleChunks(keys);

  // To prevent the memory of chunks getting to large we clear the tiles that are not in view
  if (state.chunks.size >= MAX_STORED_CHUNKS) {
    state.chunks = visibleChunks;
  }

  // This should not run on inital render since there is no old chunks to remove
  if (groundLayer.children.length > 0) {
    const groundChunksToRemove = getChunksToRemove(groundLayer, visibleChunks);
    groundLayer.removeChild(...groundChunksToRemove);
  }

  const currentGroundChunks = new Set(groundLayer.children.map((chunk) => chunk.label));

  for (const key of keys) {
    if (!currentGroundChunks.has(key) && !visibleChunks.has(key)) {
      const chunk = createEmptyChunk(key);
      const tiles = createTiles(key);

      if (chunk?.ground) {
        chunk.ground.addChild(...tiles);
        groundLayer.addChild(chunk.ground);
      }

      state.chunks.set(key, chunk);
    } else if (!currentGroundChunks.has(key) && visibleChunks.has(key)) {
      const chunk = visibleChunks.get(key);

      if (chunk?.ground) {
        groundLayer.addChild(chunk.ground);
      }
    }
  }

  isRendering = false;
};

export const shouldRenderNewChunks = (x: number, y: number) => {
  if (isRendering) return false;

  const { position } = state.player;

  const xDiff = Math.abs(position.x - x);
  const yDiff = Math.abs(position.y - y);

  if (xDiff > CHUNK.WIDTH * 2) {
    state.player.position.x = x;
    return true;
  }

  if (yDiff > CHUNK.HEIGHT * 2) {
    state.player.position.y = y;
    return true;
  }

  return false;
};
