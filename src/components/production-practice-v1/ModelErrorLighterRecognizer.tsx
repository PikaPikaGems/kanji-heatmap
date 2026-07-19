import { isOrtWasmOutOfMemoryError } from "./format-model-load-error";
import { ModelErrorShell } from "./ModelErrorShell";

export const ModelErrorLighterRecognizer = ({
  errorReport,
  onContinue,
  onCancel,
}: {
  errorReport?: string | null;
  onContinue: () => void;
  onCancel: () => void;
}) => {
  const looksLikeOom =
    errorReport != null && isOrtWasmOutOfMemoryError(errorReport);

  return (
    <ModelErrorShell
      title="Full handwriting engine unavailable"
      description={
        looksLikeOom
          ? "This device ran out of memory while starting the full handwriting engine. We'll use a lighter recognizer instead."
          : "Your device couldn't start the full handwriting engine. We'll use a lighter recognizer instead."
      }
      continueLabel="Continue"
      errorReport={errorReport}
      onContinue={onContinue}
      onCancel={onCancel}
    />
  );
};
