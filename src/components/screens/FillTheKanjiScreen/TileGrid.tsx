import { PracticeButton } from "@/components/ui/practice-button";
import { tileShortcutKeys } from "@/lib/fill-the-kanji/puzzle";

/**
 * 8 kanji tiles in a 4×2 grid, or 12 in a 6×2 grid, styled like the
 * writing-practice kanji picker, with each tile's keyboard shortcut in its
 * bottom-right corner.
 */
export const TileGrid = ({
  tiles,
  onPick,
}: {
  tiles: string[];
  onPick: (kanji: string) => void;
}) => {
  const keys = tileShortcutKeys(tiles.length);
  return (
    <div
      className={`grid w-full max-w-md mx-auto gap-1.5 sm:gap-2 ${
        tiles.length === 12 ? "grid-cols-6" : "grid-cols-4"
      }`}
    >
      {tiles.map((kanji, i) => (
        <PracticeButton
          key={`${kanji}-${i}`}
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => onPick(kanji)}
          aria-label={`${kanji} (key ${keys[i]})`}
          className={`relative w-full h-auto min-h-0 p-0 border-dashed aspect-square kanji-font rounded-xl ${
            tiles.length === 12
              ? "text-3xl sm:text-4xl"
              : "text-4xl sm:text-5xl"
          }`}
        >
          {kanji}
          <span
            className="absolute font-sans text-[10px] font-bold leading-none uppercase bottom-1 right-1.5 text-muted-foreground"
            aria-hidden
          >
            {keys[i]}
          </span>
        </PracticeButton>
      ))}
    </div>
  );
};
