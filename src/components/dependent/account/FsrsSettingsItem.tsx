import { SlidersHorizontal } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "@/components/ui/button";
import { openFsrsSettings } from "@/lib/engine/fsrs-settings-dialog";

/** Sidebar item that opens the FSRS settings dialog (design 5.6). */
export const FsrsSettingsItem = () => (
  // The dialog lives outside the drawer, so close the drawer first.
  <DrawerPrimitive.Close asChild>
    <Button
      variant="ghost"
      size="sm"
      className="justify-start w-full"
      onClick={openFsrsSettings}
    >
      <SlidersHorizontal />
      FSRS settings
    </Button>
  </DrawerPrimitive.Close>
);
