import { useLocalStorage } from "@/hooks/use-local-storage";
import { useEnterAction } from "@/hooks/use-enter-action";
import {
  PracticeInitialScreen,
  SoundAfterAnswering,
  ToggleRow,
  usePracticeDeck,
} from "@/components/shared-practice";
import { productionPracticePageMeta } from "@/lib/pages/practice-pages";
import { DEFAULT_SETTINGS, SETTINGS_KEY, soundOf } from "./constants";
import { PracticeItem, ProductionPracticeSettings } from "./types";

export const InitialScreen = ({
  onStart,
}: {
  onStart: (deck: PracticeItem[]) => void;
}) => {
  const [settings, setSetting] = useLocalStorage<ProductionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  // Writing practice never randomizes fonts (unlike reading / speed katakana).
  // Each card shows the main word with the secondary one next to it.
  const { deck, loading, canStart } = usePracticeDeck(
    { ...settings, randomizeFont: false },
    "main-and-secondary"
  );

  useEnterAction(canStart ? () => onStart(deck) : null, canStart);

  return (
    <PracticeInitialScreen
      heading={productionPracticePageMeta.heading}
      description={productionPracticePageMeta.description}
      filters={settings}
      onFilterChange={setSetting}
      showRandomizeFont={false}
      deckSize={deck.length}
      loading={loading}
      canStart={canStart}
      onStart={() => onStart(deck)}
      sessionOptions={
        <SoundAfterAnswering
          sound={soundOf(settings)}
          onChange={(sound) => setSetting("sound", sound)}
          childrenSpeak={settings.hearPronunciationOnLoad}
        >
          <ToggleRow
            id="hear-on-load"
            label="Hear pronunciation on load"
            checked={settings.hearPronunciationOnLoad}
            onChange={(v) => setSetting("hearPronunciationOnLoad", v)}
          />
        </SoundAfterAnswering>
      }
    />
  );
};
