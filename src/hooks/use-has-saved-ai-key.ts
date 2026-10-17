import { useStorageValue } from "@/hooks/use-storage-value";
import {
  AI_EXPLAIN_KEYS_KEY,
  readAiOwnerKey,
} from "@/lib/ai-explain/preferences";

/**
 * Whether this account (or the guest) has an xAI key saved on this device.
 * Kept apart from use-ai-explain.ts so the account UI doesn't load the AI
 * storage code.
 */
export const useHasSavedAiKey = (ownerId: string) =>
  useStorageValue(
    () => readAiOwnerKey(ownerId).apiKey !== "",
    (key) => key === null || key === AI_EXPLAIN_KEYS_KEY,
    ownerId
  );
