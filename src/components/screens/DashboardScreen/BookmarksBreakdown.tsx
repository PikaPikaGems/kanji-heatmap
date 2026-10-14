import { useId, useMemo, useState } from "react";
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
import { AccountRequiredNotice } from "@/components/dependent/account/AccountRequiredNotice";
import { isAccountUiHidden } from "@/lib/engine/account-ui";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { useBookmarkedKanji } from "@/lib/engine/use-kanji-sets";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { DashboardPanel } from "./DashboardPanel";

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
  const ready = useIsKanjiWorkerReady();
  const getInfo = useGetKanjiInfoFn();
  const search = useKanjiSearch(ALL_KANJI_SEARCH);
  const bookmarks = useBookmarkedKanji();
  const [showGrade, setShowGrade] = useState(false);
  const switchId = useId();

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
  const loading =
    !ready ||
    search.status === "loading" ||
    search.status === "idle" ||
    bookmarks.status === "loading";

  const bands = showGrade ? gradeBands : jlptBands;
  return (
    <>
      <div className="flex items-center justify-center gap-2 mb-4 text-xs text-muted-foreground">
        <Label
          htmlFor={switchId}
          className={!showGrade ? "text-foreground font-semibold" : undefined}
        >
          JLPT
        </Label>
        <Switch
          id={switchId}
          checked={showGrade}
          onCheckedChange={setShowGrade}
          aria-label="Toggle between JLPT and grade breakdown"
        />
        <Label
          htmlFor={switchId}
          className={showGrade ? "text-foreground font-semibold" : undefined}
        >
          Grade
        </Label>
      </div>
      {loading ? (
        <div className="py-8">
          <KaomojiAnimation />
        </div>
      ) : (
        <BreakdownRows bands={bands} />
      )}
    </>
  );
};

export const BookmarksBreakdown = () => {
  const status = useAccountStatus();

  // Bookmarks belong to the account, which builds without the engine lack.
  if (isAccountUiHidden(status)) return null;

  return (
    <DashboardPanel title="Bookmarks">
      {status.kind === "active" ? (
        <BookmarksBreakdownBody />
      ) : (
        <AccountRequiredNotice status={status} />
      )}
    </DashboardPanel>
  );
};
