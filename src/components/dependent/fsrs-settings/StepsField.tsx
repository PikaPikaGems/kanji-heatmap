import { useState } from "react";
import { Pencil } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { PracticeButton } from "@/components/ui/practice-button";
import {
  formatSteps,
  sameSteps,
  stepWarnings,
  type StepPreset,
} from "@/lib/engine/fsrs-steps";
import { cn } from "@/lib/utils";
import { CustomStepsDialog } from "./CustomStepsDialog";
import { FieldError, Warning } from "./FieldParts";

/** One choice tile, like the presets in User Preferences and the games. */
const StepTile = ({
  label,
  detail,
  selected,
  onClick,
}: {
  label: string;
  detail: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <PracticeButton
    variant={selected ? "primary" : "secondary"}
    aria-pressed={selected}
    onClick={onClick}
    className={cn(
      "flex-col w-full min-w-0 h-auto gap-0.5 px-2 py-2 rounded-xl",
      !selected && "border-dashed"
    )}
  >
    <span className="text-sm">{label}</span>
    {/* One line; a long custom value ends in "…" with the full value on hover. */}
    <span
      title={detail}
      className={cn(
        "max-w-full text-xs font-normal tracking-normal truncate",
        selected ? "opacity-80" : "text-muted-foreground"
      )}
    >
      {detail}
    </span>
  </PracticeButton>
);

/**
 * Preset tiles for one step array, plus a Custom tile that edits the draft
 * through the "Custom steps" dialog. The selected tile is derived from the
 * draft: a value matching no preset is Custom.
 */
export const StepsField = ({
  title,
  presets,
  steps,
  onChange,
  error,
}: {
  title: string;
  presets: StepPreset[];
  steps: number[];
  onChange: (steps: number[]) => void;
  error: string | undefined;
}) => {
  const [editing, setEditing] = useState(false);
  const selected = presets.find((preset) => sameSteps(preset.steps, steps));
  // Empty steps (short term off) select nothing.
  const isCustom = selected === undefined && steps.length > 0;

  return (
    <fieldset className="flex flex-col gap-2 min-w-0">
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <StepTile
            key={preset.id}
            label={preset.label}
            detail={formatSteps(preset.steps)}
            selected={selected?.id === preset.id}
            onClick={() => onChange(preset.steps)}
          />
        ))}
        <StepTile
          label="Custom"
          detail={isCustom ? formatSteps(steps) : "Your own steps"}
          selected={isCustom}
          onClick={() => setEditing(true)}
        />
      </div>
      {isCustom && (
        <TextActionButton
          icon={<Pencil size={14} />}
          className="self-start -ml-1"
          onClick={() => setEditing(true)}
        >
          Edit steps
        </TextActionButton>
      )}
      {stepWarnings(steps).map((warning) => (
        <Warning key={warning}>{warning}</Warning>
      ))}
      <FieldError message={error} />
      {editing && (
        <CustomStepsDialog
          title={title}
          initialSteps={steps}
          onApply={onChange}
          onClose={() => setEditing(false)}
        />
      )}
    </fieldset>
  );
};
