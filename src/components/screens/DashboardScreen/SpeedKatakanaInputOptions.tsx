import { useId } from "react";
import type { PointerType } from "@/lib/speed-katakana/stats";

const INPUT_LABELS: Record<PointerType, string> = {
  fine: "Keyboard",
  coarse: "Touchscreen",
};

const INPUTS: readonly PointerType[] = ["fine", "coarse"];

/**
 * Which sessions the Speed Katakana grid shows: keyboard or touchscreen
 * (they are recorded apart, since typing on glass is slower). The device's
 * own kind is marked "like this device".
 */
export const SpeedKatakanaInputOptions = ({
  value,
  devicePointer,
  onChange,
}: {
  value: PointerType;
  devicePointer: PointerType;
  onChange: (value: PointerType) => void;
}) => {
  const groupName = useId();

  return (
    <fieldset className="flex flex-col items-center gap-3 mt-5">
      <legend className="mb-3 text-xs font-extrabold text-center uppercase text-muted-foreground">
        Sessions on
      </legend>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2.5">
        {INPUTS.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 text-xs font-medium leading-none"
          >
            <input
              type="radio"
              name={groupName}
              checked={value === option}
              onChange={() => onChange(option)}
              className="w-4 h-4 shrink-0 accent-primary"
            />
            <span className="translate-y-0.5">
              {INPUT_LABELS[option]}
              {option === devicePointer && (
                <span className="text-muted-foreground">
                  {" "}
                  (like this device)
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
