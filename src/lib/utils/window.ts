import type { Container } from "pixi.js";

import { renderChunks } from "@/core/chunks";
import { setRenderDistance } from "@/lib/utils/renderDistance";

let isResizing: NodeJS.Timeout | null = null;

let prevWindowWidth = window.innerWidth;
let prevWindowHeight = window.innerHeight;

export const handleWindowResize = (world: Container, groundLayer: Container): void => {
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

  // The culling in the ticker function handles all chunks currently in the render tree.
  // If the viewport is resized beyond what the staged renderer covers, we must update
  // the visible chunks. This also ensures chunks are removed when resizing to a much
  // smaller window size.
  isResizing = setTimeout(() => renderChunks(world, groundLayer), 200);
};
