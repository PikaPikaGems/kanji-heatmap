import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CircleX, InfoIcon } from "@/components/icons";
import { GenericPopover } from "@/components/common/GenericPopover";
import { LocalStorageWarning } from "@/components/common/LocalStorageWarning";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import { cn } from "@/lib/utils";
import { MarkdownEditor } from "./MarkdownEditor";
import { StudyNotesEditorTips } from "./StudyNotesEditorTips";

interface StudyNotesFullscreenEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kanji: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}

/** Above the kanji Vaul drawer (`z-50`) so compose covers the sheet. */
const FULLSCREEN_Z = "z-[60]";

/**
 * Phone-friendly compose surface: pinned to the visual viewport so the
 * soft keyboard does not cover the textarea (unlike editing inside the
 * kanji Vaul drawer).
 */
export const StudyNotesFullscreenEditor = ({
  open,
  onOpenChange,
  kanji,
  value,
  maxLength,
  onChange,
}: StudyNotesFullscreenEditorProps) => {
  const viewport = useVisualViewport();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className={FULLSCREEN_Z} />
        <DialogPrimitive.Content
          className={cn(
            FULLSCREEN_Z,
            "fixed inset-x-0 flex flex-col gap-0 overflow-hidden border-0 bg-background p-0 shadow-none outline-none",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-2"
          )}
          style={{ top: viewport.offsetTop, height: viewport.height }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            const textarea = (event.currentTarget as HTMLElement).querySelector(
              "textarea"
            );
            textarea?.focus();
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <DialogHeader className="relative gap-1 px-4 py-3 pr-16 text-left shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className="text-2xl leading-none kanji-font">{kanji}</span>
              <span>Study Notes</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Write personal study notes for {kanji}.
            </DialogDescription>
            <GenericPopover
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center self-start gap-1 text-xs leading-loose underline cursor-pointer decoration-dotted underline-offset-8"
                >
                  <strong>Tips and optional syntax</strong>
                  <InfoIcon size={14} />
                </button>
              }
              content={
                <div className="p-5 space-y-3 text-left">
                  <StudyNotesEditorTips />
                  <LocalStorageWarning className="p-2 text-center" />
                </div>
              }
              contentClassName="z-[70] m-0 w-[calc(100vw-2rem)] max-w-sm p-0"
            />
            <DialogPrimitive.Close asChild className="absolute top-2 right-2">
              <Button
                variant="ghost"
                size="icon"
                className="p-4 border-2 border-dashed rounded-xl bg-background"
              >
                <CircleX className="size-8" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          </DialogHeader>
          <div className="flex flex-col flex-1 min-h-0 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <MarkdownEditor
              value={value}
              maxLength={maxLength}
              onChange={onChange}
              fill
              autoFocus
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
