import { Application, type Renderer } from "pixi.js";

import type { Debug } from "@/lib/debug";

export type State = {
  app: Application<Renderer>;
  debug: Debug;
};

export const state: State = {
  app: new Application(),
  debug: {},
};
