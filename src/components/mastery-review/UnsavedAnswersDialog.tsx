import type { CardType, SyncStatus } from "engine-contract";
import { ErrorTerminal } from "@/components/common/ErrorTerminal";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useEffect, useState } from "react";
import { formatCaptureTimestamp } from "@/hooks/use-debug-info";
import { useDebugReport } from "@/hooks/use-debug-report";
import { formatMegabytes } from "@/lib/format-bytes";
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

type NavigatorExtras = Navigator & { deviceMemory?: number };
type EstimateWithDetails = StorageEstimate & {
  usageDetails?: Record<string, number>;
};

/**
 * What the browser itself says about storage and the device, read when the
 * report opens: quota and usage (per kind where the browser shares it),
 * whether storage is persistent, this site's databases, memory and cores.
 * Most useful when a grade failed because the device was out of storage.
 */
const useBrowserStorageLines = (): string[] => {
  const [lines, setLines] = useState<string[]>(["Browser storage: checking…"]);

  // Effect needed: the Storage and IndexedDB APIs are async browser calls,
  // read once when the report opens.
  useEffect(() => {
    let active = true;
    const read = async () => {
      const nav = navigator as NavigatorExtras;
      const out = ["Browser storage"];
      try {
        const estimate = (await navigator.storage?.estimate?.()) as
          | EstimateWithDetails
          | undefined;
        if (estimate?.usage != null && estimate.quota) {
          const pct = ((estimate.usage / estimate.quota) * 100).toFixed(1);
          out.push(
            `Used: ${formatMegabytes(estimate.usage)} of ${formatMegabytes(estimate.quota)} (${pct}%)`
          );
        } else {
          out.push("Used: not reported by this browser");
        }
        for (const [kind, bytes] of Object.entries(
          estimate?.usageDetails ?? {}
        )) {
          out.push(`  ${kind}: ${formatMegabytes(bytes)}`);
        }
      } catch {
        out.push("Used: couldn't read");
      }
      try {
        const persisted = await navigator.storage?.persisted?.();
        out.push(
          `Persistent storage: ${persisted == null ? "unknown" : persisted ? "yes" : "no"}`
        );
      } catch {
        out.push("Persistent storage: couldn't read");
      }
      try {
        const dbs = (await indexedDB.databases?.()) ?? [];
        out.push(
          `Databases: ${dbs.map((db) => `${db.name} v${db.version}`).join(", ") || "none listed"}`
        );
      } catch {
        out.push("Databases: couldn't list");
      }
      out.push(
        `Device memory: ${nav.deviceMemory != null ? `${nav.deviceMemory} GB` : "not reported"} · CPU cores: ${nav.hardwareConcurrency ?? "not reported"}`,
        `Language: ${navigator.language} · Cookies: ${navigator.cookieEnabled ? "on" : "off"}`,
        `User agent: ${navigator.userAgent}`
      );
      if (active) setLines(out);
    };
    void read();
    return () => {
      active = false;
    };
  }, []);

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
  const { text: debugReport } = useDebugReport();
  const browserStorage = useBrowserStorageLines();
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
    ...browserStorage,
    "",
    debugReport,
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
