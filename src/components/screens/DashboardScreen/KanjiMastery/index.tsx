import { AccountGatedPanel } from "../AccountGatedPanel";
import { KanjiMasteryBody } from "./KanjiMasteryBody";

/** Collapsible dashboard section: review stability / difficulty per JLPT level or Jouyou grade. */
export const KanjiMastery = () => (
  <AccountGatedPanel title="Kanji Mastery">
    <KanjiMasteryBody />
  </AccountGatedPanel>
);
