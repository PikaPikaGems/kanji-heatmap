import { UserNotice } from "@/components/common/UserNotice";
import { BottomBannerLayout } from "@/components/site-layout/BottomBannerLayout";
import { useNetworkState } from "@/hooks/use-network-state";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";

/**
 * The offline banner's bottom bar, saying why the tiles are uncolored: a
 * browser that can't save progress. While offline the app's own offline
 * banner shows instead, never both. Logged out shows no banner.
 */
export const MasteryAccountBanner = () => {
  const { online } = useNetworkState();
  if (!online) return null;

  // The bar is inverted (light text on dark), and smaller on phones.
  return (
    <BottomBannerLayout
      wide={
        <UserNotice className="text-sm font-extrabold text-center text-background">
          {UPDATE_BROWSER_COPY}
        </UserNotice>
      }
      narrow={
        <UserNotice className="text-xs font-extrabold text-center text-background">
          {UPDATE_BROWSER_COPY}
        </UserNotice>
      }
    />
  );
};
