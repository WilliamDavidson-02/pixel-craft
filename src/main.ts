import { initDevtools } from "@pixi/devtools";
import { Container, Culler, Rectangle } from "pixi.js";

import { loadAllinitialAssets } from "@/core/assets";
import { renderChunks, shouldRenderNewChunks } from "@/core/chunks";
import {
  createPlayer,
  isPlayerMoving,
  movePlayerPosition,
  putPlayerInChunk,
  registerPlayerMovement,
  removePlayerMovement,
} from "@/core/entities/player";
import { state } from "@/core/state";
import { LABELS } from "@/lib/config";
import { renderDuebugItems, setDebugItem } from "@/lib/debug";
import { setRenderDistance } from "@/lib/utils/renderDistance";
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

  const groundLayer = new Container({ label: LABELS.APP.GROUND });
  world.addChild(groundLayer);
  renderChunks(world, groundLayer);

  const player = createPlayer();
  putPlayerInChunk(player);
  window.addEventListener("keydown", (ev) => registerPlayerMovement(ev.key));
  window.addEventListener("keyup", (ev) => removePlayerMovement(ev.key));

  state.app.ticker.add((ticker) => {
    if (isPlayerMoving()) {
      movePlayerPosition(player, world, ticker.deltaTime);

      if (shouldRenderNewChunks(player.x, player.y)) {
        renderChunks(world, groundLayer);
      }
    }

    setDebugItem("fps", Math.floor(ticker.FPS));
    setDebugItem("position", { x: player.x.toFixed(2), y: player.y.toFixed(2) });
    renderDuebugItems();

    Culler.shared.cull(world, view);
  });

  window.addEventListener("resize", () => {
    handleWindowResize(world, groundLayer);
    view = new Rectangle(0, 0, window.innerWidth, window.innerHeight);
  });
};

window.addEventListener("DOMContentLoaded", init);
