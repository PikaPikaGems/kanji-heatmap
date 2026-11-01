import type { ReactNode } from "react";
import { CheckCircle2, CloudUpload, Loader2 } from "lucide-react";
import { DialogActions } from "@/components/common/DialogActions";
import { ErrorTerminal } from "@/components/common/ErrorTerminal";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { formatCaptureTimestamp } from "@/hooks/use-debug-info";
import { useDebugReport } from "@/hooks/use-debug-report";
import { useNetworkState } from "@/hooks/use-network-state";
import { useFailedOpsCount, useSyncStatus } from "@/lib/engine/sync-queries";
import { openSyncOperations } from "@/lib/engine/sync-operations-dialog";
import { accountLines, syncLines } from "@/lib/engine/sync-report-lines";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import {
  closeSyncNowDialog,
  syncNow,
  useSyncNowState,
  type SyncNowStatus,
} from "@/lib/engine/sync-now-dialog";
import { cnWarningText } from "@/lib/generic-cn";
import { type SyncAttention, useSyncAttention } from "./old-pending";

const TITLES: Record<Exclude<SyncNowStatus["kind"], "info">, string> = {
  syncing: "Syncing your changes…",
  failed: "Couldn't sync",
  synced: "All synced",
};

/** A big icon over a line or two of text, centered. */
const StatusBody = ({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-3 py-4 text-sm text-center text-pretty animate-fade-in-fast">
    {icon}
    {children}
  </div>
);

/** The "info" step's title and why, by how urgently this device needs to sync. */
const INFO: Record<SyncAttention, { title: string; why: string }> = {
  soon: {
    title: "Please sync soon",
    why: "Some changes on this device haven't uploaded to your account in over a week. If they wait too long, saving pauses until this device syncs.",
  },
  "paused-stale": {
    title: "Saving is paused",
    why: "Some changes on this device haven't uploaded to your account for too long, so saving is paused until this device syncs.",
  },
  "paused-full": {
    title: "Saving is paused",
    why: "Too many changes on this device are waiting to upload, so saving is paused until this device syncs.",
  },
  // Synced in the background while the dialog was open.
  none: {
    title: "Sync your changes",
    why: "Nothing is waiting to upload right now.",
  },
};

/**
 * Opened from the bottom banner's "Learn more": why this device needs to
 * sync, what's paused, and Sync now (which moves on to "syncing").
 */
const Info = ({ attention }: { attention: SyncAttention }) => {
  const api = useEngineApi();
  const { online } = useNetworkState();
  const paused = attention === "paused-stale" || attention === "paused-full";

  return (
    <>
      <div className="flex flex-col gap-3 text-sm text-left text-pretty animate-fade-in-fast">
        <p>{INFO[attention].why}</p>
        {paused && (
          <ul className="flex flex-col gap-2 pl-5 list-disc">
            <li>
              Until then, you can&apos;t bookmark, edit notes, add to your
              review pile or review cards.
            </li>
            <li>
              You can keep practicing, but those rounds aren&apos;t recorded.
            </li>
          </ul>
        )}
        <p>Everything you saved is still on this device.</p>
        {!online && (
          <UserNotice>You&apos;re offline. Go online, then sync.</UserNotice>
        )}
      </div>
      <DialogActions>
        <PracticeButton variant="ghost" onClick={closeSyncNowDialog}>
          Later
        </PracticeButton>
        <PracticeButton
          variant="primary"
          disabled={!api || !online}
          onClick={() => {
            if (api) void syncNow(api);
          }}
        >
          Sync now
        </PracticeButton>
      </DialogActions>
    </>
  );
};

/** While `sync.catchUp()` runs: a spinner, and a way to stop waiting. */
const Syncing = () => (
  <>
    <StatusBody
      icon={
        <span className="relative flex items-center justify-center size-14">
          <CloudUpload aria-hidden className="size-7 text-muted-foreground" />
          <Loader2
            aria-hidden
            className="absolute inset-0 size-14 animate-spin text-muted-foreground/40"
          />
        </span>
      }
    >
      <p role="status">Uploading the changes saved on this device.</p>
    </StatusBody>
    <DialogActions>
      <PracticeButton variant="ghost" onClick={closeSyncNowDialog}>
        I&apos;ll sync later
      </PracticeButton>
    </DialogActions>
  </>
);

/**
 * What went wrong, with account and sync state and the app & device info,
 * to copy and send us. Mounted only while the sync has failed.
 */
const SyncFailureReport = ({
  code,
  message,
}: {
  code: string;
  message: string;
}) => {
  const { text: debugReport } = useDebugReport();
  const account = useAccountStatus();
  const sync = useSyncStatus();
  const failedOps = useFailedOpsCount()?.count;

  const report = [
    "Kanji Heatmap: couldn't sync",
    `Captured: ${formatCaptureTimestamp()}`,
    `Screen: ${window.location.pathname}`,
    `Error: ${code}`,
    `Message: ${message}`,
    "",
    ...accountLines(account),
    "",
    ...syncLines(sync, failedOps),
    "",
    debugReport,
  ].join("\n");

  return (
    <div className="flex flex-col gap-2 text-left animate-fade-in-fast">
      <p className="text-sm text-pretty">
        If this keeps happening, copy this report and send it to us.
      </p>
      <ErrorTerminal
        filename="sync-failed.log"
        content={report}
        className="max-w-none"
      />
    </div>
  );
};

/** The sync failed: why, a report to send us, then try again or later. */
const Failed = ({ code, message }: { code: string; message: string }) => {
  const api = useEngineApi();
  return (
    <>
      <StatusBody icon={<span className="text-4xl">⚠️</span>}>
        <p role="alert" className={cnWarningText}>
          {message}
        </p>
        <p>
          Your changes are still saved on this device. Sync soon, or saving will
          pause.{" "}
          <NoticeAction
            onClick={() => {
              // One modal at a time.
              closeSyncNowDialog();
              openSyncOperations(null);
            }}
          >
            See Unsynced changes
          </NoticeAction>
        </p>
      </StatusBody>
      <SyncFailureReport code={code} message={message} />
      <DialogActions>
        <PracticeButton variant="ghost" onClick={closeSyncNowDialog}>
          I&apos;ll sync later
        </PracticeButton>
        <PracticeButton
          variant="primary"
          disabled={!api}
          onClick={() => {
            if (api) void syncNow(api);
          }}
        >
          Try again
        </PracticeButton>
      </DialogActions>
    </>
  );
};

/** Every change is uploaded; the banner is already gone. */
const Synced = () => (
  <>
    <StatusBody
      icon={<CheckCircle2 aria-hidden className="text-green-500 size-14" />}
    >
      <p role="status">Your changes are saved to your account.</p>
    </StatusBody>
    <PracticeButton size="md" onClick={closeSyncNowDialog}>
      Done
    </PracticeButton>
  </>
);

/**
 * The Sync now dialog: "info" from the bottom banner's "Learn more", then
 * syncing and whether it worked ("Sync now" elsewhere starts at syncing).
 * Mounted once in App (see `sync-now-dialog.ts`).
 */
export const SyncNowDialog = () => {
  const { open, status } = useSyncNowState();
  const attention = useSyncAttention();
  const title =
    status.kind === "info" ? INFO[attention].title : TITLES[status.kind];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeSyncNowDialog();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title={title}
        description="Uploading the changes saved on this device"
        titleClassName="text-left"
      >
        <div key={status.kind} className="flex flex-col gap-4 pb-2">
          {status.kind === "info" && <Info attention={attention} />}
          {status.kind === "syncing" && <Syncing />}
          {status.kind === "failed" && (
            <Failed code={status.code} message={status.message} />
          )}
          {status.kind === "synced" && <Synced />}
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};
