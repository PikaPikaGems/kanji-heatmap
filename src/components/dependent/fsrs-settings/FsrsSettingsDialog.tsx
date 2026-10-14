import type { EngineAPI } from "engine-contract";
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

const Message = ({ children }: { children: string }) => (
  <p className="px-6 py-8 text-sm text-center text-muted-foreground">
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

  if (status.kind === "loading") return <Message>Loading…</Message>;
  if (status.kind === "signed-out") {
    return (
      <FsrsSettingsForm
        api={api}
        initial={defaults}
        blocker={{ kind: "signed-out" }}
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
    return <FsrsSettingsForm api={api} initial={value} blocker={blocker} />;
  }
  if (blocker?.kind === "update-required") {
    return <FsrsSettingsForm api={api} initial={defaults} blocker={blocker} />;
  }
  if (current.status === "ready" || current.status === "failed") {
    return <Message>Couldn&apos;t load your settings.</Message>;
  }
  return <Message>Loading your settings…</Message>;
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
        className="max-w-3xl"
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
