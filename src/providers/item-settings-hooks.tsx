import { useDeferredValue } from "react";
import { createContextComponents, useContextWithCatch } from "./helpers";
import { ItemSettings } from "@/lib/settings/settings";

export const defaultItemSettingsValue: ItemSettings = {
  cardType: "expanded",
  borderColorMeaning: "jlpt",
};

export const itemSettings = createContextComponents<ItemSettings>(
  defaultItemSettingsValue
);

const providerName = "ItemSettings";

export function useItemSettings() {
  const context = useContextWithCatch(itemSettings.StateContext, providerName);
  return context;
}

export function useDeferredItemSettings() {
  const context = useItemSettings();
  const value = useDeferredValue(context);
  return value;
}
export function useItemSettingsDispatch() {
  const context = useContextWithCatch(
    itemSettings.DispatchContext,
    providerName,
    `${providerName}Dispatch`
  );
  return context;
}
