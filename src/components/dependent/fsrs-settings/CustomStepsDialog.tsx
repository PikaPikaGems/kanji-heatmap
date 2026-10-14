import { useState } from "react";
import { SubmitInput } from "@/components/dependent/account/SubmitInput";
import type { ActionStatus } from "@/components/dependent/account/action-status";
import { Dialog } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { formatSteps, parseSteps, stepWarnings } from "@/lib/engine/fsrs-steps";
import { Warning } from "./FieldParts";

/** "Custom steps" dialog: one comma-separated input, applied to the draft. */
export const CustomStepsDialog = ({
  title,
  initialSteps,
  onApply,
  onClose,
}: {
  title: string;
  initialSteps: readonly number[];
  onApply: (steps: number[]) => void;
  onClose: () => void;
}) => {
  const [text, setText] = useState(formatSteps(initialSteps));
  const [status, setStatus] = useState<ActionStatus>({ kind: "idle" });
  const parsed = parseSteps(text);

  const submit = () => {
    if (!parsed.ok) {
      setStatus({ kind: "error", message: parsed.error });
      return;
    }
    onApply(parsed.steps);
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <ScrollableDialogContent
        size="md"
        title="Custom steps"
        description={`Set the ${title.toLowerCase()} as comma-separated values`}
        titleClassName="text-left"
      >
        <div className="flex flex-col gap-3 px-2 pt-2 text-left">
          <p className="text-sm">
            Use comma-separated values like: 1m, 10m, 1h
          </p>
          <SubmitInput
            label={title}
            submitLabel="Use these steps"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={text}
            onValueChange={(next) => {
              setText(next);
              setStatus({ kind: "idle" });
            }}
            status={status}
            onSubmit={submit}
          />
          {parsed.ok &&
            stepWarnings(parsed.steps).map((warning) => (
              <Warning key={warning}>{warning}</Warning>
            ))}
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};
