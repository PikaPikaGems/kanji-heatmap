import type {
  CardProgress,
  CardType,
  ReviewPileItemView,
} from "engine-contract";

/** Every card type, in the order the app lists them. */
export const ALL_CARD_TYPES: CardType[] = [
  "writing",
  "reading",
  "secondaryReading",
];

/** Short names for each card type, e.g. a review's or a column's label. */
export const CARD_TYPE_LABELS: Record<CardType, string> = {
  writing: "Writing",
  reading: "Reading I",
  secondaryReading: "Reading II",
};

/** A pile item's card of `cardType`; null for Reading II without a secondary word. */
export const cardProgress = (
  item: ReviewPileItemView,
  cardType: CardType
): CardProgress | null => {
  if (cardType === "secondaryReading") return item.secondary?.reading ?? null;
  return item[cardType];
};

/** The word a card asks about: the secondary word for Reading II, else the main word. */
export const cardWord = (
  item: ReviewPileItemView,
  cardType: CardType
): string =>
  cardType === "secondaryReading" && item.secondary
    ? item.secondary.word
    : item.word;
