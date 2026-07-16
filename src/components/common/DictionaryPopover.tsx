import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { GenericPopover } from "./GenericPopover";

/** "読み込み中 · Loading…" state shared by dictionary lookups. */
export const DictLoading = () => (
  <div className="py-2 text-xs text-muted-foreground">読み込み中 · Loading…</div>
);

/** Service-unreachable state (network/API error). */
export const DictError = ({ service }: { service: string }) => (
  <div className="py-2 text-xs">
    すみません. {service} cannot be accessed right now. Try again later.
  </div>
);

/** No-results state. */
export const DictEmpty = ({ service }: { service: string }) => (
  <div className="py-2 text-xs text-muted-foreground">
    すみません. {service} does not contain information about this word.
  </div>
);

/** "Powered by … 💪" attribution header. */
export const DictHeader = ({ label }: { label: string }) => (
  <div className="pb-1 mb-2 border-b text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
    Powered by {label} 💪
  </div>
);

/**
 * Outline icon button + popover with the scrollable content container used by
 * both the Jisho and Jotoba lookups. Owns the vaul/touch-scroll handling so it
 * lives in one place.
 */
export const DictionaryPopoverShell = ({
  icon,
  contentClassName,
  children,
}: {
  icon: ReactNode;
  contentClassName: string;
  children: ReactNode;
}) => (
  <GenericPopover
    trigger={
      <Button variant="outline" size="iconXl" className="relative">
        {icon}
      </Button>
    }
    content={
      <div
        className={contentClassName}
        data-vaul-no-drag
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    }
  />
);
