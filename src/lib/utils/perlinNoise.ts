// @ts-expect-error - This is the way to import noise
import { Noise } from "noisejs";

import { state } from "@/core/state";
import { CHUNK } from "@/lib/config";
import { isoPosToWorldPos } from "@/lib/utils/position";
import type { NoiseConfig } from "@/types/perlin";

export const setPerlinSeed = (newSeed: number) => {
  state.seed = newSeed;
};

const generateNoise = (x: number, y: number, config: NoiseConfig): number => {
  const noise = new Noise(state.seed + (config.seedOffset ?? 0));

  let sampleX = x;
  let sampleY = y;

  // Domain warping for realistic terrain shapes
  if (config.domainWarp?.enabled) {
    const { frequency, scale, offset } = config.domainWarp;
    const offsetX = offset?.x ?? 0;
    const offsetY = offset?.y ?? 0;

    const warpX = noise.perlin2(x * frequency, y * frequency) * scale;
    const warpY = noise.perlin2((x + offsetX) * frequency, (y + offsetY) * frequency) * scale;

    sampleX += warpX;
    sampleY += warpY;
  }

  // Multi octave fractal noise
  let value = 0;
  let amplitude = config.amplitude ?? 1;
  let frequency = config.baseFrequency;
  const persistence = config.persistence ?? 0.5;
  const lacunarity = config.lacunarity ?? 2;

  for (let octave = 0; octave < config.octaves; octave++) {
    const currentAmp = config.customWeights ? config.customWeights[octave] : amplitude;

    value += noise.perlin2(sampleX * frequency, sampleY * frequency) * currentAmp;

    if (!config.customWeights) {
      amplitude *= persistence;
    }
    frequency *= lacunarity;
  }

  if (config.normalize) {
    return (value + 1) / 2;
  }

  return value;
};

export const generatePerlinNoise = (x: number, y: number): number => {
  return generateNoise(x, y, {
    baseFrequency: 0.025,
    octaves: 6,
    amplitude: 1,
    persistence: 0.5,
    lacunarity: 2,
    domainWarp: {
      enabled: true,
      scale: 80,
      frequency: 0.005,
      offset: { x: 1000, y: 0 },
    },
  });
};

/**
 * Generates secondary noise for block type variation.
 * Uses a different seed and higher frequency for smaller patch sizes.
 * Returns a value normalized to 0-1 range.
 */
export const generateBlockTypeNoise = (x: number, y: number): number => {
  return generateNoise(x, y, {
    seedOffset: 1000,
    baseFrequency: 0.08,
    octaves: 2,
    customWeights: [0.7, 0.3],
    normalize: true,
  });
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
