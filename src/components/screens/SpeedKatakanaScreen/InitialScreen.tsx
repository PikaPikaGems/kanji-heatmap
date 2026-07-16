import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { PracticeButton } from "@/components/ui/practice-button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FreqCategory, freqCategoryCn } from "@/lib/freq/freq-category";
import { roundedMean } from "@/lib/utils";
import { useEnterAction } from "@/hooks/use-enter-action";
import { SoundMode, SpeedKatakanaSettings, WordCount } from "./types";
import { readSetStats } from "./storage";
import { SpeedKatakanaStatsSummary } from "./SpeedKatakanaStatsSummary";
import { DEFAULT_SETTINGS, levelOf, LEVELS, positionInLevel, setFromLevelAndPos, CHALLENGES_PER_LEVEL, SETTINGS_KEY, SPEED_KATAKANA_TOTAL_CHALLENGES } from "./constants";


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
  const currentStats = useMemo(() => readSetStats(challengeSet), [challengeSet]);
  const level = levelOf(challengeSet);
  const pos = positionInLevel(challengeSet);
  const stats = currentStats ?
    {
      timesTaken: currentStats.timesTaken,
      latestAccuracy: `${currentStats.latestAccuracy} %`,
      bestAccuracy: `${currentStats.bestAccuracy} %`,
      latestCpm: `${currentStats.latestCpm} cpm`,
      bestCpm: `${currentStats.bestCpm} cpm`,

    } : {
      timesTaken: 0,
      latestAccuracy: "- - -",
      bestAccuracy: " - ",
      latestCpm: "- - -",
      bestCpm: " -",
    }

  return (
    <div className="flex flex-wrap gap-2 text-xs font-bold text-left min-h-10">
      <div>
        Challenge {level}-{pos} (#{challengeSet}):
      </div>
      <div>
        {stats.timesTaken}{" "}
        {stats.timesTaken === 1 ? "attempt" : "attempts"}
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

  const summary = useMemo(() => {
    const cpms: number[] = [];
    for (let i = 1; i <= SPEED_KATAKANA_TOTAL_CHALLENGES; i++) {
      const s = readSetStats(i);
      if (s) cpms.push(s.latestCpm);
    }
    return {
      completed: cpms.length,
      averageCpm: roundedMean(cpms),
    };
  }, []);

  const levelCompletion = useMemo(() => {
    const counts: number[] = [];
    for (let level = 1; level <= LEVELS; level++) {
      let count = 0;
      for (let pos = 1; pos <= CHALLENGES_PER_LEVEL; pos++) {
        if (readSetStats(setFromLevelAndPos(level, pos))) count++;
      }
      counts.push(count);
    }
    return counts;
  }, []);

  const currentLevel = levelOf(settings.challengeSet);
  const currentPos = positionInLevel(settings.challengeSet);
  const currentLevelDone = levelCompletion[currentLevel - 1];

  const selectLevel = (level: number) => {
    const pos = levelOf(settings.challengeSet) === level ? currentPos : 1;
    setSetting("challengeSet", setFromLevelAndPos(level, pos));
  };

  const soundEnabled = settings.sound.enabled;
  const soundType: SoundMode = settings.sound.enabled ? settings.sound.type : "correct";

  useEnterAction(onStart);

  return (
    <div className="flex flex-col w-full h-full animate-fade-in">
      <div className="flex-1 min-h-0 pl-4 pr-2 overflow-auto">
        <div className="flex flex-col justify-center w-full max-w-lg min-h-full gap-6 px-1 mx-auto">
          <div className="flex flex-col items-center gap-1 px-6">
            <h1 className="pt-4 text-lg font-bold text-center">🐇 Speed Katakana</h1>
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
                <p className="w-full pt-1 text-xs text-left animate-fade-in-fast">
                  ⚠️ text-to-speech might not work on all devices.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Select a Challenge Set</Label>
                <span className="text-sm font-semibold tabular-nums">
                  {(currentLevelDone / CHALLENGES_PER_LEVEL) * 100}% done
                </span>
              </div>


              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: LEVELS }, (_, i) => i + 1).map((level) => {
                  const doneCount = levelCompletion[level - 1];
                  const category = Math.round(
                    (doneCount / CHALLENGES_PER_LEVEL) * 4
                  ) as FreqCategory;
                  const bgCn = freqCategoryCn[category];
                  const textCn = category > 3 ? "text-white" : "text-foreground";
                  return (
                    <button
                      key={level}
                      onClick={() => selectLevel(level)}
                      className={`py-1 ${bgCn} ${textCn} hover:opacity-80 text-xs rounded font-bold transition-colors border-2 ${currentLevel === level
                        ? "border-primary"
                        : ""
                        }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
              <Label className="text-sm text-left">Select a Challenge</Label>

              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: CHALLENGES_PER_LEVEL }, (_, i) => i + 1).map(
                  (pos) => {
                    const setNum = setFromLevelAndPos(currentLevel, pos);
                    const completed = !!readSetStats(setNum);
                    const bgCn = completed
                      ? freqCategoryCn[4]
                      : freqCategoryCn[0];
                    const textCn = completed
                      ? "text-white"
                      : "text-foreground";
                    return (
                      <button
                        key={pos}
                        onClick={() => setSetting("challengeSet", setNum)}
                        className={`py-1 ${bgCn} ${textCn} hover:opacity-80 text-xs rounded font-bold transition-colors border-2 ${currentPos === pos ? "border-primary" : ""
                          }`}
                      >
                        {pos}
                      </button>
                    );
                  }
                )}
              </div>

              <p className="text-xs text-left">
                Lower challenges contain more common words.
              </p>
            </div>
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
