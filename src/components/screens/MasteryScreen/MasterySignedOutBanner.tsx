import { BottomBannerLayout } from "@/components/site-layout/BottomBannerLayout";
import { useNetworkState } from "@/hooks/use-network-state";
import { openLoginDialog } from "@/lib/engine/login-dialog";

/**
 * The offline banner's bottom bar, asking a signed-out visitor to log in.
 * While offline the app's own offline banner shows instead, never both.
 */
export const MasterySignedOutBanner = () => {
  const { online } = useNetworkState();
  if (!online) return null;

  const message = (
    <>
      Log in to see your progress
      <button
        type="button"
        onClick={openLoginDialog}
        className="px-2 ml-2 rounded-lg bg-background text-foreground hover:bg-neon-accent hover:text-black"
      >
        Log in
      </button>
    </>
  );

  return <BottomBannerLayout wide={message} narrow={message} />;
};
