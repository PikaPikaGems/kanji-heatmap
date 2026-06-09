import { ReactNode } from "react";
import {
  Popover,
  PopoverCardArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
        {content}
      </PopoverContent>
    </Popover>
  );
};
