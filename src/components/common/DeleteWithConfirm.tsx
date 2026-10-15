import { useState, type ReactNode } from "react";
import { Trash2, X } from "lucide-react";
import { TextActionButton } from "./AiActionButtons";

type DeleteStatus = "idle" | "confirm" | "deleting";

/**
 * A Delete action that asks first. The question takes a full row, so it
 * wraps below the other actions when placed in a flex-wrap row.
 */
export const DeleteWithConfirm = ({
  question,
  confirmLabel = "Delete",
  cancelLabel = "Keep it",
  disabled,
  onDelete,
}: {
  question: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  onDelete: () => Promise<void>;
}) => {
  const [status, setStatus] = useState<DeleteStatus>("idle");
  const [error, setError] = useState("");

  const remove = async () => {
    setStatus("deleting");
    setError("");
    try {
      await onDelete();
      setStatus("idle");
    } catch {
      setStatus("confirm");
      setError("Couldn't delete this. Try again.");
    }
  };

  if (status === "idle")
    return (
      <TextActionButton
        icon={<Trash2 size={14} />}
        className="text-rose-500"
        disabled={disabled}
        onClick={() => setStatus("confirm")}
      >
        Delete
      </TextActionButton>
    );

  return (
    <div className="p-3 space-y-2 text-center border rounded-lg basis-full animate-fade-in-fast">
      <p className="text-sm">{question}</p>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <TextActionButton
          icon={<Trash2 size={14} />}
          className="text-rose-500"
          busy={status === "deleting"}
          busyLabel="Deleting…"
          disabled={disabled}
          onClick={() => void remove()}
        >
          {confirmLabel}
        </TextActionButton>
        <span aria-hidden>·</span>
        <TextActionButton
          icon={<X size={14} />}
          disabled={status === "deleting"}
          onClick={() => {
            setStatus("idle");
            setError("");
          }}
        >
          {cancelLabel}
        </TextActionButton>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
