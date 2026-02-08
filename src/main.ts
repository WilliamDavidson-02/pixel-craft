import { Container, Culler, Rectangle } from "pixi.js";

import { loadAllinitialAssets } from "@/core/assets";
import {
  handleMaxStoredChunks,
  hasRenderQueue,
  isChunksMemoryFull,
  renderChunk,
  setAllChunksRenderQueue,
  setChunksRenderQueue,
  shouldRenderNewChunks,
} from "@/core/chunks";
import {
  createPlayer,
  isPlayerMoving,
  movePlayerPosition,
  registerPlayerMovement,
  removePlayerMovement,
} from "@/core/entities/player";
import { state } from "@/core/state";
import { LABELS } from "@/lib/config";
import { renderDebugItems, setDebugItem } from "@/lib/debug";
import { initDebugGui } from "@/lib/debug/gui";
import { setRenderDistance } from "@/lib/utils/renderDistance";
import { handleWindowResize } from "@/lib/utils/window";

let view = new Rectangle(0, 0, window.innerWidth, window.innerHeight);

const init = async (): Promise<void> => {
  await state.app.init({
    resizeTo: window,
    antialias: false,
  });
  document.body.appendChild(state.app.canvas);

  setRenderDistance();
  await loadAllinitialAssets();

  const world = new Container({
    isRenderGroup: true,
    eventMode: "static",
    label: LABELS.APP.WORLD,
  });
  state.app.stage.addChild(world);

  const stackLayer = new Container({ label: LABELS.APP.STACK, sortableChildren: true });
  const staticLayer = new Container({ label: LABELS.APP.STATIC });

  setChunksRenderQueue(world, staticLayer);

  const player = createPlayer();

  stackLayer.addChild(player);
  world.addChild(staticLayer, stackLayer);

  state.app.ticker.add((ticker) => {
    if (isPlayerMoving()) {
      movePlayerPosition(player, world, ticker.deltaTime);

      if (shouldRenderNewChunks(player.x, player.y)) {
        setChunksRenderQueue(world, staticLayer);
      }

      if (isChunksMemoryFull()) {
        handleMaxStoredChunks(world);
      }
    }

    if (hasRenderQueue()) {
      renderChunk(staticLayer, stackLayer);
    }

    setDebugItem("fps", Math.floor(ticker.FPS));
    setDebugItem("position", { x: player.x.toFixed(2), y: player.y.toFixed(2) });
    renderDebugItems();

    Culler.shared.cull(world, view);
  });

  initDebugGui(() => setAllChunksRenderQueue(world, staticLayer));

  window.addEventListener("keydown", (ev) => registerPlayerMovement(ev.key));
  window.addEventListener("keyup", (ev) => removePlayerMovement(ev.key));

  window.addEventListener("resize", () => {
    handleWindowResize(world, staticLayer);
    view = new Rectangle(0, 0, window.innerWidth, window.innerHeight);
  });
};

window.addEventListener("DOMContentLoaded", init);
