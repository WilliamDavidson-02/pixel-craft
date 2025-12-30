import { TILES } from "@/lib/config/tiles";

export type ChunkKey = `${number}_${number}`;

export const getChunkKey = (row: number, col: number): ChunkKey => {
  const chunkX = Math.floor(col / TILES.CHUNK_SIZE);
  const chunkY = Math.floor(row / TILES.CHUNK_SIZE);

  return `${chunkX}_${chunkY}`;
};

export const getCellFromKey = (key: string): { col: number; row: number } => {
  const [col, row] = key.split("_");
  return { col: parseInt(col), row: parseInt(row) };
};
