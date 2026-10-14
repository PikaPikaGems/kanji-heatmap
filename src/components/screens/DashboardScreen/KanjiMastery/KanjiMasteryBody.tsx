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
import { useEngineApi, useEngineQuery } from "@/lib/engine/use-engine-query";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { Button } from "@/components/ui/button";
import { PanelNotice } from "../PanelNotice";
import { MasteryBars } from "./MasteryBars";
import { MasteryTopLists } from "./MasteryTopLists";

// The `?open=` links in the top lists open the kanji drawer on this page.
const KanjiDrawerGlobal = lazy(
  () => import("@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal")
);

const ALL_KANJI_SEARCH = toSearchSettings(new URLSearchParams());

const LoadFailed = ({ onRetry }: { onRetry?: () => void }) => (
  <PanelNotice>
    <p>Couldn&apos;t load your kanji mastery.</p>
    {onRetry ? (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    ) : null}
  </PanelNotice>
);

/** Pile snapshot + kanji data -> loading / failed / the mastery view. */
export const KanjiMasteryBody = () => {
  const api = useEngineApi();
  const pile = useEngineQuery(REVIEW_PILE_ALL_KEY, (a) =>
    a.reviews.pile.watchAll()
  );
  const getInfo = useGetKanjiInfoFn();
  const search = useKanjiSearch(ALL_KANJI_SEARCH);

  if (pile.status === "failed") {
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
    (pile.status === "ready" && !pile.result.ok) ||
    search.status === "error"
  ) {
    return <LoadFailed />;
  }

  const rows = snapshotValue(pile);
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
      <MasteryTopLists pile={rows} />
      <Suspense fallback={null}>
        <KanjiDrawerGlobal />
      </Suspense>
    </>
  );
};
