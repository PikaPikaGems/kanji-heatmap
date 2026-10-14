import type { ReactNode } from "react";
import type { ReviewPileItemView } from "engine-contract";
import { SpanBadge } from "@/components/ui/badge";
import { Link } from "@/components/dependent/routing/router-adapter";
import { URL_PARAMS } from "@/lib/settings/url-params";
import {
  recentMistakeCards,
  topDifficultCards,
  type TopCard,
} from "./mastery-tally";

const reviewedFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const CARD_TYPE_LABELS = { reading: "Reading", writing: "Writing" } as const;

const TopList = ({
  title,
  empty,
  cards,
  detail,
}: {
  title: string;
  empty: string;
  cards: TopCard[];
  detail: (card: TopCard) => ReactNode;
}) => (
  <section className="min-w-0 px-3 py-3 text-left border rounded-xl border-foreground/5 bg-muted/10">
    <h3 className="mb-2 text-sm font-bold">{title}</h3>
    {cards.length === 0 ? (
      <p className="text-xs text-muted-foreground">{empty}</p>
    ) : (
      <ol className="flex flex-col">
        {cards.map((card, i) => (
          <li key={`${card.kanji}-${card.cardType}`}>
            <Link
              to={`?${URL_PARAMS.openKanji}=${encodeURIComponent(card.kanji)}`}
              className="flex items-center gap-3 px-1 py-0.5 rounded-md hover:bg-foreground/10 active:bg-foreground/20"
            >
              <span className="w-5 text-[10px] text-end text-muted-foreground tabular-nums">
                {i + 1}
              </span>
              <span className="text-2xl kanji-font" lang="ja">
                {card.kanji}
              </span>
              <SpanBadge
                variant="outline"
                className="px-2 py-0 text-[10px] font-medium text-muted-foreground"
              >
                {CARD_TYPE_LABELS[card.cardType]}
              </SpanBadge>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                {detail(card)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    )}
  </section>
);

/** Top 10 hardest cards and top 10 recent mistakes; each row opens the kanji drawer. */
export const MasteryTopLists = ({
  pile,
}: {
  pile: readonly ReviewPileItemView[];
}) => (
  <div className="grid gap-6 mt-6 sm:grid-cols-2">
    <TopList
      title="Top 10 most difficult"
      empty="Nothing studied yet."
      cards={topDifficultCards(pile)}
      detail={(card) => `Difficulty ${card.difficulty.toFixed(1)}`}
    />
    <TopList
      title="Top 10 recent mistakes"
      empty="No cards are being relearned."
      cards={recentMistakeCards(pile)}
      detail={(card) =>
        card.lastReviewedAt
          ? reviewedFormat.format(new Date(card.lastReviewedAt))
          : ""
      }
    />
  </div>
);
