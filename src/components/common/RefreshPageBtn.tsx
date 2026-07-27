import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNetworkState } from "@/hooks/use-network-state";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

const OFFLINE_HINT = "You're offline";

export const RefreshPageBtn = ({ cnOverride }: { cnOverride?: string }) => {
  const network = useNetworkState();
  const isOffline = !network.online;
  // Ephemeral offline chip when refresh is tapped with no connection.
  // Same idea as SearchTypeHint — local state, no toast lib.
  // offlineHintKey remounts the span so the CSS animation restarts on rapid taps.
  const [offlineHint, setOfflineHint] = useState<string | null>(null);
  const [offlineHintKey, setOfflineHintKey] = useState(0);

  return (
    <span className="relative inline-flex">
      <Button
        variant="outline"
        size="iconXl"
        onClick={() => {
          if (isOffline) {
            setOfflineHint(OFFLINE_HINT);
            setOfflineHintKey((key) => key + 1);
            return;
          }
          window.location.reload();
        }}
        aria-label="Refresh page"
      >
        <RefreshCw className={cn("w-[1.2rem] h-[1.2rem]", cnOverride)} />
      </Button>
      {offlineHint != null && (
        <span
          key={offlineHintKey}
          className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 text-xs font-semibold border rounded-md shadow-sm -bottom-7 border-amber-500 bg-background dark:text-amber-300 text-amber-600 animate-search-type-hint"
          role="status"
          aria-live="polite"
          onAnimationEnd={() => setOfflineHint(null)}
        >
          {offlineHint}
        </span>
      )}
    </span>
  );
};
