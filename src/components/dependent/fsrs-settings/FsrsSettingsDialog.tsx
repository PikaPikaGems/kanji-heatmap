import type { EngineAPI } from "engine-contract";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { useEngineState } from "@/lib/engine/engine";
import {
  closeFsrsSettings,
  useFsrsSettingsOpen,
} from "@/lib/engine/fsrs-settings-dialog";
import {
  getWriteBlocker,
  useAccountStatus,
} from "@/lib/engine/use-account-status";
import { snapshotValue } from "@/lib/engine/store-cache";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import { FsrsSettingsForm, type SaveBlocker } from "./FsrsSettingsForm";

const Loading = ({ children }: { children: string }) => (
  <p
    role="status"
    className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-muted-foreground"
  >
    <Loader2 className="size-4 animate-spin" aria-hidden />
    {children}
  </p>
);

/**
 * What the dialog shows for the current account: the form with defaults when
 * logged out (Save disabled), or with the account's current settings once they
 * load.
 */
const FsrsSettingsScreen = ({ api }: { api: EngineAPI }) => {
  const status = useAccountStatus();
  const current = useEngineQuery("reviews.settings.watchCurrent", (engine) =>
    engine.reviews.settings.watchCurrent()
  );
  const defaults = api.reviews.settings.defaultSettings;

  if (status.kind === "loading") return <Loading>Loading…</Loading>;
  if (status.kind === "signed-out") {
    return (
      <FsrsSettingsForm
        api={api}
        initial={defaults}
        blocker={{ kind: "signed-out" }}
        notice={null}
      />
    );
  }
  if (status.kind !== "active") {
    return (
      <FsrsSettingsForm
        api={api}
        initial={defaults}
        blocker={{
          kind: "write",
          reason: getWriteBlocker(status) ?? "loading",
        }}
        notice={null}
      />
    );
  }

  const writeBlocker = getWriteBlocker(status);
  const blocker: SaveBlocker | null =
    status.reviewSettings.status === "update_required"
      ? { kind: "update-required" }
      : writeBlocker === null
        ? null
        : { kind: "write", reason: writeBlocker };

  const value = snapshotValue(current);
  if (value) {
    return (
      <FsrsSettingsForm
        api={api}
        initial={value}
        blocker={blocker}
        notice={null}
      />
    );
  }
  if (blocker?.kind === "update-required") {
    return (
      <FsrsSettingsForm
        api={api}
        initial={defaults}
        blocker={blocker}
        notice={null}
      />
    );
  }
  if (current.status === "loading") {
    return <Loading>Loading your settings…</Loading>;
  }
  // The read failed; the form still works, but say what it started from.
  return (
    <FsrsSettingsForm
      api={api}
      initial={defaults}
      blocker={blocker}
      notice="Couldn't load your current settings, so this shows the defaults. Saving replaces your saved settings."
    />
  );
};

/**
 * The one app-wide FSRS settings dialog (design 5.6), mounted once in App.
 * Opened with `openFsrsSettings()`. Renders nothing until the engine is ready.
 */
export const FsrsSettingsDialog = () => {
  const open = useFsrsSettingsOpen();
  const engine = useEngineState();
  if (engine.status !== "ready") return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeFsrsSettings();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title="FSRS Scheduler Settings"
        description="Review scheduling settings for your Kanji Heatmap account"
        titleClassName="text-left"
        scrollBody={false}
      >
        <FsrsSettingsScreen api={engine.api} />
      </ScrollableDialogContent>
    </Dialog>
  );
};
