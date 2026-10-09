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
  soundFamily = [],
  isKanji,
}: {
  kanji: string;
  keyword?: string;
  phonetics?: string[];
  /** Kanji with this sound part, most common first. */
  soundFamily?: string[];
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
          {/* The hint is about kanji that contain the part, not about the
              part itself: 門 is もん, but 間 関 簡 閑 are read かん. */}
          {phonetics.length > 0 && (
            // Kanji on one line, readings below: up to four readings (各)
            // wrap inside the box instead of stretching the whole popover.
            <div className="px-2 py-1.5 mx-auto mb-2 text-left border max-w-64 rounded-xl border-lime-400/40 bg-lime-400/5">
              <p className="font-normal leading-snug text-center whitespace-normal text-muted-foreground">
                🔊 Sound hint:{" "}
                <span className="text-base kanji-font text-foreground">
                  {soundFamily.join(" ")}
                </span>
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

          {/* A radical opens the radical popover even when it is also a
              kanji (夕); the popover links to the kanji. */}
          {isKnownRadical(kanji, radicals) ? (
            <RadicalPopoverContent radical={kanji} />
          ) : isKanji && keyword != null ? (
            <>
              <GlobalKanjiLink keyword={keyword} kanji={kanji} />
              <span className="italic font-normal">{"(Kanji)"}</span>
            </>
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
