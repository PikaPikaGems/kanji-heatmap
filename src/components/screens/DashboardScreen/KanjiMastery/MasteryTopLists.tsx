import { useState } from "react";
import type { CardType, ReviewPileItemView } from "engine-contract";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { RecapTile } from "@/components/shared-practice/RecapTile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TwoWaySwitch } from "../TwoWaySwitch";
import {
  MOST_DIFFICULT_ABOVE,
  recentMistakeCards,
  topDifficultCards,
  type TopCard,
} from "./mastery-tally";

const CARD_TYPE_LABELS: Record<CardType, string> = {
  reading: "Reading",
  writing: "Writing",
};

/** What an empty list shows: an emoji, a short title, and what shows up here. */
type EmptyList = { emoji: string; title: string; hint: string };

/** The cards as round-recap tiles (each opens the kanji drawer). */
const TopTiles = ({
  cards,
  getInfo,
  empty,
}: {
  cards: TopCard[];
  getInfo: GetBasicKanjiInfo;
  empty: EmptyList;
}) => {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center w-full gap-1 px-4 py-8 mt-3 text-center border-2 border-dotted rounded-2xl">
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
    <ol className="flex flex-wrap justify-center gap-2 mt-3">
      {cards.map((card) => (
        <li key={`${card.kanji}-${card.cardType}`}>
          <RecapTile
            kanji={card.kanji}
            keyword={getInfo(card.kanji)?.keyword ?? "..."}
            correct={false}
          />
        </li>
      ))}
    </ol>
  );
};

/**
 * One top list: what it is under its title (like the Fill in the Kanji
 * groups), and inside, a Reading / Writing switch and that side's tiles.
 * Swapped content fades in.
 */
const TopListItem = ({
  pile,
  getInfo,
  title,
  about,
  cardsFor,
  empty,
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
}) => {
  const [cardType, setCardType] = useState<CardType>("reading");
  return (
    <AccordionItem
      value={title}
      className="border-b-2 border-dashed last:border-b-0"
    >
      <AccordionTrigger className="py-3 text-left hover:no-underline">
        <span className="flex flex-col">
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {about}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pl-3 border-l-2 border-dotted">
        <TwoWaySwitch
          left="Reading"
          right="Writing"
          checked={cardType === "writing"}
          onCheckedChange={(writing) =>
            setCardType(writing ? "writing" : "reading")
          }
          ariaLabel="Toggle between reading and writing cards"
        />
        <div key={cardType} className="animate-fade-in-fast">
          <TopTiles
            cards={cardsFor(pile, cardType)}
            getInfo={getInfo}
            empty={empty(cardType)}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

/** Top 10 hardest cards and top 10 recent mistakes, each collapsible. */
export const MasteryTopLists = ({
  pile,
  getInfo,
}: {
  pile: readonly ReviewPileItemView[];
  getInfo: GetBasicKanjiInfo;
}) => (
  <Accordion type="multiple" className="pt-2 mt-8 border-t border-dotted">
    <TopListItem
      pile={pile}
      getInfo={getInfo}
      title="Top 10 Most Difficult"
      about={`Your hardest cards: difficulty above ${MOST_DIFFICULT_ABOVE} on a scale of 1 (easy) to 10 (hard)`}
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
      title="Top 10 Recent Mistakes"
      about="Cards you missed lately that are being relearned, newest first"
      cardsFor={recentMistakeCards}
      empty={(cardType) => ({
        emoji: "✨",
        title: "No mistakes to relearn",
        hint: `${CARD_TYPE_LABELS[cardType]} cards you missed lately show up here.`,
      })}
    />
  </Accordion>
);
