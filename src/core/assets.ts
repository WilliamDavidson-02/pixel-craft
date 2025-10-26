import { Assets, type Spritesheet } from "pixi.js";

export type AssetsKeys = "BLOCKS" | "PLAYER" | "VEGETATION";
export const ASSETS: Partial<Record<AssetsKeys, Spritesheet>> = {};

export type AudioKeys = "WALK" | "SWIM";
export const AUDIO: Partial<Record<AudioKeys, HTMLAudioElement[]>> = {};

export const loadAllinitialAssets = async (): Promise<void> => {
  ASSETS.BLOCKS = await Assets.load("/game/blocks.json");
  ASSETS.VEGETATION = await Assets.load("/game/vegetation.json");
  ASSETS.PLAYER = await Assets.load("/game/character/player.json");
};
