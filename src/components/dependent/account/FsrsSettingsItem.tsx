import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Sidebar icon button for the FSRS settings dialog (design 5.6). The sidebar
 * owns the opening: it closes itself, opens the dialog, and comes back after.
 */
export const FsrsSettingsItem = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="outline"
    size="iconXl"
    aria-label="FSRS settings"
    title="FSRS settings"
    onClick={onClick}
  >
    <SlidersHorizontal className="w-[1.2rem] h-[1.2rem]" />
  </Button>
);
