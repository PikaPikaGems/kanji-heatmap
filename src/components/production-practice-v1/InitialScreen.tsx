import { useLocalStorage } from "@/hooks/use-local-storage";
import { useEnterAction } from "@/hooks/use-enter-action";
import {
  PracticeInitialScreen,
  ToggleRow,
  usePracticeDeck,
} from "@/components/shared-practice";
import { productionPracticePageMeta } from "@/lib/pages/practice-pages";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./constants";
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
  const { deck, loading, canStart } = usePracticeDeck({
    ...settings,
    randomizeFont: false,
  });

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
        <>
          <ToggleRow
            id="blur-gloss"
            label="Blur English gloss"
            checked={settings.blurEnglishGloss}
            onChange={(v) => setSetting("blurEnglishGloss", v)}
          />
          <ToggleRow
            id="hear-on-load"
            label="Hear pronunciation on load"
            checked={settings.hearPronunciationOnLoad}
            onChange={(v) => setSetting("hearPronunciationOnLoad", v)}
          />
          {settings.hearPronunciationOnLoad && (
            <p className="w-full text-xs text-left animate-fade-in-fast">
              ⚠️ Text-to-speech might not work on all devices.
            </p>
          )}
          <ToggleRow
            id="celebratory-sound"
            label="Celebratory sound on correct"
            checked={settings.celebratorySoundOnCorrect}
            onChange={(v) => setSetting("celebratorySoundOnCorrect", v)}
          />
        </>
      }
    />
  );
};
