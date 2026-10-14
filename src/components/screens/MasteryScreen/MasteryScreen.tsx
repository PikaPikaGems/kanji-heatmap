import { lazy } from "react";
import { Loader2 } from "lucide-react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useIsKanjiWorkerReady } from "@/kanji-worker/kanji-worker-hooks";
import { AccountGateMessage } from "@/components/mastery-review/MasteryGateScreen";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { ControlBar } from "../ListScreen/ControlBar";
import { ItemCountBadge } from "../ListScreen/ControlBar/ItemCountBadge";
import LoadingKanjis from "../ListScreen/KanjiList/LoadingKanjis";
import { SuspendedKanjiList } from "../ListScreen/KanjiList/LazyKanjiList";
import { ListScreenLayout } from "../ListScreen/ListScreenLayout";
import { MasteryMetricBadge } from "./MasteryMetricBadge";
import { MasteryTileColors } from "./MasteryTileColors";

const MasteryPresentationPopover = lazy(
  () => import("./MasteryPresentationPopover")
);

/** The `/` grid, search, sort and filter, colored by mastery (design 5.9). */
const MasteryScreen = () => {
  useHtmlDocumentTitle("Mastery");
  const account = useAccountStatus();
  const ready = useIsKanjiWorkerReady();

  if (account.kind === "loading") {
    return (
      <div
        className="flex items-center justify-center min-h-dvh"
        role="status"
        aria-label="Loading"
      >
        <Loader2 className="size-7 animate-spin" />
      </div>
    );
  }

  if (account.kind !== "active") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 pt-12 text-center min-h-dvh pb-28 animate-fade-in">
        <AccountGateMessage status={account} />
      </div>
    );
  }

  return (
    <ListScreenLayout
      controlBar={<ControlBar Popover={MasteryPresentationPopover} />}
      badge={
        <>
          <ItemCountBadge />
          <MasteryMetricBadge />
        </>
      }
    >
      {ready ? (
        <MasteryTileColors>
          <SuspendedKanjiList />
        </MasteryTileColors>
      ) : (
        <LoadingKanjis />
      )}
    </ListScreenLayout>
  );
};

export default MasteryScreen;
