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
}: {
  trigger: ReactNode;
  content: ReactNode;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0 m-0" collisionPadding={16}>
        <PopoverCardArrow />
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
