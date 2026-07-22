import { useState } from "react";
import { Flower } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { GenericPopover } from "@/components/common/GenericPopover";
import { ErrorBoundary } from "@/components/error";
import { ItemPresentationSettingsContent } from "./ItemPresentationContent";

const ItemPresentationSettingsPopover = ({
  initiallyOpen = false,
}: {
  initiallyOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
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
      content={
        isOpen ? (
          <ErrorBoundary details="ItemPresentationSettingsContent in ItemPresentationPopover">
            <ItemPresentationSettingsContent />
          </ErrorBoundary>
        ) : null
      }
    />
  );
};

export default ItemPresentationSettingsPopover;
