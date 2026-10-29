import { DashboardPanel } from "../DashboardPanel";
import { KanjiMasteryBody } from "./KanjiMasteryBody";

/** Collapsible dashboard section: review mastery / stability / difficulty per JLPT level or Jouyou grade. */
export const KanjiMastery = () => (
  <DashboardPanel title="Kanji Mastery ⭐️">
    <KanjiMasteryBody />
  </DashboardPanel>
);
