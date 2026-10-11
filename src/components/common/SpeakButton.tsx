import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useSpeakWithStatus } from "@/hooks/use-jp-speak";
import { AudioLines, Headphones, Loader2, Volume2 } from "../icons";

type AudioIconType = "audio-lines" | "volume-2" | "headphones";
const audioIcons: Record<AudioIconType, ReactNode> = {
  "audio-lines": <AudioLines />,
  "volume-2": <Volume2 />,
  headphones: <Headphones />,
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
  variant?:
    | "outline"
    | "ghost"
    | "default"
    | "secondary"
    | "destructive"
    | "link";
}) => {
  const { speak, status } = useSpeakWithStatus(word);
  // Only the AI voice has a wait before audio starts.
  const preparing = status === "preparing";

  return (
    <Button
      variant={variant ?? "outline"}
      size="iconXl"
      className="relative"
      onClick={() => {
        speak();
      }}
      autoFocus={autoFocus}
      aria-busy={preparing}
    >
      {preparing ? <Loader2 className="animate-spin" /> : audioIcons[iconType]}
    </Button>
  );
};
