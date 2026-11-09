import { Fragment, useState, type ReactNode } from "react";
import { AppResetContext } from "./app-reset-hooks";

/**
 * The top of the tree. `useResetApp()` bumps the key, which remounts
 * everything below with fresh state, e.g. after logging in so no screen keeps
 * what it loaded while logged out.
 */
export const AppResetProvider = ({ children }: { children: ReactNode }) => {
  const [resetKey, setResetKey] = useState(0);

  return (
    <AppResetContext.Provider value={() => setResetKey((key) => key + 1)}>
      <Fragment key={resetKey}>{children}</Fragment>
    </AppResetContext.Provider>
  );
};
