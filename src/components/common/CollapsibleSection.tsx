import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** A form section the caller can open and close, e.g. to tuck fields away after a result arrives. */
export const CollapsibleSection = ({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) => {
  const id = useId();
  return (
    <div className="border-y border-dotted border-border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => onOpenChange(!open)}
        className="flex items-center justify-between w-full gap-2 py-2 text-sm font-semibold text-left disabled:opacity-50"
      >
        {title}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div id={id} className="pb-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};
