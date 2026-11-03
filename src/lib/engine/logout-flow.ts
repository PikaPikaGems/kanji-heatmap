import { useSyncExternalStore } from "react";
import { deleteAiOwnerKey } from "@/lib/ai-explain/preferences";
import { getCurrentOwner } from "./content-owner";
import { getEngineState } from "./engine";
import { LOGOUT_FAILED_COPY } from "./engine-copy";

/**
 * The app-wide logout flow (design 5.3.1): the "Log out?" modal, then the
 * full-screen "Logging you out…" screen. It is a module store mounted from App
 * because the sidebar account row, where it starts, unmounts as soon as the
 * account status turns signed out, in the middle of the logout.
 */

/** What to remove from this device, chosen in the modal or by the recovery dialog. */
export type LogoutRequest = {
  /** `logout({ clearLocalData: true })`: also remove the study data. */
  clearLocalData: boolean;
  /** This account's saved AI data to delete first. None from the recovery dialog. */
  ai?: { userId: string; deleteContent: boolean; deleteKey: boolean };
};

export type LogoutStep = "ai-content" | "ai-key" | "session";

export type LogoutFlow =
  | { phase: "closed" }
  | { phase: "confirm"; userId: string }
  | {
      phase: "running";
      request: LogoutRequest;
      step: LogoutStep;
      slow: boolean;
    }
  | {
      phase: "error";
      request: LogoutRequest;
      step: LogoutStep;
      message: string;
    }
  | { phase: "done"; request: LogoutRequest };

const CLOSED: LogoutFlow = { phase: "closed" };

/** Shows "this can take up to 30 seconds" after this long. */
const SLOW_AFTER_MS = 10_000;

const AI_CONTENT_FAILED_COPY = "Couldn't delete your AI-generated content";
const NOT_READY_COPY = "Your account isn't ready yet";

let state: LogoutFlow = CLOSED;
let slowTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const setState = (next: LogoutFlow) => {
  state = next;
  for (const listener of listeners) listener();
};

/** Local deletions first, then the session; only what was chosen. */
export const logoutSteps = (request: LogoutRequest): LogoutStep[] => {
  const steps: LogoutStep[] = [];
  if (request.ai?.deleteContent) steps.push("ai-content");
  if (request.ai?.deleteKey) steps.push("ai-key");
  steps.push("session");
  return steps;
};

// Closing the page can interrupt the logout, so the browser asks first.
const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  event.returnValue = "";
};

const startWatching = () => {
  window.addEventListener("beforeunload", warnBeforeLeaving);
  clearTimeout(slowTimer);
  slowTimer = setTimeout(() => {
    if (state.phase === "running") setState({ ...state, slow: true });
  }, SLOW_AFTER_MS);
};

const stopWatching = () => {
  window.removeEventListener("beforeunload", warnBeforeLeaving);
  clearTimeout(slowTimer);
};

/** Runs one step; resolves to why it failed, or null when it worked. */
const runStep = async (
  request: LogoutRequest,
  step: LogoutStep
): Promise<string | null> => {
  const ai = request.ai;
  if (step === "ai-content" && ai) {
    try {
      // Content is deleted for whoever owns it right now, so it must still
      // be this account.
      const owner = getCurrentOwner();
      if (owner.status !== "known" || owner.ownerId !== ai.userId) {
        return AI_CONTENT_FAILED_COPY;
      }
      const { clearGeneratedContent } = await import(
        "@/lib/ai-explain/storage"
      );
      await clearGeneratedContent();
      return null;
    } catch {
      return AI_CONTENT_FAILED_COPY;
    }
  }
  if (step === "ai-key" && ai) {
    deleteAiOwnerKey(ai.userId);
    return null;
  }
  const engine = getEngineState();
  if (engine.status !== "ready") return NOT_READY_COPY;
  const result = request.clearLocalData
    ? await engine.api.auth.logout({ clearLocalData: true })
    : await engine.api.auth.logout();
  return result.ok ? null : LOGOUT_FAILED_COPY;
};

const runFrom = async (request: LogoutRequest, from: LogoutStep) => {
  const steps = logoutSteps(request);
  startWatching();
  for (const step of steps.slice(steps.indexOf(from))) {
    setState({
      phase: "running",
      request,
      step,
      slow: state.phase === "running" && state.slow,
    });
    const failure = await runStep(request, step);
    if (failure === null) continue;
    stopWatching();
    setState({ phase: "error", request, step, message: failure });
    return;
  }
  stopWatching();
  // "You're logged out" stays until the person closes it.
  setState({ phase: "done", request });
};

export const openLogoutDialog = (userId: string) => {
  if (state.phase === "closed") setState({ phase: "confirm", userId });
};

export const closeLogoutDialog = () => {
  if (state.phase === "confirm") setState(CLOSED);
};

/** From the modal's "Log out" and the recovery dialog's two choices. */
export const startLogout = (request: LogoutRequest) => {
  if (state.phase !== "closed" && state.phase !== "confirm") return;
  void runFrom(request, logoutSteps(request)[0]);
};

/** "Try again": resumes from the step that failed. */
export const retryLogout = () => {
  if (state.phase !== "error") return;
  void runFrom(state.request, state.step);
};

/** "Stay logged in": closes the error screen. */
export const dismissLogoutError = () => {
  if (state.phase === "error") setState(CLOSED);
};

/** "Close" on "You're logged out": back to the app as a guest. */
export const closeLoggedOut = () => {
  if (state.phase === "done") setState(CLOSED);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useLogoutFlow = () => useSyncExternalStore(subscribe, () => state);
