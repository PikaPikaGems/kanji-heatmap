import { forwardRef } from "react";
import { Settings2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { hasNoFilters } from "@/lib/results-utils";
import { useSearchSettings } from "@/providers/search-settings-hooks";

const ChangedIndicator = () => {
  const settings = useSearchSettings();
  const noFilters = hasNoFilters(settings);

  if (noFilters) {
    return null;
  }

  return (
    <div className="absolute -top-1.5 -right-2 h-[18px] w-[18px] border-4 border-white dark:border-black bg-red-500 rounded-full font-bold flex items-center justify-center" />
  );
};

export const SortAndFilterButton = forwardRef<
  HTMLButtonElement,
  { onClick: () => void }
>(({ onClick }, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      className="relative h-9 w-9 shrink-0"
      onClick={onClick}
    >
      <Settings2 />
      <span className="sr-only">Sort and Filter Settings</span>
      <ChangedIndicator />
    </Button>
  );
});

SortAndFilterButton.displayName = "SortAndFilterButton";
