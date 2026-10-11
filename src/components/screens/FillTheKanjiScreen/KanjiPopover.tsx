import { GenericPopover } from "@/components/common/GenericPopover";
import { SpanBadge } from "@/components/ui/badge";
import { JLPTListItems } from "@/lib/jlpt";
import { JouyouGradeListItems, toJouyouGrade } from "@/lib/jouyou-grade";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { cn } from "@/lib/utils";
import { FrequencyBadges } from "@/components/common/freq/FrequencyBadges";

type KanjiBasicInfo = NonNullable<ReturnType<GetBasicKanjiInfo>>;

/** A small outline badge with the same colored dot the kanji lists use. */
const LevelBadge = ({ dotCn, label }: { dotCn: string; label: string }) => (
  <SpanBadge variant="outline" className="gap-1 font-medium text-foreground">
    <span className={`block h-2 w-2 !rounded-full ${dotCn}`} />
    {label}
  </SpanBadge>
);

/** A kanji in running text that opens a popover with it enlarged and its keyword. */
export const KanjiPopover = ({
  kanji,
  info,
  className,
}: {
  kanji: string;
  info: KanjiBasicInfo;
  className?: string;
}) => {
  const { keyword, jlpt, jouyouGrade, frequency } = info;
  const jouyou = toJouyouGrade(jouyouGrade);
  // The four ranks FrequencyBadges shows.
  const hasFrequency =
    frequency != null &&
    [
      frequency.netflix,
      frequency.google,
      frequency.wkfr,
      frequency.twitter,
    ].some((rank) => rank != null && rank >= 1);
  return (
    <GenericPopover
      // Inside a drawer: modal, or the popover can't be clicked.
      modal
      trigger={
        <button
          type="button"
          className={cn(
            "cursor-pointer rounded-lg transition-colors hover:bg-foreground/10 active:bg-foreground/20",
            className
          )}
          aria-label={`${kanji}: ${keyword}`}
        >
          {kanji}
        </button>
      }
      contentClassName="w-auto min-w-28 max-w-[min(20rem,calc(100vw-1.5rem))] p-0"
      content={
        <div className="flex flex-col items-center gap-1 px-5 py-3 text-center">
          <span className="text-8xl kanji-font text-foreground" lang="ja">
            {kanji}
          </span>
          <span className="pt-1 text-sm font-bold text-foreground">
            {keyword}
          </span>
          {(jlpt && jlpt !== "none") || jouyou !== -1 || hasFrequency ? (
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {jlpt && jlpt !== "none" && (
                <LevelBadge
                  dotCn={JLPTListItems[jlpt].cn}
                  label={JLPTListItems[jlpt].label}
                />
              )}
              {jouyou !== -1 && (
                <LevelBadge
                  dotCn={JouyouGradeListItems[jouyou].cn}
                  label={`Jouyou Grade ${JouyouGradeListItems[jouyou].label}`}
                />
              )}
              <FrequencyBadges frequency={frequency} />
            </div>
          ) : null}
        </div>
      }
    />
  );
};
