import { SyncNowAction } from "@/components/dependent/account/SyncNowAction";
import {
  ENTITLEMENT_EXPIRED_COPY,
  isSyncBlockerCopy,
} from "@/lib/engine/engine-copy";
import type { CardType } from "engine-contract";
import { UserNotice } from "@/components/common/UserNotice";
import { PracticeButton } from "@/components/ui/practice-button";
import { PracticeBottomBar, Stat } from "@/components/shared-practice";
import { LeavePractice } from "@/components/shared-practice/EndSessionButton";
import { useOpenedParam } from "@/hooks/routing-hooks";
import { useEnterAction } from "@/hooks/use-enter-action";
import { useDataDownload } from "@/lib/engine/data-download";
import { useDueCount } from "@/lib/engine/use-due-count";
import { NothingDue } from "./NothingDue";
import { useNextDueAt } from "./use-next-due-at";
import { cnWarningText } from "@/lib/generic-cn";

/**
 * Start screen of a mastery game: how many cards are due, then Start. While
 * the account's data hasn't downloaded, it says so instead (Start stays
 * disabled; the bottom banner has Try again). Without premium Start is
 * disabled too, and the bottom banner says why.
 */
export const MasteryStartScreen = ({
  heading,
  description,
  cardType,
  ready,
  blocker,
  error,
  onStart,
}: {
  heading: string;
  description: string;
  cardType: CardType;
  /** The card data (words, readings) has loaded. */
  ready: boolean;
  /** Why reviewing can't start, shown instead of the Start hint. */
  blocker: string | null;
  /** The last attempt to fetch the round failed. */
  error?: string;
  onStart: () => void;
}) => {
  const downloaded = useDataDownload() === "ready";
  const due = useDueCount()?.[cardType] ?? null;
  const nextDueAt = useNextDueAt(cardType);
  const canStart =
    downloaded && ready && blocker == null && due != null && due > 0;
  // The bottom banner already covers these two.
  const notice =
    !downloaded || blocker === ENTITLEMENT_EXPIRED_COPY
      ? (error ?? null)
      : (blocker ?? error ?? null);
  // A suggested kanji's drawer can be open; its buttons own Enter then.
  const drawerOpen = useOpenedParam() != null;

  useEnterAction(canStart && !drawerOpen ? onStart : null, canStart);

  return (
    <div className="relative flex flex-col h-full">
      <LeavePractice />
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex flex-col items-center justify-center max-w-md min-h-full gap-6 px-4 py-6 mx-auto text-center">
          <div>
            <h1 className="text-xl font-bold">{heading}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          {!downloaded && (
            <UserNotice
              icon="📥"
              className="text-base font-bold text-center animate-fade-in-fast"
            >
              Your reviews haven&apos;t downloaded yet.
            </UserNotice>
          )}
          {downloaded && due == null && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {downloaded && due != null && due > 0 && (
            <Stat value={due} unit="" label="Due now" />
          )}
          {downloaded && due === 0 && (
            <NothingDue nextDueAt={nextDueAt} canAdd={blocker == null} />
          )}
        </div>
      </div>

      <PracticeBottomBar>
        {notice && (
          <div role="status">
            <UserNotice className={cnWarningText}>
              {notice}
              {isSyncBlockerCopy(notice) && (
                <>
                  {" "}
                  <SyncNowAction />
                </>
              )}
            </UserNotice>
          </div>
        )}
        <PracticeButton size="lg" disabled={!canStart} onClick={onStart}>
          Start
        </PracticeButton>
      </PracticeBottomBar>
    </div>
  );
};
