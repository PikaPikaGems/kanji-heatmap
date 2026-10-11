import { SpeakButtonView } from "@/components/common/SpeakButton";
import { Headphones, Snail } from "@/components/icons";
import { SentenceSpeech } from "./use-fill-the-kanji-game";

/**
 * Normal and slow (snail) speak buttons, side by side. The game owns the
 * speech, so the ! and @ shortcuts show the same spinner as a tap.
 */
export const SpeakButtons = ({ speech }: { speech: SentenceSpeech }) => (
  <div className="flex items-center gap-1 shrink-0">
    <SpeakButtonView
      status={speech.normal.status}
      onSpeak={speech.normal.speak}
      icon={<Headphones />}
      label="Say it"
    />
    <SpeakButtonView
      status={speech.slow.status}
      onSpeak={speech.slow.speak}
      icon={<Snail />}
      label="Say it slowly"
    />
  </div>
);
