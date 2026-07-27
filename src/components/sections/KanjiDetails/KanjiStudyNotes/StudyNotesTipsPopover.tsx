import { InfoIcon } from "@/components/icons";
import { GenericPopover } from "@/components/common/GenericPopover";
import { cn } from "@/lib/utils";
import { StudyNotesEditorTips } from "./StudyNotesEditorTips";

interface StudyNotesTipsPopoverProps {
  className?: string;
  contentClassName?: string;
}

export const StudyNotesTipsPopover = ({
  className,
  contentClassName = "m-0 w-[calc(100vw-2rem)] max-w-sm p-0",
}: StudyNotesTipsPopoverProps) => {
  return (
    <GenericPopover
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex items-center self-start gap-1 text-xs leading-loose underline cursor-pointer decoration-dotted underline-offset-8",
            className
          )}
        >
          <strong>Tips and optional syntax</strong>
          <InfoIcon size={14} />
        </button>
      }
      content={
        <div className="p-5 space-y-3 text-left">
          <StudyNotesEditorTips />
        </div>
      }
      contentClassName={contentClassName}
    />
  );
};
