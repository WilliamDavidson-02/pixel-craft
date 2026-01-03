import { type Container, type ContainerChild, Sprite } from "pixi.js";

import {
  getChunk,
  getChunkByKey,
  getVisibleChunkKeys,
  getVisibleChunks,
  isChunkKey,
} from "@/core/chunks";
import { state } from "@/core/state";
import { getVegetationFromGround, hasVegetationCollisions } from "@/core/terrain/vegetation";
import { LABELS, PLAYER, TILE } from "@/lib/config";
import { getIsoCollisionSides } from "@/lib/utils/collisions";
import {
  getChunkByGlobalPosition,
  getIsometricTilePositions,
  isoPosToWorldPos,
} from "@/lib/utils/position";
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
  // When player is created there is no keys that are active there for the early check
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
    x: xPosTile - PLAYER.WIDTH / 2,
    y: yPosTile + PLAYER.HEIGHT / 2,
  };
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

  state.player.animation.key = getPlayerAnimationKey(state.player.movementKeys);
  state.player.position = { x, y };

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

export const setPlayerAnimation = (
  key: AnimationKey | null = state.player.animation.key,
  frame: number | null = state.player.animation.currentFrame,
) => {
  state.player.animation.currentFrame = frame ?? state.player.animation.currentFrame;
  state.player.animation.key = key ?? state.player.animation.key;
};

const getAllActivePlayerTiles = (chunk: Chunk, player: Sprite): ContainerChild[] => {
  const ground = chunk.ground?.children ?? [];
  const tiles: ContainerChild[] = [];

  // We only want to check if the bottom of the player is in a tile since that is where the feet are
  for (const tile of ground) {
    const cx = tile.x + TILE.WIDTH_HALF;
    const cy = tile.y + TILE.HEIGHT_HALF;

    // The anchor is set to bottom left of the player therefor we dont have to add width or height
    const dx = Math.abs(player.x - cx) / TILE.WIDTH_HALF;
    const dy = Math.abs(player.y - cy) / TILE.HEIGHT_HALF;

    const isInIsometricTile = dx + dy <= 1;

    if (isInIsometricTile) {
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

export const putPlayerInChunk = (player: Sprite) => {
  const { row, col } = getChunkByGlobalPosition(player.x, player.y);

  const newChunk = getChunk(row, col);
  const oldChunk = getChunkByKey(state.player.chunkKey);
  if (!newChunk || !newChunk.object) return;
  const newKey = newChunk.object.label;

  if (newKey === oldChunk?.object?.label) return;

  if (oldChunk?.object) {
    oldChunk.object.removeChild(player);
  }

  newChunk.object?.addChild(player);

  if (isChunkKey(newKey)) {
    state.player.chunkKey = newKey;
  }
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const handlePlayerBounds = (player: Sprite): AllowedKeys[] => {
  let allowedDirection = [...allowedKeys];
  const { row, col } = getChunkByGlobalPosition(player.x, player.y);
  const keys = getVisibleChunkKeys(row, col);
  const chunks = getVisibleChunks(keys);

  const activeChunk = chunks.get(`${col}_${row}`);
  const currentTiles = activeChunk ? getAllActivePlayerTiles(activeChunk, player) : [];

  // Including the chunks around the chunk that the player is in,
  // since a object item can have a part of it covering in to a differnt chunk
  for (const [, chunk] of chunks) {
    if (!chunk.ground) {
      continue;
    }

    // Moving backwords since the actual first index is the furthest away visualy
    const ground = chunk.ground.children;
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

        if (collidedSides["top-left"]) {
          allowedDirection = ["w", "a"];
          break;
        }
        if (collidedSides["top-right"]) {
          allowedDirection = ["w", "d"];
          break;
        }
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
  putPlayerInChunk(player);
  const allowedDirection = handlePlayerBounds(player);
  const distance = deltaTime * PLAYER.SPEED;

  if (state.player.movementKeys.has("w") && allowedDirection.includes("w")) {
    world.y += distance;
    player.y -= distance;
  }

  if (state.player.movementKeys.has("a") && allowedDirection.includes("a")) {
    world.x += distance * 2;
    player.x -= distance * 2;
  }

  if (state.player.movementKeys.has("s") && allowedDirection.includes("s")) {
    world.y -= distance;
    player.y += distance;
  }

  if (state.player.movementKeys.has("d") && allowedDirection.includes("d")) {
    world.x -= distance * 2;
    player.x += distance * 2;
  }

  // To always be behind or infront of the right tree we have to adjust the zIndex depending on y axis
  player.zIndex = player.y;
};
