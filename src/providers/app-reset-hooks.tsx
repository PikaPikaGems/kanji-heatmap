import { createContext, useContext } from "react";

/** Remounts the whole app (everything under `AppResetProvider`). */
export const AppResetContext = createContext<() => void>(() => {});

export const useResetApp = () => useContext(AppResetContext);
