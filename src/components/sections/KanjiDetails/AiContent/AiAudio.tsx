import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PracticeButton } from "@/components/ui/practice-button";
import {
  addAiExplainUsage,
  isAiExplainReady,
  readAiExplainSettings,
} from "@/lib/ai-explain/preferences";
import {
  AI_GENERATED_CONTENT_EVENT,
  contentFingerprint,
  getGeneratedContentEpoch,
  getAudioForSource,
  saveAudioRecord,
  type AiAudioRecord,
} from "@/lib/ai-explain/storage";
import { generateXaiSpeech } from "@/lib/ai-explain/xai";
import { prepareNarration } from "./narration";

type AudioState = {
  status: "loading" | "ready" | "generating" | "error";
  record?: AiAudioRecord;
  message?: string;
  warning?: string;
};

const SavedAudio = ({
  record,
  filename,
}: {
  record: AiAudioRecord;
  filename: string;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("");

  // Effect needed: owns a browser object URL and stops the external audio player
  // on unmount; render cannot safely allocate resources that require cleanup.
  useEffect(() => {
    const objectUrl = URL.createObjectURL(record.blob);
    setUrl(objectUrl);
    const audio = audioRef.current;
    return () => {
      audio?.pause();
      URL.revokeObjectURL(objectUrl);
    };
  }, [record.blob]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
      setMessage("");
    } catch {
      setMessage(
        "Couldn't play the MP3. Try the audio controls or download it."
      );
    }
  };

  const download = async () => {
    try {
      const { downloadBlob } = await import("@/lib/ai-explain/download");
      downloadBlob(record.blob, `${filename}.mp3`);
      setMessage("");
    } catch {
      setMessage("Couldn't download the MP3. Please try again.");
    }
  };

  return (
    <div className="space-y-3">
      <Button className="w-full" disabled={!url} onClick={() => void toggle()}>
        {playing ? (
          <>
            <Pause /> Pause
          </>
        ) : (
          <>
            <Play /> Read Aloud
          </>
        )}
      </Button>
      <audio
        ref={audioRef}
        src={url || undefined}
        controls
        className="w-full"
        preload="metadata"
        aria-label="AI-generated narration"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() =>
          setMessage("Couldn't load the saved audio. Try regenerating the MP3.")
        }
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void download()}>
          <Download /> Download MP3
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (audioRef.current) audioRef.current.currentTime = 0;
          }}
        >
          Restart
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        AI-generated voice ·{" "}
        {record.language === "ja" ? "Japanese" : "Automatic language"}
      </p>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
};

export const AiAudio = ({
  sourceId,
  markdown,
  filename,
}: {
  sourceId: string;
  markdown: string;
  filename: string;
}) => {
  const [state, setState] = useState<AudioState>({ status: "loading" });
  const request = useRef<AbortController | null>(null);
  const [revision, setRevision] = useState(0);

  // Effect needed: loads a recording from IndexedDB, listens for external clears,
  // and aborts TTS when leaving the source; none can be done during render.
  useEffect(() => {
    let active = true;
    let loadVersion = 0;
    const load = async () => {
      const version = ++loadVersion;
      const epoch = getGeneratedContentEpoch();
      try {
        const fingerprint = await contentFingerprint(markdown);
        const record = await getAudioForSource(sourceId, fingerprint);
        if (
          active &&
          version === loadVersion &&
          epoch === getGeneratedContentEpoch()
        )
          setState({ status: "ready", record });
      } catch {
        if (active)
          setState({
            status: "error",
            message:
              "Couldn't load saved audio. You can try generating it again.",
          });
      }
    };
    const changed = (event: Event) => {
      if (!(event as CustomEvent<{ cleared: boolean }>).detail?.cleared) return;
      loadVersion++;
      request.current?.abort();
      request.current = null;
      if (active) setState({ status: "ready" });
    };
    void load();
    window.addEventListener(AI_GENERATED_CONTENT_EVENT, changed);
    return () => {
      active = false;
      request.current?.abort();
      request.current = null;
      window.removeEventListener(AI_GENERATED_CONTENT_EVENT, changed);
    };
  }, [sourceId, markdown, revision]);

  const generate = async () => {
    if (request.current || state.status === "loading") return;
    const settings = readAiExplainSettings();
    if (!isAiExplainReady(settings)) return;
    const controller = new AbortController();
    const epoch = getGeneratedContentEpoch();
    request.current = controller;
    const previous = state.record;
    setState({ status: "generating", record: previous });
    try {
      const text = prepareNarration(markdown);
      if (!text) throw new Error("There is no text to read aloud.");
      const voice = settings.speechVoice ?? "eve";
      const language = settings.speechLanguage ?? "auto";
      const blob = await generateXaiSpeech({
        apiKey: settings.apiKey,
        text,
        voice,
        language,
        signal: controller.signal,
      });
      addAiExplainUsage(0, { audioCharacters: text.length });
      const fingerprint = await contentFingerprint(markdown);
      if (controller.signal.aborted) return;
      const record: AiAudioRecord = {
        id: JSON.stringify([sourceId, fingerprint, voice, language, "mp3"]),
        sourceId,
        fingerprint,
        voice,
        language,
        blob,
        createdAt: Date.now(),
      };
      let warning: string | undefined;
      try {
        await saveAudioRecord(record, epoch);
      } catch {
        warning =
          "Generated, but couldn't save on this device. Download the MP3 to keep it.";
      }
      if (!controller.signal.aborted)
        setState({ status: "ready", record, warning });
    } catch (error) {
      if (!controller.signal.aborted)
        setState({
          status: "error",
          record: previous,
          message:
            error instanceof Error
              ? error.message
              : "Couldn't generate audio. Please try again.",
        });
    } finally {
      if (request.current === controller) request.current = null;
    }
  };

  if (state.status === "loading")
    return (
      <p className="text-xs text-muted-foreground">Loading saved audio…</p>
    );
  return (
    <div className="space-y-3 border-t border-dotted pt-4">
      {state.record && (
        <SavedAudio
          key={`${state.record.id}-${state.record.createdAt}`}
          record={state.record}
          filename={filename}
        />
      )}
      {state.status === "generating" && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" /> Generating audio…
        </p>
      )}
      <PracticeButton
        variant="secondary"
        size="md"
        disabled={state.status === "generating"}
        onClick={() => void generate()}
      >
        {state.record ? (
          <>
            <RotateCcw /> Regenerate MP3
          </>
        ) : (
          "Generate MP3 to listen"
        )}
      </PracticeButton>
      {state.status === "generating" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            request.current?.abort();
            request.current = null;
            setState({ status: "ready", record: state.record });
          }}
        >
          Cancel
        </Button>
      )}
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}{" "}
          <button
            className="underline"
            onClick={() => setRevision((value) => value + 1)}
          >
            Reload saved audio
          </button>
        </p>
      )}
      {state.warning && (
        <p role="status" className="text-sm text-amber-700 dark:text-amber-400">
          {state.warning}
        </p>
      )}
    </div>
  );
};
