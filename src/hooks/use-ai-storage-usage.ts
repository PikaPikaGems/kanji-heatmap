import { useEffect, useState } from "react";
import type { AiStorageUsage } from "@/lib/ai-explain/storage-budgets";

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

/** Bytes used by AI content per kind, refreshed whenever it changes. */
export const useAiStorageUsage = () => {
  const [state, setState] = useState<AiStorageUsageState>({
    status: "loading",
  });

  // Effect needed: sizes come from IndexedDB and the Storage API (async,
  // outside React), and the change subscription must end on unmount.
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const { getAiStorageUsage } = await import("@/lib/ai-explain/storage");
        const [usage, estimate] = await Promise.all([
          getAiStorageUsage(),
          readEstimate(),
        ]);
        if (active) setState({ status: "ready", usage, estimate });
      } catch {
        if (active) setState({ status: "error" });
      }
    };
    void refresh();
    window.addEventListener(AI_GENERATED_CONTENT_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(AI_GENERATED_CONTENT_EVENT, refresh);
    };
  }, []);

  return state;
};
