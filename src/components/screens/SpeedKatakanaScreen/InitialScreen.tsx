import { useLocalStorage } from "@/hooks/use-local-storage";
import { PracticeButton } from "@/components/ui/practice-button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioRow, ToggleRow } from "@/components/shared-practice";
import { useEnterAction } from "@/hooks/use-enter-action";
import { speedKatakanaPageMeta } from "@/lib/pages/practice-pages";
import { SoundMode, SpeedKatakanaSettings, WordCount } from "./types";
import { readSetStats } from "./storage";
import { SpeedKatakanaStatsSummary } from "./SpeedKatakanaStatsSummary";
import { DEFAULT_SETTINGS, levelOf, positionInLevel, SETTINGS_KEY } from "./constants";
import { useSpeedKatakanaProgress } from "./use-speed-katakana-progress";
import { ChallengeSetSelector } from "./ChallengeSetSelector";

const SetStats = ({ challengeSet }: { challengeSet: number }) => {
  const currentStats = readSetStats(challengeSet);
  const level = levelOf(challengeSet);
  const pos = positionInLevel(challengeSet);
  const stats = currentStats
    ? {
        timesTaken: currentStats.timesTaken,
        latestAccuracy: `${currentStats.latestAccuracy} %`,
        bestAccuracy: `${currentStats.bestAccuracy} %`,
        latestCpm: `${currentStats.latestCpm} cpm`,
        bestCpm: `${currentStats.bestCpm} cpm`,
      }
    : {
        timesTaken: 0,
        latestAccuracy: "- - -",
        bestAccuracy: " - ",
        latestCpm: "- - -",
        bestCpm: " -",
      };

  return (
    <div className="flex flex-wrap gap-2 text-xs font-bold text-left min-h-10">
      <div>
        Challenge {level}-{pos} (#{challengeSet}):
      </div>
      <div>
        {stats.timesTaken} {stats.timesTaken === 1 ? "attempt" : "attempts"}
      </div>
      <div className="grid w-full grid-cols-2">
        <div>
          🎯 Accuracy:{" "}
          <span className="mr-1 text-green-500">{stats.latestAccuracy}</span>
          <br />
          🚀 <>Best Accuracy: {stats.bestAccuracy}</>
        </div>
        <div>
          🚙 Speed:{" "}
          <span className="mr-1 text-green-500">{stats.latestCpm}</span>
          <br />
          🏎️ Best Speed: {stats.bestCpm}
        </div>
      </div>
    </div>
  );
};

export const InitialScreen = ({ onStart }: { onStart: () => void }) => {
  const [settings, setSetting] = useLocalStorage<SpeedKatakanaSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

  const { summary, levelCompletion } = useSpeedKatakanaProgress();

  const soundEnabled = settings.sound.enabled;
  const soundType: SoundMode = settings.sound.enabled
    ? settings.sound.type
    : "correct";

  useEnterAction(onStart);

  return (
    <div className="flex flex-col w-full h-full animate-fade-in">
      <div className="flex-1 min-h-0 pl-4 pr-2 overflow-auto">
        <div className="flex flex-col justify-center w-full max-w-lg min-h-full gap-6 px-1 mx-auto">
          <div className="flex flex-col items-center gap-1 px-6">
            <h1 className="pt-4 text-lg font-bold text-center">
              {speedKatakanaPageMeta.heading}
            </h1>
            <SpeedKatakanaStatsSummary
              completed={summary.completed}
              averageCpm={summary.averageCpm}
            />
          </div>

          <div className="flex flex-col gap-2">
            <ToggleRow
              id="randomize-font"
              label="Randomize Font"
              checked={settings.randomizeFont}
              onChange={(v) => setSetting("randomizeFont", v)}
            />
            <ToggleRow
              id="randomize-order"
              label="Randomize Word Order"
              checked={settings.randomizeOrder}
              onChange={(v) => setSetting("randomizeOrder", v)}
            />
            <ToggleRow
              id="display-english"
              label="Display English Gloss"
              checked={settings.displayEnglish}
              onChange={(v) => setSetting("displayEnglish", v)}
            />

            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm">Full Session (48 words)</Label>
                <Switch
                  aria-label="Words per round"
                  checked={settings.wordCount === 48}
                  onCheckedChange={(checked) =>
                    setSetting("wordCount", (checked ? 48 : 24) as WordCount)
                  }
                />
              </div>
              {settings.wordCount !== 48 && (
                <p className="w-full text-xs text-left animate-fade-in-fast">
                  ⚠️ Practice sessions (24 words) will not be recorded.
                </p>
              )}
            </div>

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
                    onChange={(v) =>
                      setSetting("sound", { enabled: true, type: v })
                    }
                  />
                  <RadioRow
                    name="sound-mode"
                    value="correct"
                    current={soundType}
                    label="Sound when correct"
                    onChange={(v) =>
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

            <ChallengeSetSelector
              challengeSet={settings.challengeSet}
              levelCompletion={levelCompletion}
              onSelect={(setNumber) => setSetting("challengeSet", setNumber)}
            />
          </div>

          <SetStats challengeSet={settings.challengeSet} />
        </div>
      </div>

      <div className="shrink-0 px-4 pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t-4 border-dashed rounded-3xl bg-background">
        <div className="w-full max-w-lg mx-auto">
          <PracticeButton size="lg" onClick={onStart}>
            Start Game
          </PracticeButton>
        </div>
      </div>
    </div>
  );
};
