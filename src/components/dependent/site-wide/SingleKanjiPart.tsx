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
          {/* The reading is the family's, not necessarily this kanji's: 門
              is もん, but kanji with 門 (間 簡 閑) are read かん. */}
          {phonetics.length > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 mb-2 text-left border rounded-xl border-lime-400/70 bg-lime-400/10">
              <div className="flex flex-wrap shrink-0">
                {phonetics.map((phonetic) => (
                  <RomajiBadge
                    key={phonetic}
                    kana={phonetic}
                    className="m-0.5 text-md"
                  />
                ))}
              </div>
              <p className="max-w-40 whitespace-normal font-normal leading-snug text-muted-foreground">
                <span className="font-bold text-foreground">Sound hint</span>
                <br />
                kanji with <span className="kanji-font">{kanji}</span> are often
                read this way
              </p>
            </div>
          )}

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
