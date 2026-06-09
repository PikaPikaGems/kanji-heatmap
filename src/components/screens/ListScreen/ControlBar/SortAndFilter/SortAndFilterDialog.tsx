import { useState } from "react";
import { SearchSettings } from "@/lib/settings/settings";
import { ErrorBoundary } from "@/components/error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SortAndFilterSettingsForm } from "./SortAndFilterForm";
import { SortAndFilterButton } from "./SortAndFilterButton";

export const SortAndFilterSettingsDialog = ({
  initialValue,
  onSettle,
}: {
  onSettle: (x: SearchSettings) => void;
  initialValue: SearchSettings;
}) => {
  const [isOpen, setIsOpen] = useState(false);

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
      <DialogContent
        className={
          "max-h-svh z-50 flex flex-col min-h-0 px-1 md:px-4 pb-4"
        }
      >
        <DialogHeader>
          <DialogTitle className="m-0 text-left">
            Sorting and Filtering Settings
          </DialogTitle>
          <DialogDescription className="sr-only">
            Manage your Sorting and Filtering Settings
          </DialogDescription>
        </DialogHeader>
        <ErrorBoundary>
          <SortAndFilterSettingsForm
            initialValue={initialValue}
            onSettle={(val) => {
              onSettle(val);
              setIsOpen(false);
            }}
          />
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};
