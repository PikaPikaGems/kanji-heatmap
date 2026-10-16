import { lazy, Suspense } from "react";
import {
  useGetKanjiInfoFn,
  useKanjiSearch,
} from "@/kanji-worker/kanji-worker-hooks";
import { toSearchSettings } from "@/lib/settings/search-settings-adapter";
import {
  getCachedStore,
  REVIEW_PILE_ALL_KEY,
  snapshotValue,
} from "@/lib/engine/store-cache";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { useEngineApi, useEngineQuery } from "@/lib/engine/use-engine-query";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { PracticeButton } from "@/components/ui/practice-button";
import { PanelNotice } from "../PanelNotice";
import { MasteryBars } from "./MasteryBars";
import { MasteryTopLists } from "./MasteryTopLists";

// The top lists' tiles link `?open=<kanji>`, which opens the drawer here.
const KanjiDrawerGlobal = lazy(
  () => import("@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal")
);

const ALL_KANJI_SEARCH = toSearchSettings(new URLSearchParams());

const LoadFailed = ({ onRetry }: { onRetry?: () => void }) => (
  <PanelNotice>
    <p className="font-bold text-yellow-600 dark:text-yellow-400">
      Couldn&apos;t load your kanji mastery.
    </p>
    {onRetry ? (
      <PracticeButton variant="secondary" onClick={onRetry}>
        Try again
      </PracticeButton>
    ) : null}
  </PanelNotice>
);

/**
 * Pile snapshot + kanji data -> loading / failed / the mastery view. With no
 * account to read the pile from, the view draws an empty pile.
 */
export const KanjiMasteryBody = () => {
  const loggedIn = useAccountStatus().kind === "active";
  const api = useEngineApi();
  const pile = useEngineQuery(REVIEW_PILE_ALL_KEY, (a) =>
    a.reviews.pile.watchAll()
  );
  const getInfo = useGetKanjiInfoFn();
  const search = useKanjiSearch(ALL_KANJI_SEARCH);

  if (loggedIn && pile.status === "failed") {
    return (
      <LoadFailed
        onRetry={
          pile.retryable && api
            ? () =>
                void getCachedStore(api, REVIEW_PILE_ALL_KEY, (a) =>
                  a.reviews.pile.watchAll()
                ).refresh()
            : undefined
        }
      />
    );
  }
  if (
    (loggedIn && pile.status === "ready" && !pile.result.ok) ||
    search.status === "error"
  ) {
    return <LoadFailed />;
  }

  const rows = loggedIn ? snapshotValue(pile) : [];
  if (!rows || !getInfo || !search.data) {
    return (
      <div className="py-8">
        <KaomojiAnimation />
      </div>
    );
  }

  return (
    <>
      <MasteryBars pile={rows} allKanji={search.data} getInfo={getInfo} />
      <MasteryTopLists pile={rows} getInfo={getInfo} />
      <Suspense fallback={null}>
        <KanjiDrawerGlobal />
      </Suspense>
    </>
  );
};
