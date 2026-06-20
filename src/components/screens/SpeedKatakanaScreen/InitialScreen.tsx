import { useMemo, useState } from "react";
import { useLocalStorage2 } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
import { SPEED_KATAKANA_TOTAL_SETS } from "@/lib/assets-paths";
import { SoundMode, SpeedKatakanaSettings, WordCount } from "./types";
import { readSetStats } from "./storage";

const SOUND_ON_STORAGE_KEY = "speed-katakana-sound-on";

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
}) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="text-sm cursor-pointer">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
};

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
}) => {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
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
};

const SetStats = ({ setNumber }: { setNumber: number }) => {
  const stats = useMemo(() => readSetStats(setNumber), [setNumber]);

  if (!stats) return null;

  return (
    <div className="flex flex-wrap gap-2 text-xs font-bold text-left ">
      <div>
        🎯 Accuracy:{" "}
        <span className="mr-1 text-green-500">
          {stats.latestAccuracy}%
        </span>
        (best {stats.bestAccuracy}%)
      </div>
      <div>
        🚗 Speed:{" "}
        <span className="mr-1 text-green-500">
          {stats.latestCpm} cpm
        </span>


        (best {stats.bestCpm} cpm)
      </div>
      <div> ⭐️ {stats.timesTaken} {stats.timesTaken === 1 ? "attempt" : "attempts"}</div>

    </div>
  );
};

export const InitialScreen = ({
  initialSettings,
  onStart,
}: {
  initialSettings: SpeedKatakanaSettings;
  onStart: (settings: SpeedKatakanaSettings) => void;
}) => {
  const [randomizeFont, setRandomizeFont] = useState(
    initialSettings.randomizeFont
  );
  const [randomizeOrder, setRandomizeOrder] = useState(
    initialSettings.randomizeOrder
  );
  const [setNumber, setSetNumber] = useState(initialSettings.setNumber);
  const [displayEnglish, setDisplayEnglish] = useState(
    initialSettings.displayEnglish
  );
  const [wordCount, setWordCount] = useState<WordCount>(
    initialSettings.wordCount
  );
  const [soundEnabled, setSoundEnabled] = useLocalStorage2(
    SOUND_ON_STORAGE_KEY
  );
  const [soundMode, setSoundMode] = useState<SoundMode>(
    initialSettings.soundMode
  );

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="flex flex-col justify-center w-full max-w-md min-h-full gap-6 px-1 py-6 mx-auto">
        <h1 className="text-3xl font-bold text-center">🐇 Speed Katakana</h1>

        <div className="flex flex-col gap-5">
          <ToggleRow
            id="randomize-font"
            label="Randomize Font"
            checked={randomizeFont}
            onChange={setRandomizeFont}
          />
          <ToggleRow
            id="randomize-order"
            label="Randomize Word Order"
            checked={randomizeOrder}
            onChange={setRandomizeOrder}
          />
          <ToggleRow
            id="display-english"
            label="Display English Gloss"
            checked={displayEnglish}
            onChange={setDisplayEnglish}
          />

          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm">Long Session (48 words) </Label>
              <Switch
                aria-label="Words per round"
                checked={wordCount === 48}
                onCheckedChange={(checked) => setWordCount(checked ? 48 : 24)}
              />
            </div>
            {
              wordCount !== 48 && <p className="w-full text-xs text-left">
                ⚠️ Short sessions will not be recorded.
              </p>
            }

          </div>

          <div className="flex flex-col">
            <ToggleRow
              id="sound-on"
              label="Sound On"
              checked={soundEnabled}
              onChange={setSoundEnabled}
            />
            {soundEnabled && (
              <div className="flex gap-4 pl-1">
                <RadioRow
                  name="sound-mode"
                  value="speak"
                  current={soundMode}
                  label="Say out loud"
                  onChange={setSoundMode}
                />
                <RadioRow
                  name="sound-mode"
                  value="correct"
                  current={soundMode}
                  label="Sound when correct"
                  onChange={setSoundMode}
                />
              </div>
            )}
            {soundMode === "speak" && (
              <p className="w-full pt-1 text-xs text-left">
                ⚠️ text-to-speech might not work on all devices.
              </p>
            )}

          </div>

          <div className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Challenge set</Label>
              <span className="text-sm font-semibold tabular-nums">
                {setNumber} / {SPEED_KATAKANA_TOTAL_SETS}
              </span>
            </div>
            <DualRangeSlider
              value={[setNumber]}
              min={1}
              max={SPEED_KATAKANA_TOTAL_SETS}
              step={1}
              onValueChange={(value) => setSetNumber(value[0])}
            />
            <p className="text-xs text-left">
              Lower sets are the most common words; higher sets are rarer.
            </p>
            <SetStats setNumber={setNumber} />
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() =>
            onStart({
              setNumber,
              randomizeFont,
              randomizeOrder,
              displayEnglish,
              wordCount,
              soundEnabled,
              soundMode,
            })
          }
        >
          Start Game
        </Button>
      </div>
    </div>
  );
};
