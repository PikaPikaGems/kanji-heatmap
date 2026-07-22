import { Search } from "@/components/icons";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export const SearchInputErrorFallback = () => (
  <section className="relative flex-1 min-w-0">
    <button
      type="button"
      onClick={() => window.location.reload()}
      aria-label="Search failed to load. Refresh page."
      className={cn(
        "flex w-full items-center rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm",
        "h-9 pl-7 pr-[105px] text-left text-muted-foreground",
        "transition-colors hover:border-ring/60 hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <span className="truncate">Reload to search again</span>
    </button>

    <Search className="pointer-events-none absolute left-2 top-2 size-4 translate-y-0.5 select-none opacity-50" />

    <div
      className="pointer-events-none absolute right-2 top-2.5 flex items-center gap-1.5"
      aria-hidden
    >
      <RefreshCw className="size-4 shrink-0 text-muted-foreground opacity-70" />
    </div>
  </section>
);
