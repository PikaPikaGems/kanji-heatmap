import { GlobalKanjiLink } from "@/components/dependent/routing";

/** Compact recap tile for practice end screens. */
export const RecapTile = ({
  kanji,
  keyword,
  correct,
}: {
  kanji: string;
  keyword: string;
  correct: boolean;
}) => {
  return (
    <div
      className={`relative rounded-xl border border-dashed ${
        correct ? "border-foreground" : " "
      }`}
    >
      <GlobalKanjiLink kanji={kanji} keyword={keyword} fontSize="text-4xl" />
    </div>
  );
};
