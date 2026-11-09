import { useLocalStorage } from "@/hooks/use-local-storage";
import { useEnterAction } from "@/hooks/use-enter-action";
import {
  CHIME_SOUND,
  PracticeInitialScreen,
  SoundAfterAnswering,
  usePracticeDeck,
} from "@/components/shared-practice";
import type { PracticePageMeta } from "@/lib/pages/practice-pages";
import type { DeckAnchor } from "@/components/shared-practice/use-practice-deck";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./constants";
import { PracticeItem, RecognitionPracticeSettings } from "./types";

export const InitialScreen = ({
  page,
  anchor,
  onStart,
}: {
  page: PracticePageMeta;
  anchor: DeckAnchor;
  onStart: (deck: PracticeItem[]) => void;
}) => {
  const [settings, setSetting] = useLocalStorage<RecognitionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const { deck, loading, canStart } = usePracticeDeck(settings, anchor);

  useEnterAction(canStart ? () => onStart(deck) : null, canStart);

  return (
    <PracticeInitialScreen
      heading={page.heading}
      description={page.description}
      filters={settings}
      onFilterChange={setSetting}
      deckSize={deck.length}
      loading={loading}
      canStart={canStart}
      onStart={() => onStart(deck)}
      sessionOptions={
        <SoundAfterAnswering
          sound={settings.sound ?? CHIME_SOUND}
          onChange={(sound) => setSetting("sound", sound)}
        />
      }
    />
  );
};
