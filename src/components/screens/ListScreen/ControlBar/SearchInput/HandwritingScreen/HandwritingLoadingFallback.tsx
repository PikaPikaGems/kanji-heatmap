import { Loader2 } from "lucide-react";
import { SearchDialogLoadingShell } from "../SearchDialogLoadingShell";

export const HandwritingLoadingFallback = ({
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
    <SearchDialogLoadingShell title="Handwriting Search" onClose={onClose}>
      <div className="relative w-full px-1 mx-auto">
        <div className="absolute z-[51] w-full -top-1">
          <span className="px-2 text-sm font-bold rounded-full bg-background">
            Draw a Kanji
          </span>
        </div>
        <div className="flex items-center justify-center py-4 mt-2 overflow-hidden border-2 border-dotted rounded-md border-foreground/30">
          <div className="relative aspect-square w-[min(300px,calc(100vw-56px))] overflow-hidden rounded-xl border-2 border-dashed border-foreground/30 bg-muted/30">
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-foreground/20" />
            <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-foreground/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
              <Loader2 className="w-7 h-7 animate-spin" />
              Loading drawing pad...
            </div>
            <div className="absolute flex gap-2 bottom-3 right-3">
              <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
              <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
            </div>
          </div>
        </div>

        <div className="relative h-44 pt-4 pb-2 mt-2 mb-2 overflow-hidden border-2 border-dotted rounded-md border-foreground/30">
          <span className="absolute left-0 right-0 px-2 mx-auto -top-2 w-max text-sm font-bold rounded-full bg-background">
            Results Preview
          </span>
          <div className="flex items-center justify-center h-full gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="w-14 h-14 rounded-xl bg-muted/60 animate-pulse"
                style={{ animationDelay: `${index * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </SearchDialogLoadingShell>
  );
};
