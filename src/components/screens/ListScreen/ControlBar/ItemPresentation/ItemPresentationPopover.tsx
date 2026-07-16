import { useState, ReactNode } from "react";
import { Flower } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ItemPresentationSettingsPopover = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Popover
      open={isOpen}
      onOpenChange={(newState) => {
        setIsOpen(newState);
      }}
    >
      <PopoverTrigger
        onMouseEnter={() => {
          setIsOpen(true);
        }}
        asChild
      >
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
          <Flower />
          <span className="sr-only">Card Presentation Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mx-4 max-h-[80svh] overflow-y-auto overflow-x-hidden z-40">
        {isOpen ? children : null}
      </PopoverContent>
    </Popover>
  );
};

export default ItemPresentationSettingsPopover;
