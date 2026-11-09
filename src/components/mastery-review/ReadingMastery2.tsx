import { readingMastery2PageMeta } from "@/lib/pages/practice-pages";
import { ReadingMasteryGame } from "./ReadingMastery";

/** /reading-mastery-2: Reading II, the secondary words' readings. */
const ReadingMastery2 = () => (
  <ReadingMasteryGame
    page={readingMastery2PageMeta}
    cardType="secondaryReading"
  />
);

export default ReadingMastery2;
