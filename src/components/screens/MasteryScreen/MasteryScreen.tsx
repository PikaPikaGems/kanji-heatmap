import { lazy } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useIsKanjiWorkerReady } from "@/kanji-worker/kanji-worker-hooks";
import { AccountGateMessage } from "@/components/mastery-review/MasteryGateScreen";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { useReviewPileByKanji } from "@/lib/engine/use-review-pile";
import { ControlBar } from "../ListScreen/ControlBar";
import { ItemCountBadge } from "../ListScreen/ControlBar/ItemCountBadge";
import LoadingKanjis from "../ListScreen/KanjiList/LoadingKanjis";
import { SuspendedKanjiList } from "../ListScreen/KanjiList/LazyKanjiList";
import { ListScreenLayout } from "../ListScreen/ListScreenLayout";
import { MasteryCenteredMessage } from "./MasteryCenteredMessage";
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
  const pile = useReviewPileByKanji();

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
      <MasteryCenteredMessage>
        <AccountGateMessage status={account} />
      </MasteryCenteredMessage>
    );
  }

  if (pile.status === "failed") {
    return (
      <MasteryCenteredMessage>
        <p className="max-w-sm text-sm text-muted-foreground">
          Couldn&apos;t load your progress.
        </p>
        {pile.retry && (
          <Button variant="outline" onClick={pile.retry}>
            Try again
          </Button>
        )}
      </MasteryCenteredMessage>
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
