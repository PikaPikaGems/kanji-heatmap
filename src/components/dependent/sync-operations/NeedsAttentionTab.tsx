import { useState } from "react";
import type { RecentFailedOperation } from "engine-contract";
import { ClipboardCopy } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { Pagination } from "@/components/sections/KanjiDetails/Pagination";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { FailedOperationRow } from "./FailedOperationRow";
import { EmptyOperations, OperationList } from "./OperationList";
import type { RecentFailedOperations } from "./use-recent-failed-operations";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

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
      <p role="alert" className={cn("px-1 py-4 text-sm", cnWarningText)}>
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
      <FailedOperationPages
        operations={newestFirst}
        onDismissed={onDismissed}
      />
      <BugReportButton operations={newestFirst} />
    </div>
  );
};

/**
 * Rows per page: half the Pending tab's 10, since each row here is about
 * twice as tall (its error and Dismiss).
 */
const PAGE_SIZE = 5;

/** The failed operations, 5 per page with the drawer's pagination. */
const FailedOperationPages = ({
  operations,
  onDismissed,
}: {
  operations: readonly RecentFailedOperation[];
  onDismissed: () => void;
}) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(operations.length / PAGE_SIZE);
  // Dismissing shrinks the list: stay on its last page.
  const shown = Math.min(page, totalPages);
  const start = (shown - 1) * PAGE_SIZE;
  return (
    <div className="flex flex-col">
      <div key={shown} className="animate-fade-in-fast">
        <OperationList>
          {operations.slice(start, start + PAGE_SIZE).map((op) => (
            <FailedOperationRow
              key={op.operationId}
              op={op}
              onDismissed={onDismissed}
            />
          ))}
        </OperationList>
      </div>
      {totalPages > 1 && (
        <Pagination
          page={shown}
          totalPages={totalPages}
          onPrev={() => setPage(shown - 1)}
          onNext={() => setPage(shown + 1)}
        />
      )}
    </div>
  );
};
