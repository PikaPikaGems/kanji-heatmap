import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { SegmentedTabsList } from "@/components/ui/segmented-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useEngineState } from "@/lib/engine/engine";
import {
  closeSyncOperations,
  type SyncOperationsTab,
  useSyncOperationsDialog,
} from "@/lib/engine/sync-operations-dialog";
import { useFailedOpsCount, useSyncStatus } from "@/lib/engine/sync-queries";
import { cn } from "@/lib/utils";
import { NeedsAttentionTab } from "./NeedsAttentionTab";
import { PendingTab } from "./PendingTab";
import { SyncHeader } from "./SyncHeader";

/** A tab's name with its count in a small pill; yellow when failures wait. */
const TabLabel = ({
  text,
  count,
  warn = false,
}: {
  text: string;
  count: number;
  warn?: boolean;
}) => (
  <span className="inline-flex items-center gap-1.5">
    {text}
    <span
      className={cn(
        "min-w-5 rounded-full px-1.5 text-xs leading-5 tabular-nums",
        warn && count > 0
          ? "bg-yellow-500/20 font-bold text-yellow-700 dark:text-yellow-400"
          : "bg-foreground/10"
      )}
    >
      {count}
    </span>
  </span>
);

const SyncOperationsBody = ({
  requestedTab,
}: {
  requestedTab: SyncOperationsTab | null;
}) => {
  const sync = useSyncStatus();
  const failedCount = useFailedOpsCount()?.count ?? 0;
  const pendingCount = sync?.pendingOperationsCount ?? 0;
  const [tab, setTab] = useState<SyncOperationsTab>(
    requestedTab ??
      (failedCount > 0 && pendingCount === 0 ? "attention" : "pending")
  );

  return (
    <div className="flex flex-col gap-4 px-2 pt-1 text-left">
      <SyncHeader sync={sync} />
      <Tabs
        value={tab}
        onValueChange={(next) =>
          setTab(next === "attention" ? "attention" : "pending")
        }
      >
        <SegmentedTabsList
          value={tab}
          label="Unsynced changes"
          className="w-full"
          options={[
            {
              value: "pending",
              label: <TabLabel text="Pending" count={pendingCount} />,
            },
            {
              value: "attention",
              label: (
                <TabLabel text="Needs attention" count={failedCount} warn />
              ),
            },
          ]}
        />
        {/* Radix mounts only the open tab, so each switch fades in. */}
        <TabsContent value="pending" className="mt-4 animate-fade-in-fast">
          <PendingTab total={pendingCount} />
        </TabsContent>
        <TabsContent value="attention" className="mt-4 animate-fade-in-fast">
          <NeedsAttentionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * The one app-wide pending / failed operations dialog (design 5.7), mounted
 * once in App. Opened with `openSyncOperations()`. Renders nothing until the
 * engine is ready.
 */
export const SyncOperationsDialog = () => {
  const dialog = useSyncOperationsDialog();
  const engine = useEngineState();
  if (engine.status !== "ready") return null;

  return (
    <Dialog
      open={dialog.open}
      onOpenChange={(next) => {
        if (!next) closeSyncOperations();
      }}
    >
      <ScrollableDialogContent
        className="max-w-xl"
        title="Unsynced changes"
        description="Changes waiting to upload and operations that need attention"
        titleClassName="text-left"
      >
        <SyncOperationsBody requestedTab={dialog.open ? dialog.tab : null} />
      </ScrollableDialogContent>
    </Dialog>
  );
};
