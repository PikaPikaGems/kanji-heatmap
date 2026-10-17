import { useState, type ReactNode } from "react";
import type { CardType, ReviewPileItemView } from "engine-contract";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { RecapTile } from "@/components/shared-practice/RecapTile";
import { TwoWaySwitch } from "../TwoWaySwitch";
import {
  recentMistakeCards,
  topDifficultCards,
  type TopCard,
} from "./mastery-tally";

const CARD_TYPE_LABELS: Record<CardType, string> = {
  reading: "Reading",
  writing: "Writing",
};

/** A heading and a short line on what the list is, centered like the bars. */
const TopListHeader = ({ title, about }: { title: string; about: string }) => (
  <div className="text-center">
    <h3 className="text-sm font-bold">{title}</h3>
    <p className="mt-0.5 text-xs text-muted-foreground">{about}</p>
  </div>
);

/**
 * The cards as round-recap tiles (each opens the kanji drawer), with an
 * optional small caption under each one.
 */
const TopTiles = ({
  cards,
  getInfo,
  empty,
  caption,
}: {
  cards: TopCard[];
  getInfo: GetBasicKanjiInfo;
  empty: string;
  caption?: (card: TopCard) => ReactNode;
}) => {
  if (cards.length === 0) {
    return (
      <p className="py-4 text-xs text-center text-muted-foreground">{empty}</p>
    );
  }
  return (
    <ol className="flex flex-wrap justify-center gap-2 mt-3">
      {cards.map((card) => (
        <li
          key={`${card.kanji}-${card.cardType}`}
          className="flex flex-col items-center gap-1"
        >
          <RecapTile
            kanji={card.kanji}
            keyword={getInfo(card.kanji)?.keyword ?? "..."}
            correct={false}
          />
          {caption && (
            <span className="text-[10px] font-semibold leading-none text-muted-foreground tabular-nums">
              {caption(card)}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
};

/**
 * One top list with a Reading / Writing switch: the heading, the switch, and
 * the tiles for the side that is on. Swapped content fades in.
 */
const TopListByCardType = ({
  pile,
  getInfo,
  title,
  about,
  cardsFor,
  empty,
  caption,
}: {
  pile: readonly ReviewPileItemView[];
  getInfo: GetBasicKanjiInfo;
  title: (cardType: CardType) => string;
  about: string;
  cardsFor: (
    pile: readonly ReviewPileItemView[],
    cardType: CardType
  ) => TopCard[];
  empty: (cardType: CardType) => string;
  caption?: (card: TopCard) => ReactNode;
}) => {
  const [cardType, setCardType] = useState<CardType>("reading");
  const heading = title(cardType);
  return (
    <section>
      <div key={heading} className="animate-fade-in-fast">
        <TopListHeader title={heading} about={about} />
      </div>
      <div className="mt-3">
        <TwoWaySwitch
          left="Reading"
          right="Writing"
          checked={cardType === "writing"}
          onCheckedChange={(writing) =>
            setCardType(writing ? "writing" : "reading")
          }
          ariaLabel="Toggle between reading and writing cards"
        />
      </div>
      <div key={cardType} className="animate-fade-in-fast">
        <TopTiles
          cards={cardsFor(pile, cardType)}
          getInfo={getInfo}
          empty={empty(cardType)}
          caption={caption}
        />
      </div>
    </section>
  );
};

/** Top 10 hardest cards and top 10 recent mistakes, one row each. */
export const MasteryTopLists = ({
  pile,
  getInfo,
}: {
  pile: readonly ReviewPileItemView[];
  getInfo: GetBasicKanjiInfo;
}) => (
  <div className="flex flex-col gap-8 pt-6 mt-8 border-t border-dotted">
    <TopListByCardType
      pile={pile}
      getInfo={getInfo}
      title={() => "Top 10 Most Difficult"}
      about="Your hardest cards by difficulty, from 1 (easy) to 10 (hard)."
      cardsFor={topDifficultCards}
      empty={(cardType) =>
        `No ${CARD_TYPE_LABELS[cardType].toLowerCase()} cards studied yet.`
      }
      caption={(card) => card.difficulty.toFixed(1)}
    />
    <TopListByCardType
      pile={pile}
      getInfo={getInfo}
      title={(cardType) => `Top 10 ${CARD_TYPE_LABELS[cardType]} Mistakes`}
      about="Cards you missed lately that are being relearned, newest first."
      cardsFor={recentMistakeCards}
      empty={(cardType) =>
        `No ${CARD_TYPE_LABELS[cardType].toLowerCase()} cards are being relearned.`
      }
    />
  </div>
);
