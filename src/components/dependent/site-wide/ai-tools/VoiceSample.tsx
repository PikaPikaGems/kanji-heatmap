import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { AiPrimaryButton } from "@/components/common/AiActionButtons";
import { AudioPlayer } from "@/components/common/AudioPlayer";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import { describeAiError } from "@/lib/ai-explain/describe-error";
import {
  addAiUsage,
  DEFAULT_AI_SPEECH_PROMPT,
  rejectAiProviderKey,
  updateAiToolChoice,
  type ResolvedAiTool,
} from "@/lib/ai-explain/preferences";
import {
  AI_PROVIDERS,
  providerLabel,
} from "@/lib/ai-explain/providers/capabilities";
import { AiKeyRejectedError } from "@/lib/ai-explain/providers/types";
import {
  makeVoiceSample,
  readVoiceSample,
  VOICE_SAMPLE_TEXT,
  voiceSampleKey,
} from "@/lib/ai-explain/voice-sample";
import { getCurrentOwner } from "@/lib/engine/content-owner";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

type SampleState =
  | { status: "checking" }
  | { status: "idle" }
  | { status: "generating" }
  | { status: "ready"; url: string; autoPlay: boolean }
  | { status: "error"; message: string };

/**
 * The mixed English and Japanese sample for one set of settings: played from
 * the saved copy when there is one, else made with the learner's key when
 * asked. Keyed by `sampleKey`, so new settings start over.
 */
const MixedSample = ({
  choice,
  instructions,
  sampleKey,
}: {
  choice: ResolvedAiTool;
  instructions: string;
  sampleKey: string;
}) => {
  const [state, setState] = useState<SampleState>({ status: "checking" });
  const { provider } = choice;

  // Effect needed: looks for a saved sample in Cache Storage, which is
  // asynchronous and can't be read during render.
  useEffect(() => {
    let active = true;
    void readVoiceSample(sampleKey).then((url) => {
      if (!active) return;
      setState(
        url ? { status: "ready", url, autoPlay: false } : { status: "idle" }
      );
    });
    return () => {
      active = false;
    };
  }, [sampleKey]);

  const generate = async () => {
    setState({ status: "generating" });
    try {
      const spoken = await makeVoiceSample(choice, instructions);
      addAiUsage(spoken.usage);
      // A voice picked for the learner becomes their saved voice.
      if (spoken.pickedVoice)
        updateAiToolChoice("readAloud", {
          provider,
          voice: spoken.pickedVoice.id,
          voiceName: spoken.pickedVoice.name,
        });
      setState({ status: "ready", url: spoken.url, autoPlay: true });
    } catch (error) {
      const owner = getCurrentOwner();
      if (error instanceof AiKeyRejectedError && owner.status === "known")
        rejectAiProviderKey(owner.ownerId, provider, choice.apiKey);
      setState({
        status: "error",
        message: describeAiError(
          error,
          "Couldn't make a sample. Please try again.",
          provider
        ),
      });
    }
  };

  if (state.status === "checking") return null;
  return (
    <div className="space-y-2 animate-fade-in-fast">
      {state.status === "ready" ? (
        <AudioPlayer
          src={state.url}
          autoPlay={state.autoPlay}
          playLabel="Play mixed-language sample"
          seekLabel="Seek mixed-language sample"
          playFailedMessage="Couldn't play the sample. Try again."
          loadFailedMessage="Couldn't load the sample. Try again."
        />
      ) : (
        <AiPrimaryButton
          busy={state.status === "generating"}
          busyLabel="Making a sample…"
          onClick={() => void generate()}
        >
          <Play /> Play mixed-language sample
        </AiPrimaryButton>
      )}
      {state.status === "error" && (
        <p role="alert" className={cn("text-sm text-center", cnWarningText)}>
          {state.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Reads &ldquo;{VOICE_SAMPLE_TEXT}&rdquo; with these settings.{" "}
        {state.status === "ready"
          ? "Saved in this browser, so replaying it is free."
          : `Made once with your ${providerLabel(provider)} key (about ${VOICE_SAMPLE_TEXT.length} characters), then saved in this browser.`}
      </p>
    </div>
  );
};

/**
 * How the picked voice sounds: a mixed English and Japanese sample made with
 * the current settings, and for ElevenLabs also the voice's free recording
 * from its Voice Library.
 */
export const VoiceSample = ({
  choice,
  librarySample,
}: {
  choice: ResolvedAiTool;
  /** The Voice Library's own recording of the picked voice, if any. */
  librarySample?: { url: string; name: string };
}) => {
  const [settings] = useAiExplainSettings();
  // Only OpenAI and Gemini take speaking instructions.
  const instructions = AI_PROVIDERS[choice.provider].speech?.instructions
    ? (settings.speechPrompt ?? DEFAULT_AI_SPEECH_PROMPT)
    : "";
  const sampleKey = voiceSampleKey(choice, instructions);
  return (
    <section className="pt-1 space-y-3">
      <p className="text-sm font-semibold">Voice sample</p>
      <MixedSample
        key={sampleKey}
        choice={choice}
        instructions={instructions}
        sampleKey={sampleKey}
      />
      {librarySample && (
        // Keyed by voice: the old recording stops and the new one fades in.
        <div key={librarySample.url} className="space-y-2 animate-fade-in-fast">
          <AudioPlayer
            src={librarySample.url}
            playLabel="Play library sample"
            seekLabel={`Seek library sample of ${librarySample.name}`}
            playFailedMessage="Couldn't play this recording. Try again."
            loadFailedMessage="Couldn't load this recording. Try again."
          />
          <p className="text-xs text-muted-foreground">
            The voice&apos;s own recording from the ElevenLabs Voice Library:
            free, but often in Japanese only.
          </p>
        </div>
      )}
    </section>
  );
};
