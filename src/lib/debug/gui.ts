import GUI from "lil-gui";

import { state } from "@/core/state";
import { BLOCK_TYPE, TERRAIN_HEIGHT } from "@/lib/config";
import { setPerlinSeed } from "@/lib/utils/perlinNoise";

const gui = new GUI({ title: "Terrain Debug", closeFolders: true });
let regenerateCallback: (() => void) | null = null;

const updateWaterThreshold = (value: number) => {
  TERRAIN_HEIGHT.WATER_THRESHOLD = value;
  TERRAIN_HEIGHT.GROUND_RANGE.MAX = -value;
  TERRAIN_HEIGHT.WATER_RANGE.MIN = value;
};

export const initDebugGui = (onRegenerate: () => void) => {
  regenerateCallback = onRegenerate;

  gui.add({ seed: state.seed }, "seed", 0, 100000, 1).name("Seed").onChange(setPerlinSeed);

  const thresholdFolder = gui.addFolder("Water Threshold");
  thresholdFolder
    .add({ waterThreshold: TERRAIN_HEIGHT.WATER_THRESHOLD }, "waterThreshold", 0.05, 0.5, 0.01)
    .name("Water Threshold")
    .onChange(updateWaterThreshold);

  const sandFolder = gui.addFolder("Sand Distribution");
  sandFolder.add(BLOCK_TYPE, "SAND_SHORE_THRESHOLD", 0, 1, 0.05).name("Shore");
  sandFolder.add(BLOCK_TYPE, "SAND_UNDERWATER_THRESHOLD", 0, 1, 0.05).name("Underwater");
  sandFolder.add(BLOCK_TYPE, "SAND_MAX_GROUND_LEVEL", 0, 3, 1).name("Max Ground Level");

  const stoneFolder = gui.addFolder("Stone Distribution");
  stoneFolder.add(BLOCK_TYPE, "STONE_GROUND_THRESHOLD", 0, 0.5, 0.05).name("Ground");
  stoneFolder.add(BLOCK_TYPE, "STONE_UNDERWATER_THRESHOLD", 0, 0.5, 0.05).name("Underwater");
  stoneFolder.add(BLOCK_TYPE, "STONE_MIN_GROUND_LEVEL", 0, 3, 1).name("Min Ground Level");

  gui.add({ regenerate: () => regenerateCallback?.() }, "regenerate").name("Regenerate Terrain");
};
