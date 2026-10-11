import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SpeakStatus, useSpeakWithStatus } from "@/hooks/use-jp-speak";
import { AudioLines, Headphones, Loader2, Volume2 } from "../icons";

type AudioIconType = "audio-lines" | "volume-2" | "headphones";
const audioIcons: Record<AudioIconType, ReactNode> = {
  "audio-lines": <AudioLines />,
  "volume-2": <Volume2 />,
  headphones: <Headphones />,
};

type ButtonVariant =
  | "outline"
  | "ghost"
  | "default"
  | "secondary"
  | "destructive"
  | "link";

/**
 * The speak button for a caller that owns the speech (useSpeakWithStatus),
 * e.g. so keyboard shortcuts show the same spinner as a tap.
 */
export const SpeakButtonView = ({
  status,
  onSpeak,
  icon,
  label,
  autoFocus,
  variant,
}: {
  status: SpeakStatus;
  onSpeak: () => void;
  icon: ReactNode;
  label?: string;
  autoFocus?: boolean;
  variant?: ButtonVariant;
}) => {
  // Only the AI voice has a wait before audio starts.
  const preparing = status === "preparing";

  return (
    <Button
      variant={variant ?? "outline"}
      size="iconXl"
      className="relative"
      onClick={onSpeak}
      autoFocus={autoFocus}
      aria-busy={preparing}
      aria-label={label}
    >
      {preparing ? <Loader2 className="animate-spin" /> : icon}
    </Button>
  );
};

export const SpeakButton = ({
  word,
  iconType,
  autoFocus,
  variant,
}: {
  word: string;
  iconType: AudioIconType;
  autoFocus?: boolean;
  variant?: ButtonVariant;
}) => {
  const { speak, status } = useSpeakWithStatus(word);
  return (
    <SpeakButtonView
      status={status}
      onSpeak={speak}
      icon={audioIcons[iconType]}
      autoFocus={autoFocus}
      variant={variant}
    />
  );
};
