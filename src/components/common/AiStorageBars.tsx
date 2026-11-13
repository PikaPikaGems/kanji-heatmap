import { AI_STORAGE_LIMITS } from "@/lib/ai-explain/storage-budgets";
import type { AiStorageUsage } from "@/lib/ai-explain/storage-budgets";
import { StorageUsageBar } from "./StorageUsageBar";

/**
 * Saved AI text, MP3s and images against their limits. In App & Device Info
 * and in AI Study Tools (Usage & Saved).
 */
export const AiStorageBars = ({ usage }: { usage: AiStorageUsage }) => (
  <>
    <StorageUsageBar
      label="Text"
      mine={usage.text.mine}
      others={usage.text.others}
      shared={{ label: "Shared explains", bytes: usage.text.shared }}
      limit={AI_STORAGE_LIMITS.text}
      note="AI Explain answers, kanji essays, anchor word essays"
    />
    <StorageUsageBar
      label="MP3"
      mine={usage.audio.mine}
      others={usage.audio.others}
      limit={AI_STORAGE_LIMITS.audio}
      note="Essay and vocabulary narration"
    />
    <StorageUsageBar
      label="Images"
      mine={usage.images.mine}
      others={usage.images.others}
      limit={AI_STORAGE_LIMITS.images}
      note="Visual Mnemonics"
    />
    <p className="text-xs text-muted-foreground">
      MP3s and AI Explain answers: the least recently used are removed
      automatically. Essays and images are never removed for you; new ones stop
      saving at the limit.
    </p>
  </>
);
