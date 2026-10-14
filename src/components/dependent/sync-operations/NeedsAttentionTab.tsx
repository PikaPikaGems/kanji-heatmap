import { useState } from "react";
import type { RecentFailedOperation } from "engine-contract";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { FailedOperationRow } from "./FailedOperationRow";
import { useRecentFailedOperations } from "./use-recent-failed-operations";

/** Rows for a bug report: everything but the user's own text (`payload`). */
const bugReport = (operations: readonly RecentFailedOperation[]) =>
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      failedOperations: operations.map((op) => ({
        operationId: op.operationId,
        sequence: op.sequence,
        operationType: op.operationType,
        subject: op.subject,
        code: op.code,
        diagnosticId: op.diagnosticId,
        failedAt: new Date(op.failedAt).toISOString(),
        state: op.state,
      })),
    },
    null,
    2
  );

const Footer = ({
  operations,
  onDismissed,
}: {
  operations: readonly RecentFailedOperation[];
  onDismissed: () => void;
}) => {
  const api = useEngineApi();
  const { copy, status: copyStatus } = useCopyToClipboard(1500);
  const [busy, setBusy] = useState(false);
  // Rejected notes may be the only copy of the text, so they are only
  // dismissed one at a time.
  const dismissable = operations.filter(
    (op) => op.operationType !== "note-save"
  );

  const dismissAll = async () => {
    if (!api || busy) return;
    setBusy(true);
    await api.sync.dismissFailedOperations(
      dismissable.map((op) => op.operationId)
    );
    setBusy(false);
    onDismissed();
  };

  return (
    <div className="flex flex-wrap justify-between gap-2 pt-1">
      <Button
        variant="outline"
        size="sm"
        disabled={!api || busy || dismissable.length === 0}
        onClick={() => void dismissAll()}
      >
        {busy && <Loader2 className="animate-spin" />}
        Dismiss all (keeps notes)
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => void copy(bugReport(operations), e)}
      >
        {copyStatus === "copied" && "Copied"}
        {copyStatus === "failed" && "Copy failed"}
        {copyStatus === "inactive" && "Copy bug report"}
      </Button>
    </div>
  );
};

const Message = ({ children }: { children: string }) => (
  <p className="px-1 py-4 text-sm text-muted-foreground">{children}</p>
);

/** Operations the engine rejected or keeps failing to upload. */
export const NeedsAttentionTab = () => {
  const { result, reload } = useRecentFailedOperations();

  if (result.kind === "loading") return <Message>Loading…</Message>;
  if (result.kind === "error") {
    return <Message>Couldn&apos;t load failed operations.</Message>;
  }
  if (result.operations.length === 0) {
    return <Message>Nothing needs attention.</Message>;
  }

  const newestFirst = [...result.operations].sort(
    (a, b) => b.failedAt - a.failedAt
  );
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {newestFirst.map((op) => (
          <FailedOperationRow
            key={op.operationId}
            op={op}
            onDismissed={reload}
          />
        ))}
      </ul>
      <Footer operations={newestFirst} onDismissed={reload} />
    </div>
  );
};
