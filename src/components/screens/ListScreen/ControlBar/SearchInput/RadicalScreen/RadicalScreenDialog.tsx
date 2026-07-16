import ErrorBoundary from "@/components/error/ErrorBoundary";
import { CircleX } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  Drawer,
} from "@/components/ui/drawer";
import { ReactNode } from "react";

export const RadicalsScreenDialog = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) => {
  return (
    <Drawer open={isOpen} onClose={onClose} autoFocus={true}>
      <DrawerContent className="!select-text max-h-[100dvh] !duration-200 border-2 border-t-4 [border-top-style:dashed]">
        <DrawerTitle className="sr-only">Radical Search</DrawerTitle>
        <DrawerDescription className="sr-only">
          Search by Radical
        </DrawerDescription>
        <ErrorBoundary>{children}</ErrorBoundary>
        <DrawerClose asChild className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            className="p-4 border-2 border-dashed rounded-xl bg-background z-1000!"
          >
            <CircleX className="size-8" />
          </Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
};
