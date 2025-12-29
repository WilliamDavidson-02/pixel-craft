import { Application, type Renderer } from "pixi.js";

import type { ASSETS } from "./assets";

export type State = {
  app: Application<Renderer>;
  assets: ASSETS;
};

export const state: State = {
  app: new Application(),
  assets: {},
};
