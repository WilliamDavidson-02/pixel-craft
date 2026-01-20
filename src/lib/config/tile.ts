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
};

// Block type distribution thresholds (controlled by secondary noise)
// Sand uses positive threshold (blockNoise > threshold)
// Stone uses negative threshold (blockNoise < threshold) to avoid overlap
export const BLOCK_TYPE = {
  // Sand appears on shores when secondary noise > this value (higher = less sand)
  SAND_SHORE_THRESHOLD: 0.5,
  // Controls how far sand can spread inland from shore (higher = more spread)
  SAND_INLAND_SPREAD: 0.7,
  // Sand appears underwater when secondary noise > this value
  SAND_UNDERWATER_THRESHOLD: 0.6,
  // Stone appears on high ground when secondary noise < this value (lower = less stone)
  STONE_GROUND_THRESHOLD: 0.2,
  // Stone appears underwater when secondary noise < this value (lower = less stone)
  STONE_UNDERWATER_THRESHOLD: 0.35,
  // Stone only appears on ground at this elevation level or higher
  STONE_MIN_GROUND_LEVEL: 2,
};
