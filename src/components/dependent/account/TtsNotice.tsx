import { NoticeAction } from "@/components/common/UserNotice";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { TTS_DISCLAIMER } from "@/lib/tts";
import { cn } from "@/lib/utils";

/**
 * Under a speech setting. Logged out: "🔊 **Log in** for more
 * natural-sounding audio." Logged in: the audio, then the AI voice (if
 * enabled), then the device's voice.
 * Builds without accounts: the device-voice disclaimer.
 */
export const TtsNotice = ({ className }: { className?: string }) => {
  const status = useAccountStatus();

  if (status.kind === "signed-out") {
    return (
      <p className={cn("text-xs text-left", className)}>
        🔊 <NoticeAction onClick={openLoginDialog}>Log in</NoticeAction> for
        more natural-sounding audio.
      </p>
    );
  }
  if (status.kind === "active") {
    return (
      <p className={cn("text-xs text-left", className)}>
        🔊 Natural-sounding audio will be played by default. When not available,
        the AI voice reads it (if enabled), and your device&apos;s built-in
        voice is the last fallback.
      </p>
    );
  }
  return <p className={cn("text-xs text-left", className)}>{TTS_DISCLAIMER}</p>;
};
