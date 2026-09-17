import { GenericPopover } from "@/components/common/GenericPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GlobalKanjiLink } from "../routing";
import {
  FakeComponentLink,
  RadicalPopoverContent,
} from "../routing/global-links";
import {
  useGetKanjiInfoFn,
  useRadicals,
} from "@/kanji-worker/kanji-worker-hooks";
import { isKnownRadical } from "@/lib/radicals";

export const SingleKanjiPart = ({
  kanji,
  keyword,
  phonetics = [],
  isKanji,
}: {
  kanji: string;
  keyword?: string;
  phonetics?: string[];
  isKanji: boolean;
}) => {
  const radicals = useRadicals();
  const getKanjiInfo = useGetKanjiInfoFn();
  const componentKeyword = keyword ?? getKanjiInfo?.(kanji)?.keyword ?? "...";

  return (
    <GenericPopover
      trigger={
        <button
          className={`flex flex-col my-1 kanji-font text-3xl border-2 rounded-2xl p-2 hover:border-solid hover:border-neon-accent ${phonetics.length > 0 ? " border-lime-400" : "border-dotted"}`}
        >
          {kanji}
        </button>
      }
      content={
        <div className="p-2 text-xs font-bold">
          {phonetics.map((phonetic) => (
            <RomajiBadge key={phonetic} kana={phonetic} className="text-md" />
          ))}

          {isKanji && keyword != null ? (
            <>
              <GlobalKanjiLink keyword={keyword} kanji={kanji} />
              <span className="italic font-normal">{"(Kanji)"}</span>
            </>
          ) : isKnownRadical(kanji, radicals) ? (
            <RadicalPopoverContent radical={kanji} />
          ) : (
            <>
              <FakeComponentLink radical={kanji} keyword={componentKeyword} />
              <span className="italic font-normal">{"(Component)"}</span>
            </>
          )}
        </div>
      }
    />
  );
};
