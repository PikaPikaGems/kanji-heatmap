import { useRef, useState } from "react";
import type { PracticeActivityEventRecord } from "engine-contract";
import { useWriteBlocker } from "./data-download";
import {
  copyForCode,
  copyForWriteBlocker,
  NOT_SAVED_NOT_DOWNLOADED_COPY,
} from "./engine-copy";
import { type WriteBlocker, useAccountStatus } from "./use-account-status";
import { useEngineApi } from "./use-engine-query";

type WithoutTimes<T> = T extends unknown
  ? Omit<T, "startedAt" | "endedAt" | "timezone">
  : never;

/** A practice record minus its times, which the recorder adds. */
export type ActivityRecordInput = WithoutTimes<PracticeActivityEventRecord>;

type SaveFailure = { round: number; message: string };

/** The end screen's copy for a round that couldn't be saved. */
const notSavedCopy = (blocker: WriteBlocker) =>
  blocker === "not-downloaded" || blocker === "cache_rebuilding"
    ? NOT_SAVED_NOT_DOWNLOADED_COPY
    : copyForWriteBlocker(blocker);

/**
 * Saves a game's finished rounds to the account's activity. Call `startRound`
 * when a round begins (its `startedAt`) and `recordRound` when it ends; the
 * end time and time zone are added there. Nothing is recorded unless the
 * account is active, and a write the account can't take right now is not
 * attempted. Either way `saveError` holds the copy to show on that round's
 * end screen (null when it saved, or when logged out, which
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
      setFailure({ round: forRound, message: notSavedCopy(blocker) });
      return;
    }

    const result = await api.activity.record({
      ...input,
      startedAt: startedAtRef.current,
      endedAt: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    if (!result.ok) {
      setFailure({ round: forRound, message: copyForCode(result.error.code) });
    }
  };

  const saveError = failure?.round === round ? failure.message : null;
  return { startRound, recordRound, saveError };
};
