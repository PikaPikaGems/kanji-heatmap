import { PracticeButton } from "@/components/ui/practice-button";
import { ErrorTerminal } from "@/components/common/ErrorTerminal";

/** Shared chrome for model-load error screens (copy + actions differ per screen). */
export const ModelErrorShell = ({
  title,
  description,
  continueLabel,
  errorReport,
  onContinue,
  onCancel,
}: {
  title: string;
  description: string;
  continueLabel: string;
  errorReport?: string | null;
  onContinue: () => void;
  onCancel: () => void;
}) => (
  <div className="flex flex-col items-center justify-center w-full h-full gap-6 px-6 text-center animate-fade-in">
    <div className="max-w-md">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
    {errorReport ? (
      <ErrorTerminal content={errorReport} filename="dakanji-warmup.log" />
    ) : null}
    <div className="flex flex-col w-full max-w-xs gap-2">
      <PracticeButton size="lg" onClick={onContinue}>
        {continueLabel}
      </PracticeButton>
      <PracticeButton size="md" variant="ghost" onClick={onCancel}>
        Back
      </PracticeButton>
    </div>
  </div>
);
