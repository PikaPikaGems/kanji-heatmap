import { useState } from "react";
import { DialogActions } from "@/components/common/DialogActions";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { formatSteps, parseSteps, stepWarnings } from "@/lib/engine/fsrs-steps";
import { FieldError, Warning } from "./FieldParts";

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
  const [error, setError] = useState<string | undefined>();
  const parsed = parseSteps(text);

  const submit = () => {
    if (!parsed.ok) {
      setError(parsed.error);
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
        <form
          className="flex flex-col gap-3 px-2 pt-2 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p className="text-sm">
            Enter your {title.toLowerCase()} as comma-separated values, like 1m,
            10m, 1h.
          </p>
          <Input
            aria-label={title}
            placeholder="1m, 10m, 1h"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(undefined);
            }}
            aria-invalid={error !== undefined}
            className="h-12 px-4 border-2 rounded-2xl focus-visible:ring-offset-0"
          />
          <FieldError message={error} />
          {parsed.ok &&
            stepWarnings(parsed.steps).map((warning) => (
              <Warning key={warning}>{warning}</Warning>
            ))}
          <DialogActions className="pt-3">
            <PracticeButton variant="secondary" onClick={onClose}>
              Cancel
            </PracticeButton>
            <PracticeButton type="submit" disabled={text.trim() === ""}>
              Use these steps
            </PracticeButton>
          </DialogActions>
        </form>
      </ScrollableDialogContent>
    </Dialog>
  );
};
