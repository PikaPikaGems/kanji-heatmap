import { useSyncExternalStore } from "react";
import type { EngineAPI } from "engine-contract";
import type { StudyEngineMockControls } from "kh-study-engine/mock";
import { startEngineLifecycle } from "./lifecycle";

/**
 * Why the engine can't run here:
 * - "not-included": this build has no engine (KH_STUDY_ENGINE_ENTRY unset;
 *   see vite.config.ts).
 * - "insecure-context" / "no-web-locks" / "no-indexeddb": the browser can't run
 *   it (host/guide/AUTH.md capability gate).
 * - "failed": the engine module threw while loading (a bug, not the browser).
 */
export type EngineUnavailableReason =
  | "not-included"
  | "insecure-context"
  | "no-web-locks"
  | "no-indexeddb"
  | "failed";

export type EngineState =
  | { status: "loading" }
  | { status: "unavailable"; reason: EngineUnavailableReason }
  | {
      status: "ready";
      api: EngineAPI;
      /** Present only when running against the in-memory mock backend. */
      mockControls: StudyEngineMockControls | null;
    };

const API_BASE_URL = import.meta.env.VITE_ENGINE_API_BASE_URL;

let state: EngineState = { status: "loading" };
const listeners = new Set<() => void>();
let started = false;

const setState = (next: EngineState) => {
  state = next;
  for (const listener of listeners) listener();
};

const browserBlocker = (): EngineUnavailableReason | null => {
  if (!window.isSecureContext) return "insecure-context";
  if (typeof navigator.locks?.request !== "function") return "no-web-locks";
  return null;
};

const loadEngine = async (): Promise<EngineState> => {
  if (!__STUDY_ENGINE_INCLUDED__) {
    return { status: "unavailable", reason: "not-included" };
  }

  const blocker = browserBlocker();
  if (blocker) return { status: "unavailable", reason: blocker };

  if (API_BASE_URL) {
    const { createEngine } = await import("kh-study-engine");
    const engine = createEngine({ apiBaseUrl: API_BASE_URL });
    if (engine.type !== "available") {
      return { status: "unavailable", reason: "no-indexeddb" };
    }
    return { status: "ready", api: engine.engine, mockControls: null };
  }

  const mock = await import("kh-study-engine/mock");
  const backend = mock.createMockBackend();
  // The mock reports premium as lapsed by default, which blocks every write.
  backend.controls.setEntitlementActive(true);
  const engine = mock.createEngineWithDependencies({
    syncTransport: backend.syncTransport,
    authTransport: backend.authTransport,
    clock: { now: () => new Date() },
    timeZoneProvider: {
      current: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  if (engine.type !== "available") {
    return { status: "unavailable", reason: "no-indexeddb" };
  }
  return {
    status: "ready",
    api: engine.engine,
    mockControls: backend.controls,
  };
};

/** Starts loading the engine. Called once from main.tsx. */
export const startEngine = () => {
  if (started) return;
  started = true;
  loadEngine()
    .then((next) => {
      if (next.status === "ready") startEngineLifecycle(next.api);
      setState(next);
    })
    .catch((error: unknown) => {
      console.error("Study engine failed to load", error);
      setState({ status: "unavailable", reason: "failed" });
    });
};

export const subscribeEngineState = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getEngineState = () => state;

export const useEngineState = () =>
  useSyncExternalStore(subscribeEngineState, getEngineState);
