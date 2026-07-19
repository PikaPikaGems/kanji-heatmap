import React from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { ErrorBoundary } from "@/components/error";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  BOTTOM_SHEET_CHROME_CN,
  DrawerCloseButton,
} from "@/components/common/BottomSheet";

import { KanjiInfoContent } from "./KanjiInfoContent";

export function KanjiDrawerRaw({
  isOpen,
  onClose,
  kanji,
}: {
  isOpen: boolean;
  onClose: () => void;
  kanji: string;
}) {
  useHtmlDocumentTitle(kanji);

  // need autoFocus=true see also: https://github.com/emilkowalski/vaul/issues/517#issuecomment-2571619213
  // Also: autoFocus=true prevents the issue of search input from unnecessarily retaining focus
  return (
    <Drawer open={isOpen} onClose={onClose} autoFocus={true}>
      <DrawerContent
        className={`${BOTTOM_SHEET_CHROME_CN} h-[calc(100dvh_-_40px)]`}
      >
        <DrawerTitle className="sr-only">Information for Kanji</DrawerTitle>
        <DrawerDescription className="sr-only">
          Includes Sample Usage, Semantic Phonetic Compositions etc.
        </DrawerDescription>
        <ErrorBoundary>
          <KanjiInfoContent kanji={kanji} />
        </ErrorBoundary>
        <DrawerCloseButton />
      </DrawerContent>
    </Drawer>
  );
}

export const KanjiDrawer = React.memo(KanjiDrawerRaw);
