import type {
  ReviewSettingsCompatibility,
  UTCTimestamp,
  WriteAccess,
} from "engine-contract";
import { type EngineUnavailableReason, useEngineState } from "./engine";
import { AUTH_STATUS_KEY } from "./store-cache";
import { useEngineQuery } from "./use-engine-query";

/**
 * Everything account-dependent UI branches on. One union instead of separate
 * isLoggedIn / isSupported / canWrite flags.
 *
 * - `unavailable`: no engine. `reason: "not-included"` means this build has
 *   none (hide account UI); the browser reasons show the update message.
 * - `recovery`: the active account's local data can't be opened
 *   (host/api/SESSION.md "Recoverable local cache").
 * - `error`: the auth status itself failed to load (`diagnosticId` for bug
 *   reports).
 */
export type AccountStatus =
  | { kind: "loading" }
  | { kind: "unavailable"; reason: EngineUnavailableReason }
  | { kind: "error"; diagnosticId: string }
  | { kind: "signed-out" }
  | { kind: "recovery"; diagnosticId: string }
  | {
      kind: "active";
      userId: string;
      expiresAt: UTCTimestamp;
      writeAccess: WriteAccess;
      reviewSettings: ReviewSettingsCompatibility;
    };

export const useAccountStatus = (): AccountStatus => {
  const engine = useEngineState();
  const snapshot = useEngineQuery(AUTH_STATUS_KEY, (api) =>
    api.auth.watchStatus()
  );

  if (engine.status === "unavailable") {
    return { kind: "unavailable", reason: engine.reason };
  }
  if (snapshot.status === "loading" || snapshot.status === "unavailable") {
    return { kind: "loading" };
  }
  if (snapshot.status === "failed") {
    return { kind: "error", diagnosticId: snapshot.diagnosticId };
  }
  if (!snapshot.result.ok) {
    return { kind: "error", diagnosticId: snapshot.result.error.code };
  }

  const status = snapshot.result.value;
  if (status.status === "no_active_session") return { kind: "signed-out" };
  if (status.status === "local_cache_recovery_required") {
    return { kind: "recovery", diagnosticId: status.diagnosticId };
  }
  return {
    kind: "active",
    userId: status.userId,
    expiresAt: status.expiresAt,
    writeAccess: status.writeAccess,
    reviewSettings: status.reviewSettings,
  };
};

/**
 * Why a mutation can't run right now, or null when it can. Use it to disable
 * buttons up front (with copy from engine-copy.ts) instead of waiting for a
 * failed write.
 */
export type WriteBlocker =
  | "loading"
  | "unavailable"
  | "signed-out"
  | "recovery"
  | Extract<WriteAccess, { allowed: false }>["reason"];

export const getWriteBlocker = (status: AccountStatus): WriteBlocker | null => {
  if (status.kind === "active") {
    return status.writeAccess.allowed ? null : status.writeAccess.reason;
  }
  if (status.kind === "error") return "unavailable";
  return status.kind;
};
