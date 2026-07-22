import { useId } from "react";
import { MAX_STROKE_COUNT } from "@/lib/options/constants";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
import { Label } from "@/components/ui/label";

export const StrokeCountField = ({
  values,
  setValues,
}: {
  values: [min: number, max: number];
  setValues: (val: [min: number, max: number]) => void;
}) => {
  const id = useId();
  const fieldId = `strokecountfilter-${id}`;

  return (
    <div className="w-full">
      <Label className="text-xs" htmlFor={fieldId}>
        Stroke Count
      </Label>
      <DualRangeSlider
        id={fieldId}
        label={(value) => value}
        labelPosition="bottom"
        className="pt-2 pb-4 text-xs"
        value={values}
        onValueChange={setValues}
        min={1}
        max={MAX_STROKE_COUNT}
        step={1}
      />
    </div>
  );
};
