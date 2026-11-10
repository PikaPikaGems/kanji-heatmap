import { DEFAULT_AI_SPEECH_BIT_RATE, type ResolvedAiTool } from "./preferences";
import { modelFor, speakWithProvider } from "./providers";
import { DEFAULT_VOICES } from "./providers/voices";
import { writeVoiceSample } from "./voice-sample-cache";

export { readVoiceSample } from "./voice-sample-cache";

/**
 * What a voice sample says: English with Japanese words, like an essay, so
 * the learner hears how the voice switches between the two.
 */
export const VOICE_SAMPLE_TEXT =
  "The kanji 水 means water. You'll find it in 水曜日, Wednesday, and in 水泳, swimming. 毎日、水を飲みましょう。Drink water every day!";

/** Everything that changes how a sample sounds, as one key. */
export const voiceSampleKey = (choice: ResolvedAiTool, instructions: string) =>
  JSON.stringify([
    choice.provider,
    modelFor(choice.provider, "speech", choice.model),
    choice.voice ?? DEFAULT_VOICES[choice.provider] ?? "",
    choice.language ?? "ja",
    choice.bitRate ?? DEFAULT_AI_SPEECH_BIT_RATE,
    instructions,
  ]);

/** Speaks the sample with the tool's current settings and saves it. */
export const makeVoiceSample = async (
  choice: ResolvedAiTool,
  instructions: string
) => {
  const spoken = await speakWithProvider(choice.provider, {
    apiKey: choice.apiKey,
    model: modelFor(choice.provider, "speech", choice.model),
    text: VOICE_SAMPLE_TEXT,
    voice: choice.voice ?? DEFAULT_VOICES[choice.provider],
    language: choice.language ?? "ja",
    bitRate: choice.bitRate ?? DEFAULT_AI_SPEECH_BIT_RATE,
    instructions,
    signal: new AbortController().signal,
  });
  const url = await writeVoiceSample(
    [
      voiceSampleKey(choice, instructions),
      // When a default voice was picked and saved, the settings now name it.
      voiceSampleKey({ ...choice, voice: spoken.voice }, instructions),
    ],
    spoken.blob
  );
  return { ...spoken, url };
};
