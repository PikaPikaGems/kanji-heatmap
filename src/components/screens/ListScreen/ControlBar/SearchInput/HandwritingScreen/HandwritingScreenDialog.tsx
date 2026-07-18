import { ReactNode } from "react";
import { SearchDrawerShell } from "@/components/common/BottomSheet";

export const HandwritingScreenDialog = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) => (
  <SearchDrawerShell
    isOpen={isOpen}
    onClose={onClose}
    title="Handwriting Search"
    description="Search by drawing a kanji"
  >
    {children}
  </SearchDrawerShell>
);
