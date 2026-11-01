import { SyncNeededNotice } from "@/components/dependent/account/SyncNeededNotice";
import { useSyncAttention } from "@/components/dependent/account/old-pending";
import { useNetworkState } from "@/hooks/use-network-state";
import { BottomBannerLayout } from "./BottomBannerLayout";

/**
 * Fixed bottom banner shown on every page: "Please sync soon" / "Saving is
 * paused" while this device needs to sync (it also covers being offline),
 * otherwise the offline notice while the browser is offline. Never both.
 */
const BottomBanner = () => {
  const { online } = useNetworkState();
  const attention = useSyncAttention();

  if (attention !== "none") {
    // The bar is inverted (light text on dark), and smaller on phones.
    return (
      <BottomBannerLayout
        wide={
          <SyncNeededNotice
            attention={attention}
            className="text-sm font-extrabold text-center text-background"
          />
        }
        narrow={
          <SyncNeededNotice
            attention={attention}
            className="text-xs font-extrabold text-center text-background"
          />
        }
      />
    );
  }

  if (online) return null;

  return (
    <BottomBannerLayout
      wide={
        <>
          ⚠️ {`You're offline.`} Some parts may not work, but you can still use
          the site 💖
        </>
      }
      narrow={
        <>
          <span className="hidden min-[360px]:inline">
            ⚠️ {`You're offline.`} Some parts may not work.
          </span>
          <span className="min-[360px]:hidden">😭 {`You're offline!`}</span>
        </>
      }
    />
  );
};

export default BottomBanner;
