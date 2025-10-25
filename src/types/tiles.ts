import type { Container } from "pixi.js";

export type TileCallback<T> = (row: number, col: number) => T;

type ChunkKeys = "ground" | "surface";
export type Chunk = Partial<Record<ChunkKeys, Container>>;
export type Chunks = Map<string, Chunk>;

export type ColidedSides = {
  "top-left": boolean;
  "bottom-left": boolean;
  "bottom-right": boolean;
  "top-right": boolean;
  top: boolean;
  bottom: boolean;
};
