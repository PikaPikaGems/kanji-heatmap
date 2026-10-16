import { useState } from "react";
import type { RecentFailedOperation } from "engine-contract";
import { ClipboardCopy, Loader2 } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { DialogActions } from "@/components/common/DialogActions";
import { PracticeButton } from "@/components/ui/practice-button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { FailedOperationRow } from "./FailedOperationRow";
import { EmptyOperations, OperationList } from "./OperationList";
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

/** "Copy bug report" (low-key, in the body) and "Dismiss all (keeps notes)". */
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
    <>
      <TextActionButton
        className="self-start"
        icon={<ClipboardCopy aria-hidden size={14} />}
        onClick={(e) => void copy(bugReport(operations), e)}
      >
        {copyStatus === "copied" && "Copied"}
        {copyStatus === "failed" && "Copy failed"}
        {copyStatus === "inactive" && "Copy bug report"}
      </TextActionButton>
      {dismissable.length > 0 && (
        <DialogActions className="pt-2">
          <PracticeButton
            variant="secondary"
            disabled={!api}
            aria-busy={busy}
            onClick={() => void dismissAll()}
          >
            {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
            Dismiss all (keeps notes)
          </PracticeButton>
        </DialogActions>
      )}
    </>
  );
};

/** Operations the engine rejected or keeps failing to upload. */
export const NeedsAttentionTab = () => {
  const { result, reload } = useRecentFailedOperations();

  if (result.kind === "loading") {
    return <p className="px-1 py-4 text-sm text-muted-foreground">Loading…</p>;
  }
  if (result.kind === "error") {
    return (
      <p
        role="alert"
        className="px-1 py-4 text-sm font-bold text-yellow-600 dark:text-yellow-400"
      >
        ⚠️ Couldn&apos;t load failed operations.
      </p>
    );
  }
  if (result.operations.length === 0) {
    return (
      <EmptyOperations icon="🎉">Nothing needs attention.</EmptyOperations>
    );
  }

  const newestFirst = [...result.operations].sort(
    (a, b) => b.failedAt - a.failedAt
  );
  return (
    <div className="flex flex-col gap-3">
      <OperationList>
        {newestFirst.map((op) => (
          <FailedOperationRow
            key={op.operationId}
            op={op}
            onDismissed={reload}
          />
        ))}
      </OperationList>
      <Footer operations={newestFirst} onDismissed={reload} />
    </div>
  );
};
