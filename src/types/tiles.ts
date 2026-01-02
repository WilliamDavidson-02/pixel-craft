export type TileCallback<T> = (row: number, col: number) => T;

export type ColidedSides = {
  "top-left": boolean;
  "bottom-left": boolean;
  "bottom-right": boolean;
  "top-right": boolean;
  top: boolean;
  bottom: boolean;
};
