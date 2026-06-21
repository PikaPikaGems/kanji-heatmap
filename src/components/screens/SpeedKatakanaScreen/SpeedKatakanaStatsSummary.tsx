import { SPEED_KATAKANA_TOTAL_SETS } from "./constants";

export const SpeedKatakanaStatsSummary = ({
  completed,
  averageCpm,
}: {
  completed: number;
  averageCpm?: number | null;
}) => {
  const percent = ((completed / SPEED_KATAKANA_TOTAL_SETS) * 100).toFixed(1);
  return (
    <div className="mt-2 text-xs font-bold text-foreground">
      {completed} / {SPEED_KATAKANA_TOTAL_SETS} set(s) completed ({percent}%)
      {averageCpm != null && <> 🚗 {averageCpm} avg cpm</>}
    </div>
  );
};
