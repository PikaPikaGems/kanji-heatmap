import { NoticeAction } from "@/components/common/UserNotice";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { TTS_DISCLAIMER } from "@/lib/tts";
import { cn } from "@/lib/utils";

/**
 * Under a speech setting. Logged out: "🔊 **Log in** for natural-sounding
 * speech." Logged in: the audio, with the device's voice as a fallback.
 * Builds without accounts: the device-voice disclaimer.
 */
export const TtsNotice = ({ className }: { className?: string }) => {
  const status = useAccountStatus();

  if (status.kind === "signed-out") {
    return (
      <p className={cn("text-xs text-left", className)}>
        🔊 <NoticeAction onClick={openLoginDialog}>Log in</NoticeAction> for
        natural-sounding speech.
      </p>
    );
  }
  if (status.kind === "active") {
    return (
      <p className={cn("text-xs text-left", className)}>
        🔊 Natural-sounding audio, or your device&apos;s built-in voice when
        audio isn&apos;t available.
      </p>
    );
  }
  return <p className={cn("text-xs text-left", className)}>{TTS_DISCLAIMER}</p>;
};
