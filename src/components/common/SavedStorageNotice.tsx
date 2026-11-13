import { useAiStorageUsage } from "@/hooks/use-ai-storage-usage";
import {
  AI_STORAGE_LIMITS,
  FREE_SPACE_NOTES,
  STORAGE_WARNING_RATIO,
  freeSpaceNote,
  kindTotal,
} from "@/lib/ai-explain/storage-budgets";
import { GUEST_OWNER_ID, useCurrentOwner } from "@/lib/engine/content-owner";
import { outLinks } from "@/lib/external-links";
import { ExternalTextLink } from "./ExternalTextLink";
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
  const owner = useCurrentOwner();
  if (state.status !== "ready" || owner.status !== "known") return null;
  const usage = state.usage[kind];
  const limit = AI_STORAGE_LIMITS[kind];
  if (kindTotal(usage) < limit * STORAGE_WARNING_RATIO) return null;
  const freeSpace = freeSpaceNote(usage, owner.ownerId === GUEST_OWNER_ID);
  return (
    <div role="status" className="p-3 border border-dotted rounded-xl">
      <StorageUsageBar
        label={NOTICES[kind].label}
        mine={usage.mine}
        others={usage.others}
        shared={
          kind === "text"
            ? { label: "Shared explains", bytes: usage.shared }
            : undefined
        }
        limit={limit}
        note={
          <>
            {NOTICES[kind].note}
            {freeSpace && ` ${FREE_SPACE_NOTES[freeSpace]}`}
            {freeSpace === "guest" && (
              <>
                {" "}
                Need help? Ask us on{" "}
                <ExternalTextLink href={outLinks.discord} text="Discord." />
              </>
            )}
          </>
        }
      />
    </div>
  );
};
