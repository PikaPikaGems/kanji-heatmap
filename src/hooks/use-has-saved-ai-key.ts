import { useStorageValue } from "@/hooks/use-storage-value";
import {
  AI_EXPLAIN_KEYS_KEY,
  hasSavedAiKey,
} from "@/lib/ai-explain/preferences";

/**
 * Whether this account (or the guest) has any AI provider key saved on
 * this device.
 * Kept apart from use-ai-explain.ts so the account UI doesn't load the AI
 * storage code.
 */
export const useHasSavedAiKey = (ownerId: string) =>
  useStorageValue(
    () => hasSavedAiKey(ownerId),
    (key) => key === null || key === AI_EXPLAIN_KEYS_KEY,
    ownerId
  );
