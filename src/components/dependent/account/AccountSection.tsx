import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "@/components/ui/button";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { openRecoveryDialog } from "@/lib/engine/recovery-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { ActiveAccount } from "./ActiveAccount";
import { FsrsSettingsItem } from "./FsrsSettingsItem";

/**
 * Account area of the sidebar. Renders nothing when this build has no study
 * engine, so the default app looks as it did before accounts existed.
 */
export const AccountSection = () => {
  const status = useAccountStatus();

  if (status.kind === "loading") return null;
  if (status.kind === "unavailable") {
    if (status.reason === "not-included" || status.reason === "failed") {
      return null;
    }
    return (
      <p className="p-2 text-xs text-left border border-dashed rounded-xl text-muted-foreground">
        {UPDATE_BROWSER_COPY}
      </p>
    );
  }
  if (status.kind === "error") {
    return (
      <p className="text-[10px] text-muted-foreground">
        Account status unavailable ({status.diagnosticId})
      </p>
    );
  }

  return (
    <div onPointerDown={(e) => e.stopPropagation()}>
      {status.kind === "signed-out" && (
        <div className="flex flex-col gap-1">
          {/* The dialog lives outside the drawer, so close the drawer first. */}
          <DrawerPrimitive.Close asChild>
            <Button
              variant="outline"
              className="w-full"
              onClick={openLoginDialog}
            >
              Log in
            </Button>
          </DrawerPrimitive.Close>
          <FsrsSettingsItem />
        </div>
      )}
      {status.kind === "recovery" && (
        <DrawerPrimitive.Close asChild>
          <Button
            variant="outline"
            className="w-full"
            onClick={openRecoveryDialog}
          >
            Fix saved data on this device
          </Button>
        </DrawerPrimitive.Close>
      )}
      {status.kind === "active" && <ActiveAccount status={status} />}
    </div>
  );
};
