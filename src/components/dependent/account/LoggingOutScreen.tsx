import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Circle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dismissLogoutError,
  logoutSteps,
  retryLogout,
  type LogoutRequest,
  type LogoutStep,
  useLogoutFlow,
} from "@/lib/engine/logout-flow";
import { cn } from "@/lib/utils";

type StepProgress = "done" | "current" | "failed" | "waiting";

const stepCopy = (step: LogoutStep, request: LogoutRequest) => {
  if (step === "ai-content") {
    return {
      doing: "Deleting your AI-generated content…",
      done: "Deleted your AI-generated content",
    };
  }
  if (step === "ai-key") {
    return {
      doing: "Deleting your saved xAI API key…",
      done: "Deleted your saved xAI API key",
    };
  }
  if (request.clearLocalData) {
    return {
      doing: "Removing your study data and ending your session…",
      done: "Removed your study data and ended your session",
    };
  }
  return { doing: "Ending your session…", done: "Ended your session" };
};

const StepList = ({
  request,
  step,
  failed,
}: {
  request: LogoutRequest;
  step: LogoutStep;
  failed: boolean;
}) => {
  const steps = logoutSteps(request);
  const progressOf = (candidate: LogoutStep): StepProgress => {
    const order = steps.indexOf(candidate) - steps.indexOf(step);
    if (order < 0) return "done";
    if (order > 0) return "waiting";
    return failed ? "failed" : "current";
  };

  return (
    <ul className="flex flex-col gap-2 text-sm text-left">
      {steps.map((candidate) => {
        const progress = progressOf(candidate);
        const copy = stepCopy(candidate, request);
        return (
          <li
            key={candidate}
            className={cn(
              "flex items-start gap-2",
              progress === "waiting" && "text-muted-foreground",
              progress === "failed" && "text-destructive"
            )}
          >
            <span className="mt-0.5 shrink-0" aria-hidden>
              {progress === "done" && (
                <Check className="size-4 text-green-600 dark:text-green-400" />
              )}
              {progress === "current" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {progress === "failed" && <XCircle className="size-4" />}
              {progress === "waiting" && <Circle className="size-4" />}
            </span>
            {progress === "done" ? copy.done : copy.doing}
          </li>
        );
      })}
    </ul>
  );
};

/**
 * Full-screen "Logging you out…" screen (design 5.3.1), mounted once in App
 * because the sidebar that starts a logout unmounts mid-way. It can't be
 * dismissed: Escape and clicks outside do nothing, and there is no close
 * button. It is a Radix dialog so it traps focus and sits above any dialog
 * that was open when the logout started.
 */
export const LoggingOutScreen = () => {
  const flow = useLogoutFlow();
  if (flow.phase === "closed" || flow.phase === "confirm") return null;

  return (
    <DialogPrimitive.Root open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 outline-none bg-background/95 backdrop-blur-sm"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div
            key={flow.phase}
            className="w-full max-w-sm p-6 text-center border-2 shadow-lg rounded-3xl bg-card animate-fade-in-fast"
          >
            {flow.phase === "done" && (
              <>
                <DialogPrimitive.Title className="text-lg font-semibold text-green-600 dark:text-green-400">
                  ✓ You&apos;re logged out
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Your session has ended
                </DialogPrimitive.Description>
              </>
            )}
            {flow.phase === "running" && (
              <div className="flex flex-col gap-4">
                <DialogPrimitive.Title className="text-lg font-semibold">
                  Logging you out…
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  Please don&apos;t close or reload this tab until we&apos;re
                  done.
                </DialogPrimitive.Description>
                <StepList
                  request={flow.request}
                  step={flow.step}
                  failed={false}
                />
                {flow.slow && (
                  <p role="status" className="text-xs text-muted-foreground">
                    This can take up to 30 seconds while we finish up with the
                    server.
                  </p>
                )}
              </div>
            )}
            {flow.phase === "error" && (
              <div className="flex flex-col gap-4">
                <DialogPrimitive.Title className="text-lg font-semibold">
                  We couldn&apos;t log you out
                </DialogPrimitive.Title>
                <DialogPrimitive.Description
                  role="alert"
                  className="text-sm text-muted-foreground"
                >
                  {flow.message.replace(/[.!]+$/, "")}. You&apos;re still logged
                  in.
                </DialogPrimitive.Description>
                <StepList request={flow.request} step={flow.step} failed />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                  <Button variant="outline" onClick={dismissLogoutError}>
                    Stay logged in
                  </Button>
                  <Button onClick={retryLogout}>Try again</Button>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
