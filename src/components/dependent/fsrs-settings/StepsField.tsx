import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  formatSteps,
  sameSteps,
  stepWarnings,
  type StepPreset,
} from "@/lib/engine/fsrs-steps";
import { CustomStepsDialog } from "./CustomStepsDialog";
import { FieldError, Warning } from "./FieldParts";

/**
 * Radio presets for one step array, plus a Custom option that edits the draft
 * through the "Custom steps" dialog. The selected radio is derived from the
 * draft: a value matching no preset is Custom.
 */
export const StepsField = ({
  title,
  presets,
  steps,
  disabled,
  onChange,
  error,
}: {
  title: string;
  presets: StepPreset[];
  steps: number[];
  disabled: boolean;
  onChange: (steps: number[]) => void;
  error: string | undefined;
}) => {
  const [editing, setEditing] = useState(false);
  const selected = presets.find((preset) => sameSteps(preset.steps, steps));
  // Empty steps (short term off) select nothing.
  const isCustom = selected === undefined && steps.length > 0;

  return (
    <fieldset
      disabled={disabled}
      className="flex flex-col gap-1.5 min-w-0 disabled:opacity-50"
    >
      <legend className="mb-1 text-sm font-semibold">{title}</legend>
      {presets.map((preset) => (
        <label
          key={preset.id}
          className="flex items-center gap-2 text-sm cursor-pointer"
        >
          <input
            type="radio"
            name={title}
            className="size-4 accent-primary"
            checked={selected?.id === preset.id}
            onChange={() => onChange(preset.steps)}
          />
          {preset.label}
          <span className="text-xs text-muted-foreground">
            {formatSteps(preset.steps)}
          </span>
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name={title}
            className="size-4 accent-primary"
            checked={isCustom}
            onChange={() => setEditing(true)}
          />
          Custom
          {isCustom && (
            <span className="text-xs text-muted-foreground">
              {formatSteps(steps)}
            </span>
          )}
        </label>
        {isCustom && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setEditing(true)}
          >
            Edit steps
          </Button>
        )}
      </div>
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
