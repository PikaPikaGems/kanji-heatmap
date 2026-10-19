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
import { MasterySubsection } from "./MasterySubsection";
import { Accordion } from "@/components/ui/accordion";
import { cnWarningText } from "@/lib/generic-cn";
import type { MasteryMetric } from "@/lib/engine/mastery-metrics";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { MasteryKindFilter } from "./MasteryKindFilters";

// The top lists' tiles link `?open=<kanji>`, which opens the drawer here.
const KanjiDrawerGlobal = lazy(
  () => import("@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal")
);

/** One collapsible statistics section per measure, Mastery first (open). */
const STATS_SECTIONS: readonly { metric: MasteryMetric; title: string }[] = [
  { metric: "mastery", title: "Mastery Statistics" },
  { metric: "difficulty", title: "Difficulty Statistics" },
  { metric: "stability", title: "Stability Statistics" },
];

/** Card types the statistics show; every section shares (and remembers) it. */
const SHOWN_KINDS_KEY = "dashboard-mastery-card-kinds";
const ALL_KINDS_SHOWN: MasteryKindFilter = {
  reading: true,
  writing: true,
  combined: true,
};

const ALL_KANJI_SEARCH = toSearchSettings(new URLSearchParams());

const LoadFailed = ({ onRetry }: { onRetry?: () => void }) => (
  <PanelNotice>
    <p className={cnWarningText}>Couldn&apos;t load your kanji mastery.</p>
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
  const [shownKinds, setShownKind] = useLocalStorage<MasteryKindFilter>(
    SHOWN_KINDS_KEY,
    ALL_KINDS_SHOWN
  );

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

  const allKanji = search.data;
  return (
    <>
      {/* Mastery starts open, like the first Fill in the Kanji group. */}
      <Accordion
        type="multiple"
        defaultValue={[STATS_SECTIONS[0].title]}
        className="animate-fade-in"
      >
        {STATS_SECTIONS.map(({ metric, title }) => (
          <MasterySubsection key={metric} title={title}>
            <MasteryBars
              metric={metric}
              shownKinds={shownKinds}
              onKindChange={setShownKind}
              pile={rows}
              allKanji={allKanji}
              getInfo={getInfo}
            />
          </MasterySubsection>
        ))}
        <MasteryTopLists pile={rows} getInfo={getInfo} />
      </Accordion>
      <Suspense fallback={null}>
        <KanjiDrawerGlobal />
      </Suspense>
    </>
  );
};
