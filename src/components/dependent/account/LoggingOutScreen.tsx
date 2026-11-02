import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Circle, CircleCheckBig, Loader2, XCircle } from "lucide-react";
import { DialogActions } from "@/components/common/DialogActions";
import { UserNotice } from "@/components/common/UserNotice";
import { PracticeButton } from "@/components/ui/practice-button";
import {
  closeLoggedOut,
  dismissLogoutError,
  logoutSteps,
  retryLogout,
  type LogoutRequest,
  type LogoutStep,
  useLogoutFlow,
} from "@/lib/engine/logout-flow";
import { cn } from "@/lib/utils";
import { cnWarningText } from "@/lib/generic-cn";

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
    <ul className="flex flex-col gap-2.5 p-4 text-sm text-left border rounded-2xl border-foreground/20 bg-muted/15">
      {steps.map((candidate) => {
        const progress = progressOf(candidate);
        const copy = stepCopy(candidate, request);
        return (
          <li
            key={candidate}
            className={cn(
              "flex items-start gap-2",
              progress === "waiting" && "text-muted-foreground",
              progress === "failed" && cnWarningText
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

/** "✓ You're logged out" with the one way out: Close. */
const LoggedOut = () => (
  <div className="flex flex-col items-center gap-2 text-center">
    <CircleCheckBig
      aria-hidden
      className="mb-1 text-green-600 size-12 dark:text-green-400"
    />
    <DialogPrimitive.Title className="text-xl font-bold">
      You&apos;re logged out
    </DialogPrimitive.Title>
    <DialogPrimitive.Description className="text-sm text-pretty">
      You can keep using Kanji Heatmap as a guest.
    </DialogPrimitive.Description>
    <PracticeButton
      size="md"
      className="mt-4"
      autoFocus
      onClick={closeLoggedOut}
    >
      Close
    </PracticeButton>
  </div>
);

/**
 * Full-screen "Logging you out…" screen (design 5.3.1), mounted once in App
 * because the sidebar that starts a logout unmounts mid-way. While it runs it
 * can't be dismissed: Escape and clicks outside do nothing, and there is no
 * close button. "You're logged out" stays until Close (or Escape). It is a
 * Radix dialog so it traps focus and sits above any dialog that was open when
 * the logout started.
 */
export const LoggingOutScreen = () => {
  const flow = useLogoutFlow();
  if (flow.phase === "closed" || flow.phase === "confirm") return null;

  return (
    <DialogPrimitive.Root open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 outline-none bg-background/95 backdrop-blur-sm"
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            closeLoggedOut();
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div
            key={flow.phase}
            className="w-full max-w-sm p-6 text-left border-2 shadow-lg rounded-3xl bg-card animate-fade-in-fast"
          >
            {flow.phase === "done" && <LoggedOut />}
            {flow.phase === "running" && (
              <div className="flex flex-col gap-4">
                <DialogPrimitive.Title className="text-xl font-bold">
                  Logging you out…
                </DialogPrimitive.Title>
                <DialogPrimitive.Description asChild>
                  <div>
                    <UserNotice>
                      Please don&apos;t close or reload this tab until
                      we&apos;re done.
                    </UserNotice>
                  </div>
                </DialogPrimitive.Description>
                <StepList
                  request={flow.request}
                  step={flow.step}
                  failed={false}
                />
                {flow.slow && (
                  <div role="status" className="animate-fade-in-fast">
                    <UserNotice icon="⏳">
                      This can take up to 30 seconds while we finish up with the
                      server.
                    </UserNotice>
                  </div>
                )}
              </div>
            )}
            {flow.phase === "error" && (
              <div className="flex flex-col gap-4">
                <DialogPrimitive.Title className="text-xl font-bold">
                  We couldn&apos;t log you out
                </DialogPrimitive.Title>
                <DialogPrimitive.Description
                  role="alert"
                  className={cn("text-sm", cnWarningText)}
                >
                  ⚠️ {flow.message.replace(/[.!]+$/, "")}. You&apos;re still
                  logged in.
                </DialogPrimitive.Description>
                <StepList request={flow.request} step={flow.step} failed />
                <DialogActions className="pt-2">
                  <PracticeButton
                    variant="secondary"
                    onClick={dismissLogoutError}
                  >
                    Stay logged in
                  </PracticeButton>
                  <PracticeButton onClick={retryLogout}>
                    Try again
                  </PracticeButton>
                </DialogActions>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
