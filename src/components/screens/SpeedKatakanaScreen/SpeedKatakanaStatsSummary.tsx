import { SPEED_KATAKANA_TOTAL_CHALLENGES } from "./constants";

export const SpeedKatakanaStatsSummary = ({
  completed,
  averageCpm,
}: {
  completed: number;
  averageCpm?: number | null;
}) => {
  const percent = ((completed / SPEED_KATAKANA_TOTAL_CHALLENGES) * 100).toFixed(1);
  return (
    <div className="mt-2 text-xs font-bold text-foreground">
      {completed} / {SPEED_KATAKANA_TOTAL_CHALLENGES} {`${completed > 1 ? "challenges" : "challenge"}`} completed ({percent}%)
      {averageCpm != null && <span className="pl-1"> 🚗 {averageCpm} avg cpm</span>}
    </div>
  );
};
