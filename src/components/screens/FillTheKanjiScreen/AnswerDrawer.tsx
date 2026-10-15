import { useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { GenericPopover } from "@/components/common/GenericPopover";
import { PracticeDrawerShell } from "@/components/production-practice-v1/drawers/PracticeDrawerShell";
import { useArmedConfirmKey } from "@/hooks/use-armed-confirm-key";
import { SpanBadge } from "@/components/ui/badge";
import { CopyButton } from "@/components/common/CopyButton";
import { cnDottedUnderlineTrigger } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { FillTheKanjiItem } from "@/lib/fill-the-kanji/types";
import { plainSentence, type Puzzle } from "@/lib/fill-the-kanji/puzzle";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { type BlankResult, FuriganaSentence } from "./SentencePrompt";
import { KanjiPopover } from "./KanjiPopover";
import { SpeakButtons } from "./SpeakButtons";
import { AiExplainDialog } from "./AiExplainDialog";
import { useAiExplain, useAiExplainSettings } from "@/hooks/use-ai-explain";
import { isAiExplainReady } from "@/lib/ai-explain/preferences";
import { useCurrentOwnerId } from "@/lib/engine/content-owner";
import type { SentenceSpeech } from "./use-fill-the-kanji-game";

/** "almost": wrong, but at least half the blanks were right. */
export type FeedbackKind = "correct" | "almost" | "wrong" | "forgot";

/** The last answer shown; kept after closing so the drawer can slide away. */
export type AnswerState = {
  open: boolean;
  item: FillTheKanjiItem;
  kind: FeedbackKind;
  puzzle: Puzzle;
  /** The multiple choice tiles offered for this sentence. */
  tiles: string[];
  /** The kanji placed in each blank (null where left empty). */
  filled: (string | null)[];
  /** How each blank was answered (empty ones, as after Forgot, are wrong). */
  blankResults: BlankResult[];
} | null;

const TITLES: Record<FeedbackKind, string> = {
  correct: "🎉 Correct!",
  almost: "😅 Almost there!",
  wrong: "🙈 Not quite",
  forgot: "🫶 No worries",
};

/**
 * Answer kanji: green when every blank needing it got it, yellow when any was
 * missed (left empty or filled with something else). Other kanji: red when
 * placed anywhere, plain when left alone.
 */
const tileResultCn = (
  kanji: string,
  puzzle: Puzzle,
  filled: (string | null)[]
) => {
  const neededIn = puzzle.blanks.flatMap((k, i) => (k === kanji ? [i] : []));
  if (neededIn.length > 0) {
    return neededIn.every((i) => filled[i] === kanji)
      ? "text-green-500"
      : "text-yellow-600 dark:text-yellow-400";
  }
  return filled.includes(kanji) ? "text-red-500" : "text-foreground";
};

/** The tiles that were offered, colored by whether (and how well) each was picked. */
const TileChoices = ({
  tiles,
  puzzle,
  filled,
  getInfo,
}: {
  tiles: string[];
  puzzle: Puzzle;
  filled: (string | null)[];
  getInfo: GetBasicKanjiInfo | undefined;
}) => (
  <p
    className="flex flex-wrap justify-center gap-x-2 pb-4 text-sm kanji-font"
    lang="ja"
  >
    {tiles.map((kanji, i) => {
      const className = cn("px-0.5", tileResultCn(kanji, puzzle, filled));
      const info = getInfo?.(kanji);
      if (!info) {
        return (
          <span key={`${kanji}-${i}`} className={className}>
            {kanji}
          </span>
        );
      }
      return (
        <KanjiPopover
          key={`${kanji}-${i}`}
          kanji={kanji}
          info={info}
          className={className}
        />
      );
    })}
  </p>
);

/** Plain sentence, sentence with furigana, then the translation. */
const clipboardText = (item: FillTheKanjiItem) =>
  [plainSentence(item.jp), item.jp, item.en].join("\n");

const CONFIRM_KEYS = ["Enter", " "] as const;

/** The popover and the AI Explain modal are never open together. */
type NotesView = "closed" | "notes" | "explain";

/**
 * Notes and tags as written in the data, in a scrollable popover. With AI
 * Explain set up, it also offers a button that opens the explanation modal.
 */
const NotesPopover = ({
  item,
  showAiExplain,
  speech,
}: {
  item: FillTheKanjiItem;
  showAiExplain: boolean;
  speech: SentenceSpeech;
}) => {
  const [view, setView] = useState<NotesView>("closed");
  const explain = useAiExplain();
  const japaneseText = plainSentence(item.jp);
  const triggerClassName = cn(
    cnDottedUnderlineTrigger,
    "text-xs text-foreground"
  );

  return (
    <>
      <GenericPopover
        // Inside a drawer: modal, or the popover can't be clicked.
        modal
        open={view === "notes"}
        onOpenChange={(open) => setView(open ? "notes" : "closed")}
        trigger={
          <button type="button" className={triggerClassName}>
            View notes
          </button>
        }
        // Up to 24rem wide; shorter notes shrink the popover to fit.
        contentClassName="w-auto max-w-[min(24rem,calc(100vw-2rem))] p-0"
        content={
          <div className="flex flex-col gap-3 px-4 py-3 text-sm text-center">
            {item.notes ? (
              <p className="whitespace-pre-line" lang="ja">
                {item.notes}
              </p>
            ) : (
              <p className="text-muted-foreground">
                No notes for this sentence.
              </p>
            )}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 pt-2 border-t border-dotted">
                {item.tags.map((tag) => (
                  <SpanBadge
                    key={tag}
                    variant="outline"
                    className="font-medium text-muted-foreground"
                  >
                    {tag}
                  </SpanBadge>
                ))}
              </div>
            )}
            {showAiExplain && (
              <div className="pt-2 border-t border-dotted">
                <button
                  type="button"
                  className={triggerClassName}
                  onClick={() => {
                    setView("explain");
                    void explain.run(japaneseText);
                  }}
                >
                  ✨ AI Explain
                </button>
              </div>
            )}
          </div>
        }
      />
      <AiExplainDialog
        key={japaneseText}
        open={view === "explain"}
        onClose={() => {
          explain.cancel();
          setView("closed");
        }}
        japaneseText={japaneseText}
        speech={speech}
        state={explain.state}
        onRegenerate={(instructions) =>
          void explain.run(japaneseText, { fresh: true, instructions })
        }
        onDelete={() => explain.remove(japaneseText)}
      />
    </>
  );
};

/**
 * Bottom-sheet answer reveal after Next or Forgot, using the writing-practice
 * drawer chrome (dashed top border, slide-up, bouncing title).
 */
export const AnswerDrawer = ({
  answer,
  speech,
  onContinue,
}: {
  answer: AnswerState;
  /** The answered sentence's speech (the drawer opens on the current card). */
  speech: SentenceSpeech;
  onContinue: () => void;
}) => {
  const open = answer?.open ?? false;
  const getKanjiInfo = useGetKanjiInfoFn();
  const [aiExplainSettings] = useAiExplainSettings();
  const ownerId = useCurrentOwnerId();

  // Don't treat the Enter that submitted the answer as "Continue".
  useArmedConfirmKey({
    onConfirm: onContinue,
    enabled: open,
    keys: CONFIRM_KEYS,
  });

  if (!answer) return null;
  const { item, kind, puzzle, tiles, filled, blankResults } = answer;
  const hasNotes = item.notes !== "" || item.tags.length > 0;
  const showAiExplain = isAiExplainReady(aiExplainSettings);

  return (
    <PracticeDrawerShell
      open={open}
      // The shell's title is text-lg; these headings read better smaller.
      title={<span className="text-xs">{TITLES[kind]}</span>}
      description={
        <div className="max-h-[45dvh] overflow-y-auto px-1">
          {/* text-foreground: the drawer description is muted by default. */}
          <FuriganaSentence
            jp={item.jp}
            puzzle={puzzle}
            blankResults={blankResults}
            getInfo={getKanjiInfo ?? undefined}
            className="text-4xl sm:text-[2.5rem] text-foreground"
          />
          <p className="pt-1 text-xs text-foreground">{item.en}</p>
        </div>
      }
      footer={
        <div className="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-w-md mx-auto w-full">
          <TileChoices
            tiles={tiles}
            puzzle={puzzle}
            filled={filled}
            getInfo={getKanjiInfo ?? undefined}
          />
          <PracticeButton size="lg" onClick={onContinue}>
            Continue
          </PracticeButton>
        </div>
      }
    >
      <div className="flex items-center justify-center gap-3 px-4">
        <SpeakButtons speech={speech} />
        <span className="text-muted-foreground" aria-hidden>
          ·
        </span>
        <CopyButton textToCopy={clipboardText(item)} iconType="clipboard" />
        {(hasNotes || showAiExplain) && (
          <NotesPopover
            // Remounts on login/logout: the open answer belongs to one owner.
            key={ownerId}
            item={item}
            showAiExplain={showAiExplain}
            speech={speech}
          />
        )}
      </div>
    </PracticeDrawerShell>
  );
};
