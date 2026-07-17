import { Loader2 } from "lucide-react";
import { SearchDialogLoadingShell } from "../SearchDialogLoadingShell";

export const RadicalsLoadingFallback = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <SearchDialogLoadingShell title="Radical Search" onClose={onClose}>
      <div className="relative w-full px-1 mx-auto">
        <div className="absolute z-[51] w-full -top-1">
          <span className="px-2 text-sm font-bold rounded-full bg-background">
            Select Radicals
          </span>
        </div>
        <div className="flex max-h-[calc(100dvh-30px)] flex-wrap items-start justify-center overflow-hidden rounded-md border-2 border-dotted border-foreground/40 px-2 py-3 mt-2">
          {Array.from({ length: 42 }, (_, index) => (
            <div
              key={index}
              className="w-[47px] h-[45px] ml-1 mb-1 rounded-sm border border-dotted border-foreground/40 bg-muted/50 animate-pulse"
              style={{ animationDelay: `${(index % 12) * 80}ms` }}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading radicals...
        </div>
      </div>
    </SearchDialogLoadingShell>
  );
};
