import { useNetworkState } from "@/hooks/use-network-state";
import { BottomBannerLayout } from "./BottomBannerLayout";

/** Fixed bottom banner shown on every page while the browser is offline. */
const BottomBanner = () => {
  const { online } = useNetworkState();
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
