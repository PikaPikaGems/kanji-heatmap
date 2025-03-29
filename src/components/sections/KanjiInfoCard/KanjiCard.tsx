import {
  HoverItemReturnData,
  KanjiWordDetails,
} from "@/lib/kanji/kanji-info-types";
import {
  useIsKanjiWorkerReady,
  useKanjiInfo,
} from "@/kanji-worker/kanji-worker-hooks";

import { DefaultErrorFallback } from "@/components/error";
import { JLPTBadge } from "@/components/common/jlpt/JLPTBadge";
import { FrequencyBadges } from "@/components/common/freq/FrequencyBadges";

import { KanjiCardLayout } from "./CardLayout";
import { WordCard } from "./WordCard";
import { SingleKanjiPart } from "@/components/dependent/site-wide/SingleKanjiPart";

const transformKanjiWordDetails = (
  kanji: string,
  wordDetails?: KanjiWordDetails
) => {
  if (wordDetails == null) {
    return null;
  }

  const spacedKana = wordDetails.wordPartDetails
    .map((item) => {
      return item[1] ?? item[0];
    })
    .join(" ");

  const highlightIndex =
    wordDetails.wordPartDetails.findIndex((item) => {
      return item[0] === kanji;
    }) ?? -1;

  const result = {
    word: wordDetails.word,
    wordKanjis: wordDetails.partsList,
    definition: wordDetails.meaning,
    spacedKana,
    highlightIndex,
  };
  return result;
};

export const KanjiCard = ({ kanji }: { kanji: string }) => {
  const data = useKanjiInfo(kanji, "hover-card");
  const ready = useIsKanjiWorkerReady();

  if (data.error) {
    return <DefaultErrorFallback message="Failed to load data." />;
  }

  if (!ready || data.status === "loading" || data.data == null) {
    return null;
  }

  const info = data.data as HoverItemReturnData;

  const word1Props = transformKanjiWordDetails(kanji, info.mainVocab?.first);
  const word2Props = transformKanjiWordDetails(kanji, info.mainVocab?.second);

  const parts = info.parts
    .filter((item) => item.part !== kanji)
    .filter((item) => {
      return item.part != info.phonetic?.phonetic;
    });

  const hasParts = parts.length > 0 || info.phonetic;

  return (
    <KanjiCardLayout
      main={
        <div className="mr-4 pl-2 rounded-3xl">
          <span className="text-[120px] kanji-font">{kanji}</span>
          <div className="text-md uppercase -mt-4">{info.keyword}</div>
        </div>
      }
      firstWord={word1Props && <WordCard {...word1Props} />}
      secondWord={word2Props && <WordCard {...word2Props} />}
      components={
        hasParts && (
          <>
            {parts.map((item) => {
              return (
                <SingleKanjiPart
                  key={item.part}
                  kanji={item.part}
                  keyword={item.keyword}
                  isKanji={item.isKanji}
                />
              );
            })}
            {info.phonetic && (
              <SingleKanjiPart
                kanji={info.phonetic.phonetic}
                keyword={info.phonetic.keyword}
                phonetics={info.phonetic.sound}
                isKanji={info.phonetic.isKanji}
              />
            )}
          </>
        )
      }
      badges={
        <>
          <JLPTBadge jlpt={info.jlpt} />
          <FrequencyBadges frequency={info.frequency} />
        </>
      }
    />
  );
};
