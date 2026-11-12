import { NoticeAction } from "@/components/common/UserNotice";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { useVoiceEngine } from "@/hooks/use-ai-voice";
import { TTS_DISCLAIMER } from "@/lib/tts";
import { cn } from "@/lib/utils";

/**
 * Under a speech setting. Logged out: "🔊 **Log in** for natural-sounding
 * speech." Logged in: the audio, then the AI voice when it's chosen, then
 * the device's voice.
 * Builds without accounts: the device-voice disclaimer.
 */
export const TtsNotice = ({ className }: { className?: string }) => {
  const status = useAccountStatus();
  const [engine] = useVoiceEngine();

  if (status.kind === "signed-out") {
    return (
      <p className={cn("text-xs text-left", className)}>
        🔊 <NoticeAction onClick={openLoginDialog}>Log in</NoticeAction> for
        natural-sounding speech.
      </p>
    );
  }
  if (status.kind === "active" && engine === "ai") {
    return (
      <p className={cn("text-xs text-left", className)}>
        🔊 Natural-sounding audio will be played by default. When not available,
        the AI voice reads it, and your device&apos;s built-in voice is the last
        fallback.
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
