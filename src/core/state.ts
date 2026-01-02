import { Application, type Renderer } from "pixi.js";

import type { Chunks } from "@/types/chunks";

import type { ASSETS } from "./assets";

export type State = {
  app: Application<Renderer>;
  assets: ASSETS;
  chunks: Chunks;
};

export const state: State = {
  app: new Application(),
  assets: {},
  chunks: new Map(),
};
