import { useSyncExternalStore } from "react";

/**
 * What the dev panel last told the mock backend. The mock controls have no
 * getters, and the panel unmounts whenever the sidebar closes, so the values
 * live here (as long as the page, like the in-memory mock itself).
 */
export type MockBackendValues = {
  premiumActive: boolean;
  offline: boolean;
  requireBootstrap: boolean;
  schemaMismatch: boolean;
};

// Premium starts on because engine.ts enables it when it builds the mock.
let values: MockBackendValues = {
  premiumActive: true,
  offline: false,
  requireBootstrap: false,
  schemaMismatch: false,
};
const listeners = new Set<() => void>();

export const setMockBackendValue = <K extends keyof MockBackendValues>(
  key: K,
  value: MockBackendValues[K]
) => {
  if (values[key] === value) return;
  values = { ...values, [key]: value };
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useMockBackendValues = () =>
  useSyncExternalStore(subscribe, () => values);
