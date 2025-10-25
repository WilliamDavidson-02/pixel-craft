// @ts-expect-error - This is the way you import the noise
import { Noise } from "noisejs";
import { type ContainerChild, Sprite, type Texture } from "pixi.js";

import { SEED } from "../lib/utils/perlinNoise";
import { type Chunk } from "../types/tiles";
import { ASSETS } from "./assets";
import type { Coordinates } from "./player";
import { isoPosToWorldPos, TILE_HEIGHT, TILE_HEIGHT_HALF, TILE_WIDTH_HALF } from "./tiles";
import { isTileWater } from "./water";

type VegetationSpriteData = {
  xPosTile: number;
  yPosTile: number;
  perlin: number[][];
  row: number;
  col: number;
};

const VEGETATION_NOISE = {
  "dasiy.png": 0.08,
  "oak-tree.png": 0.05,
  "tall-grass.png": 0.2,
  "short-grass.png": 0.3,
} as const;

const TREE_DENSITY = 0.03;
const PLANT_DENSITY = 0.1;

const collisions = ["oak-tree.png"];

export const hasVegetationCollisions = (vegetation: Sprite): boolean => {
  return collisions.includes(vegetation.texture.label ?? "");
};

const deterministicHash = (x: number, y: number, seed: number): number => {
  const PRIME_X = 374761393;
  const PRIME_Y = 668265263;
  const PRIME_SEED = 982451653;
  const MIXER = 1274126177;

  let h = x * PRIME_X + y * PRIME_Y + seed * PRIME_SEED;
  h = (h ^ (h >> 13)) * MIXER;
  h = h ^ (h >> 16);

  return (h >>> 0) / 0xffffffff; // normalize to [0, 1)
};

export const generateVegetationNoise = (x: number, y: number): number => {
  const noise = new Noise(SEED);

  // // Domain warping for realistic coastlines
  const scale = 80;
  let frequency = 0.0005;
  const warpX = noise.perlin2(x * frequency, y * frequency) * scale;
  const warpY = noise.perlin2((x + 1000) * frequency, y * frequency) * scale;

  // Multi-octave fractal noise
  let value = 0;
  let amplitude = 1;
  frequency = 0.05;

  for (let octave = 0; octave < 6; octave++) {
    const sampleX = (x + warpX) * frequency;
    const sampleY = (y + warpY) * frequency;
    value += noise.perlin2(sampleX, sampleY) * amplitude;
    amplitude *= 0.6;
    frequency *= 2.6;
  }

  return value;
};

const getTextureFromPerlin = (perlin: number, x: number, y: number): Texture | null => {
  let textureKey = "";
  const shouldRender = deterministicHash(x, y, SEED);

  for (const [key, value] of Object.entries(VEGETATION_NOISE)) {
    const isThree = key === "oak-tree.png" && perlin <= value;
    const isPlant = key !== "oak-tree.png" && perlin >= value;

    if ((isThree && shouldRender < TREE_DENSITY) || (isPlant && shouldRender < PLANT_DENSITY)) {
      textureKey = key;
    }
  }

  if (!textureKey || !ASSETS.VEGETATION) return null;

  return ASSETS.VEGETATION.textures[textureKey];
};

export const convertVegetationPosToGround = (x: number, y: number): Coordinates => {
  const newX = x - TILE_WIDTH_HALF;
  const newY = y - TILE_HEIGHT * 0.75;

  return { x: newX, y: newY };
};

export const createVegetationSprite = (data: VegetationSpriteData): Sprite | null => {
  const { xPosTile, yPosTile, perlin, row, col } = data;

  if (isTileWater(perlin[row][col])) return null;

  const x = xPosTile;
  const y = yPosTile + TILE_HEIGHT * 0.75;

  const worldPos = isoPosToWorldPos(xPosTile, yPosTile);

  const vegetationNoise = generateVegetationNoise(worldPos.x, worldPos.y);
  const textureData = getTextureFromPerlin(vegetationNoise, xPosTile, yPosTile);

  if (!textureData) return null;

  const labelPos = convertVegetationPosToGround(x, y);

  const sprite = new Sprite({
    texture: textureData,
    width: textureData.width,
    height: textureData.height,
    x: x,
    y: y,
    anchor: { x: 0.5, y: 1 }, // Trees root are always centered in assets there for we set the bottom center acnhor
    label: `${labelPos.x}_${labelPos.y}`,
    zIndex: labelPos.y + TILE_HEIGHT_HALF,
  });

  return sprite;
};

export const getVegetationFromGround = (
  chunk: Chunk,
  label: string,
): ContainerChild | null | undefined => {
  return chunk.surface?.getChildByLabel(label);
};
