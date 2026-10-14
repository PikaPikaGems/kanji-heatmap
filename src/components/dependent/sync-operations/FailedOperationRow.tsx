import { useState } from "react";
import type { RecentFailedOperation } from "engine-contract";
import { Loader2 } from "lucide-react";
import { SpanBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useSetOpenedParam } from "@/hooks/routing-hooks";
import { copyForCode } from "@/lib/engine/engine-copy";
import { closeSyncOperations } from "@/lib/engine/sync-operations-dialog";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import {
  describeSubject,
  operationIcon,
  operationLabel,
  recoverableText,
} from "./operation-info";

type RowStatus =
  | { kind: "idle" }
  | { kind: "confirm-dismiss" }
  | { kind: "busy" };

const failedDate = (failedAt: number) =>
  new Date(failedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

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
  const Icon = operationIcon(op.operationType);
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
    <li className="flex flex-col gap-2 p-3 border rounded-lg">
      <div className="flex items-start gap-3">
        <Icon
          className="mt-1 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
            {operationLabel(op.operationType)}
            {kanji !== undefined && (
              <span className="text-xl leading-none">{kanji}</span>
            )}
            {subject !== "" && (
              <span className="text-xs font-normal text-muted-foreground">
                {subject}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {copyForCode(op.code)} ·{" "}
            <time dateTime={new Date(op.failedAt).toISOString()}>
              {failedDate(op.failedAt)}
            </time>
          </p>
          {op.diagnosticId !== undefined && (
            <p className="font-mono text-[10px] break-all text-muted-foreground">
              {op.diagnosticId}
            </p>
          )}
        </div>
        <SpanBadge variant={rejected ? "destructive" : "secondary"}>
          {rejected ? "Rejected" : "Retrying"}
        </SpanBadge>
      </div>
      {status.kind === "confirm-dismiss" ? (
        <div className="flex flex-col gap-2 text-xs">
          <p>
            Dismissing removes this note&apos;s text from this device. Copy it
            first if you still need it.
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void dismiss()}
            >
              Dismiss anyway
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus({ kind: "idle" })}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {text !== null && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => void copy(text, e)}
            >
              {copyStatus === "copied" && "Copied"}
              {copyStatus === "failed" && "Copy failed"}
              {copyStatus === "inactive" && "Copy text"}
            </Button>
          )}
          {text !== null && kanji !== undefined && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                openKanji(kanji);
                closeSyncOperations();
              }}
            >
              {op.operationType === "note-save" ? "Open note" : "Open kanji"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={!api || status.kind === "busy"}
            onClick={() => {
              if (needsConfirm) {
                setStatus({ kind: "confirm-dismiss" });
                return;
              }
              void dismiss();
            }}
          >
            {status.kind === "busy" && <Loader2 className="animate-spin" />}
            Dismiss
          </Button>
        </div>
      )}
    </li>
  );
};
