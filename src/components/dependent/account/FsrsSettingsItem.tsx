import { SlidersHorizontal } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "@/components/ui/button";
import { openFsrsSettings } from "@/lib/engine/fsrs-settings-dialog";

/** Sidebar icon button that opens the FSRS settings dialog (design 5.6). */
export const FsrsSettingsItem = () => (
  // The dialog lives outside the drawer, so close the drawer first.
  <DrawerPrimitive.Close asChild>
    <Button
      variant="outline"
      size="iconXl"
      aria-label="FSRS settings"
      title="FSRS settings"
      onClick={openFsrsSettings}
    >
      <SlidersHorizontal className="w-[1.2rem] h-[1.2rem]" />
    </Button>
  </DrawerPrimitive.Close>
);
