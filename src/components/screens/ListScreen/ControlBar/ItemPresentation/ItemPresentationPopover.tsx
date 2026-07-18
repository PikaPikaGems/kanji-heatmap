import { useState, ReactNode } from "react";
import { Flower } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { GenericPopover } from "@/components/common/GenericPopover";

const ItemPresentationSettingsPopover = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <GenericPopover
      open={isOpen}
      onOpenChange={setIsOpen}
      showArrow={false}
      contentClassName="mx-4 max-h-[80svh] overflow-y-auto overflow-x-hidden z-40"
      trigger={
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onMouseEnter={() => {
            setIsOpen(true);
          }}
        >
          <Flower />
          <span className="sr-only">Card Presentation Settings</span>
        </Button>
      }
      // Mount the settings form only while open.
      content={isOpen ? children : null}
    />
  );
};

export default ItemPresentationSettingsPopover;
