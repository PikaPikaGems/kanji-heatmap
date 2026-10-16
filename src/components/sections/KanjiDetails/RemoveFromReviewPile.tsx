import { useState } from "react";
import { Loader2 } from "lucide-react";
import { TextActionButton } from "@/components/common/AiActionButtons";
import { DialogActions } from "@/components/common/DialogActions";
import type { ActionStatus } from "@/components/dependent/account/action-status";
import { Dialog } from "@/components/ui/dialog";
import { PracticeButton } from "@/components/ui/practice-button";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { copyForCode } from "@/lib/engine/engine-copy";
import { useEngineApi } from "@/lib/engine/use-engine-query";

/** The confirmation inside the dialog; it owns the remove call. */
const ConfirmRemove = ({
  kanji,
  onCancel,
}: {
  kanji: string;
  onCancel: () => void;
}) => {
  const api = useEngineApi();
  const [action, setAction] = useState<ActionStatus>({ kind: "idle" });
  const busy = action.kind === "busy";

  const remove = async () => {
    if (!api || busy) return;
    setAction({ kind: "busy" });
    const result = await api.reviews.pile.remove(kanji);
    // On success the pile watch flips to "not in pile" and this unmounts.
    setAction(
      result.ok
        ? { kind: "idle" }
        : { kind: "error", message: copyForCode(result.error.code) }
    );
  };

  return (
    <div className="flex flex-col gap-5 px-2 pt-2 text-left">
      <div className="flex flex-col gap-2 text-sm">
        <p>
          This deletes {kanji}&apos;s reading and writing review history. Adding
          it again later starts both from scratch.
        </p>
        <p className="font-bold">You can&apos;t undo this.</p>
      </div>
      {action.kind === "error" && (
        <p
          role="alert"
          className="text-sm font-bold text-yellow-600 dark:text-yellow-400"
        >
          {action.message}
        </p>
      )}
      <DialogActions>
        <PracticeButton variant="secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </PracticeButton>
        <PracticeButton
          variant="danger"
          disabled={!api || busy}
          onClick={() => void remove()}
        >
          {busy && <Loader2 className="animate-spin" />}
          Remove
        </PracticeButton>
      </DialogActions>
    </div>
  );
};

/**
 * The low-key "Remove from review pile" action at the bottom of Your
 * progress, and the dialog that asks first. Removing deletes the pile item's
 * reading and writing cards' history (a later add starts both from scratch).
 */
export const RemoveFromReviewPile = ({
  kanji,
  disabled,
}: {
  kanji: string;
  disabled: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TextActionButton disabled={disabled} onClick={() => setOpen(true)}>
        Remove from review pile
      </TextActionButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <ScrollableDialogContent
          size="md"
          title={`Remove ${kanji} from your review pile?`}
          description="Removing deletes the review history of this kanji"
          titleClassName="text-left"
        >
          <ConfirmRemove kanji={kanji} onCancel={() => setOpen(false)} />
        </ScrollableDialogContent>
      </Dialog>
    </>
  );
};
