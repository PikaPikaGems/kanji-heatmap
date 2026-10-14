import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { copyForCode, UNSYNCED_LOGOUT_COPY } from "@/lib/engine/engine-copy";
import {
  openSyncOperations,
  type SyncOperationsTab,
} from "@/lib/engine/sync-operations-dialog";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import type { ActionStatus } from "./action-status";
import { SyncNowButton } from "./SyncNowButton";

type LogoutView =
  | { kind: "menu" }
  | { kind: "confirm-clear"; hasRejectedNotes: boolean };

type MenuStatus =
  | { kind: "idle" }
  | { kind: "busy"; action: "logout" | "prepare-clear" }
  | { kind: "error"; message: string };

/** Opens the operations modal; it lives outside the drawer, so close that first. */
const OperationsLink = ({
  tab,
  children,
}: {
  tab: SyncOperationsTab;
  children: string;
}) => (
  <DrawerPrimitive.Close asChild>
    <button
      type="button"
      className="font-semibold text-left underline underline-offset-4"
      onClick={() => openSyncOperations(tab)}
    >
      {children}
    </button>
  </DrawerPrimitive.Close>
);

const clearDataLabel = "Log out and remove all my data from this device";

const LogoutMenu = ({
  pendingCount,
  onAction,
}: {
  pendingCount: number;
  onAction: (view: LogoutView) => void;
}) => {
  const api = useEngineApi();
  const [status, setStatus] = useState<MenuStatus>({ kind: "idle" });
  const busy = status.kind === "busy";

  const logout = async () => {
    if (!api || busy) return;
    setStatus({ kind: "busy", action: "logout" });
    const result = await api.auth.logout();
    // On success the account status flips to signed out and this unmounts.
    setStatus(
      result.ok
        ? { kind: "idle" }
        : { kind: "error", message: copyForCode(result.error.code) }
    );
  };

  const prepareClear = async () => {
    if (!api || busy) return;
    setStatus({ kind: "busy", action: "prepare-clear" });
    const failures = await api.sync.recentFailedOperations().catch(() => []);
    onAction({
      kind: "confirm-clear",
      hasRejectedNotes: failures.some(
        (op) =>
          op.operationType === "note-save" &&
          op.state === "permanently-rejected"
      ),
    });
  };

  const logoutBusy = status.kind === "busy" && status.action === "logout";

  return (
    <div className="flex flex-col gap-2 text-left">
      {pendingCount > 0 && (
        <>
          <p>{UNSYNCED_LOGOUT_COPY}</p>
          <OperationsLink tab="pending">View unsynced changes</OperationsLink>
          <SyncNowButton />
        </>
      )}
      <Button
        variant={pendingCount > 0 ? "outline" : "default"}
        size="sm"
        disabled={!api || busy}
        onClick={() => void logout()}
      >
        {logoutBusy && <Loader2 className="animate-spin" />}
        {pendingCount > 0 ? "Log out anyway" : "Log out"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto py-2 text-xs text-left whitespace-normal text-destructive hover:text-destructive"
        disabled={!api || busy}
        onClick={() => void prepareClear()}
      >
        {status.kind === "busy" && status.action === "prepare-clear" && (
          <Loader2 className="animate-spin" />
        )}
        {clearDataLabel}
      </Button>
      {status.kind === "error" && (
        <p role="alert" className="text-destructive">
          {status.message}
        </p>
      )}
    </div>
  );
};

const ConfirmClear = ({
  hasRejectedNotes,
  onAction,
}: {
  hasRejectedNotes: boolean;
  onAction: (view: LogoutView) => void;
}) => {
  const api = useEngineApi();
  const [status, setStatus] = useState<ActionStatus>({ kind: "idle" });
  const busy = status.kind === "busy";

  const clear = async () => {
    if (!api || busy) return;
    setStatus({ kind: "busy" });
    const result = await api.auth.logout({ clearLocalData: true });
    setStatus(
      result.ok
        ? { kind: "idle" }
        : { kind: "error", message: copyForCode(result.error.code) }
    );
  };

  return (
    <div className="flex flex-col gap-2 text-left">
      <p className="font-semibold">Remove all your data from this device?</p>
      <p>Unsynced changes on this device will be lost.</p>
      {hasRejectedNotes && (
        <>
          <p>Some rejected notes may only exist on this device.</p>
          <OperationsLink tab="attention">Review rejected notes</OperationsLink>
        </>
      )}
      <Button
        variant="destructive"
        size="sm"
        className="h-auto py-2 text-xs whitespace-normal"
        disabled={!api || busy}
        onClick={() => void clear()}
      >
        {busy && <Loader2 className="animate-spin" />}
        {clearDataLabel}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => onAction({ kind: "menu" })}
      >
        Cancel
      </Button>
      {status.kind === "error" && (
        <p role="alert" className="text-destructive">
          {status.message}
        </p>
      )}
    </div>
  );
};

const LogoutPopoverBody = ({ pendingCount }: { pendingCount: number }) => {
  const [view, setView] = useState<LogoutView>({ kind: "menu" });

  if (view.kind === "confirm-clear") {
    return (
      <ConfirmClear
        hasRejectedNotes={view.hasRejectedNotes}
        onAction={setView}
      />
    );
  }
  return <LogoutMenu pendingCount={pendingCount} onAction={setView} />;
};

/** Logout icon button; its popover has the unsynced-changes warning. */
export const LogoutPopover = ({ pendingCount }: { pendingCount: number }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="iconXl" aria-label="Log out">
        <LogOut className="w-[1.2rem] h-[1.2rem]" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-60 p-3 text-xs" align="end">
      <LogoutPopoverBody pendingCount={pendingCount} />
    </PopoverContent>
  </Popover>
);
