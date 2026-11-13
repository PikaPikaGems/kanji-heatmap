import { useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A bordered card of short notes under a small uppercase title, one
 * `NoteRow` per point (e.g. the note at the bottom of the kanji drawer).
 * Easier to scan than one long warning paragraph. Starts open; the title
 * collapses and expands it.
 */
export const NoteCard = ({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div
      className={cn(
        "overflow-hidden border rounded-2xl border-foreground/20 bg-muted/15",
        className
      )}
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center justify-between w-full gap-2 px-3 pt-2.5 pb-1.5 text-xs font-bold tracking-widest text-left uppercase text-foreground/50 hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            open && "border-b"
          )}
        >
          {title}
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </h3>
      {open && (
        <div className="divide-y divide-dotted divide-foreground/15 animate-fade-in-fast">
          {children}
        </div>
      )}
    </div>
  );
};

/** One point in a `NoteCard`: a yellow icon and normal-color text. */
export const NoteRow = ({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) => (
  <div className="flex items-start py-2 mx-3">
    <Icon className="mr-2 mt-0.5 text-yellow-600 size-4 shrink-0 dark:text-yellow-500" />
    <p className="text-xs leading-relaxed text-left text-foreground">
      {children}
    </p>
  </div>
);
