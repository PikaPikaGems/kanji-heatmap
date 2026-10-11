import type { ReactNode } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { cn } from "@/lib/utils";

/** Grid of square kanji tiles; `className` sets the columns. */
export const KanjiTileGrid = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={cn(
      "grid w-full max-w-md grid-cols-4 gap-1.5 mx-auto sm:gap-2",
      className
    )}
  >
    {children}
  </div>
);

/** One square kanji tile, with the kanji sized relative to the tile. */
export const KanjiTile = ({
  kanji,
  selected = false,
  shortcut,
  autoFocus,
  className,
  ariaLabel,
  onClick,
}: {
  kanji: string;
  selected?: boolean;
  /** Keyboard shortcut shown in the bottom-right corner. */
  shortcut?: string;
  autoFocus?: boolean;
  className?: string;
  ariaLabel?: string;
  onClick: () => void;
}) => (
  <PracticeButton
    type="button"
    size="icon"
    variant={selected ? "primary" : "secondary"}
    autoFocus={autoFocus}
    onClick={onClick}
    aria-pressed={selected}
    aria-label={ariaLabel}
    className={cn(
      "relative w-full h-auto min-h-0 p-0 aspect-square kanji-font rounded-xl [container-type:inline-size]",
      !selected && "border-dashed",
      className
    )}
  >
    {/* Kanji is half the tile's width, so it fills the tile at any screen size. */}
    <span className="text-[length:50cqw] leading-none">{kanji}</span>
    {shortcut && (
      <span
        className="absolute font-sans text-[10px] font-bold leading-none uppercase bottom-1 right-1.5 text-muted-foreground"
        aria-hidden
      >
        {shortcut}
      </span>
    )}
  </PracticeButton>
);
