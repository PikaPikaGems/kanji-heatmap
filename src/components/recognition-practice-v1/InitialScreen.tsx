import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useJsonFetch } from "@/hooks/use-json";
import {
  useIsKanjiWorkerReady,
  useGetKanjiInfoFn,
} from "@/kanji-worker/kanji-worker-hooks";
import { PracticeButton } from "@/components/ui/practice-button";
import { JLPTSelector } from "@/components/common/jlpt/JLPTSelector";
import { JLTPTtypes } from "@/lib/jlpt";
import assetsPaths from "@/lib/assets-paths";
import { useEnterAction } from "@/hooks/use-enter-action";
import { buildPracticeDeck, ToggleRow } from "@/components/shared-practice";
import { recognitionPracticePageMeta } from "@/components/items/practice-pages";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./constants";
import { PracticeItem, RecognitionPracticeSettings, SoundMode } from "./types";

type RepEntry = [string, string, string, string];

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

export const InitialScreen = ({
  onStart,
}: {
  onStart: (deck: PracticeItem[]) => void;
}) => {
  const [settings, setSetting] = useLocalStorage<RecognitionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const workerReady = useIsKanjiWorkerReady();
  const getInfo = useGetKanjiInfoFn();
  const { data: repWords, status: repStatus } = useJsonFetch<
    Record<string, RepEntry>
  >(assetsPaths.KANJI_REPRESENTATIVE_WORDS);

  const deck = useMemo(() => {
    if (!workerReady || !getInfo || !repWords) return [];
    return buildPracticeDeck({
      repWords,
      getJlpt: (kanji) => getInfo(kanji)?.jlpt ?? null,
      getKeyword: (kanji) => getInfo(kanji)?.keyword ?? "...",
      settings,
    });
  }, [workerReady, getInfo, repWords, settings]);

  const loading =
    !workerReady || repStatus === "pending" || repStatus === "idle";
  const canStart = !loading && deck.length > 0;

  const soundEnabled = settings.sound?.enabled ?? true;
  const soundType: SoundMode =
    settings.sound?.enabled === true ? settings.sound.type : "correct";

  useEnterAction(canStart ? () => onStart(deck) : null, canStart);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex flex-col max-w-md gap-6 px-4 py-6 mx-auto">
          <div className="text-left">
            <h1 className="pt-4 text-xl font-bold text-center">
              {recognitionPracticePageMeta.heading}
            </h1>

            <p className="mt-1 text-sm text-center text-muted-foreground">
              {recognitionPracticePageMeta.description}
            </p>
          </div>

          <section className="flex flex-col text-left">
            <h2 className="text-xs font-bold tracking-wide uppercase text-muted-foreground">
              Kanji to include
            </h2>
            <div className="pt-2 pb-6">
              <JLPTSelector
                selectedJLPT={settings.jlpt}
                setSelectedJLPT={(v: JLTPTtypes[]) => setSetting("jlpt", v)}
              />
            </div>
            <ToggleRow
              id="bookmarked-only"
              label="Bookmarked only"
              checked={settings.bookmarkedOnly}
              onChange={(v) => setSetting("bookmarkedOnly", v)}
            />
          </section>

          <hr className="border-dashed" />

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-bold tracking-wide text-left uppercase text-muted-foreground">
              Session options
            </h2>
            <ToggleRow
              id="randomize-order"
              label="Randomize order"
              checked={settings.randomizeOrder}
              onChange={(v) => setSetting("randomizeOrder", v)}
            />
            <ToggleRow
              id="randomize-font"
              label="Randomize font"
              checked={settings.randomizeFont}
              onChange={(v) => setSetting("randomizeFont", v)}
            />

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
          </section>
        </div>
      </div>

      <div className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t-4 border-dotted rounded-3xl bg-background">
        <div className="flex flex-col w-full max-w-md gap-2 mx-auto">
          <p className="text-sm text-left text-muted-foreground">
            {loading ? (
              "Loading…"
            ) : (
              <>
                <span className="font-bold text-foreground">{deck.length}</span>{" "}
                kanji match your filters
              </>
            )}
          </p>
          <PracticeButton
            size="lg"
            disabled={!canStart}
            onClick={() => onStart(deck)}
          >
            Start Practicing
          </PracticeButton>
        </div>
      </div>
    </div>
  );
};
