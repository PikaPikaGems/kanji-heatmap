import { PracticeButton } from "@/components/ui/practice-button";
import { ErrorTerminal } from "@/components/common/ErrorTerminal";

export const ModelLoadingScreen = ({
  status,
  errorReport,
  onRetry,
  onCancel,
}: {
  status: "loading" | "error";
  errorReport?: string | null;
  onRetry: () => void;
  onCancel: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 px-6 text-center animate-fade-in">
      {status === "loading" ? (
        <>
          <div className="text-4xl animate-pulse" aria-hidden>
            ✍️
          </div>
          <div>
            <h2 className="text-xl font-bold">Loading handwriting model…</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This only happens once per visit. Hang tight.
            </p>
          </div>
        </>
      ) : (
        <>
          <div>
            <h2 className="text-xl font-bold">Could not load the model</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check your connection and try again. If it keeps failing, copy the
              log below and send it to the developers.
            </p>
          </div>
          {errorReport ? (
            <ErrorTerminal
              content={errorReport}
              filename="dakanji-warmup.log"
            />
          ) : null}
          <div className="flex flex-col w-full max-w-xs gap-2">
            <PracticeButton size="lg" onClick={onRetry}>
              Retry
            </PracticeButton>
            <PracticeButton size="md" variant="ghost" onClick={onCancel}>
              Back
            </PracticeButton>
          </div>
        </>
      )}
    </div>
  );
};
