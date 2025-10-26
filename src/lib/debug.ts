import { BitmapText, Container } from "pixi.js";

import { state } from "@/core/state";

const DEBUG_CONTAINER_LABEL = "debug-ui-container";
const debugContainer = new Container({ label: DEBUG_CONTAINER_LABEL });

export type BaseDebugValue = string | number;
export type DebugValue = BaseDebugValue | Record<string, BaseDebugValue>;
export type Debug = Record<string, DebugValue>;

export const setDebugItem = (name: string, value: DebugValue): void => {
  state.debug[name] = value;
};

const isBaseDebugValue = (value: DebugValue): value is BaseDebugValue => {
  return typeof value === "string" || typeof value === "number";
};

const formatLabel = (label: string): string => `${label}: `;

const createDebugItemValue = (value: DebugValue): string => {
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

  return new BitmapText({
    text: label + itemValue,
    y: fontSize * index + 1,
    style: {
      fontSize,
    },
  });
};

export const renderDuebugItems = (): void => {
  const items = Object.entries(state.debug).map((item, index) => createDebugItem(...item, index));
  debugContainer.removeChildren();
  debugContainer.addChild(...items);
  state.app.stage.addChild(debugContainer);
};
