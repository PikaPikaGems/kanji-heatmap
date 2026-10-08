import { ReactNode } from "react";
import {
  Popover,
  PopoverCardArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SmallUnexpectedErrorFallback } from "../error/SmallUnexpectedErrorFallback";
import { ErrorBoundary } from "../error";

export const GenericPopover = ({
  trigger,
  content,
  contentClassName = "w-auto p-0 m-0",
  showArrow = true,
  modal = false,
  open,
  onOpenChange,
}: {
  trigger: ReactNode;
  content: ReactNode;
  /** Merged over PopoverContent's base classes (w-72 p-4 …). */
  contentClassName?: string;
  showArrow?: boolean;
  /**
   * Needed inside Dialog/Drawer: otherwise the portaled content sits outside
   * the overlay and cannot be clicked.
   */
  modal?: boolean;
  /** Pass both for a controlled popover; omit for uncontrolled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  return (
    <Popover modal={modal} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className={contentClassName} collisionPadding={16}>
        {showArrow && <PopoverCardArrow />}
        {/* A long popover (the radical popover's text) can be taller than the
            space beside its trigger; scroll inside it instead of running off
            the screen. Radix sets the available height on the content; 1rem
            leaves room for the content's own padding. */}
        <div className="max-h-[calc(var(--radix-popover-content-available-height)-1rem)] overflow-y-auto">
          <ErrorBoundary
            fallback={
              <div className="p-4">
                <SmallUnexpectedErrorFallback />
              </div>
            }
          >
            {content}
          </ErrorBoundary>
        </div>
      </PopoverContent>
    </Popover>
  );
};
