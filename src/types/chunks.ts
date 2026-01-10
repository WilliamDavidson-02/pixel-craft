import type { Container } from "pixi.js";

type ChunkKeys = "ground" | "object";

export type Chunk = Partial<Record<ChunkKeys, Container>>;

export type Chunks = Map<string, Chunk>;

export type ChunkKey = `${number}_${number}`;

export type ChunkState = {
  chunks: Chunks;
  renderList: Set<ChunkKey>;
};
