import { useEffect, useState } from "react";

export interface NetworkState {
  /** Whether the browser is currently online (navigator.onLine). */
  online: boolean;
  /** Effective connection type, when the Network Information API is available. */
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  /** True when the user has requested reduced data usage. */
  saveData?: boolean;
}

interface NetworkInformation extends EventTarget {
  readonly effectiveType?: NetworkState["effectiveType"];
  readonly saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

const readNetworkState = (): NetworkState => {
  const connection = (navigator as NavigatorWithConnection).connection;
  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType,
    saveData: connection?.saveData,
  };
};

/**
 * Current online status plus the two Network Information API fields the app
 * actually reads (effectiveType, saveData). Re-reads on online/offline and on
 * connection change.
 */
export function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>(readNetworkState);

  // Effect needed: subscribes to online/offline and connection-change events.
  useEffect(() => {
    const update = () => setState(readNetworkState());
    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const connection = (navigator as NavigatorWithConnection).connection;
    connection?.addEventListener?.("change", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      connection?.removeEventListener?.("change", update);
    };
  }, []);

  return state;
}
