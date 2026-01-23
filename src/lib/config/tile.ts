const WIDTH = 128;
const HEIGHT = 64;

export const TILE = {
  WIDTH,
  WIDTH_HALF: WIDTH / 2,
  HEIGHT,
  HEIGHT_HALF: HEIGHT / 2,
} as const;

// Terrain height configuration
// Perlin values: ground elevation (-1 to -0.15), base level (-0.15 to 0.15), water depth (0.15 to 1)
// Note: Not using `as const` so values can be modified by debug GUI
export const TERRAIN_HEIGHT = {
  GROUND_LEVELS: 4,
  GROUND_RANGE: { MIN: -1, MAX: -0.15 },

  WATER_DEPTH_LEVELS: 4,
  WATER_THRESHOLD: 0.15,
  WATER_RANGE: { MIN: 0.15, MAX: 1 },
};

// Block type distribution thresholds (controlled by secondary noise)
// Sand uses positive threshold (blockNoise > threshold)
// Stone uses negative threshold (blockNoise < threshold) to avoid overlap
export const BLOCK_TYPE = {
  SAND_SHORE_THRESHOLD: 0.6,
  SAND_INLAND_SPREAD: 0.7,
  SAND_UNDERWATER_THRESHOLD: 0.7,

  STONE_GROUND_THRESHOLD: 0.2,
  STONE_UNDERWATER_THRESHOLD: 0.35,
  STONE_MIN_GROUND_LEVEL: 2,
};
