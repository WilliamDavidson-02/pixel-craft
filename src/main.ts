import { Container, Culler, Rectangle } from "pixi.js";

import { loadAllinitialAssets } from "@/core/assets";
import {
  createPlayer,
  isPlayerMoving,
  isPlayerStopping,
  movePlayerPosition,
  putPlayerInChunk,
  registerPlayerMovement,
  removePlayerMovement,
  setPlayerAnimation,
} from "@/core/entities/player";
import { state } from "@/core/state";
import {
  chunkCreationList,
  createChunk,
  setInitalTiles,
  setNewChunksToRender,
  setRenderDistance,
  updateVisibleChunks,
} from "@/core/tiles";
import { handleWindowResize } from "@/lib/utils/window";

import { renderDuebugItems, setDebugItem } from "./lib/debug";

let view = new Rectangle(0, 0, window.innerWidth, window.innerHeight);

const init = async (): Promise<void> => {
  await state.app.init({
    resizeTo: window,
    antialias: false,
    background: "#4a80ff",
  });
  document.body.appendChild(state.app.canvas);
  // @ts-expect-error - This is for development
  globalThis.__PIXI_APP__ = state.app;

  setRenderDistance();
  await loadAllinitialAssets();

  const world = new Container({
    isRenderGroup: true,
    eventMode: "static",
    label: "world",
  });

  state.app.stage.addChild(world);

  const surface = new Container({ label: "surface" });

  const ground = new Container({ label: "ground" });
  setInitalTiles(world, ground, surface);
  world.addChild(ground, surface);

  const player = createPlayer(world);
  putPlayerInChunk(player);
  window.addEventListener("keydown", (ev) => registerPlayerMovement(ev.key));
  window.addEventListener("keyup", (ev) => removePlayerMovement(ev.key));

  setDebugItem("window", { width: window.innerWidth, height: window.innerHeight });
  setDebugItem("playerPosition", { x: world.x.toFixed(2), y: world.y.toFixed(2) });

  state.app.ticker.add((ticker) => {
    setDebugItem("fps", Math.floor(ticker.FPS));
    if (isPlayerMoving()) {
      movePlayerPosition(player, world, ticker);
      setNewChunksToRender(world);

      if (chunkCreationList.length > 0) {
        createChunk(chunkCreationList[0]);
      }

      updateVisibleChunks(world, ground, surface);
    } else if (isPlayerStopping()) {
      setPlayerAnimation(player, null, 0);
    }

    renderDuebugItems();

    Culler.shared.cull(world, view);
  });

  window.addEventListener("resize", () => {
    handleWindowResize(world, ground, surface);

    view = new Rectangle(0, 0, window.innerWidth, window.innerHeight);
  });
};

window.addEventListener("DOMContentLoaded", init);
