import { type Container, type ContainerChild, Sprite, type Ticker } from "pixi.js";

import { getVegetationFromGround, hasVegetationCollisions } from "@/core/terrain/vegetation";
import {
  getChunk,
  getChunkByGlobalPosition,
  getChunkByKey,
  getIsoCollisionSides,
  getIsometricTilePositions,
  getVisibleChunkKeys,
  getVisibleChunks,
  isoPosToWorldPos,
} from "@/core/tiles";
import { TILES } from "@/lib/config/tiles";

import { type Chunk } from "../../types/tiles";

export type Coordinates = { x: number; y: number };

export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 64;

const DEFAULT_SPEED = 8;
export const PLAYER_SPEED = DEFAULT_SPEED;
const playerIsInWater = false;

const allowedKeys = ["w", "a", "s", "d"] as const;
type AllowedKeys = (typeof allowedKeys)[number];
const playerMovementKeys = new Set<string>([]);

let currentFrame = 0;
let animationKey = "down-center";

let playerChunkKey = "";

const getVerticleDirection = (verticle: string): "up" | "down" => {
  return verticle === "w" ? "up" : "down";
};

const getHorizontalDirection = (horizontal: string): "left" | "right" => {
  return horizontal === "a" ? "left" : "right";
};

const getPlayerAnimationKey = (keys: Set<string>): string => {
  // When player is created there is no keys that are active there for the early check
  if (keys.size === 0 && playerIsInWater) {
    return "water-" + animationKey;
  }

  // We only want to use the first and second key that is active if a users has three keys active we ignore it
  if (keys.size > 2 || keys.size === 0) {
    return animationKey;
  }

  const verticalKeys = ["w", "s"];
  const horizontalKeys = ["a", "d"];

  let vertical = "";
  let horizontal = "";

  for (const key of keys) {
    if (verticalKeys.includes(key)) {
      vertical = getVerticleDirection(key);
    } else if (horizontalKeys.includes(key)) {
      horizontal = getHorizontalDirection(key);
    }
  }

  let key = "";

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

  if (playerIsInWater) {
    key = "water-" + key;
  }

  return key;
};

const centerPlayerToCenterTile = (): Coordinates => {
  const xPos = window.innerWidth / 2;
  const yPos = window.innerHeight / 2;
  const { x, y } = isoPosToWorldPos(xPos, yPos);

  const { yPosTile, xPosTile } = getIsometricTilePositions(
    y,
    x,
    TILES.TILE_WIDTH_HALF,
    TILES.TILE_HEIGHT_HALF,
  );

  return {
    x: xPosTile - PLAYER_WIDTH / 2,
    y: yPosTile + PLAYER_HEIGHT / 2,
  };
};

export const createPlayer = (): Sprite => {
  const { x, y } = centerPlayerToCenterTile();

  const player = new Sprite();
  player.anchor.set(0, 1); // Left Bottom
  player.label = "player";
  player.x = x;
  player.y = y;
  player.width = PLAYER_WIDTH;
  player.height = PLAYER_HEIGHT;

  animationKey = getPlayerAnimationKey(playerMovementKeys);

  return player;
};

const isAllowedKey = (key: string): key is AllowedKeys => {
  return allowedKeys.includes(key as AllowedKeys);
};

export const registerPlayerMovement = (key: string): void => {
  if (isAllowedKey(key) && !playerMovementKeys.has(key)) {
    const opposites = { w: "s", s: "w", a: "d", d: "a" };

    // If we have to directions on the same axis it will mess with the animation key
    if (playerMovementKeys.has(opposites[key])) {
      removePlayerMovement(opposites[key]);
    }

    playerMovementKeys.add(key);
  }
};

export const removePlayerMovement = (key: string): void => {
  if (isAllowedKey(key) && playerMovementKeys.has(key)) {
    playerMovementKeys.delete(key);
  }
};

export const isPlayerMoving = (): boolean => {
  return playerMovementKeys.size !== 0;
};

export const isPlayerStopping = (): boolean => {
  return playerMovementKeys.size === 0 && currentFrame !== 0;
};

export const setPlayerAnimation = (
  key: string | null = animationKey,
  frame: number | null = currentFrame,
): void => {
  currentFrame = frame ?? currentFrame;
  animationKey = key ?? animationKey;
};

const getAllActivePlayerTiles = (chunk: Chunk, player: Sprite): ContainerChild[] => {
  const ground = chunk.ground?.children ?? [];
  const tiles: ContainerChild[] = [];

  // We only want to check if the bottom of the player is in a tile since that is where the feet are
  for (const tile of ground) {
    const cx = tile.x + TILES.TILE_WIDTH_HALF;
    const cy = tile.y + TILES.TILE_HEIGHT_HALF;

    // The anchor is set to bottom left of the player therefor we dont have to add width or height
    const dx = Math.abs(player.x - cx) / TILES.TILE_WIDTH_HALF;
    const dy = Math.abs(player.y - cy) / TILES.TILE_HEIGHT_HALF;

    const isInIsometricTile = dx + dy <= 1;

    if (isInIsometricTile) {
      tiles.push(tile);
    }
  }

  return tiles;
};

const isPlayerBehindItem = (
  item: ContainerChild,
  groundTile: ContainerChild,
  player: Sprite,
): boolean => {
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
  const isAboveGroundTile = player.y < groundTile.y + TILES.TILE_HEIGHT_HALF;

  return isAboveGroundTile && (isRight || isLeft) && (isTop || isBottom);
};

export const putPlayerInChunk = (player: Sprite): void => {
  const { row, col } = getChunkByGlobalPosition(player.x, player.y);

  const newChunk = getChunk(row, col);
  const oldChunk = getChunkByKey(playerChunkKey);
  if (!newChunk || !newChunk.surface) return;
  const newKey = newChunk.surface.label;

  if (newKey === oldChunk?.surface?.label) return;

  if (oldChunk?.surface) {
    oldChunk.surface.removeChild(player);
  }

  newChunk.surface?.addChild(player);
  playerChunkKey = newKey;
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

export const movePlayerTo = (x: number, y: number, world: Container, player: Sprite): void => {
  const xDiff = world.x - x;
  const yDiff = world.y - y;

  world.y += yDiff;
  world.x += xDiff;

  player.y -= yDiff;
  player.x -= xDiff;
};

export const movePlayerPosition = (player: Sprite, world: Container, ticker: Ticker): void => {
  // We invert the momvent on the player to keep in in the center

  // Put player in the correct chunk so zIndex will work on surface items
  putPlayerInChunk(player);
  const allowedDirection = handlePlayerBounds(player);
  const distance = ticker.deltaTime * PLAYER_SPEED;

  if (playerMovementKeys.has("w") && allowedDirection.includes("w")) {
    world.y += distance;
    player.y -= distance;
  }

  if (playerMovementKeys.has("a") && allowedDirection.includes("a")) {
    world.x += distance * 2;
    player.x -= distance * 2;
  }

  if (playerMovementKeys.has("s") && allowedDirection.includes("s")) {
    world.y -= distance;
    player.y += distance;
  }

  if (playerMovementKeys.has("d") && allowedDirection.includes("d")) {
    world.x -= distance * 2;
    player.x += distance * 2;
  }

  // To always be behind or infront of the right tree we have to adjust the zIndex depending on y axis
  player.zIndex = player.y;
};
