import { GeneratedText } from "./GeneratedText";
import { buildVocabularyPrompt } from "@/lib/ai-explain/prompts";
import { useCurrentOwnerId } from "@/lib/engine/content-owner";

export default function AnchorWordDetails({
  word,
  reading,
  englishGloss,
}: {
  word: string;
  reading: string;
  englishGloss: string;
}) {
  const id = `vocabulary:${JSON.stringify([word, reading])}`;
  const ownerId = useCurrentOwnerId();
  return (
    <GeneratedText
      // Remounts on login/logout to show the new owner's saved details.
      key={`${ownerId}:${id}`}
      id={id}
      filename={`anchor-word-${word}-${reading}`}
      generateLabel="✨ Generate Vocabulary Details"
      makePrompt={(settings) =>
        buildVocabularyPrompt(settings, {
          word,
          reading,
          dictionaryContext: englishGloss,
        })
      }
    />
  );
}
