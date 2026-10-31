import { PracticeButton } from "@/components/ui/practice-button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  PracticeBottomBar,
  SoundAfterAnswering,
  ToggleRow,
} from "@/components/shared-practice";
import { LeavePractice } from "@/components/shared-practice/EndSessionButton";
import { SaveProgressHint } from "@/components/dependent/account/SaveProgressHint";
import { useEnterAction } from "@/hooks/use-enter-action";
import { useSpeedKatakanaStats } from "@/hooks/use-speed-katakana-stats";
import { speedKatakanaPageMeta } from "@/lib/pages/practice-pages";
import {
  AllChallengeSetStats,
  summarizeChallengeSetStats,
} from "@/lib/speed-katakana/stats";
import { WordCount } from "./types";
import { SpeedKatakanaStatsSummary } from "./SpeedKatakanaStatsSummary";
import { levelOf, positionInLevel } from "./constants";
import { ChallengeSetSelector } from "./ChallengeSetSelector";
import { useChallengeSearchParam } from "./use-challenge-search-param";

const SetStats = ({
  challengeSet,
  allStats,
}: {
  challengeSet: number;
  /** Null when progress isn't available (logged out, loading). */
  allStats: AllChallengeSetStats | null;
}) => {
  const currentStats = allStats?.get(challengeSet);
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
  const { settings, setSetting, selectChallengeSet } =
    useChallengeSearchParam();

  const allStats = useSpeedKatakanaStats();
  const summary = summarizeChallengeSetStats(allStats);

  useEnterAction(onStart);

  return (
    <div className="relative flex flex-col w-full h-full animate-fade-in">
      <LeavePractice />
      <div className="flex-1 min-h-0 pl-4 pr-2 overflow-auto">
        <div className="flex flex-col w-full max-w-lg gap-6 px-1 py-6 mx-auto">
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
            <SoundAfterAnswering
              sound={settings.sound}
              onChange={(sound) => setSetting("sound", sound)}
              childrenSpeak={settings.readAloudOnShow ?? false}
            >
              <ToggleRow
                id="read-aloud-on-show"
                label="Read each word aloud when it appears"
                checked={settings.readAloudOnShow ?? false}
                onChange={(v) => setSetting("readAloudOnShow", v)}
              />
            </SoundAfterAnswering>
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

            <ChallengeSetSelector
              challengeSet={settings.challengeSet}
              allStats={allStats}
              onSelect={selectChallengeSet}
            />
          </div>

          <SetStats challengeSet={settings.challengeSet} allStats={allStats} />
        </div>
      </div>

      <PracticeBottomBar>
        <PracticeButton size="lg" onClick={onStart}>
          Start
        </PracticeButton>
        <SaveProgressHint />
      </PracticeBottomBar>
    </div>
  );
};
