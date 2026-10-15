import { useState, type ComponentProps, type ReactNode } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { cn } from "@/lib/utils";
import { FullscreenEditorDialog } from "./FullscreenEditorDialog";
import { StudyNotesTextarea, studyNotesFieldCn } from "./StudyNotesTextarea";

/**
 * A textarea for drawers and modals. On phones (coarse pointer) it shows a
 * tappable preview that opens a full-screen editor, like Personal Study
 * Notes, so the soft keyboard can't hide what you type.
 */
export const ResponsiveTextarea = ({
  id,
  value,
  onValueChange,
  title,
  placeholder,
  disabled,
  className,
  ...props
}: Omit<ComponentProps<"textarea">, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Heading of the full-screen editor on phones. */
  title: ReactNode;
}) => {
  const isCoarsePointer = useCoarsePointer();
  const [open, setOpen] = useState(false);
  const textareaProps = {
    ...props,
    value,
    placeholder,
    disabled,
    onChange: (event: { target: { value: string } }) =>
      onValueChange(event.target.value),
  };

  if (!isCoarsePointer)
    return (
      <StudyNotesTextarea id={id} className={className} {...textareaProps} />
    );

  return (
    <>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          studyNotesFieldCn,
          "text-left disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={cn("line-clamp-4", !value && "text-muted-foreground")}>
          {value || placeholder || "Tap to write"}
        </span>
      </button>
      <FullscreenEditorDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description="Edit this text full screen."
      >
        <StudyNotesTextarea {...textareaProps} className="flex-1 min-h-0" />
        <PracticeButton size="lg" onClick={() => setOpen(false)}>
          Done
        </PracticeButton>
      </FullscreenEditorDialog>
    </>
  );
};
