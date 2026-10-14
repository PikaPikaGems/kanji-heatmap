import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LeavePractice } from "@/components/shared-practice/EndSessionButton";
import {
  copyForCode,
  NOT_IN_BUILD_COPY,
  UPDATE_BROWSER_COPY,
} from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { openRecoveryDialog } from "@/lib/engine/recovery-dialog";
import type { AccountStatus } from "@/lib/engine/use-account-status";
import { MasteryLoading } from "./MasteryLoading";

const GateMessage = ({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) => (
  <>
    <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
    {action}
  </>
);

/**
 * Why the account can't use this screen, with the way out when there is one
 * (design 5.1 and 5.8). Lays itself out in whatever flex column holds it.
 */
export const AccountGateMessage = ({
  status,
}: {
  status: Exclude<AccountStatus, { kind: "active" | "loading" }>;
}) => {
  if (status.kind === "unavailable") {
    if (status.reason === "not-included") {
      return <GateMessage>{NOT_IN_BUILD_COPY}</GateMessage>;
    }
    if (status.reason === "failed") {
      return <GateMessage>{copyForCode(status.reason)}</GateMessage>;
    }
    return <GateMessage>{UPDATE_BROWSER_COPY}</GateMessage>;
  }

  if (status.kind === "error") {
    return (
      <GateMessage>
        Account status unavailable ({status.diagnosticId})
      </GateMessage>
    );
  }

  if (status.kind === "recovery") {
    return (
      <GateMessage
        action={
          <Button variant="outline" onClick={openRecoveryDialog}>
            Fix saved data on this device
          </Button>
        }
      >
        This device&apos;s saved data needs attention.
      </GateMessage>
    );
  }

  return (
    <GateMessage
      action={
        <Button variant="outline" onClick={openLoginDialog}>
          Log in
        </Button>
      }
    >
      You need to log in to access this
    </GateMessage>
  );
};

/**
 * What /reading-mastery and /writing-mastery show instead of the game while
 * the account can't review (design 5.1 and 5.8).
 */
export const MasteryGateScreen = ({
  status,
}: {
  status: Exclude<AccountStatus, { kind: "active" }>;
}) => {
  if (status.kind === "loading") return <MasteryLoading />;

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full gap-4 px-6 text-center animate-fade-in">
      <LeavePractice />
      <AccountGateMessage status={status} />
    </div>
  );
};
