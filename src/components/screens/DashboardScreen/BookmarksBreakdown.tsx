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
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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

  return (
    <DashboardPanel>
      <SectionHeading
        title="Bookmarks"
        description="How much of each JLPT band you've bookmarked.  Bookmark a word from a kanji’s detail drawer to start filling these bars."
      />
      {loading ? (
        <div className="py-8">
          <KaomojiAnimation />
        </div>
      ) : (
        <Table>
          <TableBody>
            {JLPT_TYPE_ARR.map((jlpt) => {
              const { bookmarked: n, total } = counts[jlpt];
              const pct = total > 0 ? (n / total) * 100 : 0;
              const meta = JLPTListItems[jlpt];
              return (
                <TableRow key={jlpt} className="p-0 my-1 text-left">
                  <TableCell className="p-0">
                    <div className="flex items-center justify-between py-1 pl-2 text-xs text-left ">
                      <span
                        className={`h-3 w-3 inline-block ${meta.cn} rounded-full`}
                      />
                      <span className="mx-2 font-extrabold ">
                        {meta.label !== "Not in JLPT" ? meta.label : "~"}
                      </span>{" "}
                    </div>
                  </TableCell>
                  <TableCell className="w-full px-0 py-2">
                    <Progress
                      className="h-1"
                      value={pct}
                      primitiveCn="background-theme-color-with-opacity-100"
                    />
                  </TableCell>
                  <TableCell className="p-0 text-[10px]">
                    <span className="inline-block w-12 -mb-0_5 grow text-end">
                      {n} / {total}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </DashboardPanel>
  );
};
