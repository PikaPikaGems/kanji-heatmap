import { PracticeButton } from "@/components/ui/practice-button";

/**
 * 8 or 12 kanji tiles in a 4-column grid, styled like the writing-practice
 * kanji picker, with the 1–9 keyboard shortcut in the first nine tiles'
 * bottom-right corner.
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
        aria-label={i < 9 ? `${kanji} (key ${i + 1})` : kanji}
        className="relative w-full h-auto min-h-0 p-0 text-4xl border-dashed aspect-square sm:text-5xl kanji-font rounded-xl"
      >
        {kanji}
        {i < 9 && (
          <span
            className="absolute font-sans text-[10px] font-bold leading-none bottom-1.5 right-2 text-muted-foreground"
            aria-hidden
          >
            {i + 1}
          </span>
        )}
      </PracticeButton>
    ))}
  </div>
);
