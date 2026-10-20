import { ReactNode } from "react";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { PageNotAvailable } from "@/components/error/PageNotAvailable";
import { Sumimasen } from "@/components/error/Sumimasen";
import { LeavePractice } from "@/components/shared-practice/EndSessionButton";
import {
  ENGINE_FAILED_COPY,
  NOT_IN_BUILD_COPY,
  UPDATE_BROWSER_COPY,
} from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { openRecoveryDialog } from "@/lib/engine/recovery-dialog";
import type { AccountStatus } from "@/lib/engine/use-account-status";
import { cn } from "@/lib/utils";
import { MasteryLoading } from "./MasteryLoading";
import { cnWarningTextColor } from "@/lib/generic-cn";

/**
 * The site's empty-state look (Sumimasen emoji, then one bold centered
 * line), as in "No Kanji match your search." `problem` turns the line into a
 * warning (bold yellow) for states that are broken, not just logged out.
 */
const GateMessage = ({
  children,
  problem = false,
}: {
  children: ReactNode;
  problem?: boolean;
}) => (
  <div className="flex flex-col items-center w-full max-w-md gap-5">
    <Sumimasen />
    <UserNotice
      icon={null}
      className={cn(
        "text-base font-bold text-center",
        problem && cnWarningTextColor
      )}
    >
      {children}
    </UserNotice>
  </div>
);

/**
 * Why the account can't use this screen, with the way out when there is one
 * (design 5.1 and 5.8). Lays itself out in whatever flex column holds it.
 */
export const AccountGateMessage = ({
  status,
  feature = "this page",
}: {
  status: Exclude<AccountStatus, { kind: "active" | "loading" }>;
  /** What logging in unlocks, e.g. "Reading Mastery". */
  feature?: string;
}) => {
  if (status.kind === "unavailable") {
    if (status.reason === "not-included") {
      return <GateMessage>{NOT_IN_BUILD_COPY}</GateMessage>;
    }
    if (status.reason === "failed") {
      return <GateMessage problem>{ENGINE_FAILED_COPY}</GateMessage>;
    }
    return <GateMessage problem>{UPDATE_BROWSER_COPY}</GateMessage>;
  }

  if (status.kind === "error") {
    return (
      <GateMessage problem>
        Account status unavailable ({status.diagnosticId})
      </GateMessage>
    );
  }

  if (status.kind === "recovery") {
    return (
      <GateMessage problem>
        This device&apos;s saved data needs attention.{" "}
        <NoticeAction onClick={openRecoveryDialog}>Fix it</NoticeAction> to
        continue.
      </GateMessage>
    );
  }

  return (
    <GateMessage>
      You need to <NoticeAction onClick={openLoginDialog}>log in</NoticeAction>{" "}
      to use {feature}.
    </GateMessage>
  );
};

/**
 * What /reading-mastery and /writing-mastery show instead of the game while
 * the account can't review (design 5.1 and 5.8). A build without the study
 * engine has no such pages: Not Available, as for a missing page.
 */
export const MasteryGateScreen = ({
  status,
  feature,
}: {
  status: Exclude<AccountStatus, { kind: "active" }>;
  feature: string;
}) => {
  if (status.kind === "loading") return <MasteryLoading />;

  if (status.kind === "unavailable" && status.reason === "not-included") {
    return (
      <div className="relative w-full h-full">
        <LeavePractice />
        <PageNotAvailable />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full gap-4 px-4 py-8 text-center animate-fade-in">
      <LeavePractice />
      <AccountGateMessage status={status} feature={feature} />
    </div>
  );
};
