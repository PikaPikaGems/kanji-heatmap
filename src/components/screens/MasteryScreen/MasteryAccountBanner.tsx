import { UserNotice } from "@/components/common/UserNotice";
import { LoginNotice } from "@/components/dependent/account/LoginNotice";
import { BottomBannerLayout } from "@/components/site-layout/BottomBannerLayout";
import { useNetworkState } from "@/hooks/use-network-state";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";

/**
 * The offline banner's bottom bar, saying why the tiles are uncolored:
 * signed out, or a browser that can't save progress. While offline the app's
 * own offline banner shows instead, never both.
 */
export const MasteryAccountBanner = ({
  reason,
}: {
  reason: "signed-out" | "unsupported-browser";
}) => {
  const { online } = useNetworkState();
  if (!online) return null;

  // The bar is inverted (light text on dark), and smaller on phones.
  const wide = "text-center text-background font-extrabold text-sm";
  const narrow = "text-center text-background font-extrabold text-xs";

  if (reason === "unsupported-browser") {
    return (
      <BottomBannerLayout
        wide={<UserNotice className={wide}>{UPDATE_BROWSER_COPY}</UserNotice>}
        narrow={
          <UserNotice className={narrow}>{UPDATE_BROWSER_COPY}</UserNotice>
        }
      />
    );
  }

  return (
    <BottomBannerLayout
      wide={<LoginNotice to="see your progress" className={wide} />}
      narrow={<LoginNotice to="see your progress" className={narrow} />}
    />
  );
};
