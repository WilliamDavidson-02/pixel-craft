import { Application, type Renderer } from "pixi.js";

import type { ChunkState } from "@/types/chunks";
import type { PlayerState } from "@/types/player";

import type { ASSETS } from "./assets";

export type State = {
  app: Application<Renderer>;
  assets: ASSETS;
  chunkState: ChunkState;
  player: PlayerState;
};

const initialPlayerState: PlayerState = {
  animation: {
    currentFrame: 0,
    key: "down-center",
  },
  position: { x: 0, y: 0 },
  movementKeys: new Set([]),
  inWater: false,
};

const initialChunkState: ChunkState = {
  chunks: new Map(),
  renderList: new Set(),
};

export const state: State = {
  app: new Application(),
  assets: {},
  chunkState: initialChunkState,
  player: initialPlayerState,
};
