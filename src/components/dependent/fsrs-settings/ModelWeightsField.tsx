import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
          <p className="text-sm">
            Defaults work well for most users. Don&apos;t tweak these manually
            unless you really know what you&apos;re doing.
          </p>
          <textarea
            aria-label="Model weights"
            rows={6}
            spellCheck={false}
            className="w-full p-3 font-mono text-xs border rounded-md bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(undefined);
            }}
          />
          <FieldError message={error} />
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setText(formatWeights(defaultWeights));
                setError(undefined);
              }}
            >
              Reset to defaults
            </Button>
            <Button type="button" onClick={apply}>
              Apply weights
            </Button>
          </div>
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
      <p className="p-2 font-mono text-xs break-words border rounded-md bg-muted/40 text-muted-foreground">
        {weights.join(", ")}
      </p>
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
        >
          Edit weights
        </Button>
      </div>
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
