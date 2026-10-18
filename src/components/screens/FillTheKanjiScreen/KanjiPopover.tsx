import { GenericPopover } from "@/components/common/GenericPopover";
import { FrequencyBadges } from "@/components/common/freq/FrequencyBadges";
import { JLPTBadge } from "@/components/common/jlpt/JLPTBadge";
import { JouyouGradeBadge } from "@/components/common/JouyouGradeBadge";
import { toJouyouGrade } from "@/lib/jouyou-grade";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { cn } from "@/lib/utils";
import { useState, type CSSProperties } from "react";
import { WritingPracticeModal } from "@/components/production-practice-v1/WritingPracticeModal";
import { KanjiReadingBadges } from "./KanjiReadingBadges";

type KanjiBasicInfo = NonNullable<ReturnType<GetBasicKanjiInfo>>;

/** The popover and the writing practice modal are never open together. */
type KanjiPopoverView = "closed" | "popover" | "practice";

/**
 * A kanji in running text that opens a popover with its level badges, it
 * enlarged, its keyword, its readings, its frequency badges and a "Practice
 * writing now" link (opens the stroke-order practice modal).
 */
export const KanjiPopover = ({
  kanji,
  info,
  className,
  style,
}: {
  kanji: string;
  info: KanjiBasicInfo;
  className?: string;
  style?: CSSProperties;
}) => {
  const { keyword, jlpt, jouyouGrade, frequency } = info;
  const hasJouyou = toJouyouGrade(jouyouGrade) !== -1;
  const [view, setView] = useState<KanjiPopoverView>("closed");
  return (
    <>
      <GenericPopover
        open={view === "popover"}
        onOpenChange={(open) => setView(open ? "popover" : "closed")}
        // Inside a drawer: modal, or the popover can't be clicked.
        modal
        // Don't highlight the first badge when it opens.
        focusOnOpen={false}
        trigger={
          <button
            type="button"
            className={cn(
              "cursor-pointer rounded-lg transition-colors hover:bg-foreground/10 active:bg-foreground/20",
              className
            )}
            style={style}
            aria-label={`${kanji}: ${keyword}`}
          >
            {kanji}
          </button>
        }
        contentClassName="w-auto min-w-28 max-w-[min(17rem,calc(100vw-1.5rem))] p-0"
        content={
          <div className="flex flex-col items-center gap-1 px-1 py-3 text-center">
            {/* Same badges as the kanji drawer's general information. */}
            <div className="flex flex-wrap justify-center">
              {jlpt && <JLPTBadge jlpt={jlpt} />}
              {hasJouyou && <JouyouGradeBadge jouyouGrade={jouyouGrade!} />}
            </div>
            <span className="text-8xl kanji-font text-foreground" lang="ja">
              {kanji}
            </span>
            <span className="pt-1 text-sm font-bold text-foreground">
              {keyword}
            </span>
            <KanjiReadingBadges kanji={kanji} />
            <div className="flex flex-wrap justify-center">
              <FrequencyBadges frequency={frequency} />
            </div>
            <button
              type="button"
              className="pt-2 mt-1 mb-1.5 text-xs underline border-t border-dotted text-muted-foreground decoration-dotted underline-offset-4 hover:text-foreground"
              onClick={() => setView("practice")}
            >
              Practice writing now
            </button>
          </div>
        }
      />
      <WritingPracticeModal
        open={view === "practice"}
        onOpenChange={(open) => setView(open ? "practice" : "closed")}
        kanji={kanji}
      />
    </>
  );
};
