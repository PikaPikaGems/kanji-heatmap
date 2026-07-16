import wanakana from "@/lib/wanakana-adapter";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { useKanjiRepresentativeWord } from "@/providers/kanji-representative-word-provider";
import { ellipsisCn, loadingCn } from "./kanji-item-button-hooks";
import { isKanji } from "@/lib/utils";
const RepWordKanji = ({ kanji }: { kanji: string }) => {
  const repWord = useKanjiRepresentativeWord(kanji);

  return (
    <>
      {repWord ? (
        <span className={`${ellipsisCn} block text-sm kanji-font`}>
          {repWord.word} ({repWord.reading})
        </span>
      ) : (
        <span className={`${ellipsisCn} block text-sm kanji-font`}>·</span>
      )}
    </>
  );
};

export const ExpandedBtnContent = ({ kanji }: { kanji: string }) => {
  const getInfo = useGetKanjiInfoFn();
  const kanjiInfo = getInfo?.(kanji);

  if (kanjiInfo == null && isKanji(kanji) === false) {
    return (
      <span
        className={`${loadingCn} block`}
        role="status"
        aria-label="loading"
      />
    );
  }

  const on = kanjiInfo?.on ? wanakana.toKatakana(kanjiInfo.on) : "";
  const kun = kanjiInfo?.kun && kanjiInfo.kun.length > 0 ? kanjiInfo.kun : "";
  const dot = on.length > 0 && kun.length > 0 ? " • " : "";
  const keyword =
    kanjiInfo?.keyword != null && kanjiInfo.keyword.length > 0
      ? kanjiInfo.keyword
      : "-";

  return (
    <>
      <span className={`${ellipsisCn} block text-sm kanji-font`}>
        {on.length > 0 || kun.length > 0 ? `${on}${dot}${kun}` : " • "}
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
