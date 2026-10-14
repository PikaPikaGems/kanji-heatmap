import { lazy, Suspense } from "react";
import {
  useGetKanjiInfoFn,
  useKanjiSearch,
} from "@/kanji-worker/kanji-worker-hooks";
import { toSearchSettings } from "@/lib/settings/search-settings-adapter";
import { REVIEW_PILE_ALL_KEY, snapshotValue } from "@/lib/engine/store-cache";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { MasteryBars } from "./MasteryBars";
import { MasteryTopLists } from "./MasteryTopLists";

// The `?open=` links in the top lists open the kanji drawer on this page.
const KanjiDrawerGlobal = lazy(
  () => import("@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal")
);

const ALL_KANJI_SEARCH = toSearchSettings(new URLSearchParams());

/** Pile snapshot + kanji data -> loading / failed / the mastery view. */
export const KanjiMasteryBody = () => {
  const pile = useEngineQuery(REVIEW_PILE_ALL_KEY, (api) =>
    api.reviews.pile.watchAll()
  );
  const getInfo = useGetKanjiInfoFn();
  const search = useKanjiSearch(ALL_KANJI_SEARCH);

  const pileFailed =
    pile.status === "failed" || (pile.status === "ready" && !pile.result.ok);
  if (pileFailed || search.status === "error") {
    return (
      <p className="text-sm text-muted-foreground">
        Couldn&apos;t load your kanji mastery. Try again in a moment.
      </p>
    );
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
