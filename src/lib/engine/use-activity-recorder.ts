import { useRef, useState } from "react";
import type { PracticeActivityEventRecord } from "engine-contract";
import { useWriteBlocker } from "./data-download";
import { copyForCode } from "./engine-copy";
import { type WriteBlocker, useAccountStatus } from "./use-account-status";
import { useEngineApi } from "./use-engine-query";

type WithoutTimes<T> = T extends unknown
  ? Omit<T, "startedAt" | "endedAt" | "timezone">
  : never;

/** A practice record minus its times, which the recorder adds. */
export type ActivityRecordInput = WithoutTimes<PracticeActivityEventRecord>;

/**
 * Why a finished round wasn't saved: the account can't save right now
 * (`blocker`, worded with its fix by ProgressNotSavedNotice), or the write
 * itself failed (`message`).
 */
export type SaveError =
  | { kind: "blocked"; blocker: WriteBlocker }
  | { kind: "failed"; message: string };

type SaveFailure = { round: number; error: SaveError };

/** Engine error codes that mean the account can't save right now. */
const BLOCKER_CODES: Record<string, WriteBlocker> = {
  entitlement_expired: "entitlement_expired",
  outbox_full: "outbox_full",
  outbox_stale: "outbox_stale",
  storage_quota: "storage_quota",
  cache_rebuilding: "not-downloaded",
};

const errorForCode = (code: string): SaveError => {
  const blocker = BLOCKER_CODES[code];
  return blocker
    ? { kind: "blocked", blocker }
    : { kind: "failed", message: copyForCode(code) };
};

/**
 * Saves a game's finished rounds to the account's activity. Call `startRound`
 * when a round begins (its `startedAt`) and `recordRound` when it ends; the
 * end time and time zone are added there. Nothing is recorded unless the
 * account is active, and a write the account can't take right now is not
 * attempted. Either way `saveError` says why that round's end screen shows
 * "Not saved" (null when it saved, or when logged out, which
 * ProgressNotSavedNotice words itself).
 */
export const useActivityRecorder = () => {
  const account = useAccountStatus();
  const blocker = useWriteBlocker();
  const api = useEngineApi();
  const startedAtRef = useRef(Date.now());
  // Counts rounds so a late answer never shows on a later round.
  const [round, setRound] = useState(0);
  const [failure, setFailure] = useState<SaveFailure | null>(null);

  const startRound = () => {
    startedAtRef.current = Date.now();
    setRound((current) => current + 1);
  };

  const recordRound = async (input: ActivityRecordInput) => {
    if (account.kind !== "active" || !api) return;

    const forRound = round;
    if (blocker) {
      setFailure({ round: forRound, error: { kind: "blocked", blocker } });
      return;
    }

    const result = await api.activity.record({
      ...input,
      startedAt: startedAtRef.current,
      endedAt: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    if (!result.ok) {
      setFailure({ round: forRound, error: errorForCode(result.error.code) });
    }
  };

  const saveError = failure?.round === round ? failure.error : null;
  return { startRound, recordRound, saveError };
};
