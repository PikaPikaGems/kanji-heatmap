import { OldPendingNotice } from "@/components/dependent/account/OldPendingNotice";
import { useHasOldPendingChanges } from "@/components/dependent/account/old-pending";
import { useNetworkState } from "@/hooks/use-network-state";
import { BottomBannerLayout } from "./BottomBannerLayout";

/**
 * Fixed bottom banner shown on every page: the week-old-changes warning while
 * changes wait to upload (it also covers being offline), otherwise the
 * offline notice while the browser is offline. Never both.
 */
const BottomBanner = () => {
  const { online } = useNetworkState();
  const hasOldPending = useHasOldPendingChanges();

  if (hasOldPending) {
    // The bar is inverted (light text on dark), and smaller on phones.
    return (
      <BottomBannerLayout
        wide={
          <OldPendingNotice className="text-sm font-extrabold text-center text-background" />
        }
        narrow={
          <OldPendingNotice className="text-xs font-extrabold text-center text-background" />
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
