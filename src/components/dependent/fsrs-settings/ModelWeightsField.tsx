import { useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { DialogActions } from "@/components/common/DialogActions";
import { UserNotice } from "@/components/common/UserNotice";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { formatWeights, parseWeights } from "@/lib/engine/fsrs-weights";
import { FieldError, FieldTitle } from "./FieldParts";

const WeightsDialog = ({
  weights,
  defaultWeights,
  onApply,
  onClose,
}: {
  weights: number[];
  defaultWeights: number[];
  onApply: (weights: number[]) => void;
  onClose: () => void;
}) => {
  const [text, setText] = useState(formatWeights(weights));
  const [error, setError] = useState<string | undefined>();

  const apply = () => {
    const parsed = parseWeights(text);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    onApply(parsed.weights);
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
        title="Model weights"
        description="Edit the 21 FSRS model weights"
        titleClassName="text-left"
      >
        <div className="flex flex-col gap-3 px-2 pt-2 text-left">
          <UserNotice>
            Defaults work well for most users. Don&apos;t tweak these manually
            unless you really know what you&apos;re doing.
          </UserNotice>
          <textarea
            aria-label="Model weights"
            rows={6}
            spellCheck={false}
            className="w-full p-3 font-mono text-xs border-2 rounded-2xl bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(undefined);
            }}
          />
          <FieldError message={error} />
          <TextActionButton
            icon={<RotateCcw size={14} />}
            className="self-start -ml-1"
            onClick={() => {
              setText(formatWeights(defaultWeights));
              setError(undefined);
            }}
          >
            Reset to defaults
          </TextActionButton>
          <DialogActions className="pt-3">
            <PracticeButton variant="secondary" onClick={onClose}>
              Cancel
            </PracticeButton>
            <PracticeButton onClick={apply}>Apply weights</PracticeButton>
          </DialogActions>
        </div>
      </ScrollableDialogContent>
    </Dialog>
  );
};

/** Read-only list of the model weights, edited through a dialog. */
export const ModelWeightsField = ({
  weights,
  defaultWeights,
  onChange,
  error,
}: {
  weights: number[];
  defaultWeights: number[];
  onChange: (weights: number[]) => void;
  error: string | undefined;
}) => {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <FieldTitle
        title="Model weights"
        tip="The numbers FSRS uses to predict how fast you forget. The defaults suit most people."
      />
      <p className="p-3 font-mono text-xs break-words border-2 border-dashed rounded-xl text-muted-foreground">
        {weights.join(", ")}
      </p>
      <TextActionButton
        icon={<Pencil size={14} />}
        className="self-start -ml-1"
        onClick={() => setEditing(true)}
      >
        Edit weights
      </TextActionButton>
      <FieldError message={error} />
      {editing && (
        <WeightsDialog
          weights={weights}
          defaultWeights={defaultWeights}
          onApply={onChange}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
};
