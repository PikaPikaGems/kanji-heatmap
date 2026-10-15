import { GeneratedText } from "./GeneratedText";
import { buildVocabularyPrompt } from "@/lib/ai-explain/prompts";

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
  return (
    <GeneratedText
      key={id}
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
