import GUI from "lil-gui";

import { BLOCK_TYPE, TERRAIN_HEIGHT } from "@/lib/config";

let gui: GUI | null = null;
let regenerateCallback: (() => void) | null = null;

/**
 * Updates water threshold and keeps ground range in sync to prevent overlap
 */
const updateWaterThreshold = (value: number) => {
  TERRAIN_HEIGHT.WATER_THRESHOLD = value;
  TERRAIN_HEIGHT.GROUND_RANGE.max = -value;
  TERRAIN_HEIGHT.WATER_RANGE.min = value;
};

/**
 * Initializes the debug GUI with terrain controls
 */
export const initDebugGui = (onRegenerate: () => void) => {
  if (gui) return; // Already initialized

  regenerateCallback = onRegenerate;

  gui = new GUI({ title: "Terrain Debug" });

  // Water/Ground threshold folder
  const thresholdFolder = gui.addFolder("Water Threshold");
  thresholdFolder
    .add({ waterThreshold: TERRAIN_HEIGHT.WATER_THRESHOLD }, "waterThreshold", 0.05, 0.5, 0.01)
    .name("Water Threshold")
    .onChange(updateWaterThreshold);

  // Sand thresholds folder
  const sandFolder = gui.addFolder("Sand Distribution");
  sandFolder.add(BLOCK_TYPE, "SAND_SHORE_THRESHOLD", 0, 1, 0.05).name("Shore");
  sandFolder.add(BLOCK_TYPE, "SAND_INLAND_SPREAD", 0, 1, 0.05).name("Inland Spread");
  sandFolder.add(BLOCK_TYPE, "SAND_UNDERWATER_THRESHOLD", 0, 1, 0.05).name("Underwater");

  // Stone thresholds folder (inverted: lower value = more stone)
  const stoneFolder = gui.addFolder("Stone Distribution");
  stoneFolder.add(BLOCK_TYPE, "STONE_GROUND_THRESHOLD", 0, 0.5, 0.05).name("Ground");
  stoneFolder.add(BLOCK_TYPE, "STONE_UNDERWATER_THRESHOLD", 0, 0.5, 0.05).name("Underwater");
  stoneFolder.add(BLOCK_TYPE, "STONE_MIN_GROUND_LEVEL", 0, 3, 1).name("Min Ground Level");

  // Regenerate button
  gui.add({ regenerate: () => regenerateCallback?.() }, "regenerate").name("Regenerate Terrain");
};

export const destroyDebugGui = () => {
  gui?.destroy();
  gui = null;
};
