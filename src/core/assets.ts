import { Assets, type Spritesheet } from "pixi.js";

import { state } from "./state";

export type AssetsKeys = "blocks" | "player" | "vegetation";
export type ASSETS = Partial<Record<AssetsKeys, Spritesheet>>;

export const loadAllinitialAssets = async (): Promise<void> => {
  state.assets.blocks = await Assets.load("/game/blocks.json");
  state.assets.vegetation = await Assets.load("/game/vegetation.json");
  state.assets.player = await Assets.load("/game/character/player.json");
};
