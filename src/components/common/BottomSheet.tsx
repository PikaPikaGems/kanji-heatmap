import { ReactNode } from "react";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { CircleX } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

/** Dashed-top bottom-sheet chrome shared by the app's vaul drawers. */
export const BOTTOM_SHEET_CHROME_CN =
  "!select-text !duration-200 border-2 border-t-4 [border-top-style:dashed]";

/** Visual style of the floating CircleX close button (shared with the
 * non-drawer loading shell, which needs a plain onClick button). */
export const SHEET_CLOSE_BTN_CN =
  "p-4 border-2 border-dashed rounded-xl bg-background";

export const DrawerCloseButton = () => (
  <DrawerClose asChild className="absolute top-2 right-2">
    <Button
      variant="ghost"
      size="icon"
      className={`${SHEET_CLOSE_BTN_CN} z-1000!`}
    >
      <CircleX className="size-8" />
    </Button>
  </DrawerClose>
);

/** Full-height search drawer (radical picker, handwriting pad) with sr-only
 * labelling and the shared close button. */
export const SearchDrawerShell = ({
  isOpen,
  onClose,
  title,
  description,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <Drawer open={isOpen} onClose={onClose} autoFocus={true}>
    <DrawerContent className={`${BOTTOM_SHEET_CHROME_CN} max-h-[100dvh]`}>
      <DrawerTitle className="sr-only">{title}</DrawerTitle>
      <DrawerDescription className="sr-only">{description}</DrawerDescription>
      <ErrorBoundary>{children}</ErrorBoundary>
      <DrawerCloseButton />
    </DrawerContent>
  </Drawer>
);
