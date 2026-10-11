import {
  KanjiTile,
  KanjiTileGrid,
} from "@/components/shared-practice/KanjiTileGrid";
import { tileShortcutKeys } from "@/lib/fill-the-kanji/puzzle";

/**
 * 8 kanji tiles in a 4×2 grid, or 12 in a 4×3 grid (6×2 from sm up), using
 * the same tiles as writing practice, with each tile's keyboard shortcut in
 * its bottom-right corner.
 */
export const TileGrid = ({
  tiles,
  onPick,
}: {
  tiles: string[];
  onPick: (kanji: string) => void;
}) => {
  const keys = tileShortcutKeys(tiles.length);
  const isTwelve = tiles.length === 12;
  return (
    <KanjiTileGrid
      className={isTwelve ? "sm:grid-cols-6 sm:max-w-2xl" : undefined}
    >
      {tiles.map((kanji, i) => (
        <KanjiTile
          key={`${kanji}-${i}`}
          kanji={kanji}
          shortcut={keys[i]}
          ariaLabel={`${kanji} (key ${keys[i]})`}
          onClick={() => onPick(kanji)}
        />
      ))}
    </KanjiTileGrid>
  );
};
