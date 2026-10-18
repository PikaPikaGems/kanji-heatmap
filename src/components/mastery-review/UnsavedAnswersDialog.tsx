import type { CardType, SyncStatus } from "engine-contract";
import { ErrorTerminal } from "@/components/common/ErrorTerminal";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useAiStorageUsage } from "@/hooks/use-ai-storage-usage";
import { useAiVoiceState } from "@/hooks/use-ai-voice";
import {
  formatCaptureTimestamp,
  formatDebugInfoForClipboard,
  formatStorageForClipboard,
  useDebugInfo,
} from "@/hooks/use-debug-info";
import { copyForCode } from "@/lib/engine/engine-copy";
import { useFailedOpsCount, useSyncStatus } from "@/lib/engine/sync-queries";
import {
  type AccountStatus,
  useAccountStatus,
} from "@/lib/engine/use-account-status";
import type { SaveFailure } from "./use-mastery-session";

const accountLines = (account: AccountStatus): string[] => {
  if (account.kind !== "active") return [`Account: ${account.kind}`];
  const write = account.writeAccess.allowed
    ? "allowed"
    : `blocked (${account.writeAccess.reason})`;
  return [
    "Account: active",
    `Write access: ${write}`,
    `Review settings: ${account.reviewSettings.status}`,
    `Session expires: ${new Date(account.expiresAt).toISOString()}`,
  ];
};

const syncLines = (
  sync: SyncStatus | undefined,
  failedOps: number | undefined
): string[] => {
  if (!sync) return ["Sync: not loaded"];
  const lines = [
    `Sync: ${sync.state}${sync.state === "failed" ? ` (${sync.error.code})` : ""}`,
    `Pending changes: ${sync.pendingOperationsCount}`,
    `Failed changes: ${failedOps ?? "not loaded"}`,
    `Upload blocked: ${sync.pushBlocked ? "yes" : "no"}`,
    `Server revision: ${sync.serverRevision}`,
    `Last synced: ${
      sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toISOString() : "never"
    }`,
  ];
  if (sync.oldestPendingOperationAgeMs != null) {
    const hours = sync.oldestPendingOperationAgeMs / 3_600_000;
    lines.push(`Oldest pending change: ${hours.toFixed(1)} h old`);
  }
  return lines;
};

/** Mounted only while the dialog is open, so the storage checks run on open. */
const ReportBody = ({
  cardType,
  failures,
}: {
  cardType: CardType;
  failures: SaveFailure[];
}) => {
  const info = useDebugInfo();
  const storage = useAiStorageUsage();
  const voice = useAiVoiceState();
  const account = useAccountStatus();
  const sync = useSyncStatus();
  const failedOps = useFailedOpsCount()?.count;

  const report = [
    "Kanji Heatmap: answers not saved",
    `Captured: ${formatCaptureTimestamp()}`,
    `Screen: ${window.location.pathname} (${cardType} cards)`,
    "",
    `Unsaved answers (${failures.length})`,
    ...failures.map(
      (f) =>
        `${f.kanji} · ${f.rating} · ${f.code} · ${f.at.toISOString()} · ${copyForCode(f.code)}`
    ),
    "",
    ...accountLines(account),
    "",
    ...syncLines(sync, failedOps),
    "",
    formatDebugInfoForClipboard(info),
    ...formatStorageForClipboard(storage, voice),
  ].join("\n");

  return (
    <div className="flex flex-col gap-5 text-left">
      <p className="text-sm text-pretty">
        These answers stay due, so they come back in a later round. If this
        keeps happening, copy this report and send it to us.
      </p>
      <ErrorTerminal
        filename="unsaved-answers.log"
        content={report}
        className="max-w-none"
      />
    </div>
  );
};

/** The "View more" report behind "Some answers weren't saved". */
export const UnsavedAnswersDialog = ({
  open,
  cardType,
  failures,
  onClose,
}: {
  open: boolean;
  cardType: CardType;
  failures: SaveFailure[];
  onClose: () => void;
}) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <ScrollableDialogContent
      size="md"
      title="Some answers weren't saved"
      description="A report to copy and send to the developers"
      titleClassName="text-left"
    >
      <div className="flex flex-col gap-5">
        <ReportBody cardType={cardType} failures={failures} />
        <PracticeButton size="md" onClick={onClose}>
          Done
        </PracticeButton>
      </div>
    </ScrollableDialogContent>
  </Dialog>
);
