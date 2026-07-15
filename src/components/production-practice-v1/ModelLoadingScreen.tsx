import { PracticeButton } from "@/components/ui/practice-button";

export const ModelLoadingScreen = ({
  status,
  onRetry,
  onCancel,
}: {
  status: "loading" | "error";
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
              Check your connection and try again.
            </p>
          </div>
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
