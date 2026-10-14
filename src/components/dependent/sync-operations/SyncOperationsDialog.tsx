import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEngineState } from "@/lib/engine/engine";
import {
  closeSyncOperations,
  type SyncOperationsTab,
  useSyncOperationsDialog,
} from "@/lib/engine/sync-operations-dialog";
import { useFailedOpsCount, useSyncStatus } from "@/lib/engine/sync-queries";
import { NeedsAttentionTab } from "./NeedsAttentionTab";
import { PendingTab } from "./PendingTab";
import { SyncHeader } from "./SyncHeader";

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
    <div className="flex flex-col gap-4 px-2 pt-2 text-left">
      <SyncHeader sync={sync} />
      <Tabs
        value={tab}
        onValueChange={(next) =>
          setTab(next === "attention" ? "attention" : "pending")
        }
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="attention">
            Needs attention ({failedCount})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <PendingTab total={pendingCount} />
        </TabsContent>
        <TabsContent value="attention">
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
        className="max-w-2xl"
        title="Sync"
        description="Changes waiting to upload and operations that need attention"
        titleClassName="text-left"
      >
        <SyncOperationsBody requestedTab={dialog.open ? dialog.tab : null} />
      </ScrollableDialogContent>
    </Dialog>
  );
};
