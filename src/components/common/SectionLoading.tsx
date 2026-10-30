import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The kanji drawer sections' loading state: a centered spinner holding the
 * section's place (Kanji Essay, notes, AI essays, Visual Mnemonics).
 */
export const SectionLoading = ({
  label = "Loading",
  className,
}: {
  /** Read by screen readers, e.g. "Loading essay". */
  label?: string;
  className?: string;
}) => (
  <div
    role="status"
    aria-label={label}
    className={cn("flex items-center justify-center w-full h-48", className)}
  >
    <Loader2 className="size-7 animate-spin" />
  </div>
);
