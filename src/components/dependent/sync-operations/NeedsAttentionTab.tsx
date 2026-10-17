import type { RecentFailedOperation } from "engine-contract";
import { ClipboardCopy } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { FailedOperationRow } from "./FailedOperationRow";
import { EmptyOperations, OperationList } from "./OperationList";
import type { RecentFailedOperations } from "./use-recent-failed-operations";

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

/** "Copy bug report": low-key, under the list. */
const BugReportButton = ({
  operations,
}: {
  operations: readonly RecentFailedOperation[];
}) => {
  const { copy, status } = useCopyToClipboard(1500);

  return (
    <TextActionButton
      className="self-start"
      icon={<ClipboardCopy aria-hidden size={14} />}
      onClick={(e) => void copy(bugReport(operations), e)}
    >
      {status === "copied" && "Copied"}
      {status === "failed" && "Copy failed"}
      {status === "inactive" && "Copy bug report"}
    </TextActionButton>
  );
};

/** Operations the engine rejected or keeps failing to upload. */
export const NeedsAttentionTab = ({
  result,
  onDismissed,
}: {
  result: RecentFailedOperations;
  onDismissed: () => void;
}) => {
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
            onDismissed={onDismissed}
          />
        ))}
      </OperationList>
      <BugReportButton operations={newestFirst} />
    </div>
  );
};
