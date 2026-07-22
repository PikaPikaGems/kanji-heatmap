import { lazy, useState } from "react";
import { Loader2 } from "lucide-react";
import { SearchSettings } from "@/lib/settings/settings";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SortAndFilterButton } from "./SortAndFilterButton";

const SortAndFilterSettingsDialog = lazy(() =>
  import("./SortAndFilterDialog").then((m) => ({
    default: m.SortAndFilterSettingsDialog,
  }))
);

export const SortAndFilterLoadingFallback = () => (
  <Button
    variant="outline"
    size="icon"
    className="relative h-9 w-9 shrink-0"
    aria-label="Loading sort and filter settings"
    disabled
  >
    <Loader2 className="animate-spin" />
  </Button>
);

/**
 * Keeps the sort/filter dialog out of the list-screen chunk until opened.
 * While the chunk loads, Suspense shows {@link SortAndFilterLoadingFallback}
 * in place of the trigger so the control bar does not shift.
 */
const LazySortAndFilter = ({
  initialValue,
  onSettle,
}: {
  onSettle: (x: SearchSettings) => void;
  initialValue: SearchSettings;
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);

  if (!shouldLoad) {
    return (
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <SortAndFilterButton onClick={() => setShouldLoad(true)} />
        </HoverCardTrigger>
        <HoverCardContent className="z-50 w-24 p-2 text-xs border rounded-md shadow-md outline-none bg-popover text-popover-foreground">
          Sort and Filter Settings
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <SortAndFilterSettingsDialog
      initiallyOpen
      initialValue={initialValue}
      onSettle={onSettle}
    />
  );
};

export default LazySortAndFilter;
