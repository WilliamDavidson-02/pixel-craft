import { Container, type ContainerChild, type ContainerOptions } from "pixi.js";

import { state } from "@/core/state";
import { createTiles } from "@/core/tiles";
import { CHUNK } from "@/lib/config";
import { getChunkByGlobalPosition } from "@/lib/utils/position";
import { RENDER_DISTANCE } from "@/lib/utils/renderDistance";
import type { Chunk, ChunkKey, Chunks } from "@/types/chunks";

const MAX_STORED_CHUNKS = 250;

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
  return state.chunkState.chunks.get(`${col}_${row}`);
};

export const getChunkByKey = (key?: ChunkKey): Chunk | undefined => {
  return key ? state.chunkState.chunks.get(key) : undefined;
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
    const chunk = state.chunkState.chunks.get(key);

    if (chunk) {
      selectedChunks.set(key, chunk);
    }
  }

  return selectedChunks;
};

const getChunksToRemove = (layer: Container, visibleChunks: Chunks) => {
  return layer.children.filter((chunk) => !visibleChunks.has(chunk.label));
};

const getChunkKeysToAdd = (visibleChunkKeys: ChunkKey[], layer: Container): ChunkKey[] => {
  return visibleChunkKeys.filter((key) => !layer.children.some((chunk) => chunk.label === key));
};

const createEmptyChunk = (key: ChunkKey): Chunk => {
  const { row, col } = getCellFromKey(key);
  const zIndex = row + col;

  const containerOptions: ContainerOptions<ContainerChild> = {
    label: key,
    zIndex,
    cullable: true,
  };

  return {
    ground: new Container(containerOptions),
    object: new Container(containerOptions),
  };
};

// This rendering method should only be used on initial render
export const renderChunksSync = (world: Container, groundLayer: Container) => {
  // Inverting the world pos since we move the world the other way to simulate movement
  const { row, col } = getChunkByGlobalPosition(-world.x, -world.y);
  const keys = getVisibleChunkKeys(row, col);

  if (groundLayer.children.length > 0) {
    groundLayer.removeChildren();
  }

  for (const key of keys) {
    const chunk = createEmptyChunk(key);
    const tiles = createTiles(key);

    if (chunk.ground && tiles.length > 0) {
      chunk.ground.addChild(...tiles);
    }

    if (chunk.ground) {
      groundLayer.addChild(chunk.ground);
    }

    state.chunkState.chunks.set(key, chunk);
  }
};

// This rendering method should only be used for chunk visibility updates
// We only want to handle one chunk at a time one from render list and one from the remove list (if any)
export const renderChunk = (groundLayer: Container) => {
  const { renderList, chunks } = state.chunkState;

  const renderKey = renderList.values().next().value;
  if (!renderKey) return;

  let chunk = chunks.get(renderKey);

  if (!chunk) {
    chunk = createEmptyChunk(renderKey);
    const tiles = createTiles(renderKey);

    if (chunk.ground && tiles.length > 0) {
      chunk.ground.addChild(...tiles);
    }
  }

  if (chunk.ground) {
    groundLayer.addChild(chunk.ground);
  }

  state.chunkState.renderList.delete(renderKey);
  state.chunkState.chunks.set(renderKey, chunk);
};

export const hasRenderQueue = () => {
  return state.chunkState.renderList.size > 0;
};

export const setChunksRenderQueue = (world: Container, groundLayer: Container) => {
  // Inverting the world pos since we move the world the other way to simulate movement
  const { row, col } = getChunkByGlobalPosition(-world.x, -world.y);
  const keys = getVisibleChunkKeys(row, col);

  // New chunks to render include chunks that are not in the rendered layer but are stored in state or need to be created
  const chunksToRender = getChunkKeysToAdd(keys, groundLayer);
  state.chunkState.renderList = new Set([...state.chunkState.renderList, ...chunksToRender]);

  // Since removeing chunks is a much less resource intensive operation, we can handle all at once here
  const visibleChunks = getVisibleChunks(keys);
  const groundChunksToRemove = getChunksToRemove(groundLayer, visibleChunks);

  if (groundChunksToRemove.length > 0) {
    groundLayer.removeChild(...groundChunksToRemove);
  }
};

export const shouldRenderNewChunks = (x: number, y: number) => {
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

export const isChunksMemoryFull = () => {
  return state.chunkState.chunks.size >= MAX_STORED_CHUNKS;
};

export const handleMaxStoredChunks = (world: Container) => {
  // Inverting the world pos since we move the world the other way to simulate movement
  const { row, col } = getChunkByGlobalPosition(-world.x, -world.y);
  const keys = getVisibleChunkKeys(row, col);
  const visibleChunks = getVisibleChunks(keys);

  state.chunkState.chunks = visibleChunks;
};
