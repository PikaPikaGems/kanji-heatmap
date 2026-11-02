import type { ReactNode } from "react";
import { NoticeCard, NoticeCardButton } from "@/components/common/NoticeCard";
import { openLoginDialog } from "@/lib/engine/login-dialog";

/**
 * The logged-out notice card: "👀 You're not logged in." with a line saying
 * what logging in gives (`children`) and a Log in button. The dashboard, FSRS
 * settings and the kanji drawer's progress and notes share it, so they word
 * and style it the same way.
 */
export const LoggedOutCard = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <NoticeCard
    icon="👀"
    title="You're not logged in."
    className={className}
    action={
      <NoticeCardButton variant="secondary" onClick={openLoginDialog}>
        Log in
      </NoticeCardButton>
    }
  >
    {children}
  </NoticeCard>
);
