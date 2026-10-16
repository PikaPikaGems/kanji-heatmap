import { useMemo } from "react";
import { ProgressNotSavedNotice } from "@/components/dependent/account/ProgressNotSavedNotice";
import { useEnterAction } from "@/hooks/use-enter-action";
import { pickEndCheer } from "@/lib/practice-cheers";
import { Link } from "@/components/dependent/routing/router-adapter";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { dedupe, percent } from "@/lib/utils";
import { Stat } from "./CountUpStat";
import { EndScreenLayout } from "./EndScreenLayout";
import { PracticeSessionResult } from "./types";
import { RoundRecap } from "./RoundRecap";

const CONTINUE_KEYS = ["Enter", " "] as const;

/** Home-screen search listing the given kanji, in the order given. */
const multiKanjiSearchHref = (kanji: string[]) => {
  const params = new URLSearchParams({
    [URL_PARAMS.textSearch.type]: "multi-kanji",
    [URL_PARAMS.textSearch.text]: kanji.join(""),
  });
  return `/?${params.toString()}`;
};

export const EndSession = ({
  results,
  hasMore,
  wordsCleared,
  saveError,
  onNext,
  onEnd,
}: {
  results: PracticeSessionResult[];
  /** False when every word in the deck has been answered correctly. */
  hasMore: boolean;
  /** Total words in the filtered deck (used on the final complete screen). */
  wordsCleared: number;
  /** Why the finished round couldn't be saved, if it couldn't. */
  saveError: string | null;
  onNext: () => void;
  onEnd: () => void;
}) => {
  const cheer = useMemo(() => pickEndCheer(), []);
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = percent(correctCount, results.length, 100);

  useEnterAction(hasMore ? onNext : onEnd, true, CONTINUE_KEYS);
  useEnterAction(onEnd, true, ["Escape"]);

  if (!hasMore) {
    // `results` is the whole run here, so this covers every round.
    const forgottenKanji = dedupe(
      results.filter((r) => !r.correct).map((r) => r.kanji)
    );

    return (
      <EndScreenLayout
        className="px-4"
        heading={`🎉 ${cheer}`}
        subtitle="All words complete"
        stats={
          <>
            <Stat value={accuracy} unit="%" label="Accuracy" />
            <Stat value={wordsCleared} unit="" label="Words cleared" />
            <Stat value={results.length} unit="" label="Attempts" />
          </>
        }
        afterStats={
          forgottenKanji.length > 0 && (
            <Link
              href={multiKanjiSearchHref(forgottenKanji)}
              className="text-sm font-bold underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              View {forgottenKanji.length} kanji you forgot
            </Link>
          )
        }
        belowButtons={<ProgressNotSavedNotice saveError={saveError} />}
        primaryLabel="Done"
        onPrimary={onEnd}
      />
    );
  }

  return (
    <RoundRecap
      cheer={cheer}
      summary={
        <p className="mt-2 text-sm font-bold text-center text-muted-foreground">
          {correctCount}/{results.length} correct this round
        </p>
      }
      tiles={results}
      afterButtons={<ProgressNotSavedNotice saveError={saveError} />}
      primaryLabel="Continue"
      onPrimary={onNext}
      secondaryLabel="End Session"
      onSecondary={onEnd}
    />
  );
};
