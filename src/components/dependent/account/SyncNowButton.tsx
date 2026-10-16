import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PracticeButton } from "@/components/ui/practice-button";
import { copyForCode } from "@/lib/engine/engine-copy";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { cn } from "@/lib/utils";
import type { ActionStatus } from "./action-status";

/**
 * Runs `sync.catchUp()` and shows its failure under the button: a full-width
 * secondary button.
 */
export const SyncNowButton = ({
  label = "Sync now",
  className,
}: {
  label?: string;
  className?: string;
}) => {
  const api = useEngineApi();
  const [status, setStatus] = useState<ActionStatus>({ kind: "idle" });
  const busy = status.kind === "busy";

  const syncNow = async () => {
    if (!api || busy) return;
    setStatus({ kind: "busy" });
    const result = await api.sync.catchUp();
    setStatus(
      result.ok
        ? { kind: "idle" }
        : { kind: "error", message: copyForCode(result.error.code) }
    );
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <PracticeButton
        variant="secondary"
        size="md"
        // Not disabled while busy: a disabled secondary button fades to 20%.
        disabled={!api}
        aria-busy={busy}
        onClick={() => void syncNow()}
      >
        {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {label}
      </PracticeButton>
      {status.kind === "error" && (
        <p
          role="alert"
          className="text-sm font-bold text-yellow-600 dark:text-yellow-400"
        >
          ⚠️ {status.message}
        </p>
      )}
    </div>
  );
};
