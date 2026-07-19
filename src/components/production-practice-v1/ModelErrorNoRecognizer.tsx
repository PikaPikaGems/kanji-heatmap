import { ModelErrorShell } from "./ModelErrorShell";

export const ModelErrorNoRecognizer = ({
  errorReport,
  onContinue,
  onCancel,
}: {
  errorReport?: string | null;
  onContinue: () => void;
  onCancel: () => void;
}) => (
  <ModelErrorShell
    title="Recognition unavailable"
    description="Neither handwriting recognizer could start. You can still practice — pick the correct kanji after each drawing, without stroke grading."
    continueLabel="Continue without recognition"
    errorReport={errorReport}
    onContinue={onContinue}
    onCancel={onCancel}
  />
);
