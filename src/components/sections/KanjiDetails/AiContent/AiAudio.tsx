import {
  abortInFlight,
  getInFlight,
  trackInFlight,
} from "@/lib/ai-explain/in-flight";
import { NoticeAction } from "@/components/common/UserNotice";
import { cn } from "@/lib/utils";
import { cnWarningText } from "@/lib/generic-cn";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  AiPrimaryButton,
  AiRequestFeedback,
  DownloadButton,
  RegenerateButton,
} from "@/components/common/AiActionButtons";
import {
  addAiExplainUsage,
  DEFAULT_AI_SPEECH_BIT_RATE,
  DEFAULT_AI_SPEECH_VOICE,
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

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "--:--";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

/** A minimal audio bar: elapsed / total and a seek slider. */
const MiniPlayer = ({
  disabled,
  current,
  duration,
  onSeek,
}: {
  disabled: boolean;
  current: number;
  duration: number;
  onSeek: (seconds: number) => void;
}) => (
  <div className="flex items-center gap-3">
    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
      {formatTime(current)} / {formatTime(duration)}
    </span>
    <Slider
      disabled={disabled || !Number.isFinite(duration) || duration <= 0}
      min={0}
      max={Number.isFinite(duration) && duration > 0 ? duration : 1}
      step={0.1}
      value={[current]}
      onValueChange={([seconds]) => onSeek(seconds)}
      thumbLabel="Seek narration"
    />
  </div>
);

const SavedAudio = ({
  record,
  filename,
  regenerate,
}: {
  record: AiAudioRecord;
  filename: string;
  regenerate: ReactNode;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
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
      setMessage("Couldn't play the MP3. Download it to listen instead.");
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
      <AiPrimaryButton disabled={!url} onClick={() => void toggle()}>
        {playing ? (
          <>
            <Pause /> Pause
          </>
        ) : (
          <>
            <Play /> Read Aloud
          </>
        )}
      </AiPrimaryButton>
      <audio
        ref={audioRef}
        src={url || undefined}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(event) =>
          setTime({
            current: event.currentTarget.currentTime,
            duration: event.currentTarget.duration,
          })
        }
        onTimeUpdate={(event) =>
          setTime({
            current: event.currentTarget.currentTime,
            duration: event.currentTarget.duration,
          })
        }
        onError={() =>
          setMessage("Couldn't load the saved audio. Try regenerating the MP3.")
        }
      />
      <MiniPlayer
        disabled={!url}
        current={time.current}
        duration={time.duration}
        onSeek={(seconds) => {
          if (audioRef.current) audioRef.current.currentTime = seconds;
        }}
      />
      <div className="flex flex-wrap items-center gap-1">
        <DownloadButton onClick={() => void download()}>
          Download MP3
        </DownloadButton>
        <span aria-hidden>·</span>
        {regenerate}
      </div>
      <p className="text-xs text-muted-foreground">
        AI-generated voice ·{" "}
        {record.language === "ja" ? "Japanese" : "Automatic language"}
      </p>
      {message && (
        <p role="alert" className={cn("text-sm text-center", cnWarningText)}>
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

  const flightKey = `audio:${sourceId}`;

  // Effect needed: loads a recording from IndexedDB and listens for external
  // clears; none can be done during render. An MP3 still generating from an
  // earlier mount (the drawer was closed) shows as generating until it lands.
  useEffect(() => {
    let active = true;
    let loadVersion = 0;
    const load = async () => {
      const running = getInFlight(flightKey);
      if (running && !request.current) {
        if (active) setState({ status: "generating" });
        await running.settled;
        if (!active) return;
      }
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
      abortInFlight(flightKey);
      request.current = null;
      if (active) setState({ status: "ready" });
    };
    void load();
    window.addEventListener(AI_GENERATED_CONTENT_EVENT, changed);
    // No abort on unmount: the MP3 is still saved when it arrives.
    return () => {
      active = false;
      request.current = null;
      window.removeEventListener(AI_GENERATED_CONTENT_EVENT, changed);
    };
  }, [sourceId, markdown, revision, flightKey]);

  const generate = async () => {
    if (request.current || getInFlight(flightKey) || state.status === "loading")
      return;
    const settings = readAiExplainSettings();
    if (!isAiExplainReady(settings)) return;
    const controller = new AbortController();
    const epoch = getGeneratedContentEpoch();
    request.current = controller;
    const previous = state.record;
    setState({ status: "generating", record: previous });
    let finish: () => void = () => {};
    trackInFlight(
      flightKey,
      controller,
      new Promise<void>((resolve) => (finish = resolve))
    );
    try {
      const text = prepareNarration(markdown);
      if (!text) throw new Error("There is no text to read aloud.");
      const voice = settings.speechVoice ?? DEFAULT_AI_SPEECH_VOICE;
      const language = settings.speechLanguage ?? "auto";
      const blob = await generateXaiSpeech({
        apiKey: settings.apiKey,
        text,
        voice,
        language,
        bitRate: settings.speechBitRate ?? DEFAULT_AI_SPEECH_BIT_RATE,
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
      finish();
      if (request.current === controller) request.current = null;
    }
  };

  if (state.status === "loading")
    return (
      <p className="text-xs text-muted-foreground">Loading saved audio…</p>
    );
  return (
    <div className="space-y-3 border-t border-dotted pt-4">
      {state.record ? (
        <SavedAudio
          key={`${state.record.id}-${state.record.createdAt}`}
          record={state.record}
          filename={filename}
          regenerate={
            <RegenerateButton
              busy={state.status === "generating"}
              busyLabel="Regenerating MP3…"
              onClick={() => void generate()}
            >
              Regenerate MP3
            </RegenerateButton>
          }
        />
      ) : (
        <AiPrimaryButton
          busy={state.status === "generating"}
          onClick={() => void generate()}
        >
          Generate MP3 to listen
        </AiPrimaryButton>
      )}
      <AiRequestFeedback
        busy={state.status === "generating"}
        onCancel={() => {
          abortInFlight(flightKey);
          request.current = null;
          setState({ status: "ready", record: state.record });
        }}
        error={
          state.message && (
            <>
              {state.message}{" "}
              <NoticeAction onClick={() => setRevision((value) => value + 1)}>
                Reload saved audio
              </NoticeAction>
            </>
          )
        }
        warning={state.warning}
      />
    </div>
  );
};
