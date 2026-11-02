import { useEffect, useState } from "react";
import type { AiStorageUsage } from "@/lib/ai-explain/storage-budgets";
import { useCurrentOwner } from "@/lib/engine/content-owner";

/** Same as AI_GENERATED_CONTENT_EVENT; spelled out so the storage module stays lazy. */
const AI_GENERATED_CONTENT_EVENT = "ai-generated-content-changed";

export type AiStorageUsageState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      usage: AiStorageUsage;
      /** The browser's own figures for this whole site, when it shares them. */
      estimate?: { usage: number; quota: number };
    };

const readEstimate = async () => {
  try {
    const { usage, quota } = (await navigator.storage?.estimate?.()) ?? {};
    return usage != null && quota ? { usage, quota } : undefined;
  } catch {
    return undefined;
  }
};

const LOADING: AiStorageUsageState = { status: "loading" };

/**
 * Bytes used by AI content per kind, refreshed whenever it changes or the
 * owner (logged-in account or guest) does. Loading until the owner is known.
 */
export const useAiStorageUsage = (): AiStorageUsageState => {
  const owner = useCurrentOwner();
  const ownerId = owner.status === "known" ? owner.ownerId : undefined;
  // Tagged with its owner so one owner's sizes never show for the next.
  const [loaded, setLoaded] = useState<{
    ownerId: string;
    state: AiStorageUsageState;
  } | null>(null);

  // Effect needed: sizes come from IndexedDB and the Storage API (async,
  // outside React), and the change subscription must end on unmount. It
  // re-runs on ownerId because the sizes counted as "mine" belong to one owner.
  useEffect(() => {
    if (ownerId === undefined) return;
    let active = true;
    const refresh = async () => {
      try {
        const { getAiStorageUsage } = await import("@/lib/ai-explain/storage");
        const [usage, estimate] = await Promise.all([
          getAiStorageUsage(),
          readEstimate(),
        ]);
        if (active)
          setLoaded({ ownerId, state: { status: "ready", usage, estimate } });
      } catch {
        if (active) setLoaded({ ownerId, state: { status: "error" } });
      }
    };
    void refresh();
    window.addEventListener(AI_GENERATED_CONTENT_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(AI_GENERATED_CONTENT_EVENT, refresh);
    };
  }, [ownerId]);

  if (!loaded || loaded.ownerId !== ownerId) return LOADING;
  return loaded.state;
};
