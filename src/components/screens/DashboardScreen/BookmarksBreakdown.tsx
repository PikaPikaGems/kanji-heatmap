import { useMemo } from "react";
import {
  useGetKanjiInfoFn,
  useIsKanjiWorkerReady,
  useKanjiSearch,
} from "@/kanji-worker/kanji-worker-hooks";
import { toSearchSettings } from "@/lib/settings/search-settings-adapter";
import { JLPT_TYPE_ARR, JLPTListItems, JLTPTtypes } from "@/lib/jlpt";
import { useBookmarkedKanji } from "@/hooks/use-bookmarked-kanji";
import { Progress } from "@/components/ui/progress";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { SectionHeading } from "./SectionHeading";
import { DashboardPanel } from "./DashboardPanel";

const ALL_KANJI_SEARCH = toSearchSettings(new URLSearchParams());

type JlptCounts = Record<JLTPTtypes, { bookmarked: number; total: number }>;

const emptyCounts = (): JlptCounts =>
  Object.fromEntries(
    JLPT_TYPE_ARR.map((k) => [k, { bookmarked: 0, total: 0 }])
  ) as JlptCounts;

export const BookmarksBreakdown = () => {
  const ready = useIsKanjiWorkerReady();
  const getInfo = useGetKanjiInfoFn();
  const search = useKanjiSearch(ALL_KANJI_SEARCH);
  const bookmarked = useBookmarkedKanji();

  const counts = useMemo(() => {
    const next = emptyCounts();
    if (!ready || !getInfo || !search.data) return next;

    for (const kanji of search.data) {
      const jlpt = getInfo(kanji)?.jlpt ?? "none";
      next[jlpt].total += 1;
    }

    for (const kanji of bookmarked) {
      const jlpt = getInfo(kanji)?.jlpt ?? "none";
      next[jlpt].bookmarked += 1;
    }

    return next;
  }, [ready, getInfo, search.data, bookmarked]);

  const loading =
    !ready || search.status === "loading" || search.status === "idle";

  const totalBookmarked = bookmarked.length;

  return (
    <DashboardPanel>
      <SectionHeading
        title="Bookmarks"
        description="How much of each JLPT band you've bookmarked."
      />
      {loading ? (
        <div className="py-8">
          <KaomojiAnimation />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1 ">
            {JLPT_TYPE_ARR.map((jlpt) => {
              const { bookmarked: n, total } = counts[jlpt];
              const pct = total > 0 ? (n / total) * 100 : 0;
              const meta = JLPTListItems[jlpt];
              return (
                <div key={jlpt} className="flex items-center gap-2">
                  <div className="flex items-center w-10 gap-2 text-sm font-extrabold shrink-0">
                    <span
                      className={`inline-block size-2.5 shrink-0 rounded-full ${meta.cn}`}
                    />
                    {meta.label !== "Not in JLPT" ? meta.label : "~"}
                  </div>
                  <Progress
                    className="flex-1 h-2.5 border border-border/60"
                    value={pct}
                    primitiveCn={meta.cn}
                  />
                  <div className="w-8 text-xs font-bold text-right shrink-0 tabular-nums text-muted-foreground">
                    {n}/{total}
                  </div>
                </div>
              );
            })}
          </div>
          {totalBookmarked === 0 ? (
            <p className="mt-5 text-sm font-semibold text-center text-muted-foreground">
              Bookmark a word from a kanji’s detail drawer to start filling
              these bars.
            </p>
          ) : null}
        </>
      )}
    </DashboardPanel>
  );
};
