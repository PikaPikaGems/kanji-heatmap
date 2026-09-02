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
        <ErrorBoundary
          fallback={
            <div className="p-4">
              <SmallUnexpectedErrorFallback />
            </div>
          }
        >
          {content}
        </ErrorBoundary>
      </PopoverContent>
    </Popover>
  );
};
