// @ts-expect-error - This is the way to import noise
import { Noise } from "noisejs";

import { state } from "@/core/state";
import { CHUNK } from "@/lib/config";
import { isoPosToWorldPos } from "@/lib/utils/position";

export const setPerlinSeed = (newSeed: number) => {
  state.seed = newSeed;
};

export const generatePerlinNoise = (x: number, y: number): number => {
  const noise = new Noise(state.seed);
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
  const chunkX = col * CHUNK.SIZE;
  const chunkY = row * CHUNK.SIZE;
  const values: number[][] = [];

  for (let y = 0; y < CHUNK.SIZE; y++) {
    const row = [];
    for (let x = 0; x < CHUNK.SIZE; x++) {
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

/**
 * Generates secondary noise for block type variation.
 * Uses a different seed and higher frequency for smaller patch sizes.
 * Returns a value normalized to 0-1 range.
 */
export const generateBlockTypeNoise = (x: number, y: number): number => {
  const noise = new Noise(state.seed + 1000); // Different seed for independent variation

  // Higher frequency for smaller patches
  const frequency = 0.08;

  // Simple 2-octave noise for block type variation
  let value = 0;
  value += noise.perlin2(x * frequency, y * frequency) * 0.7;
  value += noise.perlin2(x * frequency * 2, y * frequency * 2) * 0.3;

  // Normalize from [-1, 1] to [0, 1]
  return (value + 1) / 2;
};
