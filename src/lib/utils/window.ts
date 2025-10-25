import type { Container } from "pixi.js";

import { setRenderDistance, updateVisibleChunks } from "../../core/tiles";

let isResizing: number | null = null;

let prevWindowWidth = window.innerWidth;
let prevWindowHeight = window.innerHeight;

export const handleWindowResize = (
  world: Container,
  ground: Container,
  surface: Container,
): void => {
  const widthDiff = window.innerWidth - prevWindowWidth;
  const heightDiff = window.innerHeight - prevWindowHeight;

  world.x += widthDiff / 2;
  world.y += heightDiff / 2;

  prevWindowWidth = window.innerWidth;
  prevWindowHeight = window.innerHeight;

  setRenderDistance();

  if (isResizing) {
    clearTimeout(isResizing);
  }

  // The culling in the ticker function will handle all the current chunks that are in the render tree
  // But if we resize furter then what is the staged renderer we there for update the visible chunk, also it will be removing chunks if we resize to a much smaller window size
  isResizing = setTimeout(() => updateVisibleChunks(world, ground, surface), 200);
};
