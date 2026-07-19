import { PracticeButton } from "@/components/ui/practice-button";
import { ErrorTerminal } from "@/components/common/ErrorTerminal";
import { isOrtWasmOutOfMemoryError } from "./format-model-load-error";

export const ModelErrorScreen = ({
  errorReport,
  onRetry,
  onContinueWithoutGrading,
  onCancel,
}: {
  errorReport?: string | null;
  onRetry: () => void;
  onContinueWithoutGrading: () => void;
  onCancel: () => void;
}) => {
  const looksLikeOom =
    errorReport != null && isOrtWasmOutOfMemoryError(errorReport);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 px-6 text-center animate-fade-in">
      <div className="max-w-md">
        <h2 className="text-xl font-bold">Could not load the model</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {looksLikeOom
            ? "This device ran out of memory while starting the handwriting engine. You can still practice — pick the correct kanji after each drawing, without stroke grading."
            : "The handwriting grading model could not start. You can still practice — pick the correct kanji after each drawing, without stroke grading."}
        </p>
      </div>
      {errorReport ? (
        <ErrorTerminal content={errorReport} filename="dakanji-warmup.log" />
      ) : null}
      <div className="flex flex-col w-full max-w-xs gap-2">
        <PracticeButton size="lg" onClick={onContinueWithoutGrading}>
          Continue without grading
        </PracticeButton>
        <PracticeButton size="md" variant="secondary" onClick={onRetry}>
          Retry loading model
        </PracticeButton>
        <PracticeButton size="md" variant="ghost" onClick={onCancel}>
          Back
        </PracticeButton>
      </div>
    </div>
  );
};
