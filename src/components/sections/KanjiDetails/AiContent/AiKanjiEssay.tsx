import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { useKanjiAnchorWords } from "@/providers/kanji-representative-word-hooks";
import { buildKanjiEssayPrompt } from "@/lib/ai-explain/prompts";
import { GeneratedText } from "./GeneratedText";

export const AiKanjiEssay = ({
  kanji,
  keyword,
}: {
  kanji: string;
  keyword: string;
}) => {
  const getInfo = useGetKanjiInfoFn();
  const anchors = useKanjiAnchorWords(kanji);
  const anchorWords = anchors
    ? [anchors.main, anchors.secondary].flatMap((word) =>
        word
          ? [
              {
                word: word.word,
                reading: word.readings.join("・"),
                englishGloss: word.englishGloss,
              },
            ]
          : []
      )
    : [];
  return (
    <GeneratedText
      key={kanji}
      id={`essay:${kanji}`}
      filename={`kanji-essay-${kanji}`}
      generateLabel="✨ Generate AI Essay"
      makePrompt={(settings) =>
        buildKanjiEssayPrompt(settings, {
          kanji,
          kanjiContext: JSON.stringify({
            keyword,
            readings: { on: getInfo?.(kanji)?.on, kun: getInfo?.(kanji)?.kun },
            anchorWords,
          }),
        })
      }
    />
  );
};
