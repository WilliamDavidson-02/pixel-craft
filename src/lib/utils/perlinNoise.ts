// @ts-expect-error - This is the way to import noise
import { Noise } from "noisejs";

import { isoPosToWorldPos } from "@/core/tiles";
import { TILES } from "@/lib/config/tiles";

export const SEED = 47208;

export const generatePerlinNoise = (x: number, y: number): number => {
  const noise = new Noise(SEED);
  // Domain warping for realistic coastlines
  const scale = 80;
  let frequency = 0.005;
  const warpX = noise.perlin2(x * frequency, y * frequency) * scale;
  const warpY = noise.perlin2((x + 1000) * frequency, y * frequency) * scale;

  // Multi-octave fractal noise
  let value = 0;
  let amplitude = 1;
  frequency = 0.025;

  for (let octave = 0; octave < 6; octave++) {
    const sampleX = (x + warpX) * frequency;
    const sampleY = (y + warpY) * frequency;
    value += noise.perlin2(sampleX, sampleY) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value;
};

export const getPerlinNoise = (col: number, row: number): number[][] => {
  const chunkX = col * TILES.CHUNK_SIZE;
  const chunkY = row * TILES.CHUNK_SIZE;
  const values: number[][] = [];

  for (let y = 0; y < TILES.CHUNK_SIZE; y++) {
    const row = [];
    for (let x = 0; x < TILES.CHUNK_SIZE; x++) {
      const worldX = chunkX + x;
      const worldY = chunkY + y;

      const value = generatePerlinNoise(worldX, worldY);
      row.push(value);
    }
    values.push(row);
  }

  return values;
};

export const getPerlinAroundCell = (xPos: number, yPos: number): number[][] => {
  const area = 1;
  const values: number[][] = [];

  const worldPos = isoPosToWorldPos(xPos, yPos);

  for (let y = worldPos.y - area; y <= worldPos.y + area; y++) {
    const row: number[] = [];
    for (let x = worldPos.x - area; x <= worldPos.x + area; x++) {
      const col = generatePerlinNoise(x, y);
      row.push(col);
    }

    values.push(row);
  }

  return values;
};
