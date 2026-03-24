import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { GenericPopover } from "@/components/common/GenericPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GlobalKanjiLink } from "../routing";
import { outLinks } from "@/lib/external-links";
import { GlobalRadicalLink } from "../routing/global-links";

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
        <div className="text-xs p-2 font-bold">
          {phonetics.map((phonetic) => (
            <RomajiBadge key={phonetic} kana={phonetic} />
          ))}

          {keyword == null ? (
            <div className="w-32 my-2">
              Keyword Missing
              <br />
              <ExternalTextLink text="Report Bug" href={outLinks.discord} />
              {"🐛🐞"}
            </div>
          ) : isKanji ? (
            <>
              <GlobalKanjiLink keyword={keyword} kanji={kanji} />
              <span className="font-normal italic">{"(Kanji)"}</span>
            </>
          ) : (
            <>
              <GlobalRadicalLink radical={kanji} keyword={keyword} />
              <span className="font-normal italic">{"(Radical)"}</span>
            </>
          )}
        </div>
      }
    />
  );
};
