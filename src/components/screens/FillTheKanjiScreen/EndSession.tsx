import { useMemo } from "react";
import { useEnterAction } from "@/hooks/use-enter-action";
import { useKanjiUrlState } from "@/hooks/routing-hooks";
import { pickEndCheer } from "@/lib/practice-cheers";
import { cn, percent } from "@/lib/utils";
import { Stat } from "@/components/shared-practice";
import { PracticeButton } from "@/components/ui/practice-button";
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
    className="flex flex-wrap justify-center gap-x-2 text-sm kanji-font"
    lang="ja"
  >
    {missed.map(({ kanji, kind }) => (
      <button
        key={kanji}
        type="button"
        onClick={() => onOpen(kanji)}
        className={cn(
          "px-0.5 cursor-pointer rounded-lg transition-colors hover:bg-foreground/10 active:bg-foreground/20",
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
 * Same layout as Reading Practice's round end: the recap scrolls, and
 * Next Batch / End Session stay fixed at the bottom.
 */
export const EndSession = ({
  results,
  batchLabel,
  onNext,
  onRetryMistakes,
  onEnd,
}: {
  results: ItemResult[];
  batchLabel: string;
  onNext: () => void;
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

  useEnterAction(onNext, drawerClosed, CONTINUE_KEYS);
  useEnterAction(onEnd, drawerClosed, ["Escape"]);

  return (
    <div className="flex flex-col w-full h-full animate-fade-in">
      {/* m-auto centers the recap in the space above the buttons and, unlike
          justify-center, still scrolls from the top when it overflows. */}
      <div className="flex flex-col flex-1 min-h-0 px-4 pt-4 overflow-y-auto">
        <div className="flex flex-col items-center w-full max-w-md gap-10 pb-4 m-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold kanji-font animate-practice-bounce-soft">
              {cheer}
            </h2>
            <p className="mt-1 text-xs font-bold tracking-wide uppercase text-muted-foreground">
              {batchLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">
            <Stat value={correct} unit={`/${results.length}`} label="Correct" />
            <Stat
              value={percent(correct, results.length)}
              unit="%"
              label="Accuracy"
            />
          </div>

          {correct < results.length && (
            <button
              type="button"
              onClick={onRetryMistakes}
              className="text-sm font-bold underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              Retry mistakes
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background">
        <div className="flex flex-col w-full max-w-md gap-2 mx-auto">
          {missed.length > 0 && (
            // Capped so a long list never pushes the buttons off screen.
            <div className="pb-2 overflow-y-auto max-h-24">
              <MissedKanjiList missed={missed} onOpen={setOpenedKanji} />
            </div>
          )}
          <PracticeButton size="lg" onClick={onNext}>
            Next Batch
          </PracticeButton>
          <PracticeButton size="md" variant="ghost" onClick={onEnd}>
            End Session
          </PracticeButton>
        </div>
      </div>
    </div>
  );
};
