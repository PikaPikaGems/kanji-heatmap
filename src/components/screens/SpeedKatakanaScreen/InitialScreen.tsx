import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
import { SoundMode, SpeedKatakanaSettings, WordCount } from "./types";
import { readSetStats } from "./storage";
import { SpeedKatakanaStatsSummary } from "./SpeedKatakanaStatsSummary";
import { DEFAULT_SETTINGS, levelOf, LEVELS, positionInLevel, setFromLevelAndPos, SETS_PER_LEVEL, SETTINGS_KEY, SPEED_KATAKANA_TOTAL_SETS } from "./constants";


const ToggleRow = ({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4">
    <Label htmlFor={id} className="text-sm cursor-pointer">
      {label}
    </Label>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </div>
);

const RadioRow = ({
  name,
  value,
  current,
  label,
  onChange,
}: {
  name: string;
  value: SoundMode;
  current: SoundMode;
  label: string;
  onChange: (value: SoundMode) => void;
}) => (
  <label className="flex items-center gap-2 pr-4 text-sm cursor-pointer">
    <input
      type="radio"
      name={name}
      value={value}
      checked={current === value}
      onChange={() => onChange(value)}
      className="accent-primary"
    />
    {label}
  </label>
);

const SetStats = ({ challengeSet }: { challengeSet: number }) => {
  const stats = useMemo(() => readSetStats(challengeSet), [challengeSet]);
  if (!stats) return <div className="h-10"></div>;
  return (
    <div className="flex flex-wrap gap-2 text-xs font-bold text-left min-h-10">
      <div>Challenge # {challengeSet}:</div>
      <div>
        ⭐️ {stats.timesTaken}{" "}
        {stats.timesTaken === 1 ? "attempt" : "attempts"}
      </div>
      <div className="flex">
        <div>
          🎯 Accuracy:{" "}
          <span className="mr-1 text-green-500">{stats.latestAccuracy}%</span>
          (best: {stats.bestAccuracy}%)
        </div>
        <div className="ml-1">
          🚗 Speed:{" "}
          <span className="mr-1 text-green-500">{stats.latestCpm} cpm</span>
          (best: {stats.bestCpm} cpm)
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

  const summary = useMemo(() => {
    let completed = 0;
    let totalCpm = 0;
    for (let i = 1; i <= SPEED_KATAKANA_TOTAL_SETS; i++) {
      const s = readSetStats(i);
      if (s) { completed++; totalCpm += s.latestCpm; }
    }
    return {
      completed,
      averageCpm: completed > 0 ? Math.round(totalCpm / completed) : null,
    };
  }, []);

  const currentLevel = levelOf(settings.challengeSet);
  const currentPos = positionInLevel(settings.challengeSet);

  const selectLevel = (level: number) => {
    const pos = levelOf(settings.challengeSet) === level ? currentPos : 1;
    setSetting("challengeSet", setFromLevelAndPos(level, pos));
  };

  const soundEnabled = settings.sound.enabled;
  const soundType: SoundMode = settings.sound.enabled ? settings.sound.type : "correct";

  return (
    <div className="w-full h-full pl-4 pr-2 overflow-auto">
      <div className="flex flex-col justify-center w-full max-w-lg min-h-full gap-6 px-1 mx-auto">
        <div className="flex flex-col items-center gap-1 px-6">
          <h1 className="pt-4 text-lg font-bold text-center">🐇 Speed Katakana {"⌨️"}</h1>
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
              <Label className="text-sm">Long Session (48 words)</Label>
              <Switch
                aria-label="Words per round"
                checked={settings.wordCount === 48}
                onCheckedChange={(checked) =>
                  setSetting("wordCount", (checked ? 48 : 24) as WordCount)
                }
              />
            </div>
            {settings.wordCount !== 48 && (
              <p className="w-full text-xs text-left">
                ⚠️ Short sessions will not be recorded.
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
              <div className="flex flex-wrap pl-1">
                <RadioRow
                  name="sound-mode"
                  value="speak"
                  current={soundType}
                  label="Say out loud"
                  onChange={(v) => setSetting("sound", { enabled: true, type: v })}
                />
                <RadioRow
                  name="sound-mode"
                  value="correct"
                  current={soundType}
                  label="Sound when correct"
                  onChange={(v) => setSetting("sound", { enabled: true, type: v })}
                />
              </div>
            )}
            {soundEnabled && soundType === "speak" && (
              <p className="w-full pt-1 text-xs text-left">
                ⚠️ text-to-speech might not work on all devices.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Select a Challenge Set</Label>
              <span className="text-sm font-semibold tabular-nums">
                {settings.challengeSet} / {SPEED_KATAKANA_TOTAL_SETS}
              </span>
            </div>

            <div className="flex gap-1">
              {Array.from({ length: LEVELS }, (_, i) => i + 1).map((level) => (
                <button
                  key={level}
                  onClick={() => selectLevel(level)}
                  className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${currentLevel === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <Label className="text-sm text-left">Select a Challenge</Label>

            <DualRangeSlider
              value={[currentPos]}
              min={1}
              max={SETS_PER_LEVEL}
              step={1}
              onValueChange={(value) =>
                setSetting("challengeSet", setFromLevelAndPos(currentLevel, value[0]))
              }
            />

            <p className="text-xs text-left">
              Lower sets are the most common words; higher sets are rarer.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={onStart}
        >
          Start Game
        </Button>
        <SetStats challengeSet={settings.challengeSet} />
      </div>
    </div>
  );
};
