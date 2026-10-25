import { useMemo, useState } from "react";
import {
  useGetKanjiInfoFn,
  useIsKanjiWorkerReady,
  useKanjiSearch,
} from "@/kanji-worker/kanji-worker-hooks";
import { toSearchSettings } from "@/lib/settings/search-settings-adapter";
import { JLPT_TYPE_ARR, JLPTListItems, JLTPTtypes } from "@/lib/jlpt";
import {
  JOUYOU_GRADE_ARR,
  JouyouGrade,
  JouyouGradeListItems,
  toJouyouGrade,
} from "@/lib/jouyou-grade";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { useBookmarkedKanji } from "@/lib/engine/use-kanji-sets";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { DashboardPanel } from "./DashboardPanel";
import { TwoWaySwitch } from "./TwoWaySwitch";

const ALL_KANJI_SEARCH = toSearchSettings(new URLSearchParams());

type BandCounts<T extends string | number> = Record<
  T,
  { bookmarked: number; total: number }
>;

type BreakdownBand = {
  key: string;
  label: string;
  cn: string;
  bookmarked: number;
  total: number;
};

const emptyJlptCounts = (): BandCounts<JLTPTtypes> =>
  Object.fromEntries(
    JLPT_TYPE_ARR.map((k) => [k, { bookmarked: 0, total: 0 }])
  ) as BandCounts<JLTPTtypes>;

const emptyGradeCounts = (): BandCounts<JouyouGrade> =>
  Object.fromEntries(
    JOUYOU_GRADE_ARR.map((k) => [k, { bookmarked: 0, total: 0 }])
  ) as BandCounts<JouyouGrade>;

const BreakdownRows = ({ bands }: { bands: BreakdownBand[] }) => (
  <Table>
    <TableBody>
      {bands.map(({ key, label, cn, bookmarked: n, total }) => {
        const pct = total > 0 ? (n / total) * 100 : 0;
        return (
          <TableRow key={key} className="p-0 my-1 text-left">
            <TableCell className="p-0">
              <div className="flex items-center justify-between py-1 pl-2 text-xs text-left ">
                <span className={`h-3 w-3 inline-block ${cn} rounded-full`} />
                <span className="mx-2 font-extrabold ">{label}</span>{" "}
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
              <span className="inline-block min-w-14 -mb-0_5 grow text-end">
                {n} / {total}
              </span>
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);

const BookmarksBreakdownBody = () => {
  const loggedIn = useAccountStatus().kind === "active";
  const ready = useIsKanjiWorkerReady();
  const getInfo = useGetKanjiInfoFn();
  const search = useKanjiSearch(ALL_KANJI_SEARCH);
  const bookmarks = useBookmarkedKanji();
  const [showGrade, setShowGrade] = useState(false);

  const jlptBands = useMemo((): BreakdownBand[] => {
    const next = emptyJlptCounts();
    if (!ready || !getInfo || !search.data) return [];

    for (const kanji of search.data) {
      const jlpt = getInfo(kanji)?.jlpt ?? "none";
      next[jlpt].total += 1;
    }

    for (const kanji of bookmarks.kanji) {
      const jlpt = getInfo(kanji)?.jlpt ?? "none";
      next[jlpt].bookmarked += 1;
    }

    return JLPT_TYPE_ARR.map((jlpt) => {
      const meta = JLPTListItems[jlpt];
      return {
        key: jlpt,
        label: meta.label !== "Not in JLPT" ? meta.label : "~",
        cn: meta.cn,
        bookmarked: next[jlpt].bookmarked,
        total: next[jlpt].total,
      };
    });
  }, [ready, getInfo, search.data, bookmarks.kanji]);

  const gradeBands = useMemo((): BreakdownBand[] => {
    const next = emptyGradeCounts();
    if (!ready || !getInfo || !search.data) return [];

    for (const kanji of search.data) {
      const grade = toJouyouGrade(getInfo(kanji)?.jouyouGrade);
      next[grade].total += 1;
    }

    for (const kanji of bookmarks.kanji) {
      const grade = toJouyouGrade(getInfo(kanji)?.jouyouGrade);
      next[grade].bookmarked += 1;
    }

    return JOUYOU_GRADE_ARR.map((grade) => {
      const meta = JouyouGradeListItems[grade];
      return {
        key: String(grade),
        label: meta.label !== "Not in Jouyou" ? meta.label : "~",
        cn: meta.cn,
        bookmarked: next[grade].bookmarked,
        total: next[grade].total,
      };
    });
  }, [ready, getInfo, search.data, bookmarks.kanji]);

  // Grade now comes from the same synchronous lookup as JLPT, so there is no
  // separate grade-map request to wait on.
  // Without an account there are no bookmarks to wait for: every band is 0.
  const loading =
    !ready ||
    search.status === "loading" ||
    search.status === "idle" ||
    (loggedIn && bookmarks.status === "loading");

  const bands = showGrade ? gradeBands : jlptBands;
  return (
    <>
      {loading ? (
        <div className="py-8">
          <KaomojiAnimation />
        </div>
      ) : (
        <div
          key={showGrade ? "grade" : "jlpt"}
          className="animate-fade-in-fast"
        >
          <BreakdownRows bands={bands} />
        </div>
      )}
      {/* Under the rows, like the switch under Kanji Mastery's bars. */}
      <TwoWaySwitch
        className="mt-4"
        left="JLPT"
        right="Grade"
        checked={showGrade}
        onCheckedChange={setShowGrade}
        ariaLabel="Toggle between JLPT and grade breakdown"
      />
    </>
  );
};

export const BookmarksBreakdown = () => (
  <DashboardPanel title="Bookmarks">
    <BookmarksBreakdownBody />
  </DashboardPanel>
);
