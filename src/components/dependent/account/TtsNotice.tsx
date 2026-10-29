import { NoticeAction } from "@/components/common/UserNotice";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { TTS_DISCLAIMER } from "@/lib/tts";
import { cn } from "@/lib/utils";

/**
 * Under a speech setting. Logged out: "🔊 **Log in** for more natural-sounding
 * speech." (logged-in speech will use recorded audio); otherwise the
 * text-to-speech disclaimer.
 */
export const TtsNotice = ({ className }: { className?: string }) => {
  const status = useAccountStatus();

  if (status.kind === "signed-out") {
    return (
      <p className={cn("text-xs text-left", className)}>
        🔊 <NoticeAction onClick={openLoginDialog}>Log in</NoticeAction> for
        more natural-sounding speech.
      </p>
    );
  }
  return <p className={cn("text-xs text-left", className)}>{TTS_DISCLAIMER}</p>;
};
