import { useMemo } from "react";
import { useEnterAction } from "@/hooks/use-enter-action";
import { useKanjiUrlState } from "@/hooks/routing-hooks";
import { pickEndCheer } from "@/lib/practice-cheers";
import { cn, percent } from "@/lib/utils";
import { EndScreenLayout, Stat } from "@/components/shared-practice";
import { ProgressNotSavedNotice } from "@/components/dependent/account/ProgressNotSavedNotice";
import { ItemResult, MissedKanji } from "./types";

const CONTINUE_KEYS = ["Enter", " "] as const;

/** Each missed kanji once, in order; wrong anywhere beats forgot. */
const uniqueMissed = (results: ItemResult[]): MissedKanji[] => {
  const kinds = new Map<string, MissedKanji["kind"]>();
  for (const { kanji, kind } of results.flatMap((r) => r.missed)) {
    if (kinds.get(kanji) === "wrong") continue;
    kinds.set(kanji, kind);
  }
  return [...kinds].map(([kanji, kind]) => ({ kanji, kind }));
};

/** The batch's missed kanji, colored like the answer drawer; each opens the kanji drawer. */
const MissedKanjiList = ({
  missed,
  onOpen,
}: {
  missed: MissedKanji[];
  onOpen: (kanji: string) => void;
}) => (
  <p
    className="flex flex-wrap justify-center text-lg gap-x-2 kanji-font"
    lang="ja"
  >
    {missed.map(({ kanji, kind }) => (
      <button
        key={kanji}
        type="button"
        onClick={() => onOpen(kanji)}
        className={cn(
          "px-1 cursor-pointer rounded-lg transition-colors hover:bg-foreground/10 active:bg-foreground/20",
          kind === "wrong"
            ? "text-red-500"
            : "text-yellow-600 dark:text-yellow-400"
        )}
      >
        {kanji}
      </button>
    ))}
  </p>
);

/**
 * End of a batch: the shared end screen with the missed kanji, and Retry
 * Mistakes (when there are any) next to "I'm done".
 */
export const EndSession = ({
  results,
  batchLabel,
  saveError,
  onRetryMistakes,
  onEnd,
}: {
  results: ItemResult[];
  batchLabel: string;
  /** Copy for why saving the batch to the account failed, if it did. */
  saveError: string | null;
  /** Replays just the missed sentences; not recorded as a batch attempt. */
  onRetryMistakes: () => void;
  onEnd: () => void;
}) => {
  const cheer = useMemo(() => pickEndCheer(), []);
  const correct = results.filter((r) => r.correct).length;
  const missed = uniqueMissed(results);
  const [openedKanji, setOpenedKanji] = useKanjiUrlState();
  // While the kanji drawer is open, Enter, Space and Escape belong to it.
  const drawerClosed = openedKanji == null;
  const hasMistakes = correct < results.length;

  useEnterAction(
    hasMistakes ? onRetryMistakes : onEnd,
    drawerClosed,
    CONTINUE_KEYS
  );
  useEnterAction(onEnd, drawerClosed, ["Escape"]);

  return (
    <EndScreenLayout
      cheer={cheer}
      subtitle={batchLabel}
      stats={
        <>
          <Stat value={correct} unit={`/${results.length}`} label="Correct" />
          <Stat
            value={percent(correct, results.length)}
            unit="%"
            label="Accuracy"
          />
        </>
      }
      onContinue={hasMistakes ? onRetryMistakes : undefined}
      continueLabel="Retry Mistakes"
      onEnd={onEnd}
      notice={<ProgressNotSavedNotice saveError={saveError} />}
    >
      {missed.length > 0 && (
        <MissedKanjiList missed={missed} onOpen={setOpenedKanji} />
      )}
    </EndScreenLayout>
  );
};
