import { ReactNode } from "react";
import { useLocalStorage } from "../hooks/use-local-storage";

import { ItemSettings } from "@/lib/settings/settings";
import { defaultItemSettingsValue, itemSettings } from "./item-settings-hooks";

const storageKey = "item-settings";

export function ItemSettingsProvider({ children }: { children: ReactNode }) {
  const [storageData, setItem] = useLocalStorage<ItemSettings>(
    storageKey,
    defaultItemSettingsValue
  );

  const mergedSettings = { ...defaultItemSettingsValue, ...storageData };

  return (
    <itemSettings.StateContext.Provider value={mergedSettings}>
      <itemSettings.DispatchContext.Provider value={setItem}>
        {children}
      </itemSettings.DispatchContext.Provider>
    </itemSettings.StateContext.Provider>
  );
}
