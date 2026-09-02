import { useId, type ReactNode } from "react";
import { PlayCircle, Snail } from "@/components/icons";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useStrokeAnimationSettings } from "@/hooks/use-stroke-animation-settings";
import {
  DEFAULT_STROKE_ANIMATION_SETTINGS,
  FAST_SPEED_MAX,
  FAST_SPEED_MIN,
  SLOW_SPEED_MAX,
  SLOW_SPEED_MIN,
  SPEED_STEP,
} from "@/lib/stroke-animation-settings";
import { Button } from "@/components/ui/button";

const formatSpeed = (n: number) => `${n.toFixed(1)}×`;

const SpeedSliderRow = ({
  id,
  icon,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs font-bold"
      >
        <span className="flex size-6 items-center justify-center rounded-md bg-secondary text-foreground [&_svg]:size-3.5">
          {icon}
        </span>
        {label}
      </Label>
      <span className="text-xs font-bold tabular-nums text-muted-foreground">
        {formatSpeed(value)}
      </span>
    </div>
    <Slider
      id={id}
      min={min}
      max={max}
      step={SPEED_STEP}
      value={[value]}
      onValueChange={([next]) => {
        if (next != null) onChange(next);
      }}
      aria-label={label}
    />
    <div className="flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      <span>{formatSpeed(min)}</span>
      <span>{formatSpeed(max)}</span>
    </div>
  </div>
);

export const StrokeAnimationSettingsFields = () => {
  const [settings, setSetting, reset] = useStrokeAnimationSettings();
  const numbersId = useId();
  const slowId = useId();
  const fastId = useId();
  const isDefault =
    settings.showStrokeOrderNumbers ===
      DEFAULT_STROKE_ANIMATION_SETTINGS.showStrokeOrderNumbers &&
    settings.slowSpeed === DEFAULT_STROKE_ANIMATION_SETTINGS.slowSpeed &&
    settings.fastSpeed === DEFAULT_STROKE_ANIMATION_SETTINGS.fastSpeed;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-2">
        <Switch
          id={numbersId}
          checked={settings.showStrokeOrderNumbers}
          onCheckedChange={(checked) =>
            setSetting("showStrokeOrderNumbers", checked)
          }
        />

        <Label htmlFor={numbersId} className="text-xs font-bold cursor-pointer">
          Show stroke order numbers
        </Label>
      </div>

      <SpeedSliderRow
        id={slowId}
        icon={<Snail />}
        label="Slow Speed"
        value={settings.slowSpeed}
        min={SLOW_SPEED_MIN}
        max={SLOW_SPEED_MAX}
        onChange={(value) => setSetting("slowSpeed", value)}
      />

      <SpeedSliderRow
        id={fastId}
        icon={<PlayCircle />}
        label="Default Speed"
        value={settings.fastSpeed}
        min={FAST_SPEED_MIN}
        max={FAST_SPEED_MAX}
        onChange={(value) => setSetting("fastSpeed", value)}
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full text-xs font-bold"
        disabled={isDefault}
        onClick={reset}
      >
        Reset to defaults
      </Button>
    </div>
  );
};
