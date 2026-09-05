import { cn } from "@/lib/utils";
import {
  useCurrentThemeColor,
  themeColorsRgb,
} from "@/hooks/use-change-theme-color";

export const ColorGrid = ({ onSelect }: { onSelect?: () => void }) => {
  const [colorIndex, setThemeColor] = useCurrentThemeColor();

  return (
    <div className="grid grid-cols-6 gap-2">
      {themeColorsRgb.map((rgb, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            setThemeColor(i);
            onSelect?.();
          }}
          aria-pressed={colorIndex === i}
          aria-label={`Theme color ${i + 1}`}
          className={cn(
            "h-10 rounded-xl border-2 transition-transform",
            colorIndex === i
              ? "border-theme-color-darker scale-95 ring-2 ring-offset-2 ring-offset-background"
              : "border-transparent hover:scale-105"
          )}
          style={{
            backgroundColor: `rgb(${rgb})`,
            ...(colorIndex === i ? { borderColor: `rgb(${rgb})` } : {}),
          }}
        />
      ))}
    </div>
  );
};
