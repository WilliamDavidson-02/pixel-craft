import { type Container, type ContainerChild, Sprite } from "pixi.js";

import { getVisibleChunkKeys, getVisibleChunks } from "@/core/chunks";
import { state } from "@/core/state";
import { getVegetationFromGround, hasVegetationCollisions } from "@/core/terrain/vegetation";
import { LABELS, PLAYER, TILE } from "@/lib/config";
import { getIsoCollisionSides } from "@/lib/utils/collisions";
import {
  getChunkByGlobalPosition,
  getIsometricTilePositions,
  isoPosToWorldPos,
} from "@/lib/utils/position";
import { getMaxTileLevel, isPointInIsometricTile } from "@/lib/utils/tiles";
import { type Chunk } from "@/types/chunks";
import {
  type AllowedKeys,
  allowedKeys,
  type AnimationKey,
  type Coordinates,
  type Horizontal,
  type Vertical,
  type WaterKey,
} from "@/types/player";

const getVerticleDirection = (verticle: AllowedKeys): Vertical => {
  return verticle === "w" ? "up" : "down";
};

const getHorizontalDirection = (horizontal: AllowedKeys): Horizontal => {
  return horizontal === "a" ? "left" : "right";
};

const isWaterKey = (key: AnimationKey): key is WaterKey => {
  return key.startsWith("water-");
};

const getPlayerAnimationKey = (keys: Set<AllowedKeys>): AnimationKey => {
  const currentKey = state.player.animation.key;
  // When player is created there is no keys that are active therefore the early check
  if (keys.size === 0 && state.player.inWater) {
    return isWaterKey(currentKey) ? currentKey : `water-${currentKey}`;
  }

  // We only want to use the first and second key that is active if a users has three keys active we ignore it
  if (keys.size > 2 || keys.size === 0) {
    return currentKey;
  }

  const verticalKeys = ["w", "s"];
  const horizontalKeys = ["a", "d"];

  let vertical: Vertical | null = null;
  let horizontal: Horizontal | null = null;

  for (const key of keys) {
    if (verticalKeys.includes(key)) {
      vertical = getVerticleDirection(key);
    } else if (horizontalKeys.includes(key)) {
      horizontal = getHorizontalDirection(key);
    }
  }

  let key: AnimationKey = currentKey;

  // Handle 1 key
  if (keys.size === 1) {
    if (vertical) {
      key = `${vertical}-center`;
    }
    if (horizontal) {
      key = `${horizontal}-${horizontal}`;
    }
  }

  // In the format of the spritesheet naming the verticle direction always comes first
  if (vertical && horizontal) {
    key = `${vertical}-${horizontal}`;
  }

  if (state.player.inWater && !isWaterKey(key)) {
    key = `water-${key}`;
  }

  return key;
};

const centerPlayerToCenterTile = (): Coordinates => {
  const xPos = window.innerWidth / 2;
  const yPos = window.innerHeight / 2;
  const { x, y } = isoPosToWorldPos(xPos, yPos);

  const { yPosTile, xPosTile } = getIsometricTilePositions(y, x, TILE.WIDTH_HALF, TILE.HEIGHT_HALF);

  return {
    ...state.player.position,
    x: xPosTile - PLAYER.WIDTH / 2,
    y: yPosTile + PLAYER.HEIGHT / 2,
  };
};

const getPlayerBaseFeetPosition = (
  player: Sprite,
  xOffset = 0,
  yOffset = 0,
  level = state.player.position.level,
): Coordinates => {
  return {
    ...state.player.position,
    x: player.x + player.width / 2 + xOffset,
    // Visual feet y projected back to base map y by undoing elevation offset
    y: player.y + yOffset + level * TILE.HEIGHT_HALF,
  };
};

const isPlayerFeetTouchingTile = (
  player: Sprite,
  tile: ContainerChild,
  xOffset = 0,
  yOffset = 0,
  level = state.player.position.level,
) => {
  const feet = getPlayerBaseFeetPosition(player, xOffset, yOffset, level);
  const y = feet.y - PLAYER.FEET_MARGIN;
  const halfWidth = player.width / 2 - PLAYER.FEET_MARGIN;

  // Check 3 probe points across the player feet (left, center, right)
  return (
    isPointInIsometricTile(feet.x - halfWidth, y, tile) ||
    isPointInIsometricTile(feet.x, y, tile) ||
    isPointInIsometricTile(feet.x + halfWidth, y, tile)
  );
};

const getStackLayerFromPlayer = (player: Sprite): Container | null => {
  return player.parent?.label === LABELS.APP.STACK ? player.parent : null;
};

const getPlayerTerrainLevel = (
  player: Sprite,
  stackLayer: Container | null,
  xOffset = 0,
  yOffset = 0,
  level = state.player.position.level,
): number => {
  const feet = getPlayerBaseFeetPosition(player, xOffset, yOffset, level);
  const { row, col } = getChunkByGlobalPosition(feet.x, feet.y);
  const keys = getVisibleChunkKeys(row, col);
  const chunks = getVisibleChunks(keys);

  const activeChunk = chunks.get(`${col}_${row}`);
  const staticTiles = activeChunk ? getAllActivePlayerTiles(activeChunk, player, level) : [];
  let nextLevel = getMaxTileLevel(staticTiles);

  if (stackLayer) {
    const touchingStackTiles = stackLayer.children.filter(
      (tile) =>
        tile.label !== LABELS.APP.PLAYER &&
        isPlayerFeetTouchingTile(player, tile, xOffset, yOffset, level),
    );
    nextLevel = getMaxTileLevel(touchingStackTiles, nextLevel);
  }

  return nextLevel;
};

const canPlayerMoveToNextLevel = (
  player: Sprite,
  stackLayer: Container | null,
  xOffset: number,
  yOffset: number,
  currentLevel: number,
): boolean => {
  const nextLevel = getPlayerTerrainLevel(player, stackLayer, xOffset, yOffset, currentLevel);
  return nextLevel - currentLevel <= PLAYER.MAX_STEP_LEVEL_DIFF;
};

const applyPlayerElevation = (player: Sprite, stackLayer: Container | null) => {
  const previousLevel = state.player.position.level;
  const baseFeetY = player.y + previousLevel * TILE.HEIGHT_HALF;
  const nextLevel = getPlayerTerrainLevel(player, stackLayer, 0, 0, previousLevel);

  // Keep base feet stable in map space, project visual y from sampled level
  player.y = baseFeetY - nextLevel * TILE.HEIGHT_HALF;
  state.player.position.level = nextLevel;
};

export const createPlayer = (): Sprite => {
  const { x, y } = centerPlayerToCenterTile();

  const player = new Sprite();
  player.anchor.set(0, 1); // Left Bottom
  player.label = LABELS.APP.PLAYER;
  player.x = x;
  player.y = y;
  player.width = PLAYER.WIDTH;
  player.height = PLAYER.HEIGHT;
  player.zIndex = x + y;

  state.player.animation.key = getPlayerAnimationKey(state.player.movementKeys);
  state.player.position = { x, y, level: 0 };

  const { currentFrame, key } = state.player.animation;

  if (state.assets.player) {
    player.texture = state.assets.player.animations[key][currentFrame];
  }

  return player;
};

const isAllowedKey = (key: string): key is AllowedKeys => {
  return allowedKeys.includes(key as AllowedKeys);
};

export const registerPlayerMovement = (key: string) => {
  if (isAllowedKey(key) && !state.player.movementKeys.has(key)) {
    const opposites = { w: "s", s: "w", a: "d", d: "a" } as const;

    // If we have to directions on the same axis it will mess with the animation key
    if (state.player.movementKeys.has(opposites[key])) {
      removePlayerMovement(opposites[key]);
    }

    state.player.movementKeys.add(key);
  }
};

export const removePlayerMovement = (key: string) => {
  if (isAllowedKey(key) && state.player.movementKeys.has(key)) {
    state.player.movementKeys.delete(key);
  }
};

export const isPlayerMoving = () => {
  return state.player.movementKeys.size !== 0;
};

export const isPlayerStopping = () => {
  return state.player.movementKeys.size === 0 && state.player.animation.currentFrame !== 0;
};

const handlePlayerAnimation = (player: Sprite) => {
  const { timer, speed } = state.player.animation;
  if (timer >= speed && state.player.movementKeys.size > 0) {
    state.player.animation.timer = 0;
    state.player.animation.currentFrame =
      (state.player.animation.currentFrame + 1) % state.player.animation.frameLength;
    state.player.animation.key = getPlayerAnimationKey(state.player.movementKeys);

    if (state.assets.player) {
      const { key, currentFrame } = state.player.animation;
      player.texture = state.assets.player.animations[key][currentFrame];
    }
  }
};

const getAllActivePlayerTiles = (
  chunk: Chunk,
  player: Sprite,
  level = state.player.position.level,
): ContainerChild[] => {
  const ground = chunk?.children ?? [];
  const tiles: ContainerChild[] = [];

  // We only want to check if the bottom of the player is in a tile since that is where the feet are
  for (const tile of ground) {
    if (isPlayerFeetTouchingTile(player, tile, 0, 0, level)) {
      tiles.push(tile);
    }
  }

  return tiles;
};

const isPlayerBehindItem = (item: ContainerChild, groundTile: ContainerChild, player: Sprite) => {
  // To place an item i.e vegetation on a tile but still allow the assets to display above the tile we set the anchor at bottom center
  const itemLeft = item.x - item.width / 2;
  const itemRight = item.x + item.width / 2;
  const itemTop = item.y - item.height;

  const playerRight = player.x + player.width;
  const playerTop = player.y - player.height;

  const isRight = player.x < itemRight && player.x > itemLeft;
  const isLeft = playerRight > itemLeft && playerRight < itemRight;
  const isTop = player.y > itemTop && player.y < item.y;
  const isBottom = playerTop < item.y && playerTop > itemTop;
  const isAboveGroundTile = player.y < groundTile.y + TILE.HEIGHT_HALF;

  return isAboveGroundTile && (isRight || isLeft) && (isTop || isBottom);
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const handlePlayerBounds = (player: Sprite): AllowedKeys[] => {
  let allowedDirection = [...allowedKeys];
  const feet = getPlayerBaseFeetPosition(player);
  const { row, col } = getChunkByGlobalPosition(feet.x, feet.y);
  const keys = getVisibleChunkKeys(row, col);
  const chunks = getVisibleChunks(keys);

  const activeChunk = chunks.get(`${col}_${row}`);
  const currentTiles = activeChunk ? getAllActivePlayerTiles(activeChunk, player) : [];

  // Including the chunks around the chunk that the player is in,
  // since a object item can have a part of it covering in to a differnt chunk
  for (const [, chunk] of chunks) {
    if (!chunk) {
      continue;
    }

    // Moving backwords since the actual first index is the furthest away visualy
    const ground = chunk.children;
    for (let i = ground.length - 1; i >= 0; i--) {
      const tile = ground[i];
      const currentVegetation = getVegetationFromGround(chunk, tile.label);
      const hasCollisions = currentVegetation
        ? hasVegetationCollisions(currentVegetation as Sprite)
        : false;

      if (!hasCollisions) continue;

      if (currentVegetation && isPlayerBehindItem(currentVegetation, tile, player)) {
        currentVegetation.alpha = 0.4;
      } else if (currentVegetation) {
        currentVegetation.alpha = 1;
      }

      if (currentVegetation && currentTiles.includes(tile)) {
        const collidedSides = getIsoCollisionSides(tile, player);

        if (collidedSides["bottom-left"]) {
          allowedDirection = ["s", "a"];
          break;
        }
        if (collidedSides["bottom-right"]) {
          allowedDirection = ["s", "d"];
          break;
        }
        if (collidedSides["top"]) {
          allowedDirection = ["w", "a", "d"];
          break;
        }
        if (collidedSides["bottom"]) {
          allowedDirection = ["s", "a", "d"];
          break;
        }
      }
    }
  }

  return allowedDirection;
};

export const movePlayerTo = (x: number, y: number, world: Container, player: Sprite) => {
  const xDiff = world.x - x;
  const yDiff = world.y - y;

  world.y += yDiff;
  world.x += xDiff;

  player.y -= yDiff;
  player.x -= xDiff;
};

export const movePlayerPosition = (player: Sprite, world: Container, deltaTime: number) => {
  // Put player in the correct chunk so zIndex will work on surface items
  const allowedDirection = handlePlayerBounds(player);
  const distance = deltaTime * PLAYER.SPEED;
  const stackLayer = getStackLayerFromPlayer(player);
  const currentLevel = getPlayerTerrainLevel(player, stackLayer, 0, 0, state.player.position.level);
  state.player.position.level = currentLevel;

  if (
    state.player.movementKeys.has("w") &&
    allowedDirection.includes("w") &&
    canPlayerMoveToNextLevel(player, stackLayer, 0, -distance, currentLevel)
  ) {
    world.y += distance;
    player.y -= distance;
  }

  if (
    state.player.movementKeys.has("a") &&
    allowedDirection.includes("a") &&
    canPlayerMoveToNextLevel(player, stackLayer, -distance * 2, 0, currentLevel)
  ) {
    world.x += distance * 2;
    player.x -= distance * 2;
  }

  if (
    state.player.movementKeys.has("s") &&
    allowedDirection.includes("s") &&
    canPlayerMoveToNextLevel(player, stackLayer, 0, distance, currentLevel)
  ) {
    world.y -= distance;
    player.y += distance;
  }

  if (
    state.player.movementKeys.has("d") &&
    allowedDirection.includes("d") &&
    canPlayerMoveToNextLevel(player, stackLayer, distance * 2, 0, currentLevel)
  ) {
    world.x -= distance * 2;
    player.x += distance * 2;
  }

  applyPlayerElevation(player, stackLayer);

  // We render player at elevated y values and add the terrain offset back for depth sorting
  player.zIndex = player.y + player.height + state.player.position.level * TILE.HEIGHT_HALF;

  state.player.animation.timer += deltaTime / 60;
  handlePlayerAnimation(player);
};
