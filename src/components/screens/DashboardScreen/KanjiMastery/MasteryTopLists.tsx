import { useState } from "react";
import type { CardType, ReviewPileItemView } from "engine-contract";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { RecapTile } from "@/components/shared-practice/RecapTile";
import { formatInterval } from "@/lib/engine/format-interval";
import { ALL_CARD_TYPES, CARD_TYPE_LABELS } from "@/lib/engine/card-types";
import { MasterySubsection } from "./MasterySubsection";
import { SegmentedTabsList } from "@/components/ui/segmented-tabs";
import { Tabs } from "@/components/ui/tabs";
import {
  leastStableCards,
  MOST_DIFFICULT_ABOVE,
  recentMistakeCards,
  topDifficultCards,
  type TopCard,
} from "./mastery-tally";

/** What an empty list shows: an emoji, a short title, and what shows up here. */
type EmptyList = { emoji: string; title: string; hint: string };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The cards as round-recap tiles (each opens the kanji drawer), each with an
 * optional short caption under it.
 */
const TopTiles = ({
  cards,
  getInfo,
  empty,
  captionFor,
}: {
  cards: TopCard[];
  getInfo: GetBasicKanjiInfo;
  empty: EmptyList;
  captionFor?: (card: TopCard) => string;
}) => {
  if (cards.length === 0) {
    return (
      // Muted dashed border with square corners.
      <div className="flex flex-col items-center w-full gap-1 px-4 py-6 mt-3 text-center border-2 border-dashed border-foreground/15">
        <span aria-hidden className="text-2xl">
          {empty.emoji}
        </span>
        <p className="text-sm font-bold">{empty.title}</p>
        <p className="text-xs text-muted-foreground text-pretty">
          {empty.hint}
        </p>
      </div>
    );
  }
  return (
    <ol className="flex flex-wrap gap-2 mt-3">
      {cards.map((card) => (
        <li
          key={`${card.kanji}-${card.cardType}`}
          className="flex flex-col items-center gap-0.5"
        >
          <RecapTile
            kanji={card.kanji}
            keyword={getInfo(card.kanji)?.keyword ?? "..."}
            correct={false}
          />
          {captionFor && (
            <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
              {captionFor(card)}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
};

/**
 * One top list, collapsible like the Fill in the Kanji groups: inside, what
 * it is, a Reading / Writing switch and that side's tiles. Swapped content
 * fades in.
 */
const TopListItem = ({
  pile,
  getInfo,
  title,
  about,
  cardsFor,
  empty,
  captionFor,
}: {
  pile: readonly ReviewPileItemView[];
  getInfo: GetBasicKanjiInfo;
  title: string;
  about: string;
  cardsFor: (
    pile: readonly ReviewPileItemView[],
    cardType: CardType
  ) => TopCard[];
  empty: (cardType: CardType) => EmptyList;
  captionFor?: (card: TopCard) => string;
}) => {
  const [cardType, setCardType] = useState<CardType>("writing");
  return (
    <MasterySubsection title={title}>
      <p className="mb-3 text-xs text-left text-muted-foreground">{about}</p>
      <Tabs
        value={cardType}
        onValueChange={(value) => setCardType(value as CardType)}
      >
        <SegmentedTabsList
          value={cardType}
          label="Card type"
          className="h-9 text-xs"
          options={ALL_CARD_TYPES.map((value) => ({
            value,
            label: CARD_TYPE_LABELS[value],
          }))}
        />
      </Tabs>
      <div key={cardType} className="animate-fade-in-fast">
        <TopTiles
          cards={cardsFor(pile, cardType)}
          getInfo={getInfo}
          empty={empty(cardType)}
          captionFor={captionFor}
        />
      </div>
    </MasterySubsection>
  );
};

/**
 * Top 10 hardest cards, least stable cards and recent mistakes, each
 * collapsible; they go in the Kanji Mastery accordion.
 */
export const MasteryTopLists = ({
  pile,
  getInfo,
}: {
  pile: readonly ReviewPileItemView[];
  getInfo: GetBasicKanjiInfo;
}) => (
  <>
    <TopListItem
      pile={pile}
      getInfo={getInfo}
      title="Top 10 Most Difficult"
      about={`Your hardest cards: difficulty above ${MOST_DIFFICULT_ABOVE} on a scale of 1 (easy) to 10 (hard).`}
      cardsFor={topDifficultCards}
      empty={(cardType) => ({
        emoji: "🎯",
        title: "Nothing that hard",
        hint: `${CARD_TYPE_LABELS[cardType]} cards above difficulty ${MOST_DIFFICULT_ABOVE} show up here.`,
      })}
    />
    <TopListItem
      pile={pile}
      getInfo={getInfo}
      title="Top 10 Least Stable"
      about="The cards you'll forget soonest, lowest stability first; under each, its stability: about how long until recall drops to your target retention. Cards being relearned are left out, since Recent Mistakes covers those."
      cardsFor={leastStableCards}
      captionFor={(card) => formatInterval(card.stability * DAY_MS)}
      empty={(cardType) => ({
        emoji: "🌱",
        title: "Nothing to show yet",
        hint: `${CARD_TYPE_LABELS[cardType]} cards show up here once they're past learning.`,
      })}
    />
    <TopListItem
      pile={pile}
      getInfo={getInfo}
      title="Top 10 Recent Mistakes"
      about="Cards you missed lately that are being relearned, newest first."
      cardsFor={recentMistakeCards}
      empty={(cardType) => ({
        emoji: "✨",
        title: "No mistakes to relearn",
        hint: `${CARD_TYPE_LABELS[cardType]} cards you missed lately show up here.`,
      })}
    />
  </>
);
