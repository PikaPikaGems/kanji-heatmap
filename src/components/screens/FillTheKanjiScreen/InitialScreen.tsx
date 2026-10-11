import { PracticeButton } from "@/components/ui/practice-button";
import { ResponsiveSelect } from "@/components/common/ResponsiveSelect";
import { RadioRow, ToggleRow } from "@/components/shared-practice";
import { LeavePractice } from "@/components/shared-practice/EndSessionButton";
import { LevelGridSelector } from "@/components/shared-practice/LevelGridSelector";
import { useEnterAction } from "@/hooks/use-enter-action";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { fillTheKanjiPageMeta } from "@/lib/pages/practice-pages";
import { TTS_DISCLAIMER } from "@/lib/tts";
import {
  FILL_THE_KANJI_SETS,
  FillTheKanjiSetId,
} from "@/lib/fill-the-kanji/sets";
import {
  isFillTheKanjiSetId,
  levelCount,
  levelOfRound,
  positionInLevel,
  roundCount,
  roundFromLevelAndPos,
  roundLabel,
  roundRowRange,
  roundsInLevel,
  ROUNDS_PER_LEVEL,
  setRowCount,
  totalRoundCount,
} from "@/lib/fill-the-kanji/rounds";
import {
  countAllAttemptedRounds,
  readSetRoundStats,
  RoundStats,
} from "@/lib/fill-the-kanji/storage";
import { formatLastAttempted } from "@/lib/fill-the-kanji/format";
import { SoundMode } from "./types";
import { useFillTheKanjiSettings } from "./use-fill-the-kanji-settings";

/** Same select as the Sorting and Filtering modal: options with descriptions. */
const SetSelect = ({
  selected,
  onSelect,
}: {
  selected: FillTheKanjiSetId;
  onSelect: (setId: FillTheKanjiSetId) => void;
}) => (
  <ResponsiveSelect
    label="Select a Challenge"
    value={selected}
    onChange={(v) => {
      if (isFillTheKanjiSetId(v)) onSelect(v);
    }}
    options={FILL_THE_KANJI_SETS.map(({ id, label }) => ({
      value: id,
      label,
      description: `${setRowCount(id).toLocaleString()} sentences · ${
        Object.keys(readSetRoundStats(id)).length
      }/${roundCount(id)} rounds played`,
    }))}
  />
);

const RoundSummary = ({
  setId,
  round,
  stats,
}: {
  setId: FillTheKanjiSetId;
  round: number;
  stats: RoundStats | null;
}) => {
  const [start, end] = roundRowRange(setId, round);
  return (
    <div className="flex flex-col gap-1 text-xs font-bold text-left min-h-10">
      <div>
        Round {roundLabel(round)} (#{round}) · Items {start + 1}–{end} of{" "}
        {setRowCount(setId).toLocaleString()}
      </div>
      {stats ? (
        <div className="grid grid-cols-2 gap-1">
          <div>
            🔁 {stats.attemptCount}{" "}
            {stats.attemptCount === 1 ? "attempt" : "attempts"}
          </div>
          <div>🕒 Last played {formatLastAttempted(stats.lastAttempted)}</div>
        </div>
      ) : (
        <div className="text-muted-foreground">Not played yet</div>
      )}
    </div>
  );
};

export const InitialScreen = ({ onStart }: { onStart: () => void }) => {
  const { settings, setId, round, setSetting, selectSet, selectRound } =
    useFillTheKanjiSettings();
  const stats = readSetRoundStats(setId);

  const soundEnabled = settings.sound.enabled;
  const soundType: SoundMode = settings.sound.enabled
    ? settings.sound.type
    : "correct";

  useEnterAction(onStart);
  const isCoarsePointer = useCoarsePointer();

  return (
    <div className="relative flex flex-col w-full h-full animate-fade-in">
      <LeavePractice />
      <div className="flex-1 min-h-0 pl-4 pr-2 overflow-auto">
        <div className="flex flex-col w-full max-w-lg gap-6 px-1 py-6 mx-auto">
          <div className="flex flex-col items-center gap-1 px-6">
            <h1 className="pt-4 text-lg font-bold text-center">
              {fillTheKanjiPageMeta.heading}
            </h1>
            <p className="text-xs font-bold text-muted-foreground tabular-nums">
              {countAllAttemptedRounds()} of {totalRoundCount()} rounds played
            </p>
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
            <div className="pt-3">
              <ToggleRow
                id="read-aloud-on-show"
                label="Read each sentence aloud when it appears"
                checked={settings.readAloudOnShow ?? false}
                onChange={(v) => setSetting("readAloudOnShow", v)}
              />
            </div>
            {((soundEnabled && soundType === "speak") ||
              settings.readAloudOnShow) && (
              <p className="w-full pt-1 text-xs text-left animate-fade-in-fast">
                {TTS_DISCLAIMER}
              </p>
            )}
          </div>

          <div className="text-left">
            <SetSelect selected={setId} onSelect={selectSet} />
          </div>
          <LevelGridSelector
            levelCount={levelCount(setId)}
            itemsPerLevel={ROUNDS_PER_LEVEL}
            levelSize={(level) => roundsInLevel(setId, level)}
            isDone={(level, pos) =>
              stats[String(roundFromLevelAndPos(level, pos))] != null
            }
            level={levelOfRound(round)}
            position={positionInLevel(round)}
            onSelect={(level, pos) =>
              selectRound(setId, roundFromLevelAndPos(level, pos))
            }
            levelHeading="Select a Level"
            itemHeading="Select a Round"
          />
          <RoundSummary
            setId={setId}
            round={round}
            stats={stats[String(round)] ?? null}
          />
        </div>
      </div>

      <div className="shrink-0 px-4 pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t-4 border-dashed rounded-3xl bg-background">
        <div className="w-full max-w-lg mx-auto">
          <PracticeButton size="lg" onClick={onStart}>
            Start Round
          </PracticeButton>
          {!isCoarsePointer && (
            <p className="pt-2 text-xs text-center text-muted-foreground">
              Tip: during a round, press{" "}
              <kbd className="px-1.5 py-0.5 font-mono text-[11px] border rounded bg-muted">
                !
              </kbd>{" "}
              to hear the sentence.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
