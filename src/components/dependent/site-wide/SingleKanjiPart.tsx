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
            // Text first, readings below: up to four readings (各) wrap inside
            // the box instead of stretching the whole popover.
            <div className="px-2 py-1.5 mx-auto mb-2 text-left border max-w-64 rounded-xl border-lime-400/40 bg-lime-400/5">
              <p className="font-normal leading-snug whitespace-normal text-muted-foreground">
                <span className="font-bold text-foreground">Sound hint:</span>{" "}
                kanji with <span className="kanji-font">{kanji}</span> are often
                read
              </p>
              <div className="flex flex-wrap justify-center">
                {phonetics.map((phonetic) => (
                  <RomajiBadge
                    key={phonetic}
                    kana={phonetic}
                    className="m-0.5 px-2 py-0.5 sm:py-0.5 text-base sm:text-base"
                  />
                ))}
              </div>
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
