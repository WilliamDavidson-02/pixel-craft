import { BitmapText, Container, Graphics } from "pixi.js";

import { state } from "@/core/state";
import { CONFIG } from "@/lib/config";

const debugContainer = new Container({ label: CONFIG.DEBUG_CONTAINER_LABEL });

export type BaseDebugValue = string | number;
export type DebugValue = BaseDebugValue | Record<string, BaseDebugValue> | null;
export type Debug = Record<string, DebugValue>;

const debug: Debug = {
  fps: null,
  position: null,
  chunk: null,
};

export const setDebugItem = (name: string, value: DebugValue): void => {
  debug[name] = value;
};

const isBaseDebugValue = (value: DebugValue): value is BaseDebugValue => {
  return !!value && (typeof value === "string" || typeof value === "number");
};

const formatLabel = (label: string): string => `${label}: `;

const createDebugItemValue = (value: DebugValue): string | undefined => {
  if (!value) return;

  if (isBaseDebugValue(value)) {
    return value.toString();
  }

  return Object.entries(value)
    .map(([subName, subValue]) => formatLabel(subName) + subValue.toString())
    .join("   ");
};

export const createDebugItem = (name: string, value: DebugValue, index: number): Container => {
  const label = formatLabel(name);
  const itemValue = createDebugItemValue(value);

  const fontSize = 16;
  const padding = 6;

  const text = new BitmapText({
    text: label + itemValue,
    style: { fontSize },
  });

  const bg = new Graphics();
  bg.rect(0, 0, text.width + padding * 2, text.height + padding * 2).fill({
    color: 0x000000,
    alpha: 0.2,
  });

  text.x = padding;
  text.y = padding;

  const container = new Container();
  container.y = index * (text.height + padding * 2);

  container.addChild(bg);
  container.addChild(text);

  return container;
};

export const renderDuebugItems = (): void => {
  const items = Object.entries(debug)
    .filter(([_, value]) => value !== null)
    .map((item, index) => createDebugItem(...item, index));
  debugContainer.removeChildren();
  debugContainer.addChild(...items);
  state.app.stage.addChild(debugContainer);
};
