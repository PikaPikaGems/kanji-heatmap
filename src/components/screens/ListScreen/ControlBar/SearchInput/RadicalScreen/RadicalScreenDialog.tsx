import { ReactNode } from "react";
import { SearchDrawerShell } from "@/components/common/BottomSheet";

export const RadicalsScreenDialog = ({
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
    title="Radical Search"
    description="Search by Radical"
  >
    {children}
  </SearchDrawerShell>
);
