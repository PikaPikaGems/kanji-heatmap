import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyForCode } from "@/lib/engine/engine-copy";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import type { ActionStatus } from "./action-status";

/** Runs `sync.catchUp()` and shows its failure under the button. */
export const SyncNowButton = () => {
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
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={!api || busy}
        onClick={() => void syncNow()}
      >
        {busy && <Loader2 className="animate-spin" />}
        Sync now
      </Button>
      {status.kind === "error" && (
        <p role="alert" className="text-xs text-destructive">
          {status.message}
        </p>
      )}
    </div>
  );
};
