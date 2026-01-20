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
export const TERRAIN_HEIGHT = {
  // Number of discrete height levels for ground elevation (above base)
  GROUND_LEVELS: 4,
  // Number of discrete depth levels for water/underwater terrain
  WATER_DEPTH_LEVELS: 4,
  // Perlin value range for elevated ground (more negative = higher)
  GROUND_RANGE: { min: -1, max: -0.15 },
  // Perlin value range for water depth (more positive = deeper)
  WATER_RANGE: { min: 0.15, max: 1 },
  // The water/ground boundary threshold
  WATER_THRESHOLD: 0.15,
} as const;
