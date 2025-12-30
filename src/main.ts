import { initDevtools } from "@pixi/devtools";
import { Container, Culler, Rectangle } from "pixi.js";

import { loadAllinitialAssets } from "@/core/assets";
import {
  createPlayer,
  isPlayerMoving,
  movePlayerPosition,
  putPlayerInChunk,
  registerPlayerMovement,
  removePlayerMovement,
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
import { LABELS } from "@/lib/config/labels";
import { renderDuebugItems, setDebugItem } from "@/lib/debug";
import { handleWindowResize } from "@/lib/utils/window";

let view = new Rectangle(0, 0, window.innerWidth, window.innerHeight);

const init = async (): Promise<void> => {
  await state.app.init({
    resizeTo: window,
    antialias: false,
    background: "#4a80ff",
  });
  document.body.appendChild(state.app.canvas);
  initDevtools({ app: state.app });

  setRenderDistance();
  await loadAllinitialAssets();

  const world = new Container({
    isRenderGroup: true,
    eventMode: "static",
    label: LABELS.APP.WORLD,
  });

  state.app.stage.addChild(world);

  const objectLayer = new Container({ label: LABELS.APP.OBJECT });
  const groundLayer = new Container({ label: LABELS.APP.GROUND });
  setInitalTiles(world, groundLayer, objectLayer);
  world.addChild(groundLayer, objectLayer);

  const player = createPlayer();
  putPlayerInChunk(player);
  window.addEventListener("keydown", (ev) => registerPlayerMovement(ev.key));
  window.addEventListener("keyup", (ev) => removePlayerMovement(ev.key));

  state.app.ticker.add((ticker) => {
    if (isPlayerMoving()) {
      movePlayerPosition(player, world, ticker);
      setNewChunksToRender(world);

      if (chunkCreationList.length > 0) {
        createChunk(chunkCreationList[0]);
      }

      updateVisibleChunks(world, groundLayer, objectLayer);
    }

    setDebugItem("fps", Math.floor(ticker.FPS));
    setDebugItem("position", { x: world.x.toFixed(2), y: world.y.toFixed(2) });
    renderDuebugItems();

    Culler.shared.cull(world, view);
  });

  window.addEventListener("resize", () => {
    handleWindowResize(world, groundLayer, objectLayer);
    view = new Rectangle(0, 0, window.innerWidth, window.innerHeight);
  });
};

window.addEventListener("DOMContentLoaded", init);
