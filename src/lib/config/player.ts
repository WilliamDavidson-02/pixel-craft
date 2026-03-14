const WIDTH = 32;
const HEIGHT = 64;

const DEFAULT_SPEED = 4;
const SPEED = DEFAULT_SPEED;
const FEET_MARGIN = 2;
const MAX_STEP_LEVEL_DIFF = 1;

export const PLAYER = {
  WIDTH,
  HEIGHT,
  DEFAULT_SPEED,
  SPEED,
  FEET_MARGIN,
  MAX_STEP_LEVEL_DIFF,
} as const;
