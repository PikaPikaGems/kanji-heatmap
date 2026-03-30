import { GenericPopover } from "@/components/common/GenericPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GlobalKanjiLink } from "../routing";

import { FakeComponentLink, GlobalRadicalLink } from "../routing/global-links";
import { isKnownRadical, nonRadicalVariantKeywords } from "@/lib/radicals";

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
  return (
    <GenericPopover
      trigger={
        <button
          className={`flex flex-col m-1 kanji-font text-2xl border-2 rounded-2xl p-1 hover:border-solid hover:border-[#2effff] ${phonetics.length > 0 ? " border-lime-400" : "border-dotted"}`}
        >
          {kanji}
        </button>
      }
      content={
        <div className="p-2 text-xs font-bold">
          {phonetics.map((phonetic) => (
            <RomajiBadge key={phonetic} kana={phonetic} />
          ))}

          {keyword == null
            ? <FakeComponentLink radical={kanji} keyword={nonRadicalVariantKeywords[kanji] ?? "..."} />
            : isKanji ? (
              <>
                <GlobalKanjiLink keyword={keyword} kanji={kanji} />
                <span className="italic font-normal">{"(Kanji)"}</span>
              </>
            ) : isKnownRadical(kanji) ? (
              <>
                <GlobalRadicalLink radical={kanji} keyword={keyword} />
                <span className="italic font-normal">{"(Radical)"}</span>
              </>
            ) : (
              <>
                <FakeComponentLink radical={kanji} keyword={keyword} />
                <span className="italic font-normal">{"(Component)"}</span>
              </>
            )}
        </div>
      }
    />
  );
};
