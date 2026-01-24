import { BLOCK_TYPE } from "@/lib/config";
import type { BlockType } from "@/types/ground";

export const getBlockType = (
  level: number,
  isWater: boolean,
  isShore: boolean,
  blockNoise: number,
): BlockType => {
  if (isWater) {
    // Stone uses inverted threshold (lower noise = stone) to separate from sand
    if (blockNoise < BLOCK_TYPE.STONE_UNDERWATER_THRESHOLD) {
      return "stone";
    }

    if (blockNoise > BLOCK_TYPE.SAND_UNDERWATER_THRESHOLD) {
      return "sand";
    }

    return "dirt";
  }

  // High elevation: can have stone (inverted threshold)
  if (
    level >= BLOCK_TYPE.STONE_MIN_GROUND_LEVEL &&
    blockNoise < BLOCK_TYPE.STONE_GROUND_THRESHOLD
  ) {
    return "stone";
  }

  // Shore tiles: sand with noise based variation
  // Also allow sand to creep inland based on noise and spread threshold
  if (
    isShore &&
    blockNoise > BLOCK_TYPE.SAND_SHORE_THRESHOLD &&
    level <= BLOCK_TYPE.SAND_MAX_GROUND_LEVEL
  ) {
    return "sand";
  }

  return "grass";
};
