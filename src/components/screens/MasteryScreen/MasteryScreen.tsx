import { lazy } from "react";
import { Loader2 } from "lucide-react";
import { PracticeButton } from "@/components/ui/practice-button";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useIsKanjiWorkerReady } from "@/kanji-worker/kanji-worker-hooks";
import { AccountGateMessage } from "@/components/mastery-review/MasteryGateScreen";
import { isEngineAbsent } from "@/lib/engine/account-ui";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { useReviewPileByKanji } from "@/lib/engine/use-review-pile";
import { ControlBar } from "../ListScreen/ControlBar";
import { ItemCountBadge } from "../ListScreen/ControlBar/ItemCountBadge";
import LoadingKanjis from "../ListScreen/KanjiList/LoadingKanjis";
import { SuspendedKanjiList } from "../ListScreen/KanjiList/LazyKanjiList";
import { ListScreenLayout } from "../ListScreen/ListScreenLayout";
import { MasteryCenteredMessage } from "./MasteryCenteredMessage";
import { MasteryMetricBadge } from "./MasteryMetricBadge";
import { MasteryAccountBanner } from "./MasteryAccountBanner";
import { LoginPill } from "@/components/dependent/account/LoginPill";
import { MasteryTileColors } from "./MasteryTileColors";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

const MasteryPresentationPopover = lazy(
  () => import("./MasteryPresentationPopover")
);

/**
 * The `/` grid, colored by mastery (design 5.9). Search, sort, filter and
 * item settings are shared with `/`; the background color meaning is its own.
 * Without a pile to read (signed out, a browser that can't save progress, or
 * a build without the engine) every tile stays uncolored ("Not started");
 * a bottom banner says why, except in builds without the engine.
 */
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

  if (account.kind === "error" || account.kind === "recovery") {
    return (
      <MasteryCenteredMessage>
        <AccountGateMessage status={account} />
      </MasteryCenteredMessage>
    );
  }

  if (account.kind === "active" && pile.status === "failed") {
    return (
      <MasteryCenteredMessage>
        <p className={cn("max-w-sm text-sm", cnWarningText)}>
          Couldn&apos;t load your progress.
        </p>
        {pile.retry && (
          <PracticeButton variant="secondary" onClick={pile.retry}>
            Try again
          </PracticeButton>
        )}
      </MasteryCenteredMessage>
    );
  }

  const unsupportedBrowser =
    account.kind === "unavailable" && !isEngineAbsent(account.reason);

  return (
    <>
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
      {account.kind === "signed-out" && <LoginPill emoji="💪" />}
      {unsupportedBrowser && <MasteryAccountBanner />}
    </>
  );
};

export default MasteryScreen;
