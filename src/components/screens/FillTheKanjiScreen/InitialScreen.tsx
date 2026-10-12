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
  levelOfBatch,
  positionInLevel,
  batchCount,
  batchFromLevelAndPos,
  batchLabel,
  batchRowRange,
  batchesInLevel,
  BATCHES_PER_LEVEL,
  setRowCount,
  totalBatchCount,
} from "@/lib/fill-the-kanji/batches";
import {
  countAllAttemptedBatches,
  readSetBatchStats,
  BatchStats,
} from "@/lib/fill-the-kanji/storage";
import {
  DEFAULT_TILE_COUNT,
  isTileCount,
  TILE_COUNT_OPTIONS,
  TileCount,
} from "@/lib/fill-the-kanji/puzzle";
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
        Object.keys(readSetBatchStats(id)).length
      }/${batchCount(id)} batches played`,
    }))}
  />
);

const BatchSummary = ({
  setId,
  batch,
  stats,
}: {
  setId: FillTheKanjiSetId;
  batch: number;
  stats: BatchStats | null;
}) => {
  const [start, end] = batchRowRange(setId, batch);
  return (
    <div className="flex flex-col gap-1 text-xs font-bold text-left min-h-10">
      <div>
        Batch {batchLabel(batch)} (#{batch}) · Items {start + 1}–{end} of{" "}
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

const TileCountPicker = ({
  current,
  onChange,
}: {
  current: TileCount;
  onChange: (count: TileCount) => void;
}) => (
  <fieldset className="flex flex-wrap items-center gap-y-1 text-left">
    <legend className="sr-only">Number of choices</legend>
    <span className="pr-4 text-sm" aria-hidden>
      Number of choices:
    </span>
    {TILE_COUNT_OPTIONS.map((count) => (
      <RadioRow
        key={count}
        name="tile-count"
        value={String(count)}
        current={String(current)}
        label={String(count)}
        onChange={() => onChange(count)}
      />
    ))}
  </fieldset>
);

const Key = ({ children }: { children: string }) => (
  <kbd className="px-1.5 py-0.5 font-mono text-[11px] border rounded bg-muted">
    {children}
  </kbd>
);

export const InitialScreen = ({ onStart }: { onStart: () => void }) => {
  const { settings, setId, batch, setSetting, selectSet, selectBatch } =
    useFillTheKanjiSettings();
  const stats = readSetBatchStats(setId);

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
              {countAllAttemptedBatches()} of {totalBatchCount()} batches played
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

          <TileCountPicker
            current={
              isTileCount(settings.tileCount)
                ? settings.tileCount
                : DEFAULT_TILE_COUNT
            }
            onChange={(count) => setSetting("tileCount", count)}
          />

          <div className="text-left">
            <SetSelect selected={setId} onSelect={selectSet} />
          </div>
          <LevelGridSelector
            levelCount={levelCount(setId)}
            itemsPerLevel={BATCHES_PER_LEVEL}
            levelSize={(level) => batchesInLevel(setId, level)}
            isDone={(level, pos) =>
              stats[String(batchFromLevelAndPos(level, pos))] != null
            }
            level={levelOfBatch(batch)}
            position={positionInLevel(batch)}
            onSelect={(level, pos) =>
              selectBatch(setId, batchFromLevelAndPos(level, pos))
            }
            levelHeading="Select a Level"
            itemHeading="Select a Batch"
          />
          <BatchSummary
            setId={setId}
            batch={batch}
            stats={stats[String(batch)] ?? null}
          />
        </div>
      </div>

      <div className="shrink-0 px-4 pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t-4 border-dotted rounded-3xl bg-background">
        <div className="w-full max-w-lg mx-auto">
          <PracticeButton size="lg" onClick={onStart}>
            Start
          </PracticeButton>
          {!isCoarsePointer && (
            <p className="pt-2 text-xs text-center text-muted-foreground">
              Tip: during a batch, press <Key>!</Key> to hear the sentence, or{" "}
              <Key>@</Key> to hear it slowly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
