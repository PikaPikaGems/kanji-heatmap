import { useEffect } from "react";
import { SpeakButton } from "@/components/common/SpeakButton";
import { AiExplainDialog } from "@/components/screens/FillTheKanjiScreen/AiExplainDialog";
import { useAiExplain } from "@/hooks/use-ai-explain";
import {
  closeWordExplain,
  useWordExplainDialog,
} from "@/lib/ai-explain/word-explain-dialog";

const WordExplainFlow = ({
  word,
  english,
  open,
}: {
  word: string;
  english?: string;
  open: boolean;
}) => {
  const explain = useAiExplain();

  // Effect needed: the explanation starts when the dialog opens from a
  // popover elsewhere in the app, so there is no event handler here to start
  // it from; it runs once per opening (the parent remounts this per session).
  useEffect(() => {
    void explain.run(word, { word: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per opening
  }, []);

  return (
    <AiExplainDialog
      open={open}
      // Closing doesn't cancel: the answer is still saved when it arrives.
      onClose={closeWordExplain}
      japaneseText={word}
      english={english}
      word
      speakButtons={<SpeakButton word={word} iconType="volume-2" />}
      state={explain.state}
      onRegenerate={(instructions) =>
        void explain.run(word, { fresh: true, instructions, word: true })
      }
      onDelete={() => explain.remove(word)}
    />
  );
};

/** "✨ AI Explain" for one word, opened with `openWordExplain(word)`. */
export const WordExplainDialog = () => {
  const { open, word, english, session } = useWordExplainDialog();
  if (session === 0) return null;
  return (
    <WordExplainFlow key={session} word={word} english={english} open={open} />
  );
};
