import wanakana from "@/lib/wanakana-adapter";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { useKanjiRepresentativeWord } from "@/providers/kanji-representative-word-provider";
import { ellipsisCn, loadingCn } from "./kanji-item-button-hooks";
const RepWordKanji = ({ kanji }: { kanji: string }) => {
  const repWord = useKanjiRepresentativeWord(kanji);

  return <>
    {repWord && (
      <span className={`${ellipsisCn} block text-sm kanji-font`}>
        {repWord.word} ({repWord.reading})
      </span>
    )}
  </>
}

export const ExpandedBtnContent = ({ kanji }: { kanji: string }) => {
  const getInfo = useGetKanjiInfoFn();
  const kanjiInfo = getInfo?.(kanji);

  if (kanjiInfo == null) {
    return (
      <span
        className={`${loadingCn} block`}
        role="status"
        aria-label="loading"
      />
    );
  }

  const { on, kun, keyword } = kanjiInfo;

  return (
    <>
      <span className={`${ellipsisCn} block text-sm kanji-font`}>
        {wanakana.toKatakana(on)}
        <>
          {kun && kun.length > 0 ? (
            <>
              {" • "}
              {kun}
            </>
          ) : (
            ""
          )}
        </>
      </span>
      <span className="block text-5xl kanji-font">{kanji}</span>
      <span
        className={`${ellipsisCn} block text-xs font-extrabold uppercase mt-1 romaji-font`}
      >
        {keyword}
      </span>
      <RepWordKanji kanji={kanji} />
    </>
  );
};
