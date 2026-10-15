import { useAiStorageUsage } from "@/hooks/use-ai-storage-usage";
import {
  AI_STORAGE_LIMITS,
  STORAGE_WARNING_RATIO,
  kindTotal,
} from "@/lib/ai-explain/storage-budgets";
import { StorageUsageBar } from "./StorageUsageBar";

const NOTICES = {
  text: {
    label: "Saved AI text on this device",
    note: "Download what you want to keep, then delete older essays or vocabulary details. New ones can't be saved past the limit.",
  },
  images: {
    label: "Saved images on this device",
    note: "Download what you want to keep, then delete older mnemonics. New ones can't be saved past the limit.",
  },
};

/**
 * Shown once this kind of saved content nears its device limit. Nothing here
 * is backed up anywhere else yet, so everyone sees it.
 */
export const SavedStorageNotice = ({ kind }: { kind: "text" | "images" }) => {
  const state = useAiStorageUsage();
  if (state.status !== "ready") return null;
  const usage = state.usage[kind];
  const limit = AI_STORAGE_LIMITS[kind];
  if (kindTotal(usage) < limit * STORAGE_WARNING_RATIO) return null;
  return (
    <div role="status" className="p-3 border border-dotted rounded-xl">
      <StorageUsageBar
        label={NOTICES[kind].label}
        mine={usage.mine}
        others={usage.others}
        limit={limit}
        note={NOTICES[kind].note}
      />
    </div>
  );
};
