export type GroundSpriteData = {
  xPosTile: number;
  yPosTile: number;
  perlin: number[][];
  row: number;
  col: number;
  chunkCol: number;
  chunkRow: number;
};

export type BlockType = "grass" | "dirt" | "sand" | "stone";
