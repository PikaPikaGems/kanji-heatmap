import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { AiPrimaryButton } from "@/components/common/AiActionButtons";
import { cn } from "@/lib/utils";
import { cnWarningText } from "@/lib/generic-cn";

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "--:--";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

/**
 * Our audio player: a Play/Pause button, elapsed / total and a seek slider,
 * in place of the browser's own controls. Pauses when it unmounts.
 */
export const AudioPlayer = ({
  src,
  playLabel,
  seekLabel,
  playFailedMessage,
  loadFailedMessage,
}: {
  /** Empty while the source isn't ready: the controls are disabled. */
  src: string;
  playLabel: string;
  seekLabel: string;
  playFailedMessage: string;
  loadFailedMessage: string;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [message, setMessage] = useState("");

  // Effect needed: stops the external audio element when this unmounts;
  // nothing in render or an event handler runs at unmount.
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

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
      setMessage(playFailedMessage);
    }
  };

  const syncTime = (audio: HTMLAudioElement) =>
    setTime({ current: audio.currentTime, duration: audio.duration });
  const { current, duration } = time;
  const seekable = Number.isFinite(duration) && duration > 0;

  return (
    <div className="space-y-3">
      <AiPrimaryButton disabled={!src} onClick={() => void toggle()}>
        {playing ? (
          <>
            <Pause /> Pause
          </>
        ) : (
          <>
            <Play /> {playLabel}
          </>
        )}
      </AiPrimaryButton>
      <audio
        ref={audioRef}
        src={src || undefined}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(event) => syncTime(event.currentTarget)}
        onTimeUpdate={(event) => syncTime(event.currentTarget)}
        onError={() => setMessage(loadFailedMessage)}
      />
      <div className="flex items-center gap-3">
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {formatTime(current)} / {formatTime(duration)}
        </span>
        <Slider
          disabled={!src || !seekable}
          min={0}
          max={seekable ? duration : 1}
          step={0.1}
          value={[current]}
          onValueChange={([seconds]) => {
            if (audioRef.current) audioRef.current.currentTime = seconds;
          }}
          thumbLabel={seekLabel}
        />
      </div>
      {message && (
        <p role="alert" className={cn("text-sm text-center", cnWarningText)}>
          {message}
        </p>
      )}
    </div>
  );
};
