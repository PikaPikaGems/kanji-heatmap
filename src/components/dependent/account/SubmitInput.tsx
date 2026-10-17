import type { ComponentProps } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionStatus } from "./action-status";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

/**
 * One text input with a submit arrow inside its right edge, plus the error
 * under it. The login steps each ask for a single value this way.
 */
export const SubmitInput = ({
  label,
  submitLabel,
  value,
  onValueChange,
  status,
  onSubmit,
  ...inputProps
}: {
  label: string;
  submitLabel: string;
  value: string;
  onValueChange: (value: string) => void;
  status: ActionStatus;
  onSubmit: () => void;
} & Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "onSubmit" | "readOnly"
>) => {
  const busy = status.kind === "busy";

  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (busy || value.trim() === "") return;
        onSubmit();
      }}
    >
      <div className="relative">
        <Input
          {...inputProps}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          readOnly={busy}
          aria-label={label}
          placeholder={label}
          aria-invalid={status.kind === "error"}
          className="h-12 pl-4 pr-14 border-2 rounded-2xl focus-visible:ring-offset-0"
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          aria-label={submitLabel}
          disabled={busy || value.trim() === ""}
          className="absolute -translate-y-1/2 right-1 top-1/2 rounded-xl"
        >
          {busy ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ArrowRight className="size-5!" />
          )}
        </Button>
      </div>
      {status.kind === "error" && (
        <p role="alert" className={cn("px-1 text-sm", cnWarningText)}>
          {status.message}
        </p>
      )}
    </form>
  );
};
