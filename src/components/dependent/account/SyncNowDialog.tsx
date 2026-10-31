import type { ReactNode } from "react";
import { CheckCircle2, CloudUpload, Loader2 } from "lucide-react";
import { DialogActions } from "@/components/common/DialogActions";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import {
  closeSyncNowDialog,
  syncNow,
  useSyncNowState,
  type SyncNowStatus,
} from "@/lib/engine/sync-now-dialog";
import { cnWarningText } from "@/lib/generic-cn";

const TITLES: Record<SyncNowStatus["kind"], string> = {
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

/** The sync failed: why, then try again or leave it for later. */
const Failed = ({ message }: { message: string }) => {
  const api = useEngineApi();
  return (
    <>
      <StatusBody icon={<span className="text-4xl">⚠️</span>}>
        <p role="alert" className={cnWarningText}>
          {message}
        </p>
        <p>
          Your changes are still saved on this device. Sync soon, or saving will
          pause.
        </p>
      </StatusBody>
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
 * "Sync now" from the week-old-changes banner: syncs while open, then says
 * whether it worked. Mounted once in App (see `sync-now-dialog.ts`).
 */
export const SyncNowDialog = () => {
  const { open, status } = useSyncNowState();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeSyncNowDialog();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title={TITLES[status.kind]}
        description="Uploading changes that haven't synced in a week"
        titleClassName="text-left"
      >
        <div key={status.kind} className="flex flex-col gap-4 pb-2">
          {status.kind === "syncing" && <Syncing />}
          {status.kind === "failed" && <Failed message={status.message} />}
          {status.kind === "synced" && <Synced />}
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};
