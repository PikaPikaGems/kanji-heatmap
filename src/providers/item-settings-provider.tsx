import { ReactNode, useMemo } from "react";
import { useLocalStorage } from "../hooks/use-local-storage";

import { ItemSettings } from "@/lib/settings/settings";
import { defaultItemSettingsValue, itemSettings } from "./item-settings-hooks";

const storageKey = "item-settings";

export function ItemSettingsProvider({ children }: { children: ReactNode }) {
  const [storageData, setItem] = useLocalStorage<ItemSettings>(
    storageKey,
    defaultItemSettingsValue
  );

  // Memoized: context value must keep a stable identity or every consumer
  // re-renders on any provider render.
  const mergedSettings = useMemo(
    () => ({ ...defaultItemSettingsValue, ...storageData }),
    [storageData]
  );

  return (
    <itemSettings.StateContext.Provider value={mergedSettings}>
      <itemSettings.DispatchContext.Provider value={setItem}>
        {children}
      </itemSettings.DispatchContext.Provider>
    </itemSettings.StateContext.Provider>
  );
}
