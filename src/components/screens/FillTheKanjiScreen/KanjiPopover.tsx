import { GenericPopover } from "@/components/common/GenericPopover";
import { FrequencyBadges } from "@/components/common/freq/FrequencyBadges";
import { JLPTBadge } from "@/components/common/jlpt/JLPTBadge";
import { JouyouGradeBadge } from "@/components/common/JouyouGradeBadge";
import { toJouyouGrade } from "@/lib/jouyou-grade";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type KanjiBasicInfo = NonNullable<ReturnType<GetBasicKanjiInfo>>;

/** A kanji in running text that opens a popover with its badges, it enlarged and its keyword. */
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
  return (
    <GenericPopover
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
      contentClassName="w-auto min-w-28 max-w-[min(20rem,calc(100vw-1.5rem))] p-0"
      content={
        <div className="flex flex-col items-center gap-1 px-5 py-3 text-center">
          {/* Same badges as the kanji drawer's general information. */}
          <div className="flex flex-wrap justify-center">
            {jlpt && <JLPTBadge jlpt={jlpt} />}
            {hasJouyou && <JouyouGradeBadge jouyouGrade={jouyouGrade!} />}
            <FrequencyBadges frequency={frequency} />
          </div>
          <span className="text-8xl kanji-font text-foreground" lang="ja">
            {kanji}
          </span>
          <span className="pt-1 text-sm font-bold text-foreground">
            {keyword}
          </span>
        </div>
      }
    />
  );
};
