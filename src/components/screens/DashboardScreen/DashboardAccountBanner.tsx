import { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";

const Banner = ({ children }: { children: ReactNode }) => (
  <Alert
    role="status"
    className="flex flex-col items-center gap-3 border-2 border-dashed border-amber-500/60 bg-amber-500/10 sm:flex-row sm:justify-between"
  >
    {children}
  </Alert>
);

const BannerText = ({ children }: { children: ReactNode }) => (
  <p className="text-sm font-semibold text-center sm:text-left">{children}</p>
);

/**
 * Tells why the dashboard below shows an empty account: logged out (with a
 * Log in button), a browser that can't save progress, or an account that
 * can't be read. Renders nothing while loading or logged in.
 */
export const DashboardAccountBanner = () => {
  const account = useAccountStatus();

  if (account.kind === "signed-out") {
    return (
      <Banner>
        <BannerText>
          ⚠️ You&apos;re not logged in. Log in to view your progress statistics.
        </BannerText>
        <Button size="sm" onClick={openLoginDialog}>
          Log in
        </Button>
      </Banner>
    );
  }
  if (account.kind === "unavailable") {
    return (
      <Banner>
        <BannerText>⚠️ {UPDATE_BROWSER_COPY}</BannerText>
      </Banner>
    );
  }
  if (account.kind === "error" || account.kind === "recovery") {
    return (
      <Banner>
        <BannerText>
          ⚠️ Your progress isn&apos;t available right now.
        </BannerText>
      </Banner>
    );
  }
  return null;
};
