import { useState } from "react";
import { SearchSettings } from "@/lib/settings/settings";
import { ErrorBoundary } from "@/components/error";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SortAndFilterButton } from "./SortAndFilterButton";
import { SortAndFilterSettingsForm } from "./SortAndFilterForm";

export const SortAndFilterSettingsDialog = ({
  initialValue,
  onSettle,
  initiallyOpen = false,
}: {
  onSettle: (x: SearchSettings) => void;
  initialValue: SearchSettings;
  initiallyOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <DialogTrigger asChild>
            <SortAndFilterButton
              onClick={() => {
                setIsOpen(true);
              }}
            />
          </DialogTrigger>
        </HoverCardTrigger>
        <HoverCardContent className="z-50 w-24 p-2 text-xs border rounded-md shadow-md outline-none bg-popover text-popover-foreground">
          Sort and Filter Settings
        </HoverCardContent>
      </HoverCard>
      <ScrollableDialogContent
        title="Sorting and Filtering Settings"
        description="Manage your Sorting and Filtering Settings"
        scrollBody={false}
        className="max-h-svh px-1 pb-4 md:px-4"
        headerClassName="px-0 pt-0"
        titleClassName="px-2 text-left"
        bodyClassName="px-0"
      >
        {isOpen && (
          <ErrorBoundary>
            <SortAndFilterSettingsForm
              initialValue={initialValue}
              onSettle={(val) => {
                onSettle(val);
                setIsOpen(false);
              }}
            />
          </ErrorBoundary>
        )}
      </ScrollableDialogContent>
    </Dialog>
  );
};
