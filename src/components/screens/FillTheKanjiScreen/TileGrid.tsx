import { PracticeButton } from "@/components/ui/practice-button";

/**
 * 8 kanji tiles in a 4×2 grid, styled like the writing-practice kanji picker,
 * with each tile's 1–8 keyboard shortcut in its bottom-right corner.
 */
export const TileGrid = ({
  tiles,
  onPick,
}: {
  tiles: string[];
  onPick: (kanji: string) => void;
}) => (
  <div className="grid w-full max-w-md grid-cols-4 gap-1.5 mx-auto sm:gap-2">
    {tiles.map((kanji, i) => (
      <PracticeButton
        key={`${kanji}-${i}`}
        type="button"
        size="icon"
        variant="secondary"
        onClick={() => onPick(kanji)}
        aria-label={`${kanji} (key ${i + 1})`}
        className="relative w-full h-auto min-h-0 p-0 text-4xl border-dashed aspect-square sm:text-5xl kanji-font rounded-xl"
      >
        {kanji}
        <span
          className="absolute font-sans text-[10px] font-bold leading-none bottom-1.5 right-2 text-muted-foreground"
          aria-hidden
        >
          {i + 1}
        </span>
      </PracticeButton>
    ))}
  </div>
);
