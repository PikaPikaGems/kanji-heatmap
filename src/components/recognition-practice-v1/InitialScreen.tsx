import { useLocalStorage } from "@/hooks/use-local-storage";
import { useEnterAction } from "@/hooks/use-enter-action";
import {
  PracticeInitialScreen,
  RadioRow,
  ToggleRow,
  usePracticeDeck,
} from "@/components/shared-practice";
import { recognitionPracticePageMeta } from "@/lib/pages/practice-pages";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./constants";
import { PracticeItem, RecognitionPracticeSettings, SoundMode } from "./types";

export const InitialScreen = ({
  onStart,
}: {
  onStart: (deck: PracticeItem[]) => void;
}) => {
  const [settings, setSetting] = useLocalStorage<RecognitionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const { deck, loading, canStart } = usePracticeDeck(settings);

  const soundEnabled = settings.sound?.enabled ?? true;
  const soundType: SoundMode =
    settings.sound?.enabled === true ? settings.sound.type : "correct";

  useEnterAction(canStart ? () => onStart(deck) : null, canStart);

  return (
    <PracticeInitialScreen
      heading={recognitionPracticePageMeta.heading}
      description={recognitionPracticePageMeta.description}
      filters={settings}
      onFilterChange={setSetting}
      deckSize={deck.length}
      loading={loading}
      canStart={canStart}
      onStart={() => onStart(deck)}
      sessionOptions={
        <div className="flex flex-col">
          <ToggleRow
            id="sound-on"
            label="Sound On"
            checked={soundEnabled}
            onChange={(v) =>
              setSetting(
                "sound",
                v ? { enabled: true, type: soundType } : { enabled: false }
              )
            }
          />
          {soundEnabled && (
            <div className="flex flex-wrap pl-1 animate-fade-in-fast">
              <RadioRow
                name="sound-mode"
                value="speak"
                current={soundType}
                label="Say out loud"
                onChange={(v: SoundMode) =>
                  setSetting("sound", { enabled: true, type: v })
                }
              />
              <RadioRow
                name="sound-mode"
                value="correct"
                current={soundType}
                label="Sound when correct"
                onChange={(v: SoundMode) =>
                  setSetting("sound", { enabled: true, type: v })
                }
              />
            </div>
          )}
          {soundEnabled && soundType === "speak" && (
            <p className="w-full pt-1 text-xs text-left animate-fade-in-fast">
              ⚠️ text-to-speech might not work on all devices.
            </p>
          )}
        </div>
      }
    />
  );
};
