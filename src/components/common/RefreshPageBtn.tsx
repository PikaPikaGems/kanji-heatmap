import { HintChip } from "@/components/common/HintChip";
import { useFlashHint } from "@/hooks/use-flash-hint";
import { Button } from "@/components/ui/button";
import { useNetworkState } from "@/hooks/use-network-state";
import { forceHardRefresh } from "@/lib/force-hard-refresh";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

const OFFLINE_HINT = "You're offline";

export const RefreshPageBtn = ({ cnOverride }: { cnOverride?: string }) => {
  const network = useNetworkState();
  const isOffline = !network.online;
  // Flash chip when refresh is tapped with no connection.
  const offlineHint = useFlashHint();

  return (
    <span className="relative inline-flex">
      <Button
        variant="outline"
        size="iconXl"
        onClick={() => {
          if (isOffline) {
            offlineHint.show(OFFLINE_HINT);
            return;
          }
          void forceHardRefresh();
        }}
        aria-label="Refresh page"
      >
        <RefreshCw className={cn("w-[1.2rem] h-[1.2rem]", cnOverride)} />
      </Button>
      {offlineHint.hint && (
        // right-0, not centered: the hint animation owns `transform`, and the
        // button sits at the sidebar's right edge.
        <HintChip
          key={offlineHint.hint.key}
          tone="warning"
          className="right-0 -bottom-7"
          onDone={offlineHint.done}
        >
          {offlineHint.hint.text}
        </HintChip>
      )}
    </span>
  );
};
