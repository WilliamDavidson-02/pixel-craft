import type { Container } from "pixi.js";

export type Layer = "static" | "stack";

export type Chunk = Container;

export type Chunks = Map<string, Chunk>;

export type ChunkKey = `${number}_${number}`;

export type ChunkState = {
  chunks: Chunks;
  renderList: Set<ChunkKey>;
};
