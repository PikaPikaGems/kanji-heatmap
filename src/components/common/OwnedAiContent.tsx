import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useCurrentOwner } from "@/lib/engine/content-owner";

/** Stands in for saved AI content while it, or whose it is, is loading. */
export const SavedAiContentLoading = () => (
  <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
    <Loader2 className="size-4 animate-spin" /> Loading saved AI content…
  </p>
);

/**
 * Shows saved AI content (essays, MP3s, images, answers, storage) only once
 * its owner is known, so a logged-in user never sees the guest's while the
 * account loads. The children remount and fade in for each owner, so login
 * and logout switch the content without a reload.
 */
export const OwnedAiContent = ({ children }: { children: ReactNode }) => {
  const owner = useCurrentOwner();
  if (owner.status === "unknown") return <SavedAiContentLoading />;
  return (
    <div key={owner.ownerId} className="animate-fade-in-fast">
      {children}
    </div>
  );
};
