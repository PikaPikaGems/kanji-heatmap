import { useState } from "react";
import type { RecentFailedOperation } from "engine-contract";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { DialogActions } from "@/components/common/DialogActions";
import { PracticeButton } from "@/components/ui/practice-button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useSetOpenedParam } from "@/hooks/routing-hooks";
import { copyForCode } from "@/lib/engine/engine-copy";
import { closeSyncOperations } from "@/lib/engine/sync-operations-dialog";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { cn } from "@/lib/utils";
import {
  describeSubject,
  operationIcon,
  operationLabel,
  recoverableText,
} from "./operation-info";
import { OperationIcon, OperationKanji } from "./OperationList";

type RowStatus =
  | { kind: "idle" }
  | { kind: "confirm-dismiss" }
  | { kind: "busy" };

const failedDate = (failedAt: number) =>
  new Date(failedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

/** "● Rejected" (the server won't take it) or "● Retrying". */
const StatePill = ({ rejected }: { rejected: boolean }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap">
    <span
      aria-hidden
      className={cn(
        "size-1.5 rounded-full",
        rejected ? "bg-destructive" : "bg-amber-500 animate-pulse"
      )}
    />
    {rejected ? "Rejected" : "Retrying"}
  </span>
);

/**
 * One operation the engine could not upload. Rejected notes and pile words
 * keep their text on the record; it is only copied out or opened for the
 * person to save again, never re-queued here.
 */
export const FailedOperationRow = ({
  op,
  onDismissed,
}: {
  op: RecentFailedOperation;
  onDismissed: () => void;
}) => {
  const api = useEngineApi();
  const openKanji = useSetOpenedParam();
  const { copy, status: copyStatus } = useCopyToClipboard(1500);
  const [status, setStatus] = useState<RowStatus>({ kind: "idle" });
  const kanji = op.subject?.kanji;
  const subject = describeSubject(op.subject);
  const text = recoverableText(op);
  const rejected = op.state === "permanently-rejected";
  // Dismissing a rejected note throws away its only copy.
  const needsConfirm = rejected && op.operationType === "note-save";

  const dismiss = async () => {
    if (!api || status.kind === "busy") return;
    setStatus({ kind: "busy" });
    await api.sync.dismissFailedOperations([op.operationId]);
    onDismissed();
  };

  return (
    <li className="flex flex-col gap-2.5 px-3 py-3">
      <div className="flex items-start gap-3">
        <OperationIcon Icon={operationIcon(op.operationType)} />
        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
          <p className="flex flex-wrap items-center text-sm font-semibold gap-x-2 gap-y-1">
            {operationLabel(op.operationType)}
            <StatePill rejected={rejected} />
          </p>
          <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
            {copyForCode(op.code)}
          </p>
          <p className="text-xs text-muted-foreground">
            <time
              className="whitespace-nowrap"
              dateTime={new Date(op.failedAt).toISOString()}
            >
              {failedDate(op.failedAt)}
            </time>
            {subject !== "" && ` · ${subject}`}
          </p>
          {op.diagnosticId !== undefined && (
            <p className="font-mono text-[10px] break-all text-muted-foreground">
              {op.diagnosticId}
            </p>
          )}
        </div>
        {kanji !== undefined && <OperationKanji kanji={kanji} />}
      </div>
      {status.kind === "confirm-dismiss" ? (
        <div
          key={status.kind}
          className="flex flex-col gap-3 pt-1 animate-fade-in-fast"
        >
          <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
            ⚠️ Dismissing removes this note&apos;s text from this device. Copy
            it first if you still need it.
          </p>
          <DialogActions>
            <PracticeButton
              variant="ghost"
              onClick={() => setStatus({ kind: "idle" })}
            >
              Cancel
            </PracticeButton>
            <PracticeButton variant="danger" onClick={() => void dismiss()}>
              Dismiss anyway
            </PracticeButton>
          </DialogActions>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-12">
          {text !== null && (
            <TextActionButton
              icon={<Copy aria-hidden size={14} />}
              onClick={(e) => void copy(text, e)}
            >
              {copyStatus === "copied" && "Copied"}
              {copyStatus === "failed" && "Copy failed"}
              {copyStatus === "inactive" && "Copy text"}
            </TextActionButton>
          )}
          {text !== null && kanji !== undefined && (
            <TextActionButton
              icon={<ExternalLink aria-hidden size={14} />}
              onClick={() => {
                openKanji(kanji);
                closeSyncOperations();
              }}
            >
              {op.operationType === "note-save" ? "Open note" : "Open kanji"}
            </TextActionButton>
          )}
          <TextActionButton
            icon={<Trash2 aria-hidden size={14} />}
            busy={status.kind === "busy"}
            busyLabel="Dismissing…"
            disabled={!api}
            onClick={() => {
              if (needsConfirm) {
                setStatus({ kind: "confirm-dismiss" });
                return;
              }
              void dismiss();
            }}
          >
            Dismiss
          </TextActionButton>
        </div>
      )}
    </li>
  );
};
