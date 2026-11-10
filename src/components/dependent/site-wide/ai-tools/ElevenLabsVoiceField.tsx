import { useEffect, useState } from "react";
import { AudioPlayer } from "@/components/common/AudioPlayer";
import BasicSelect from "@/components/common/BasicSelect";
import { TextActionButton } from "@/components/common/AiActionButtons";
import {
  updateAiToolChoice,
  type ResolvedAiTool,
} from "@/lib/ai-explain/preferences";
import {
  listJapaneseVoices,
  type ElevenLabsVoice,
} from "@/lib/ai-explain/providers/elevenlabs";

type VoiceList =
  | { status: "loading"; voices: ElevenLabsVoice[] }
  | {
      status: "done";
      voices: ElevenLabsVoice[];
      page: number;
      hasMore: boolean;
    }
  | { status: "error"; voices: ElevenLabsVoice[]; message: string };

const DEFAULT_OPTION = "__default__";

/**
 * Japanese voices from the ElevenLabs Voice Library. Any of them can read
 * aloud without being added to the account.
 */
export const ElevenLabsVoiceField = ({
  choice,
}: {
  choice: ResolvedAiTool;
}) => {
  const [list, setList] = useState<VoiceList>({
    status: "loading",
    voices: [],
  });
  const { apiKey } = choice;

  const load = (page: number, voices: ElevenLabsVoice[]) => {
    setList({ status: "loading", voices });
    return listJapaneseVoices(apiKey, page).then(
      (next) => ({
        status: "done" as const,
        voices: [...voices, ...next.voices],
        page,
        hasMore: next.hasMore,
      }),
      (error: unknown) => ({
        status: "error" as const,
        voices,
        message: error instanceof Error ? error.message : "",
      })
    );
  };

  // Effect needed: fetches the first page of voices when Read Aloud opens on
  // ElevenLabs; render can't await a request, and a reply after unmount or a
  // key change must be dropped.
  useEffect(() => {
    let active = true;
    setList({ status: "loading", voices: [] });
    void listJapaneseVoices(apiKey, 0).then(
      (next) =>
        active &&
        setList({
          status: "done",
          voices: next.voices,
          page: 0,
          hasMore: next.hasMore,
        }),
      (error: unknown) =>
        active &&
        setList({
          status: "error",
          voices: [],
          message: error instanceof Error ? error.message : "",
        })
    );
    return () => {
      active = false;
    };
  }, [apiKey]);

  const saved = choice.voice;
  const selected = list.voices.find((voice) => voice.id === saved);
  const options = [
    ...(saved
      ? selected
        ? []
        : [{ value: saved, label: choice.voiceName ?? saved }]
      : [
          {
            value: DEFAULT_OPTION,
            label: "Default: the first Japanese voice",
          },
        ]),
    ...list.voices.map((voice) => ({
      value: voice.id,
      label: voice.name,
      description: voice.details || undefined,
    })),
  ];

  return (
    <div className="space-y-1">
      <p aria-hidden className="text-sm font-semibold">
        Voice
      </p>
      <BasicSelect
        isLabelSrOnly
        triggerCN="rounded-lg"
        label="Voice"
        value={saved ?? DEFAULT_OPTION}
        onChange={(id) => {
          if (id === DEFAULT_OPTION) return;
          const voice = list.voices.find((option) => option.id === id);
          updateAiToolChoice("readAloud", {
            voice: id,
            voiceName: voice?.name,
          });
        }}
        options={options}
      />
      {selected?.previewUrl && (
        // Keyed by voice: the old sample stops and the new one fades in.
        <div key={selected.id} className="pt-2 animate-fade-in-fast">
          <AudioPlayer
            src={selected.previewUrl}
            playLabel="Play sample"
            seekLabel={`Seek sample of ${selected.name}`}
            playFailedMessage="Couldn't play this sample. Try again, or pick another voice."
            loadFailedMessage="Couldn't load this sample. Try again, or pick another voice."
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {list.status === "loading" && "Loading Japanese voices… "}
        {list.status === "error" && `Couldn't load voices. ${list.message} `}
        Japanese voices from the ElevenLabs Voice Library; none need adding to
        your account.
      </p>
      {list.status === "done" && list.hasMore && (
        <TextActionButton
          onClick={() => void load(list.page + 1, list.voices).then(setList)}
        >
          Load more voices
        </TextActionButton>
      )}
    </div>
  );
};
