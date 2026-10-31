import {
  HoverItemReturnData,
  KanjiWordDetails,
} from "@/lib/kanji/kanji-info-types";
import {
  useIsKanjiWorkerReady,
  useKanjiInfo,
} from "@/kanji-worker/kanji-worker-hooks";

import { JLPTBadge } from "@/components/common/jlpt/JLPTBadge";
import { FrequencyBadges } from "@/components/common/freq/FrequencyBadges";

import { KanjiCardLayout } from "./CardLayout";
import { WordCard } from "./WordCard";
import { CardLoadingScreen } from "@/components/common/CardLoadingScreen";
import { OriginalKanjiComponentBreakdown } from "../KanjiDetails/OriginalComponentBreakdown";
import { useKanjiAnchorWords } from "@/providers/kanji-representative-word-hooks";
import { HintChip } from "@/components/common/HintChip";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useFlashHint } from "@/hooks/use-flash-hint";

/** The card's big kanji; a double click (or double tap) copies it. */
const CopyableBigKanji = ({ kanji }: { kanji: string }) => {
  const { copy } = useCopyToClipboard();
  const hint = useFlashHint();

  return (
    <span className="relative inline-block">
      <span
        className="text-[140px] leading-none kanji-font select-none cursor-copy"
        title="Double-click to copy"
        onDoubleClick={(e) => {
          void copy(kanji, e);
          hint.show(`Copied ${kanji}`);
        }}
      >
        {kanji}
      </span>
      {hint.hint && (
        <HintChip
          key={hint.hint.key}
          className="-translate-x-1/2 left-1/2 -bottom-2"
          onDone={hint.done}
        >
          {hint.hint.text}
        </HintChip>
      )}
    </span>
  );
};

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

export const KanjiCardBare = ({ kanji }: { kanji: string }) => {
  return (
    <>
      <article className="w-full pt-6 pb-20 border-2 border-dotted rounded-3xl animate-fade-in">
        <div className="relative pl-2 mr-4 rounded-3xl">
          <span className="text-[220px] leading-none kanji-font">{kanji}</span>
        </div>
      </article>
    </>
  );
};

const RepWordKanji = ({ kanji }: { kanji: string }) => {
  const repWord = useKanjiAnchorWords(kanji)?.main;

  return (
    <>
      {repWord && (
        <div className="flex justify-center gap-2 m-auto">
          <span className="text-sm kanji-font">
            {repWord.tier} {repWord.word} ({repWord.readings.join("・")})
          </span>
        </div>
      )}
    </>
  );
};

export const KanjiCard = ({ kanji }: { kanji: string }) => {
  const data = useKanjiInfo(kanji, "hover-card");
  const ready = useIsKanjiWorkerReady();

  if (data.error) {
    return <KanjiCardBare kanji={kanji} />;
  }

  if (!ready || data.status === "loading" || data.data == null) {
    return <CardLoadingScreen />;
  }

  const info = data.data as HoverItemReturnData;

  const word1Props = transformKanjiWordDetails(kanji, info.mainVocab?.first);
  const word2Props = transformKanjiWordDetails(kanji, info.mainVocab?.second);

  return (
    <KanjiCardLayout
      main={
        <div className="relative py-2 pl-2 mr-4 rounded-3xl">
          <CopyableBigKanji kanji={kanji} />
          <div className="mt-4 font-bold uppercase -translate-y-1 text-md">
            {info.keyword}
          </div>
          <RepWordKanji kanji={kanji} />
        </div>
      }
      firstWord={word1Props && <WordCard {...word1Props} />}
      secondWord={word2Props && <WordCard {...word2Props} />}
      componentBreakdown={
        <OriginalKanjiComponentBreakdown
          kanji={kanji}
          showNotAvailable={false}
        />
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
