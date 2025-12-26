import { Application, type Renderer } from "pixi.js";

export type State = {
  app: Application<Renderer>;
};

export const state: State = {
  app: new Application(),
};
